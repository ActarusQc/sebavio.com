/**
 * Synchronisation Stripe ↔ forfaits : preview (lecture) puis apply (confirmé).
 */

import "server-only";

import { randomUUID } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { writeAdminAuditLog } from "@/features/admin/services/audit-write";
import {
  applyPlanSyncSchema,
  type ApplyPlanSyncInput,
} from "@/features/plans/lib/schemas";
import type { PlanActor } from "@/features/plans/services/plan-crud";
import { listAllStripeProductsForSync } from "@/features/plans/services/plan-sync-stripe-list";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getStripeMode } from "@/services/stripe/config";
import { listSebavioProducts } from "@/services/stripe/product-service";
import { listPricesForProduct } from "@/services/stripe/price-service";
import {
  getSebavioPlanId,
  getSebavioStripeMode,
  isSebavioAppMetadata,
} from "@/services/stripe/sebavio-metadata";

export type PlanSyncProposedAction = {
  actionKey: string;
  actionType: "import_product" | "update_price_mirror";
  payload: Record<string, unknown>;
};

export type PlanSyncReport = {
  syncRunId: string;
  stripeMode: string;
  toCreateLocally: PlanSyncProposedAction[];
  toUpdate: PlanSyncProposedAction[];
  inconsistencies: Array<{ code: string; message: string; planId?: string }>;
  ignored: Array<{ id: string; reason: string }>;
  errors: Array<{ message: string }>;
};

export type ApplyPlanSyncResult = {
  syncRunId: string;
  applied: string[];
  skipped: string[];
  failed: string[];
};

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 80) || "imported_plan"
  );
}

export async function previewPlanSync(): Promise<PlanSyncReport> {
  const mode = getStripeMode();
  const toCreateLocally: PlanSyncProposedAction[] = [];
  const toUpdate: PlanSyncProposedAction[] = [];
  const inconsistencies: PlanSyncReport["inconsistencies"] = [];
  const ignored: PlanSyncReport["ignored"] = [];
  const errors: PlanSyncReport["errors"] = [];

  let allProducts: Awaited<ReturnType<typeof listAllStripeProductsForSync>> =
    [];
  let sebavioProducts: Awaited<ReturnType<typeof listSebavioProducts>> = [];

  try {
    allProducts = await listAllStripeProductsForSync();
    sebavioProducts = await listSebavioProducts({ includeInactive: true });
  } catch (error) {
    errors.push({
      message:
        error instanceof Error
          ? error.message.slice(0, 300)
          : "Erreur liste produits Stripe",
    });
  }

  for (const product of allProducts) {
    const isSebavio = isSebavioAppMetadata(product.metadata);
    const metaMode = getSebavioStripeMode(product.metadata);
    if (!isSebavio || metaMode !== mode) {
      ignored.push({
        id: product.id,
        reason: !isSebavio
          ? "Produit non Sebavio"
          : `Mode métadonnée ${metaMode ?? "absent"} ≠ ${mode}`,
      });
    }
  }

  const localPlans = await prisma.plan.findMany({
    where: { stripeMode: mode },
    include: { prices: true, entitlements: true },
  });

  const byProductId = new Map(
    localPlans
      .filter((p) => p.stripeProductId)
      .map((p) => [p.stripeProductId!, p]),
  );

  for (const product of sebavioProducts) {
    const local = byProductId.get(product.id);
    let prices: Awaited<ReturnType<typeof listPricesForProduct>> = [];
    try {
      prices = await listPricesForProduct(product.id, {
        includeInactive: true,
      });
    } catch (error) {
      errors.push({
        message: `Prix introuvables pour ${product.id}: ${
          error instanceof Error ? error.message.slice(0, 200) : "erreur"
        }`,
      });
      if (local) {
        inconsistencies.push({
          code: "PRICE_LIST_FAILED",
          message: `Impossible de lister les prix Stripe du produit ${product.id}`,
          planId: local.id,
        });
      }
      continue;
    }

    if (!local) {
      const actionKey = `import:${product.id}`;
      toCreateLocally.push({
        actionKey,
        actionType: "import_product",
        payload: {
          stripeProductId: product.id,
          name: product.name,
          status: "hidden",
          metadataPlanId: getSebavioPlanId(product.metadata) ?? null,
          prices: prices.map((price) => ({
            stripePriceId: price.id,
            unitAmount: price.unit_amount ?? 0,
            currency: (price.currency ?? "cad").toLowerCase(),
            interval: price.recurring?.interval ?? "month",
            intervalCount: price.recurring?.interval_count ?? 1,
            isCurrent: false,
            active: price.active,
          })),
        },
      });
      continue;
    }

    // Comparisons for updates (proposed only)
    for (const price of prices) {
      const localPrice = local.prices.find((p) => p.stripePriceId === price.id);
      if (!localPrice) {
        toUpdate.push({
          actionKey: `add_price:${local.id}:${price.id}`,
          actionType: "update_price_mirror",
          payload: {
            planId: local.id,
            stripePriceId: price.id,
            unitAmount: price.unit_amount ?? 0,
            currency: (price.currency ?? "cad").toLowerCase(),
            interval: price.recurring?.interval ?? "month",
            intervalCount: price.recurring?.interval_count ?? 1,
            isCurrent: false,
            status: price.active ? "active" : "archived",
          },
        });
        continue;
      }

      const stripeAmount = price.unit_amount ?? 0;
      const stripeActive = price.active;
      const localActive = localPrice.status === "active";
      if (
        localPrice.unitAmount !== stripeAmount ||
        localActive !== stripeActive
      ) {
        toUpdate.push({
          actionKey: `mirror_price:${localPrice.id}`,
          actionType: "update_price_mirror",
          payload: {
            planId: local.id,
            planPriceId: localPrice.id,
            stripePriceId: price.id,
            unitAmount: stripeAmount,
            status: stripeActive ? "active" : "archived",
            // never touch isCurrent here
          },
        });
      }
    }

    for (const localPrice of local.prices) {
      if (!prices.some((p) => p.id === localPrice.stripePriceId)) {
        inconsistencies.push({
          code: "LOCAL_PRICE_MISSING_ON_STRIPE",
          message: `Prix local ${localPrice.stripePriceId} absent de Stripe`,
          planId: local.id,
        });
      }
    }
  }

  for (const plan of localPlans) {
    if (plan.stripeProductId && !byProductId.has(plan.stripeProductId)) {
      // already in map
    }
    if (!plan.stripeProductId) {
      inconsistencies.push({
        code: "PLAN_WITHOUT_PRODUCT",
        message: `Forfait local sans produit Stripe valide`,
        planId: plan.id,
      });
    } else if (
      !sebavioProducts.some((p) => p.id === plan.stripeProductId) &&
      plan.status !== "pending_reconciliation"
    ) {
      inconsistencies.push({
        code: "PRODUCT_MISSING_OR_FOREIGN",
        message: `Produit Stripe ${plan.stripeProductId} introuvable ou non Sebavio`,
        planId: plan.id,
      });
    }

    const currentByCombo = new Map<string, number>();
    for (const price of plan.prices) {
      if (!price.isCurrent) continue;
      const key = `${price.interval}:${price.intervalCount}:${price.currency}`;
      currentByCombo.set(key, (currentByCombo.get(key) ?? 0) + 1);
    }
    for (const [combo, count] of currentByCombo) {
      if (count > 1) {
        inconsistencies.push({
          code: "MULTIPLE_IS_CURRENT",
          message: `Plusieurs prix courants pour ${combo}`,
          planId: plan.id,
        });
      }
    }

    // entitlements never proposed for change
    void plan.entitlements;
  }

  const reportWithoutId: Omit<PlanSyncReport, "syncRunId"> = {
    stripeMode: mode,
    toCreateLocally,
    toUpdate,
    inconsistencies,
    ignored,
    errors,
  };

  const run = await prisma.planSyncRun.create({
    data: {
      stripeMode: mode,
      status: "preview",
      report: reportWithoutId as Prisma.InputJsonValue,
    },
  });

  return { syncRunId: run.id, ...reportWithoutId };
}

async function executeImportProduct(
  payload: Record<string, unknown>,
  mode: string,
): Promise<{ planId: string }> {
  const stripeProductId = String(payload.stripeProductId);
  const name = String(payload.name ?? "Forfait importé");
  const status =
    payload.status === "pending_reconciliation"
      ? "pending_reconciliation"
      : "hidden";
  const prices = (payload.prices as Array<Record<string, unknown>>) ?? [];
  const metadataPlanId =
    typeof payload.metadataPlanId === "string" &&
    payload.metadataPlanId.length > 0
      ? payload.metadataPlanId
      : randomUUID();

  const existing = await prisma.plan.findFirst({
    where: { stripeProductId, stripeMode: mode },
  });
  if (existing) {
    return { planId: existing.id };
  }

  const planId = metadataPlanId;

  await prisma.$transaction(async (tx) => {
    await tx.plan.create({
      data: {
        id: planId,
        internalName: `${slugify(name)}_${planId.slice(0, 8)}`,
        publicName: name,
        status,
        isVisibleOnSignup: false,
        isFeatured: false,
        displayOrder: 0,
        stripeProductId,
        stripeMode: mode,
        lastSyncedAt: new Date(),
        reconciliationError: null,
      },
    });

    for (const price of prices) {
      await tx.planPrice.create({
        data: {
          planId,
          stripePriceId: String(price.stripePriceId),
          interval: String(price.interval ?? "month"),
          intervalCount: Number(price.intervalCount ?? 1),
          currency: String(price.currency ?? "cad").toLowerCase(),
          unitAmount: Number(price.unitAmount ?? 0),
          status: price.active === false ? "archived" : "active",
          isCurrent: false,
          stripeMode: mode,
        },
      });
    }
  });

  return { planId };
}

async function executeUpdatePriceMirror(
  payload: Record<string, unknown>,
  mode: string,
): Promise<void> {
  const planId = String(payload.planId);
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.stripeMode !== mode) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Forfait introuvable ou mode invalide.",
      400,
    );
  }

  if (payload.planPriceId) {
    await prisma.planPrice.update({
      where: { id: String(payload.planPriceId) },
      data: {
        unitAmount:
          typeof payload.unitAmount === "number"
            ? payload.unitAmount
            : undefined,
        status: typeof payload.status === "string" ? payload.status : undefined,
        // never touch isCurrent
      },
    });
  } else if (payload.stripePriceId) {
    const existing = await prisma.planPrice.findFirst({
      where: {
        planId,
        stripePriceId: String(payload.stripePriceId),
      },
    });
    if (existing) return;
    await prisma.planPrice.create({
      data: {
        planId,
        stripePriceId: String(payload.stripePriceId),
        interval: String(payload.interval ?? "month"),
        intervalCount: Number(payload.intervalCount ?? 1),
        currency: String(payload.currency ?? "cad").toLowerCase(),
        unitAmount: Number(payload.unitAmount ?? 0),
        status: String(payload.status ?? "active"),
        isCurrent: false,
        stripeMode: mode,
      },
    });
  }

  await prisma.plan.update({
    where: { id: planId },
    data: { lastSyncedAt: new Date() },
  });
}

export async function applyPlanSync(
  rawInput: ApplyPlanSyncInput,
  actor: PlanActor,
): Promise<ApplyPlanSyncResult> {
  const input = applyPlanSyncSchema.parse(rawInput);
  const mode = getStripeMode();

  const run = await prisma.planSyncRun.findUnique({
    where: { id: input.syncRunId },
  });

  if (!run) {
    throw new AppError("VALIDATION_ERROR", "Synchronisation introuvable.", 404);
  }
  if (run.stripeMode !== mode) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Incohérence de mode Stripe : sync=${run.stripeMode}, serveur=${mode}.`,
      400,
    );
  }

  const report = (run.report ?? {}) as {
    toCreateLocally?: PlanSyncProposedAction[];
    toUpdate?: PlanSyncProposedAction[];
  };

  const proposedByKey = new Map<string, PlanSyncProposedAction>();
  for (const action of [
    ...(report.toCreateLocally ?? []),
    ...(report.toUpdate ?? []),
  ]) {
    proposedByKey.set(action.actionKey, action);
  }

  await prisma.planSyncRun.update({
    where: { id: run.id },
    data: { status: "applying" },
  });

  const applied: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  try {
    for (const confirmed of input.confirmedActions) {
      const proposed = proposedByKey.get(confirmed.actionKey);
      if (!proposed) {
        skipped.push(confirmed.actionKey);
        continue;
      }

      const existing = await prisma.planSyncAction.findUnique({
        where: {
          syncRunId_actionKey: {
            syncRunId: run.id,
            actionKey: confirmed.actionKey,
          },
        },
      });

      if (existing?.status === "applied" || existing?.status === "skipped") {
        skipped.push(confirmed.actionKey);
        continue;
      }

      await prisma.planSyncAction.upsert({
        where: {
          syncRunId_actionKey: {
            syncRunId: run.id,
            actionKey: confirmed.actionKey,
          },
        },
        create: {
          syncRunId: run.id,
          actionKey: confirmed.actionKey,
          actionType: proposed.actionType,
          status: "pending",
          payload: proposed.payload as Prisma.InputJsonValue,
        },
        update: {
          status: "pending",
          error: null,
          payload: proposed.payload as Prisma.InputJsonValue,
        },
      });

      try {
        if (proposed.actionType === "import_product") {
          const { planId } = await executeImportProduct(proposed.payload, mode);
          await prisma.planSyncAction.update({
            where: {
              syncRunId_actionKey: {
                syncRunId: run.id,
                actionKey: confirmed.actionKey,
              },
            },
            data: {
              status: "applied",
              result: { planId } as Prisma.InputJsonValue,
              error: null,
            },
          });
        } else if (proposed.actionType === "update_price_mirror") {
          await executeUpdatePriceMirror(proposed.payload, mode);
          await prisma.planSyncAction.update({
            where: {
              syncRunId_actionKey: {
                syncRunId: run.id,
                actionKey: confirmed.actionKey,
              },
            },
            data: {
              status: "applied",
              result: { ok: true } as Prisma.InputJsonValue,
              error: null,
            },
          });
        } else {
          throw new AppError(
            "VALIDATION_ERROR",
            `Type d'action non supporté: ${proposed.actionType}`,
            400,
          );
        }

        applied.push(confirmed.actionKey);
        await writeAdminAuditLog({
          actorUserId: actor.id,
          actorRole: actor.role,
          entity: "plan_sync",
          entityId: run.id,
          action: "PLAN_SYNC_ACTION_APPLIED",
          newValue: {
            result: "success",
            syncRunId: run.id,
            actionKey: confirmed.actionKey,
            actionType: proposed.actionType,
            stripeMode: mode,
          },
          ipAddress: actor.ipAddress ?? null,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message.slice(0, 500) : "Erreur apply";
        await prisma.planSyncAction.update({
          where: {
            syncRunId_actionKey: {
              syncRunId: run.id,
              actionKey: confirmed.actionKey,
            },
          },
          data: { status: "failed", error: message },
        });
        failed.push(confirmed.actionKey);
        await writeAdminAuditLog({
          actorUserId: actor.id,
          actorRole: actor.role,
          entity: "plan_sync",
          entityId: run.id,
          action: "PLAN_SYNC_ACTION_FAILED",
          newValue: {
            result: "error",
            syncRunId: run.id,
            actionKey: confirmed.actionKey,
            stripeMode: mode,
            error: message,
          },
          ipAddress: actor.ipAddress ?? null,
        });
        throw error;
      }
    }

    await prisma.planSyncRun.update({
      where: { id: run.id },
      data: {
        status: failed.length > 0 ? "failed" : "completed",
        completedAt: new Date(),
      },
    });

    await writeAdminAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      entity: "plan_sync",
      entityId: run.id,
      action: "PLAN_SYNC_APPLY_SUMMARY",
      newValue: {
        result: failed.length > 0 ? "error" : "success",
        syncRunId: run.id,
        stripeMode: mode,
        applied,
        skipped,
        failed,
      },
      ipAddress: actor.ipAddress ?? null,
    });

    return { syncRunId: run.id, applied, skipped, failed };
  } catch (error) {
    await prisma.planSyncRun.update({
      where: { id: run.id },
      data: { status: "failed", completedAt: new Date() },
    });
    throw error;
  }
}
