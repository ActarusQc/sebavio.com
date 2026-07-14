import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { haversineKm } from "@/lib/geo";
import { writeAuditLog } from "@/features/auth/services/audit";
import { ACTIVITY_STOP_DISTANCE_WARN_KM } from "@/features/activities/constants";
import type { AttachActivityResult } from "@/features/activities/types";
import {
  assertWritableStatus,
  getOwnedTripOrThrow,
} from "@/features/trips/services";

/**
 * Attache une activité à une étape (N activités par étape).
 * Avertissement non bloquant si distance > 50 km.
 */
export async function attachActivityToStop(
  userId: string,
  tripId: string,
  stopId: string,
  activityId: string,
  notes?: string | null,
  ipAddress?: string | null,
): Promise<AttachActivityResult> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const stop = trip.stops.find((s) => s.id === stopId);
  if (!stop) {
    throw new AppError("TRIP_001", "Voyage introuvable", 404);
  }

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, deletedAt: null },
  });
  if (!activity) {
    throw new AppError("ACT_001", "Activité introuvable", 404);
  }

  let distanceKm: number | null = null;
  let distanceWarning: string | null = null;

  if (stop.latitude != null && stop.longitude != null) {
    distanceKm =
      Math.round(
        haversineKm(
          Number(stop.latitude),
          Number(stop.longitude),
          Number(activity.latitude),
          Number(activity.longitude),
        ) * 10,
      ) / 10;
    if (distanceKm > ACTIVITY_STOP_DISTANCE_WARN_KM) {
      distanceWarning = `Cette activité est à ${distanceKm} km de cette étape`;
    }
  }

  const existing = await prisma.tripStopActivity.findFirst({
    where: { tripStopId: stopId, activityId },
  });

  let link;
  if (existing && existing.deletedAt == null) {
    throw new AppError(
      "ACT_002",
      "Cette activité est déjà liée à cette étape",
      409,
    );
  }

  if (existing) {
    link = await prisma.tripStopActivity.update({
      where: { id: existing.id },
      data: {
        deletedAt: null,
        notes: notes ?? existing.notes,
      },
    });
  } else {
    const maxSeq = await prisma.tripStopActivity.aggregate({
      where: { tripStopId: stopId, deletedAt: null },
      _max: { sequence: true },
    });
    const nextSeq = (maxSeq._max.sequence ?? 0) + 1;
    link = await prisma.tripStopActivity.create({
      data: {
        tripStopId: stopId,
        activityId,
        sequence: nextSeq,
        notes: notes ?? null,
      },
    });
  }

  await writeAuditLog({
    userId,
    entity: "trip_stop_activities",
    entityId: link.id,
    action: "attach_activity",
    newValue: { tripId, stopId, activityId, distanceKm, distanceWarning },
    ipAddress,
  });

  return {
    stopId,
    activityId,
    linkId: link.id,
    distanceKm,
    distanceWarning,
  };
}

export async function detachActivityFromStop(
  userId: string,
  tripId: string,
  stopId: string,
  activityId: string,
  ipAddress?: string | null,
): Promise<void> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const stop = trip.stops.find((s) => s.id === stopId);
  if (!stop) {
    throw new AppError("TRIP_001", "Voyage introuvable", 404);
  }

  const link = await prisma.tripStopActivity.findFirst({
    where: { tripStopId: stopId, activityId, deletedAt: null },
  });
  if (!link) {
    throw new AppError("ACT_001", "Lien activité introuvable", 404);
  }

  await prisma.tripStopActivity.update({
    where: { id: link.id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    userId,
    entity: "trip_stop_activities",
    entityId: link.id,
    action: "detach_activity",
    oldValue: { tripId, stopId, activityId },
    ipAddress,
  });
}
