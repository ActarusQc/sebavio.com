import "server-only";

import type { PlanAccessGrant } from "@prisma/client";

import {
  PLAN_ENTITLEMENT_KEYS,
  type PlanEntitlementKey,
  type PlanEntitlementValue,
} from "@/features/plans/lib/entitlement-registry";
import { resolveEntitlementFromRows } from "@/features/plans/lib/entitlement-resolve";
import {
  isFullAccessLevel,
  type AccessLevel,
} from "@/features/subscriptions/lib/access-levels";
import { OFFICIAL_PLAN_SLUGS } from "@/features/subscriptions/lib/official-plan-slugs";
import { expirePassIfNeeded } from "@/features/subscriptions/services/pass-access";
import type {
  LimitedTripPreview,
  LimitedTripPreviewInput,
} from "@/features/subscriptions/types";
import type { UserRole } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getStripeMode } from "@/services/stripe/config";

export type { LimitedTripPreview, LimitedTripPreviewInput };
const PLUS_ACTIVE_STATUSES = ["active", "trialing"] as const;

export type UserAccessSnapshot = {
  userId: string;
  level: AccessLevel;
  planId: string | null;
  planSlug: string | null;
  entitlements: PlanEntitlementValue[];
  passGrant: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    remainingDays: number;
  } | null;
  subscriptionId: string | null;
  resolvedAt: Date;
};

function fullEntitlements(): PlanEntitlementValue[] {
  return PLAN_ENTITLEMENT_KEYS.map((key) => {
    if (key === "support.priority") {
      return {
        key,
        enabled: true,
        limit: null,
        value: "priority",
      };
    }
    return {
      key,
      enabled: true,
      limit: null,
      value: null,
    };
  });
}

function mapEntitlementRows(
  rows: Array<{
    key: string;
    enabled: boolean;
    limit: number | null;
    value: string | null;
  }>,
): PlanEntitlementValue[] {
  return PLAN_ENTITLEMENT_KEYS.map((key) =>
    resolveEntitlementFromRows(rows, key),
  );
}

async function loadPlanEntitlementsBySlug(
  slug: string,
  stripeMode: string,
): Promise<{
  planId: string | null;
  entitlements: PlanEntitlementValue[];
}> {
  const plan = await prisma.plan.findUnique({
    where: {
      internalName_stripeMode: {
        internalName: slug,
        stripeMode,
      },
    },
    include: {
      entitlements: {
        select: { key: true, enabled: true, limit: true, value: true },
      },
    },
  });

  if (!plan) {
    return { planId: null, entitlements: mapEntitlementRows([]) };
  }

  return {
    planId: plan.id,
    entitlements: mapEntitlementRows(plan.entitlements),
  };
}

function isAdminRole(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

/**
 * Jours restants (plafond inclusif arrondi au supérieur, min 0).
 */
export function getPassRemainingDays(
  grant: Pick<PlanAccessGrant, "endsAt">,
  now: Date = new Date(),
): number {
  const ms = grant.endsAt.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function hasFullAccess(snapshot: UserAccessSnapshot): boolean {
  if (isFullAccessLevel(snapshot.level)) return true;
  const full = snapshot.entitlements.find(
    (e) => e.key === "trip.full_access.enabled",
  );
  return full?.enabled === true;
}

function bucketRange(
  value: number | null | undefined,
  spreadRatio: number,
  roundTo: number,
): { min: number; max: number } | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null;
  const spread = Math.max(value * spreadRatio, roundTo);
  const min = Math.max(0, Math.floor((value - spread) / roundTo) * roundTo);
  const max = Math.ceil((value + spread) / roundTo) * roundTo;
  return { min, max: Math.max(min, max) };
}

/**
 * Aperçu approximatif — jamais de coordonnées précises.
 */
export function buildLimitedTripPreview(
  input: LimitedTripPreviewInput,
): LimitedTripPreview {
  return {
    isApproximate: true,
    distanceKmRange: bucketRange(input.approximateDistanceKm, 0.12, 10),
    durationMinutesRange: bucketRange(
      input.approximateDurationMinutes,
      0.15,
      15,
    ),
    stopsRange: bucketRange(input.stopCount, 0.25, 1),
    fuelLitersRange: bucketRange(input.fuelLitersEstimate, 0.2, 5),
  };
}

export async function resolveUserAccess(
  userId: string,
): Promise<UserAccessSnapshot> {
  const mode = getStripeMode();
  const now = new Date();

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new AppError("VALIDATION_ERROR", "Utilisateur introuvable.", 404);
  }

  if (isAdminRole(user.role as UserRole)) {
    return {
      userId,
      level: "admin",
      planId: null,
      planSlug: null,
      entitlements: fullEntitlements(),
      passGrant: null,
      subscriptionId: null,
      resolvedAt: now,
    };
  }

  const plusPlan = await prisma.plan.findUnique({
    where: {
      internalName_stripeMode: {
        internalName: OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
        stripeMode: mode,
      },
    },
    include: {
      prices: {
        select: { stripePriceId: true },
      },
      entitlements: {
        select: { key: true, enabled: true, limit: true, value: true },
      },
    },
  });

  if (plusPlan) {
    const priceIds = plusPlan.prices.map((p) => p.stripePriceId);
    const subscription = await prisma.stripeSubscription.findFirst({
      where: {
        userId,
        stripeMode: mode,
        status: { in: [...PLUS_ACTIVE_STATUSES] },
        OR: [
          ...(plusPlan.stripeProductId
            ? [{ stripeProductId: plusPlan.stripeProductId }]
            : []),
          ...(priceIds.length > 0 ? [{ stripePriceId: { in: priceIds } }] : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
    });

    if (subscription) {
      return {
        userId,
        level: "sebavio_plus",
        planId: plusPlan.id,
        planSlug: OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
        entitlements: mapEntitlementRows(plusPlan.entitlements),
        passGrant: null,
        subscriptionId: subscription.id,
        resolvedAt: now,
      };
    }
  }

  const passPlan = await prisma.plan.findUnique({
    where: {
      internalName_stripeMode: {
        internalName: OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
        stripeMode: mode,
      },
    },
    include: {
      entitlements: {
        select: { key: true, enabled: true, limit: true, value: true },
      },
    },
  });

  if (passPlan) {
    let grant = await prisma.planAccessGrant.findFirst({
      where: {
        userId,
        planId: passPlan.id,
        status: "active",
      },
      orderBy: { endsAt: "desc" },
    });

    if (grant) {
      grant = await expirePassIfNeeded(grant, now);
    }

    if (grant && grant.status === "active" && grant.endsAt > now) {
      return {
        userId,
        level: "pass_30_jours",
        planId: passPlan.id,
        planSlug: OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
        entitlements: mapEntitlementRows(passPlan.entitlements),
        passGrant: {
          id: grant.id,
          startsAt: grant.startsAt,
          endsAt: grant.endsAt,
          remainingDays: getPassRemainingDays(grant, now),
        },
        subscriptionId: null,
        resolvedAt: now,
      };
    }
  }

  const discovery = await loadPlanEntitlementsBySlug(
    OFFICIAL_PLAN_SLUGS.DECOUVERTE,
    mode,
  );

  return {
    userId,
    level: "decouverte",
    planId: discovery.planId,
    planSlug: OFFICIAL_PLAN_SLUGS.DECOUVERTE,
    entitlements: discovery.entitlements,
    passGrant: null,
    subscriptionId: null,
    resolvedAt: now,
  };
}

export async function assertFeatureAllowed(
  userId: string,
  entitlementKey: PlanEntitlementKey,
): Promise<UserAccessSnapshot> {
  const snapshot = await resolveUserAccess(userId);

  if (snapshot.level === "admin") {
    return snapshot;
  }

  const entitlement = snapshot.entitlements.find(
    (e) => e.key === entitlementKey,
  );

  if (entitlement?.enabled) {
    return snapshot;
  }

  if (
    snapshot.level === "decouverte" &&
    (entitlementKey === "trip.full_access.enabled" ||
      entitlementKey === "trip.gps_tracking.enabled" ||
      entitlementKey === "trip.travel_mode.enabled" ||
      entitlementKey === "trip.detours.enabled" ||
      entitlementKey === "trip.optimize.enabled")
  ) {
    const mode = getStripeMode();
    const passPlan = await prisma.plan.findUnique({
      where: {
        internalName_stripeMode: {
          internalName: OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
          stripeMode: mode,
        },
      },
    });
    if (passPlan) {
      const expiredGrant = await prisma.planAccessGrant.findFirst({
        where: {
          userId,
          planId: passPlan.id,
          status: "expired",
        },
        orderBy: { endsAt: "desc" },
      });
      if (expiredGrant) {
        throw new AppError(
          "PASS_EXPIRED",
          "Votre Pass 30 jours a expiré. Renouvelez-le pour retrouver l'accès complet.",
          403,
        );
      }
    }
  }

  throw new AppError(
    "ACCESS_DENIED",
    "Cette fonctionnalité n'est pas incluse dans votre forfait actuel.",
    403,
  );
}
