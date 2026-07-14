import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { haversineKm } from "@/lib/geo";
import { writeAuditLog } from "@/features/auth/services/audit";
import { CAMPGROUND_STOP_DISTANCE_WARN_KM } from "@/features/campings/constants";
import type { AttachCampgroundResult } from "@/features/campings/types";
import {
  assertWritableStatus,
  getOwnedTripOrThrow,
} from "@/features/trips/services";

/**
 * Attache / détache un camping à une étape du voyage propriétaire.
 * Avertissement non bloquant si distance > 50 km (retourné au client).
 */
export async function attachCampgroundToStop(
  userId: string,
  tripId: string,
  stopId: string,
  campgroundId: string | null,
  ipAddress?: string | null,
): Promise<AttachCampgroundResult> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const stop = trip.stops.find((s) => s.id === stopId);
  if (!stop) {
    throw new AppError("TRIP_001", "Voyage introuvable", 404);
  }

  let distanceKm: number | null = null;
  let distanceWarning: string | null = null;

  if (campgroundId) {
    const campground = await prisma.campground.findFirst({
      where: { id: campgroundId, deletedAt: null },
    });
    if (!campground) {
      throw new AppError("CAMP_001", "Camping introuvable", 404);
    }

    if (stop.latitude != null && stop.longitude != null) {
      distanceKm =
        Math.round(
          haversineKm(
            Number(stop.latitude),
            Number(stop.longitude),
            Number(campground.latitude),
            Number(campground.longitude),
          ) * 10,
        ) / 10;
      if (distanceKm > CAMPGROUND_STOP_DISTANCE_WARN_KM) {
        distanceWarning = `Ce camping est à ${distanceKm} km de cette étape`;
      }
    }

    await prisma.tripStop.update({
      where: { id: stopId },
      data: {
        campgroundId,
        stopType: "camping",
        name: stop.name || campground.name,
      },
    });
  } else {
    await prisma.tripStop.update({
      where: { id: stopId },
      data: { campgroundId: null },
    });
  }

  await writeAuditLog({
    userId,
    entity: "trip_stops",
    entityId: stopId,
    action: campgroundId ? "attach_campground" : "detach_campground",
    newValue: { tripId, campgroundId, distanceKm, distanceWarning },
    ipAddress,
  });

  return {
    stopId,
    campgroundId,
    distanceKm,
    distanceWarning,
  };
}
