import "server-only";

import { getMapsService } from "@/services/maps";
import { AppError } from "@/lib/errors";
import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";
import { ensureDraftPlacesGeocoded } from "@/features/ai-trip-planner/services/geocode-places";

/**
 * Recalcule distance/durée via le moteur cartographique réel.
 * En flux conversationnel : échec soft (null + warning).
 */
export async function recalculateDraftEstimates(
  userId: string,
  draft: TripDraftParsed,
  options?: { strict?: boolean },
): Promise<TripDraftParsed> {
  let next = { ...draft };

  if (!next.origin.name || !next.destination.name) {
    return {
      ...next,
      estimatedDistanceKm: null,
      estimatedDurationMinutes: null,
    };
  }

  try {
    next = await ensureDraftPlacesGeocoded(userId, next);
  } catch (error) {
    if (options?.strict) throw error;
    return {
      ...next,
      softWarnings: [
        ...next.softWarnings.filter((w) => !w.includes("localisation")),
        "Impossible de localiser précisément les lieux pour l’instant.",
      ],
    };
  }

  if (
    next.origin.latitude == null ||
    next.origin.longitude == null ||
    next.destination.latitude == null ||
    next.destination.longitude == null
  ) {
    return next;
  }

  try {
    const directions = await getMapsService().directions(
      userId,
      { lat: next.origin.latitude, lng: next.origin.longitude },
      { lat: next.destination.latitude, lng: next.destination.longitude },
      next.stops
        .filter(
          (s) =>
            s.accepted &&
            s.latitude != null &&
            s.longitude != null &&
            s.category !== "fuel",
        )
        .slice(0, 8)
        .map((s) => ({
          lat: s.latitude as number,
          lng: s.longitude as number,
          label: s.name,
        })),
    );

    return {
      ...next,
      estimatedDistanceKm: directions.distanceKm,
      estimatedDurationMinutes: directions.durationMin,
      softWarnings: next.softWarnings.filter((w) => !w.includes("itinéraire")),
    };
  } catch (error) {
    if (options?.strict) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "EXT_001",
        "Le calcul d’itinéraire est temporairement indisponible.",
        503,
      );
    }
    return {
      ...next,
      estimatedDistanceKm: null,
      estimatedDurationMinutes: null,
      softWarnings: [
        ...next.softWarnings.filter((w) => !w.includes("itinéraire")),
        "Le calcul d’itinéraire est temporairement indisponible.",
      ],
    };
  }
}
