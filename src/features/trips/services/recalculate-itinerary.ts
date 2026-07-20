import "server-only";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { TripDetailDto } from "@/features/trips/types";

export type FuelCalculationStatus = "current" | "stale" | "unavailable";

/**
 * Recalcule atomiquement l'itinéraire, puis tente le carburant.
 *
 * Si Directions réussit mais le carburant échoue :
 * - conserve le **nouveau** trajet ;
 * - conserve le dernier `estimatedFuelCost` valide ;
 * - marque `fuelEstimateStale = true` ;
 * - ne remplace jamais le plan par des zéros.
 */
export async function recalculateTripItineraryAtomic(
  userId: string,
  tripId: string,
  options?: {
    includeReturnTrip?: boolean;
    ipAddress?: string | null;
  },
): Promise<{
  trip: TripDetailDto;
  fuelRecalculated: boolean;
  fuelStopCount: number;
  fuelCalculationStatus: FuelCalculationStatus;
}> {
  const { assertFullTripAccess } =
    await import("@/features/trips/services/access-gate");
  await assertFullTripAccess(userId);

  const { rebuildTripRouteFromCanonicalData, getTripById } =
    await import("@/features/trips/services/trips");
  const { estimateTripFuel } =
    await import("@/features/fuel/services/estimate");

  const previousRoute = await prisma.tripRoute.findUnique({
    where: { tripId },
  });
  const previousFuelCost = previousRoute?.estimatedFuelCost ?? null;
  const hadValidFuelPlan = previousFuelCost != null;

  try {
    await rebuildTripRouteFromCanonicalData(userId, tripId, options?.ipAddress);
  } catch (error) {
    console.error(
      "[trips]",
      JSON.stringify({
        operation: "recalculate-itinerary-failed",
        tripId,
        phase: "directions",
        errorCode:
          error instanceof AppError
            ? error.code
            : error instanceof Error
              ? error.message
              : "UNKNOWN",
      }),
    );
    throw error;
  }

  const tripAfterRoute = await getTripById(userId, tripId);
  const includeReturn =
    options?.includeReturnTrip ?? Boolean(tripAfterRoute.returnDate);

  try {
    const estimate = await estimateTripFuel(userId, tripId, {
      includeReturnTrip: includeReturn,
    });
    const fuelStopCount =
      (estimate.calculation?.outbound?.refuelStops?.length ?? 0) +
      (estimate.calculation?.returnLeg?.refuelStops?.length ?? 0);

    const refreshed = await getTripById(userId, tripId);
    return {
      trip: refreshed,
      fuelRecalculated: Boolean(estimate.calculation?.feasible),
      fuelStopCount,
      fuelCalculationStatus: "current",
    };
  } catch (fuelError) {
    console.error(
      "[trips]",
      JSON.stringify({
        operation: "recalculate-itinerary-fuel-failed",
        tripId,
        phase: "fuel",
        errorCode:
          fuelError instanceof AppError
            ? fuelError.code
            : fuelError instanceof Error
              ? fuelError.message
              : "FUEL_FAILED",
        preservedFuelCost: hadValidFuelPlan,
      }),
    );

    // Nouveau trajet conservé ; dernier plan carburant valide conservé (stale).
    await prisma.tripRoute.update({
      where: { tripId },
      data: {
        estimatedFuelCost: hadValidFuelPlan ? previousFuelCost : null,
        fuelEstimateStale: true,
      },
    });

    const refreshed = await getTripById(userId, tripId);
    return {
      trip: refreshed,
      fuelRecalculated: false,
      // Ne pas présenter 0 comme un nouveau résultat valide.
      fuelStopCount: -1,
      fuelCalculationStatus: hadValidFuelPlan ? "stale" : "unavailable",
    };
  }
}
