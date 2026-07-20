/**
 * Lectures forfaits — toujours filtrées par le mode Stripe courant.
 */

import "server-only";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  listPlansSchema,
  getPlanSchema,
  type ListPlansInput,
  type GetPlanInput,
} from "@/features/plans/lib/schemas";
import {
  countSubscribersForPlan,
  type PlanSubscriberCounts,
} from "@/features/plans/lib/subscriber-counts";
import { getStripeMode } from "@/services/stripe/config";

export type PlanListItem = {
  id: string;
  internalName: string;
  publicName: string;
  shortDescription: string | null;
  status: string;
  displayOrder: number;
  isFeatured: boolean;
  isVisibleOnSignup: boolean;
  stripeProductId: string | null;
  stripeMode: string;
  lastSyncedAt: Date | null;
  reconciliationError: string | null;
  currentPrices: Array<{
    id: string;
    interval: string;
    intervalCount: number;
    currency: string;
    unitAmount: number;
  }>;
  activeSubscribers: number;
};

export type PlanDetail = {
  id: string;
  internalName: string;
  publicName: string;
  shortDescription: string | null;
  fullDescription: string | null;
  displayOrder: number;
  isFeatured: boolean;
  isVisibleOnSignup: boolean;
  status: string;
  archivedAt: Date | null;
  defaultTrialDays: number | null;
  stripeProductId: string | null;
  stripeMode: string;
  lastSyncedAt: Date | null;
  reconciliationError: string | null;
  createdAt: Date;
  updatedAt: Date;
  prices: Array<{
    id: string;
    stripePriceId: string;
    interval: string;
    intervalCount: number;
    currency: string;
    unitAmount: number;
    status: string;
    isCurrent: boolean;
    stripeMode: string;
    archivedAt: Date | null;
    createdAt: Date;
  }>;
  entitlements: Array<{
    id: string;
    key: string;
    enabled: boolean;
    limit: number | null;
    value: string | null;
  }>;
  subscribers: PlanSubscriberCounts;
};

/**
 * Liste des forfaits du mode Stripe courant uniquement.
 */
export async function listPlans(
  rawInput: ListPlansInput | undefined = {},
): Promise<PlanListItem[]> {
  const input = listPlansSchema.parse(rawInput ?? {});
  const stripeMode = getStripeMode();

  const plans = await prisma.plan.findMany({
    where: {
      stripeMode,
      ...(input.status ? { status: input.status } : {}),
    },
    orderBy: [{ displayOrder: "asc" }, { publicName: "asc" }],
    include: {
      prices: {
        where: { isCurrent: true, stripeMode },
        select: {
          id: true,
          interval: true,
          intervalCount: true,
          currency: true,
          unitAmount: true,
        },
      },
    },
  });

  const items: PlanListItem[] = [];
  for (const plan of plans) {
    const counts = await countSubscribersForPlan(plan.id);
    items.push({
      id: plan.id,
      internalName: plan.internalName,
      publicName: plan.publicName,
      shortDescription: plan.shortDescription,
      status: plan.status,
      displayOrder: plan.displayOrder,
      isFeatured: plan.isFeatured,
      isVisibleOnSignup: plan.isVisibleOnSignup,
      stripeProductId: plan.stripeProductId,
      stripeMode: plan.stripeMode,
      lastSyncedAt: plan.lastSyncedAt,
      reconciliationError: plan.reconciliationError,
      currentPrices: plan.prices,
      activeSubscribers: counts.active,
    });
  }

  return items;
}

/**
 * Détail complet d’un forfait du mode courant (prix, entitlements, abonnés).
 * Un forfait d’un autre mode est traité comme introuvable.
 */
export async function getPlan(rawInput: GetPlanInput): Promise<PlanDetail> {
  const input = getPlanSchema.parse(rawInput);
  const stripeMode = getStripeMode();

  const plan = await prisma.plan.findFirst({
    where: {
      id: input.planId,
      stripeMode,
    },
    include: {
      prices: {
        where: { stripeMode },
        orderBy: [{ isCurrent: "desc" }, { createdAt: "desc" }],
      },
      entitlements: {
        orderBy: { key: "asc" },
      },
    },
  });

  if (!plan) {
    throw new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404);
  }

  const subscribers = await countSubscribersForPlan(plan.id);

  return {
    id: plan.id,
    internalName: plan.internalName,
    publicName: plan.publicName,
    shortDescription: plan.shortDescription,
    fullDescription: plan.fullDescription,
    displayOrder: plan.displayOrder,
    isFeatured: plan.isFeatured,
    isVisibleOnSignup: plan.isVisibleOnSignup,
    status: plan.status,
    archivedAt: plan.archivedAt,
    defaultTrialDays: plan.defaultTrialDays,
    stripeProductId: plan.stripeProductId,
    stripeMode: plan.stripeMode,
    lastSyncedAt: plan.lastSyncedAt,
    reconciliationError: plan.reconciliationError,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    prices: plan.prices.map((p) => ({
      id: p.id,
      stripePriceId: p.stripePriceId,
      interval: p.interval,
      intervalCount: p.intervalCount,
      currency: p.currency,
      unitAmount: p.unitAmount,
      status: p.status,
      isCurrent: p.isCurrent,
      stripeMode: p.stripeMode,
      archivedAt: p.archivedAt,
      createdAt: p.createdAt,
    })),
    entitlements: plan.entitlements.map((e) => ({
      id: e.id,
      key: e.key,
      enabled: e.enabled,
      limit: e.limit,
      value: e.value,
    })),
    subscribers,
  };
}

export type PlanSubscriberRow = {
  subscriptionId: string;
  userId: string;
  userEmail: string | null;
  status: string;
  stripePriceId: string | null;
  unitAmount: number | null;
  currency: string | null;
  billingInterval: string | null;
};

/**
 * Abonnés liés au forfait (mode courant uniquement).
 */
export async function listPlanSubscribers(
  planId: string,
): Promise<PlanSubscriberRow[]> {
  const stripeMode = getStripeMode();
  const plan = await prisma.plan.findFirst({
    where: { id: planId, stripeMode },
    select: {
      stripeProductId: true,
      stripeMode: true,
      prices: { select: { stripePriceId: true } },
    },
  });

  if (!plan) {
    throw new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404);
  }

  const priceIds = plan.prices.map((p) => p.stripePriceId);
  const orBranches: Array<Record<string, unknown>> = [];
  if (priceIds.length > 0) {
    orBranches.push({ stripePriceId: { in: priceIds } });
  }
  if (plan.stripeProductId) {
    orBranches.push({
      stripePriceId: null,
      stripeProductId: plan.stripeProductId,
    });
  }
  if (orBranches.length === 0) return [];

  const rows = await prisma.stripeSubscription.findMany({
    where: {
      stripeMode: plan.stripeMode,
      OR: orBranches,
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      userId: true,
      status: true,
      stripePriceId: true,
      unitAmount: true,
      currency: true,
      billingInterval: true,
      user: { select: { email: true } },
    },
  });

  return rows.map((r) => ({
    subscriptionId: r.id,
    userId: r.userId,
    userEmail: r.user.email,
    status: r.status,
    stripePriceId: r.stripePriceId,
    unitAmount: r.unitAmount,
    currency: r.currency,
    billingInterval: r.billingInterval,
  }));
}

export type PlanAuditRow = {
  id: string;
  action: string;
  actorEmail: string | null;
  reason: string | null;
  createdAt: Date;
};

export async function listPlanAuditLogs(
  planId: string,
): Promise<PlanAuditRow[]> {
  const stripeMode = getStripeMode();
  const plan = await prisma.plan.findFirst({
    where: { id: planId, stripeMode },
    select: { id: true },
  });
  if (!plan) {
    throw new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404);
  }

  const rows = await prisma.auditLog.findMany({
    where: {
      entityId: planId,
      entity: { in: ["plan", "plan_price", "plan_entitlement", "plan_sync"] },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      action: true,
      reason: true,
      createdAt: true,
      user: { select: { email: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    actorEmail: r.user?.email ?? null,
    reason: r.reason,
    createdAt: r.createdAt,
  }));
}
