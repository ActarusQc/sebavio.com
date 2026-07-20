/**
 * Comptage abonnés + estimation revenus mensuels pour un forfait.
 * intervalCount : via PlanPrice (absent de StripeSubscription — mono-item Phase 3).
 */

import "server-only";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

/** Statuts actifs Phase 4 (comptage forfaits). */
export const PLAN_ACTIVE_SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
] as const;

export type PlanSubscriberCounts = {
  active: number;
  canceled: number;
  estimatedMonthlyRevenueCents: number | null;
  revenueIsComplete: boolean;
};

type PriceMeta = {
  stripePriceId: string;
  interval: string;
  intervalCount: number;
};

function monthlyFromSubscription(input: {
  unitAmount: number | null;
  billingInterval: string | null;
  quantity: number;
  intervalCount: number | null;
}): number | null {
  if (
    input.unitAmount == null ||
    input.billingInterval == null ||
    input.intervalCount == null ||
    input.intervalCount <= 0
  ) {
    return null;
  }

  const qty = input.quantity > 0 ? input.quantity : 1;
  const amount = input.unitAmount * qty;

  if (input.billingInterval === "month") {
    return amount / input.intervalCount;
  }
  if (input.billingInterval === "year") {
    return amount / (12 * input.intervalCount);
  }
  return null;
}

export async function countSubscribersForPlan(
  planId: string,
): Promise<PlanSubscriberCounts> {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      status: true,
      stripeMode: true,
      stripeProductId: true,
      prices: {
        select: {
          stripePriceId: true,
          interval: true,
          intervalCount: true,
          unitAmount: true,
          status: true,
        },
      },
    },
  });

  if (!plan) {
    throw new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404);
  }

  const planPriceIds = plan.prices.map((p) => p.stripePriceId);
  const priceById = new Map<string, PriceMeta>(
    plan.prices.map((p) => [
      p.stripePriceId,
      {
        stripePriceId: p.stripePriceId,
        interval: p.interval,
        intervalCount: p.intervalCount,
      },
    ]),
  );

  if (planPriceIds.length === 0 && !plan.stripeProductId) {
    return {
      active: 0,
      canceled: 0,
      estimatedMonthlyRevenueCents: 0,
      revenueIsComplete: true,
    };
  }

  const orBranches: Array<Record<string, unknown>> = [];
  if (planPriceIds.length > 0) {
    orBranches.push({ stripePriceId: { in: planPriceIds } });
  }
  if (plan.stripeProductId) {
    orBranches.push({
      stripePriceId: null,
      stripeProductId: plan.stripeProductId,
    });
  }

  const subscriptions = await prisma.stripeSubscription.findMany({
    where: {
      stripeMode: plan.stripeMode,
      OR: orBranches,
    },
    select: {
      status: true,
      stripePriceId: true,
      unitAmount: true,
      billingInterval: true,
      quantity: true,
    },
  });

  let active = 0;
  let canceled = 0;
  const activeMonthlyParts: Array<number | null> = [];

  for (const sub of subscriptions) {
    if (
      (PLAN_ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(
        sub.status,
      )
    ) {
      active += 1;

      let intervalCount: number | null = null;
      if (sub.stripePriceId) {
        const meta = priceById.get(sub.stripePriceId);
        intervalCount = meta?.intervalCount ?? null;
      }
      // Fallback produit (stripePriceId null) : pas d'intervalCount fiable → null

      activeMonthlyParts.push(
        monthlyFromSubscription({
          unitAmount: sub.unitAmount,
          billingInterval: sub.billingInterval,
          quantity: sub.quantity,
          intervalCount,
        }),
      );
    } else if (sub.status === "canceled") {
      canceled += 1;
    }
  }

  if (active === 0) {
    return {
      active: 0,
      canceled,
      estimatedMonthlyRevenueCents: 0,
      revenueIsComplete: true,
    };
  }

  if (activeMonthlyParts.some((v) => v == null)) {
    return {
      active,
      canceled,
      estimatedMonthlyRevenueCents: null,
      revenueIsComplete: false,
    };
  }

  const total = activeMonthlyParts.reduce<number>(
    (sum, v) => sum + (v as number),
    0,
  );

  return {
    active,
    canceled,
    estimatedMonthlyRevenueCents: Math.round(total),
    revenueIsComplete: true,
  };
}
