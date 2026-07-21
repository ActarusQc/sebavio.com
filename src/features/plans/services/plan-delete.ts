/**
 * Suppression définitive d’un forfait (hard-delete) — mode Stripe test uniquement.
 * Refus conservateur si historique financier / abonnements / grants.
 */

import "server-only";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { writeAdminAuditLog } from "@/features/admin/services/audit-write";
import {
  deletePlanSchema,
  type DeletePlanInput,
} from "@/features/plans/lib/schemas";
import type { PlanDeleteImpact } from "@/features/plans/lib/plan-delete-types";
import type { PlanActor } from "@/features/plans/services/plan-crud";
import { getStripeMode } from "@/services/stripe/config";
import { archiveStripeProduct } from "@/services/stripe/product-service";
import { deactivateStripePrice } from "@/services/stripe/price-service";

export type { PlanDeleteImpact } from "@/features/plans/lib/plan-delete-types";

async function loadPlanForDelete(planId: string) {
  const mode = getStripeMode();
  const plan = await prisma.plan.findFirst({
    where: { id: planId, stripeMode: mode },
    include: {
      prices: {
        select: {
          id: true,
          stripePriceId: true,
          billingType: true,
          interval: true,
          intervalCount: true,
          unitAmount: true,
          currency: true,
          isCurrent: true,
          accessDurationDays: true,
        },
      },
    },
  });

  if (!plan) {
    throw new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404);
  }

  return plan;
}

function subscriptionWhereForPlan(plan: {
  stripeMode: string;
  stripeProductId: string | null;
  prices: Array<{ stripePriceId: string }>;
}) {
  const orBranches: Array<Record<string, unknown>> = [];
  const priceIds = plan.prices.map((p) => p.stripePriceId);
  if (priceIds.length > 0) {
    orBranches.push({ stripePriceId: { in: priceIds } });
  }
  if (plan.stripeProductId) {
    orBranches.push({ stripeProductId: plan.stripeProductId });
  }
  if (orBranches.length === 0) {
    return null;
  }
  return {
    stripeMode: plan.stripeMode,
    OR: orBranches,
  };
}

/**
 * Impact de suppression + raisons de blocage (sans confirmation système).
 */
export async function getPlanDeleteImpact(
  planId: string,
): Promise<PlanDeleteImpact> {
  const plan = await loadPlanForDelete(planId);
  const subWhere = subscriptionWhereForPlan(plan);

  const [purchasesCount, accessGrantsCount, activeGrantsCount, subscriptions] =
    await Promise.all([
      prisma.planPurchase.count({ where: { planId: plan.id } }),
      prisma.planAccessGrant.count({ where: { planId: plan.id } }),
      prisma.planAccessGrant.count({
        where: { planId: plan.id, status: "active" },
      }),
      subWhere
        ? prisma.stripeSubscription.findMany({
            where: subWhere,
            select: { userId: true, status: true },
          })
        : Promise.resolve([] as Array<{ userId: string; status: string }>),
    ]);

  const activeStatuses = new Set(["active", "trialing", "past_due"]);
  const activeSubscriptions = subscriptions.filter((s) =>
    activeStatuses.has(s.status),
  ).length;

  const grantUsers = await prisma.planAccessGrant.findMany({
    where: { planId: plan.id, status: "active" },
    select: { userId: true },
    distinct: ["userId"],
  });

  const userIds = new Set<string>();
  for (const s of subscriptions) {
    if (activeStatuses.has(s.status)) userIds.add(s.userId);
  }
  for (const g of grantUsers) {
    userIds.add(g.userId);
  }

  const blockReasons: string[] = [];
  if (subscriptions.length > 0) {
    blockReasons.push(
      `${subscriptions.length} abonnement(s) Stripe lié(s) à ce forfait (tout historique).`,
    );
  }
  if (purchasesCount > 0) {
    blockReasons.push(
      `${purchasesCount} achat(s) (PlanPurchase) — historique financier.`,
    );
  }
  if (accessGrantsCount > 0) {
    blockReasons.push(
      `${accessGrantsCount} droit(s) d’accès (PlanAccessGrant) associé(s).`,
    );
  }
  if (plan.isSystemProtected) {
    blockReasons.push(
      "Forfait système protégé — confirmation renforcée requise.",
    );
  }
  if (getStripeMode() !== "test" && plan.stripeProductId) {
    blockReasons.push(
      "Suppression définitive Stripe refusée hors mode test — archivez le forfait.",
    );
  }

  const canDelete =
    subscriptions.length === 0 &&
    purchasesCount === 0 &&
    accessGrantsCount === 0 &&
    (getStripeMode() === "test" || !plan.stripeProductId);

  return {
    planId: plan.id,
    publicName: plan.publicName,
    internalName: plan.internalName,
    status: plan.status,
    isSystemProtected: plan.isSystemProtected,
    stripeProductId: plan.stripeProductId,
    stripeMode: plan.stripeMode,
    pricesCount: plan.prices.length,
    priceSummaries: plan.prices.map((p) => ({
      billingType: p.billingType,
      interval: p.interval,
      intervalCount: p.intervalCount,
      unitAmount: p.unitAmount,
      currency: p.currency,
      isCurrent: p.isCurrent,
      accessDurationDays: p.accessDurationDays,
    })),
    subscriptionsTotal: subscriptions.length,
    activeSubscriptions,
    purchasesCount,
    accessGrantsCount,
    activeGrantsCount,
    usersCovered: userIds.size,
    canDelete,
    blockReasons,
  };
}

export type CanHardDeleteOptions = {
  confirmSystemDelete?: boolean;
  confirmPublicName?: string;
};

/**
 * Vérifie si la suppression définitive est autorisée.
 */
export async function canHardDeletePlan(
  planId: string,
  options: CanHardDeleteOptions = {},
): Promise<boolean> {
  const impact = await getPlanDeleteImpact(planId);
  if (
    impact.subscriptionsTotal > 0 ||
    impact.purchasesCount > 0 ||
    impact.accessGrantsCount > 0
  ) {
    return false;
  }
  if (getStripeMode() !== "test" && impact.stripeProductId) {
    return false;
  }
  if (impact.isSystemProtected) {
    if (!options.confirmSystemDelete) return false;
    if (
      !options.confirmPublicName ||
      options.confirmPublicName !== impact.publicName
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Suppression définitive locale (+ archive/désactivation Stripe en mode test).
 */
export async function deletePlanHard(
  rawInput: DeletePlanInput,
  actor: PlanActor,
): Promise<void> {
  const input = deletePlanSchema.parse(rawInput);
  const mode = getStripeMode();
  const plan = await loadPlanForDelete(input.planId);

  if (input.confirmPublicName !== plan.publicName) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Le nom public saisi ne correspond pas exactement au forfait.",
      400,
    );
  }

  if (plan.isSystemProtected && !input.confirmSystemDelete) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Ce forfait système est protégé. Cochez la confirmation de suppression système.",
      400,
    );
  }

  const allowed = await canHardDeletePlan(plan.id, {
    confirmSystemDelete: input.confirmSystemDelete,
    confirmPublicName: input.confirmPublicName,
  });

  if (!allowed) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Suppression définitive impossible : historique d’abonnements, d’achats ou de droits d’accès détecté. Archivez le forfait à la place.",
      400,
    );
  }

  const stripePriceIds = plan.prices.map((p) => p.stripePriceId);
  const stripeProductId = plan.stripeProductId;

  if (mode === "test") {
    for (const priceId of stripePriceIds) {
      try {
        await deactivateStripePrice(priceId);
      } catch {
        // Prix déjà inactif ou introuvable côté Stripe — on continue.
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.planEntitlement.deleteMany({ where: { planId: plan.id } });
    await tx.planPrice.deleteMany({ where: { planId: plan.id } });
    await tx.plan.delete({ where: { id: plan.id } });
  });

  if (mode === "test" && stripeProductId) {
    try {
      await archiveStripeProduct(stripeProductId);
    } catch {
      // Produit déjà archivé — ignorer.
    }
  }

  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "plan",
    entityId: plan.id,
    action: "PLAN_HARD_DELETE",
    reason: input.reason ?? null,
    oldValue: {
      publicName: plan.publicName,
      internalName: plan.internalName,
      status: plan.status,
      isSystemProtected: plan.isSystemProtected,
      stripeProductId,
      stripeMode: mode,
      priceIds: stripePriceIds,
    },
    newValue: {
      result: "success",
      deleted: true,
      stripeMode: mode,
    },
    ipAddress: actor.ipAddress ?? null,
  });
}
