import "server-only";

import { OFFICIAL_PLAN_SLUGS } from "@/features/subscriptions/lib/official-plan-slugs";
import { prisma } from "@/lib/prisma";
import { getStripeMode } from "@/services/stripe/config";

export type PublicPlanPrice = {
  id: string;
  billingType: string;
  interval: string;
  intervalCount: number;
  accessDurationDays: number | null;
  currency: string;
  unitAmount: number;
};

export type PublicPlanEntitlement = {
  key: string;
  enabled: boolean;
  limit: number | null;
  value: string | null;
};

export type PublicOfficialPlan = {
  id: string;
  internalName: string;
  publicName: string;
  shortDescription: string | null;
  fullDescription: string | null;
  displayOrder: number;
  isFeatured: boolean;
  currentPrices: PublicPlanPrice[];
  entitlements: PublicPlanEntitlement[];
};

const OFFICIAL_SLUG_LIST = Object.values(OFFICIAL_PLAN_SLUGS);

/**
 * Forfaits officiels visibles à l’inscription / pricing (mode Stripe courant).
 */
export async function listPublicOfficialPlans(): Promise<PublicOfficialPlan[]> {
  const stripeMode = getStripeMode();

  const plans = await prisma.plan.findMany({
    where: {
      stripeMode,
      status: "active",
      isVisibleOnSignup: true,
      internalName: { in: [...OFFICIAL_SLUG_LIST] },
    },
    orderBy: [{ displayOrder: "asc" }, { publicName: "asc" }],
    include: {
      prices: {
        where: {
          isCurrent: true,
          status: "active",
          stripeMode,
        },
        select: {
          id: true,
          billingType: true,
          interval: true,
          intervalCount: true,
          accessDurationDays: true,
          currency: true,
          unitAmount: true,
        },
        orderBy: { createdAt: "asc" },
      },
      entitlements: {
        select: {
          key: true,
          enabled: true,
          limit: true,
          value: true,
        },
      },
    },
  });

  return plans.map((plan) => ({
    id: plan.id,
    internalName: plan.internalName,
    publicName: plan.publicName,
    shortDescription: plan.shortDescription,
    fullDescription: plan.fullDescription,
    displayOrder: plan.displayOrder,
    isFeatured: plan.isFeatured,
    currentPrices: plan.prices,
    entitlements: plan.entitlements,
  }));
}
