import "server-only";

import { getMapsService } from "@/services/maps";
import { AppError } from "@/lib/errors";
import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";

export async function resolvePlaceName(
  userId: string,
  name: string,
): Promise<{
  name: string;
  placeId: string | null;
  latitude: number;
  longitude: number;
}> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new AppError("VALIDATION_ERROR", "Lieu invalide.", 400);
  }

  try {
    const result = await getMapsService().geocode(userId, trimmed);
    return {
      name: result.formattedAddress || trimmed,
      placeId: null,
      latitude: result.lat,
      longitude: result.lng,
    };
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === "EXT_002") {
        throw new AppError(
          "VALIDATION_ERROR",
          `Lieu ambigu ou introuvable : « ${trimmed} ». Précisez la ville ou la province.`,
          400,
        );
      }
      throw error;
    }
    throw new AppError(
      "EXT_001",
      "Le service de localisation est temporairement indisponible.",
      503,
    );
  }
}

export async function ensureDraftPlacesGeocoded(
  userId: string,
  draft: TripDraftParsed,
): Promise<TripDraftParsed> {
  const next = {
    ...draft,
    origin: { ...draft.origin },
    destination: { ...draft.destination },
  };

  if (
    next.origin.name &&
    (next.origin.latitude == null || next.origin.longitude == null)
  ) {
    const resolved = await resolvePlaceName(userId, next.origin.name);
    next.origin = {
      name: resolved.name,
      placeId: resolved.placeId,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
    };
  }

  if (
    next.destination.name &&
    (next.destination.latitude == null || next.destination.longitude == null)
  ) {
    const resolved = await resolvePlaceName(userId, next.destination.name);
    next.destination = {
      name: resolved.name,
      placeId: resolved.placeId,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
    };
  }

  return next;
}
