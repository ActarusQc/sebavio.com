/**
 * Contrôles d'accès forfait côté services voyages (serveur uniquement).
 */

import "server-only";

import { isWithinLimit } from "@/features/plans/lib/entitlement-resolve";
import type { PlanEntitlementKey } from "@/features/plans/lib/entitlement-registry";
import {
  assertFeatureAllowed,
  resolveUserAccess,
} from "@/features/subscriptions/services/access-resolve";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function assertCanCreateTrip(userId: string): Promise<void> {
  const access = await resolveUserAccess(userId);
  if (access.level === "admin") return;

  const tripsMax = access.entitlements.find((e) => e.key === "trips.max");
  if (!tripsMax) {
    throw new AppError(
      "ACCESS_DENIED",
      "Cette fonctionnalité n'est pas incluse dans votre forfait actuel.",
      403,
    );
  }

  const currentCount = await prisma.trip.count({
    where: { userId, deletedAt: null },
  });

  if (!isWithinLimit(currentCount, tripsMax)) {
    throw new AppError(
      "ACCESS_DENIED",
      "Limite de voyages atteinte pour votre forfait. Choisissez le Pass 30 jours ou Sebavio Plus pour continuer.",
      403,
    );
  }
}

export async function assertTripFeature(
  userId: string,
  entitlementKey: PlanEntitlementKey,
): Promise<void> {
  await assertFeatureAllowed(userId, entitlementKey);
}

/** Mutations « voyage complet » (itinéraire détaillé, stops, etc.). */
export async function assertFullTripAccess(userId: string): Promise<void> {
  await assertFeatureAllowed(userId, "trip.full_access.enabled");
}
