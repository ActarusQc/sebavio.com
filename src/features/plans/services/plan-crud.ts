/**
 * Création et réconciliation de forfaits (Phase 4).
 * Séquence : Plan local pending → Stripe product/prices (idempotence) → finalisation active.
 */

import "server-only";

import { randomUUID } from "node:crypto";

import type { UserRole } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { writeAdminAuditLog } from "@/features/admin/services/audit-write";
import {
  createPlanSchema,
  planPriceSpecSchema,
  updatePlanMetadataSchema,
  hidePlanSchema,
  archivePlanSchema,
  type CreatePlanInput,
  type UpdatePlanMetadataInput,
  type HidePlanInput,
  type ArchivePlanInput,
} from "@/features/plans/lib/schemas";
import { getStripeMode } from "@/services/stripe/config";
import {
  archiveStripeProduct,
  createSebavioProduct,
  listSebavioProducts,
} from "@/services/stripe/product-service";
import {
  createSebavioPrice,
  listPricesForProduct,
} from "@/services/stripe/price-service";
import { getSebavioPlanId } from "@/services/stripe/sebavio-metadata";

export type PlanActor = {
  id: string;
  role: UserRole;
  ipAddress?: string | null;
};

export type ReconcilePlanOptions = {
  /** Prix désirés si absents localement (reprise après échec partiel). */
  prices?: CreatePlanInput["prices"];
};

export function planProductIdempotencyKey(planId: string): string {
  return `plan-create:${planId}:product`;
}

export function planPriceIdempotencyKey(
  planId: string,
  interval: string,
  intervalCount: number,
  currency: string,
): string {
  return `plan-create:${planId}:price:${interval}:${intervalCount}:${currency.toLowerCase()}`;
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) {
    const msg = error.message.replace(
      /\bsk_(?:test|live)_[A-Za-z0-9]+\b/g,
      "[REDACTED]",
    );
    return msg.slice(0, 500);
  }
  return "Erreur inconnue lors de la création du forfait.";
}

async function markPartialFailure(
  planId: string,
  error: unknown,
  actor: PlanActor,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const message = safeErrorMessage(error);
  const mode = getStripeMode();
  await prisma.plan.update({
    where: { id: planId },
    data: {
      status: "pending_reconciliation",
      reconciliationError: message,
    },
  });
  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "plan",
    entityId: planId,
    action: "PLAN_CREATE_PARTIAL_FAILURE",
    oldValue: { status: "pending_reconciliation" },
    newValue: {
      result: "error",
      stripeMode: mode,
      error: message,
      ...extra,
    },
    ipAddress: actor.ipAddress ?? null,
  });
}

async function finalizePlanActive(input: {
  planId: string;
  stripeProductId: string;
  stripeMode: string;
  prices: Array<{
    stripePriceId: string;
    unitAmount: number;
    currency: string;
    interval: string;
    intervalCount: number;
  }>;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.planPrice.findMany({
      where: { planId: input.planId },
      select: { stripePriceId: true },
    });
    const existingIds = new Set(existing.map((p) => p.stripePriceId));

    for (const price of input.prices) {
      if (existingIds.has(price.stripePriceId)) continue;
      await tx.planPrice.create({
        data: {
          planId: input.planId,
          stripePriceId: price.stripePriceId,
          interval: price.interval,
          intervalCount: price.intervalCount,
          currency: price.currency,
          unitAmount: price.unitAmount,
          status: "active",
          isCurrent: true,
          stripeMode: input.stripeMode,
        },
      });
    }

    await tx.plan.update({
      where: { id: input.planId },
      data: {
        stripeProductId: input.stripeProductId,
        status: "active",
        reconciliationError: null,
      },
    });
  });
}

/**
 * Crée un forfait : ligne locale pending → Stripe → finalisation active.
 */
export async function createPlan(
  rawInput: CreatePlanInput,
  actor: PlanActor,
): Promise<{ planId: string }> {
  const input = createPlanSchema.parse(rawInput);
  const mode = getStripeMode();
  const planId = randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.plan.create({
      data: {
        id: planId,
        internalName: input.internalName,
        publicName: input.publicName,
        shortDescription: input.shortDescription ?? null,
        fullDescription: input.fullDescription ?? null,
        displayOrder: input.displayOrder,
        isFeatured: input.isFeatured,
        isVisibleOnSignup: input.isVisibleOnSignup,
        defaultTrialDays: input.defaultTrialDays ?? null,
        status: "pending_reconciliation",
        stripeProductId: null,
        stripeMode: mode,
        reconciliationError: null,
      },
    });

    if (input.entitlements && input.entitlements.length > 0) {
      await tx.planEntitlement.createMany({
        data: input.entitlements.map((e) => ({
          planId,
          key: e.key,
          enabled: e.enabled,
          limit: e.limit,
          value: e.value,
        })),
      });
    }
  });

  try {
    const product = await createSebavioProduct({
      name: input.publicName,
      description: input.shortDescription ?? input.fullDescription ?? null,
      planId,
      idempotencyKey: planProductIdempotencyKey(planId),
    });

    const createdPrices: Array<{
      stripePriceId: string;
      unitAmount: number;
      currency: string;
      interval: string;
      intervalCount: number;
    }> = [];

    for (const price of input.prices) {
      const stripePrice = await createSebavioPrice({
        productId: product.id,
        planId,
        unitAmount: price.unitAmount,
        currency: price.currency,
        interval: price.interval,
        intervalCount: price.intervalCount,
        idempotencyKey: planPriceIdempotencyKey(
          planId,
          price.interval,
          price.intervalCount,
          price.currency,
        ),
      });

      createdPrices.push({
        stripePriceId: stripePrice.id,
        unitAmount: stripePrice.unit_amount ?? price.unitAmount,
        currency: stripePrice.currency ?? price.currency,
        interval: stripePrice.recurring?.interval ?? price.interval,
        intervalCount:
          stripePrice.recurring?.interval_count ?? price.intervalCount,
      });
    }

    await finalizePlanActive({
      planId,
      stripeProductId: product.id,
      stripeMode: mode,
      prices: createdPrices,
    });

    await writeAdminAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      entity: "plan",
      entityId: planId,
      action: "PLAN_CREATE_SUCCESS",
      newValue: {
        result: "success",
        stripeMode: mode,
        stripeProductId: product.id,
        priceIds: createdPrices.map((p) => p.stripePriceId),
      },
      ipAddress: actor.ipAddress ?? null,
    });

    return { planId };
  } catch (error) {
    await markPartialFailure(planId, error, actor, {
      stripeProductId: null,
    });
    throw error;
  }
}

/**
 * Reprend un forfait pending_reconciliation sans dupliquer product/prices.
 */
export async function reconcilePlan(
  planId: string,
  actor: PlanActor,
  options: ReconcilePlanOptions = {},
): Promise<{ status: string }> {
  const mode = getStripeMode();
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      prices: true,
      entitlements: true,
    },
  });

  if (!plan) {
    throw new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404);
  }

  if (plan.stripeMode !== mode) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Incohérence de mode Stripe : forfait=${plan.stripeMode}, serveur=${mode}.`,
      400,
    );
  }

  if (plan.status !== "pending_reconciliation") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Seuls les forfaits en pending_reconciliation peuvent être réconciliés.",
      400,
    );
  }

  const desiredPrices = options.prices;
  if (!desiredPrices || desiredPrices.length === 0) {
    if (plan.prices.length === 0) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Aucun prix à réconcilier : fournir les tarifs désirés.",
        400,
      );
    }
  }

  const pricesToEnsure =
    desiredPrices && desiredPrices.length > 0
      ? desiredPrices.map((p) => planPriceSpecSchema.parse(p))
      : plan.prices.map((p) => ({
          unitAmount: p.unitAmount,
          currency: p.currency,
          interval: p.interval as "day" | "week" | "month" | "year",
          intervalCount: p.intervalCount,
        }));

  try {
    let productId = plan.stripeProductId;

    if (!productId) {
      const sebavioProducts = await listSebavioProducts({
        includeInactive: true,
      });
      const existing = sebavioProducts.find(
        (p) => getSebavioPlanId(p.metadata) === planId,
      );
      if (existing) {
        productId = existing.id;
      } else {
        const product = await createSebavioProduct({
          name: plan.publicName,
          description: plan.shortDescription ?? plan.fullDescription ?? null,
          planId,
          idempotencyKey: planProductIdempotencyKey(planId),
        });
        productId = product.id;
      }
    }

    const stripePrices = await listPricesForProduct(productId, {
      includeInactive: true,
    });
    const byCombo = new Map<string, (typeof stripePrices)[number]>();
    for (const p of stripePrices) {
      const interval = p.recurring?.interval ?? "";
      const intervalCount = p.recurring?.interval_count ?? 1;
      const currency = (p.currency ?? "").toLowerCase();
      byCombo.set(`${interval}:${intervalCount}:${currency}`, p);
    }

    const resolved: Array<{
      stripePriceId: string;
      unitAmount: number;
      currency: string;
      interval: string;
      intervalCount: number;
    }> = [];

    for (const price of pricesToEnsure) {
      const key = `${price.interval}:${price.intervalCount}:${price.currency}`;
      let stripePrice = byCombo.get(key);
      if (!stripePrice) {
        stripePrice = await createSebavioPrice({
          productId,
          planId,
          unitAmount: price.unitAmount,
          currency: price.currency,
          interval: price.interval,
          intervalCount: price.intervalCount,
          idempotencyKey: planPriceIdempotencyKey(
            planId,
            price.interval,
            price.intervalCount,
            price.currency,
          ),
        });
      }

      resolved.push({
        stripePriceId: stripePrice.id,
        unitAmount: stripePrice.unit_amount ?? price.unitAmount,
        currency: (stripePrice.currency ?? price.currency).toLowerCase(),
        interval: stripePrice.recurring?.interval ?? price.interval,
        intervalCount:
          stripePrice.recurring?.interval_count ?? price.intervalCount,
      });
    }

    await finalizePlanActive({
      planId,
      stripeProductId: productId,
      stripeMode: mode,
      prices: resolved,
    });

    await writeAdminAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      entity: "plan",
      entityId: planId,
      action: "PLAN_RECONCILE_SUCCESS",
      newValue: {
        result: "success",
        stripeMode: mode,
        stripeProductId: productId,
        priceIds: resolved.map((p) => p.stripePriceId),
      },
      ipAddress: actor.ipAddress ?? null,
    });

    return { status: "active" };
  } catch (error) {
    await markPartialFailure(planId, error, actor);
    throw error;
  }
}

function assertPlanMode(planStripeMode: string, mode: string): void {
  if (planStripeMode !== mode) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Incohérence de mode Stripe : forfait=${planStripeMode}, serveur=${mode}.`,
      400,
    );
  }
}

function assertNotArchived(status: string): void {
  if (status === "archived") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Ce forfait est archivé et ne peut plus être modifié.",
      400,
    );
  }
}

export async function updatePlanMetadata(
  rawInput: UpdatePlanMetadataInput,
  actor: PlanActor,
): Promise<void> {
  const input = updatePlanMetadataSchema.parse(rawInput);
  const mode = getStripeMode();
  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan) {
    throw new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404);
  }
  assertNotArchived(plan.status);
  assertPlanMode(plan.stripeMode, mode);

  const oldValue = {
    publicName: plan.publicName,
    shortDescription: plan.shortDescription,
    fullDescription: plan.fullDescription,
    displayOrder: plan.displayOrder,
    isFeatured: plan.isFeatured,
    isVisibleOnSignup: plan.isVisibleOnSignup,
    defaultTrialDays: plan.defaultTrialDays,
    stripeMode: plan.stripeMode,
  };

  await prisma.plan.update({
    where: { id: plan.id },
    data: {
      publicName: input.publicName,
      shortDescription: input.shortDescription ?? null,
      fullDescription: input.fullDescription ?? null,
      displayOrder: input.displayOrder,
      isFeatured: input.isFeatured,
      isVisibleOnSignup: input.isVisibleOnSignup,
      defaultTrialDays:
        input.defaultTrialDays === undefined
          ? plan.defaultTrialDays
          : input.defaultTrialDays,
    },
  });

  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "plan",
    entityId: plan.id,
    action: "PLAN_METADATA_UPDATE",
    oldValue,
    newValue: {
      result: "success",
      stripeMode: mode,
      publicName: input.publicName,
      displayOrder: input.displayOrder,
      isFeatured: input.isFeatured,
      isVisibleOnSignup: input.isVisibleOnSignup,
    },
    ipAddress: actor.ipAddress ?? null,
  });
}

export async function hidePlan(
  rawInput: HidePlanInput,
  actor: PlanActor,
): Promise<void> {
  const input = hidePlanSchema.parse(rawInput);
  const mode = getStripeMode();
  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan) {
    throw new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404);
  }
  assertNotArchived(plan.status);
  assertPlanMode(plan.stripeMode, mode);

  await prisma.plan.update({
    where: { id: plan.id },
    data: {
      status: "hidden",
      isVisibleOnSignup: false,
    },
  });

  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "plan",
    entityId: plan.id,
    action: "PLAN_HIDDEN",
    reason: input.reason,
    oldValue: {
      status: plan.status,
      isVisibleOnSignup: plan.isVisibleOnSignup,
      stripeMode: mode,
    },
    newValue: {
      result: "success",
      status: "hidden",
      isVisibleOnSignup: false,
      stripeMode: mode,
    },
    ipAddress: actor.ipAddress ?? null,
  });
}

export async function archivePlan(
  rawInput: ArchivePlanInput,
  actor: PlanActor,
): Promise<void> {
  const input = archivePlanSchema.parse(rawInput);
  const mode = getStripeMode();
  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan) {
    throw new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404);
  }
  assertNotArchived(plan.status);
  assertPlanMode(plan.stripeMode, mode);

  if (input.archiveStripeProduct && plan.stripeProductId) {
    await archiveStripeProduct(plan.stripeProductId);
  }

  const archivedAt = new Date();
  await prisma.plan.update({
    where: { id: plan.id },
    data: {
      status: "archived",
      archivedAt,
      isVisibleOnSignup: false,
    },
  });

  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "plan",
    entityId: plan.id,
    action: "PLAN_ARCHIVED",
    reason: input.reason,
    oldValue: { status: plan.status, stripeMode: mode },
    newValue: {
      result: "success",
      status: "archived",
      archivedAt: archivedAt.toISOString(),
      archiveStripeProduct: input.archiveStripeProduct,
      stripeMode: mode,
    },
    ipAddress: actor.ipAddress ?? null,
  });
}

export async function duplicatePlan(
  input: { planId: string; internalName: string },
  actor: PlanActor,
): Promise<{ planId: string }> {
  const mode = getStripeMode();
  const source = await prisma.plan.findUnique({
    where: { id: input.planId },
    include: {
      prices: { where: { isCurrent: true } },
      entitlements: true,
    },
  });

  if (!source) {
    throw new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404);
  }
  assertPlanMode(source.stripeMode, mode);

  if (source.prices.length === 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Impossible de dupliquer un forfait sans prix courant.",
      400,
    );
  }

  const result = await createPlan(
    {
      internalName: input.internalName,
      publicName: source.publicName,
      shortDescription: source.shortDescription ?? undefined,
      fullDescription: source.fullDescription ?? undefined,
      displayOrder: source.displayOrder,
      isFeatured: false,
      isVisibleOnSignup: source.isVisibleOnSignup,
      defaultTrialDays: source.defaultTrialDays,
      prices: source.prices.map((p) => ({
        unitAmount: p.unitAmount,
        currency: p.currency,
        interval: p.interval as "day" | "week" | "month" | "year",
        intervalCount: p.intervalCount,
      })),
      entitlements: source.entitlements.map((e) => ({
        key: e.key as CreatePlanInput["entitlements"] extends Array<infer U>
          ? U extends { key: infer K }
            ? K
            : never
          : never,
        enabled: e.enabled,
        limit: e.limit,
        value: e.value,
      })) as CreatePlanInput["entitlements"],
    },
    actor,
  );

  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "plan",
    entityId: result.planId,
    action: "PLAN_DUPLICATED",
    oldValue: { sourcePlanId: source.id, stripeMode: mode },
    newValue: {
      result: "success",
      planId: result.planId,
      stripeMode: mode,
    },
    ipAddress: actor.ipAddress ?? null,
  });

  return result;
}
