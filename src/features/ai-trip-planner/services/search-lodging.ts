import "server-only";

import { randomUUID } from "node:crypto";
import { createPlacesCallBudget } from "@/features/trips/activities/places-call-budget";
import {
  isGooglePlacesConfigured,
  searchNearbyActivities,
  searchTextActivities,
} from "@/features/trips/activities/google-places-activity-provider";
import type { AccommodationParseResult } from "@/features/ai-trip-planner/lib/accommodation";
import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";

export type LodgingOption = TripDraftParsed["lodgingOptions"][number];

function lodgingAnchor(draft: TripDraftParsed): {
  latitude: number;
  longitude: number;
  areaLabel: string;
} | null {
  const dest = draft.destination;
  if (dest.latitude != null && dest.longitude != null) {
    return {
      latitude: dest.latitude,
      longitude: dest.longitude,
      areaLabel: dest.city || dest.name || "destination",
    };
  }
  const origin = draft.origin;
  if (origin.latitude != null && origin.longitude != null) {
    return {
      latitude: origin.latitude,
      longitude: origin.longitude,
      areaLabel: origin.city || origin.name || "départ",
    };
  }
  return null;
}

/**
 * Recherche de véritables établissements via Google Places (Nearby + Text).
 */
export async function searchLodgingOptions(input: {
  userId: string;
  sessionId: string;
  draft: TripDraftParsed;
  accommodation: AccommodationParseResult;
}): Promise<{ options: LodgingOption[]; areaLabel: string | null }> {
  const anchor = lodgingAnchor(input.draft);
  if (!anchor || !isGooglePlacesConfigured()) {
    return { options: [], areaLabel: anchor?.areaLabel ?? null };
  }

  const budget = createPlacesCallBudget({
    tripId: input.sessionId,
    userId: input.userId,
    maxCalls: 4,
  });

  const area = anchor.areaLabel;
  const queryBase = input.accommodation.searchQuery ?? "hébergement";
  const textQuery = `${queryBase} près de ${area} Québec`;

  const seen = new Set<string>();
  const options: LodgingOption[] = [];

  const push = (c: {
    name: string;
    address: string | null;
    city: string | null;
    latitude: number;
    longitude: number;
    googlePlaceId: string | null;
    rating: number | null;
    reviewCount: number | null;
    googleMapsUrl: string | null;
    primaryType: string | null;
  }) => {
    const key = c.googlePlaceId || `${c.name}:${c.latitude}:${c.longitude}`;
    if (seen.has(key) || !c.name.trim()) return;
    // Filtrer les motels si on cherche un gîte
    if (
      input.accommodation.type === "bed_and_breakfast" &&
      /\bmotel\b/i.test(c.name)
    ) {
      return;
    }
    if (
      input.accommodation.type === "bed_and_breakfast" &&
      c.primaryType === "motel"
    ) {
      return;
    }
    seen.add(key);
    options.push({
      id: randomUUID(),
      name: c.name,
      address: c.address,
      city: c.city,
      placeId: c.googlePlaceId,
      latitude: c.latitude,
      longitude: c.longitude,
      rating: c.rating,
      ratingCount: c.reviewCount,
      googleMapsUrl: c.googleMapsUrl,
      primaryType: c.primaryType,
    });
  };

  try {
    const text = await searchTextActivities({
      latitude: anchor.latitude,
      longitude: anchor.longitude,
      textQuery,
      radiusMeters: 35_000,
      maxResultCount: 8,
      zoneKind: "destination",
      language: "fr",
      budget,
    });
    for (const c of text.candidates) push(c);
  } catch (error) {
    console.error("[ai-trip-planner] lodging text search failed", {
      name: error instanceof Error ? error.name : "unknown",
    });
  }

  if (options.length < 3) {
    try {
      const nearby = await searchNearbyActivities({
        latitude: anchor.latitude,
        longitude: anchor.longitude,
        includedTypes: input.accommodation.placeTypes.slice(0, 3),
        radiusMeters: 25_000,
        maxResultCount: 8,
        zoneKind: "destination",
        language: "fr",
        budget,
      });
      for (const c of nearby.candidates) push(c);
    } catch (error) {
      console.error("[ai-trip-planner] lodging nearby search failed", {
        name: error instanceof Error ? error.name : "unknown",
      });
    }
  }

  // Score : note + préférence types gîte
  options.sort((a, b) => {
    const score = (o: LodgingOption) => {
      let s = o.rating ?? 0;
      if (
        input.accommodation.type === "bed_and_breakfast" &&
        /g[iî]te|bed|breakfast|couette|inn|auberge|guest/i.test(
          `${o.name} ${o.primaryType ?? ""}`,
        )
      ) {
        s += 2;
      }
      return s;
    };
    return score(b) - score(a);
  });

  return { options: options.slice(0, 6), areaLabel: area };
}
