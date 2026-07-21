import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { createInAppNotification } from "@/features/notifications/services/create";
import { regenerateRemindersForVehicle } from "@/services/maintenance-schedule/sync";
import { odometerFromTripSchema } from "@/features/vehicle-maintenance/schemas";
import { assertOdometerNotDecreasing } from "@/features/vehicles/services/odometer";

function parseZod<T>(parse: () => T, fallbackMessage: string): T {
  try {
    return parse();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? fallbackMessage,
        400,
      );
    }
    throw error;
  }
}

/**
 * Propose / confirme l’ajout de la distance d’un voyage terminé au kilométrage.
 */
export async function applyOdometerFromTrip(
  userId: string,
  vehicleId: string,
  raw: unknown,
) {
  const input = parseZod(
    () => odometerFromTripSchema.parse(raw),
    "Données invalides",
  );

  const vehicle = await prisma.userVehicle.findFirst({
    where: { id: vehicleId, userId, deletedAt: null },
  });
  if (!vehicle) {
    throw new AppError("VEH_001", "Véhicule introuvable", 404);
  }

  const trip = await prisma.trip.findFirst({
    where: {
      id: input.tripId,
      userId,
      vehicleId,
      deletedAt: null,
      status: "completed",
    },
    include: {
      route: true,
    },
  });
  if (!trip) {
    throw new AppError(
      "TRIP_001",
      "Voyage terminé introuvable pour ce véhicule",
      404,
    );
  }

  const routeDistance = trip.route?.distanceKm
    ? Number(trip.route.distanceKm)
    : null;
  const distanceKm =
    input.distanceKm ??
    (routeDistance != null ? Math.round(routeDistance) : null);
  if (distanceKm == null || distanceKm <= 0) {
    throw new AppError(
      "MNT_003",
      "Distance du voyage indisponible. Indiquez distanceKm manuellement.",
      400,
    );
  }

  const proposedOdometer = vehicle.currentOdometer + distanceKm;

  if (!input.confirm) {
    await createInAppNotification({
      userId,
      type: "maintenance",
      title: "Kilométrage à confirmer",
      body: `Kilométrage avant : ${vehicle.currentOdometer.toLocaleString("fr-CA")} km · Voyage : ${distanceKm.toLocaleString("fr-CA")} km · Proposé : ${proposedOdometer.toLocaleString("fr-CA")} km`,
      priority: "normal",
      dedupeKey: `odo-trip:${vehicleId}:${trip.id}`,
      sourceEntity: "trip",
      sourceId: trip.id,
      href: `/dashboard/vehicles/${vehicleId}/maintenance`,
    });

    return {
      confirmed: false,
      previousOdometerKm: vehicle.currentOdometer,
      tripDistanceKm: distanceKm,
      proposedOdometerKm: proposedOdometer,
      message: "Confirmez pour mettre à jour le kilométrage du véhicule.",
    };
  }

  assertOdometerNotDecreasing(vehicle.currentOdometer, proposedOdometer);

  await prisma.userVehicle.update({
    where: { id: vehicleId },
    data: {
      currentOdometer: proposedOdometer,
      odometerUpdatedAt: new Date(),
    },
  });

  await regenerateRemindersForVehicle(userId, vehicleId);

  return {
    confirmed: true,
    previousOdometerKm: vehicle.currentOdometer,
    tripDistanceKm: distanceKm,
    proposedOdometerKm: proposedOdometer,
    newOdometerKm: proposedOdometer,
  };
}
