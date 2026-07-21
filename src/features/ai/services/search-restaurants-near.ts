import "server-only";

import { createPlacesCallBudget } from "@/features/trips/activities/places-call-budget";
import {
  isGooglePlacesConfigured,
  searchNearbyActivities,
  searchTextActivities,
} from "@/features/trips/activities/google-places-activity-provider";
import type { RestaurantStyleId } from "@/features/ai/lib/restaurant-preferences";

export const RESTAURANT_SEARCH_DEFAULT_RADIUS_KM = 10;
export const RESTAURANT_SEARCH_MAX_RADIUS_KM = 25;
export const RESTAURANT_SEARCH_MAX_DETOUR_MINUTES = 20;
export const RESTAURANT_SEARCH_TIME_TOLERANCE_MINUTES = 30;
export const RESTAURANT_MAX_BEHIND_TARGET_KM = 25;
export const RESTAURANT_MAX_BEHIND_TARGET_MINUTES = 20;

/** Alias historique */
export const RESTAURANT_INITIAL_SEARCH_RADIUS_KM =
  RESTAURANT_SEARCH_DEFAULT_RADIUS_KM;

export type RestaurantPlaceCandidate = {
  name: string;
  address: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  rating: number | null;
  ratingCount: number | null;
  priceLevel: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  primaryType: string | null;
};

const STYLE_QUERIES: Record<RestaurantStyleId, string> = {
  fast: "restauration rapide restaurant",
  family: "restaurant familial",
  romantic: "restaurant romantique",
  fine: "restaurant gastronomique",
  local: "restaurant cuisine locale",
  cafe: "café restaurant léger",
  any: "restaurant",
};

/**
 * Recherche Places (Nearby + Text) près du point repas — aucun appel xAI.
 */
export async function searchRestaurantsNearPosition(input: {
  tripId: string;
  userId: string;
  latitude: number;
  longitude: number;
  style: RestaurantStyleId;
  radiusKm?: number;
}): Promise<RestaurantPlaceCandidate[]> {
  if (!isGooglePlacesConfigured()) return [];

  const radiusKm = input.radiusKm ?? RESTAURANT_SEARCH_DEFAULT_RADIUS_KM;
  const radiusMeters = Math.min(
    50_000,
    Math.max(1000, Math.round(radiusKm * 1000)),
  );
  const budget = createPlacesCallBudget({
    tripId: input.tripId,
    userId: input.userId,
    maxCalls: 4,
  });

  const candidates: RestaurantPlaceCandidate[] = [];
  const seen = new Set<string>();

  try {
    const nearby = await searchNearbyActivities({
      latitude: input.latitude,
      longitude: input.longitude,
      includedTypes: ["restaurant", "cafe"],
      radiusMeters,
      maxResultCount: 8,
      zoneKind: "route_sample",
      language: "fr",
      budget,
    });
    for (const c of nearby.candidates) {
      const key = c.googlePlaceId || `${c.name}:${c.latitude}:${c.longitude}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        name: c.name,
        address: c.address,
        city: c.city,
        latitude: c.latitude,
        longitude: c.longitude,
        rating: c.rating,
        ratingCount: c.reviewCount,
        priceLevel: c.priceLevel,
        websiteUrl: c.websiteUrl,
        googleMapsUrl: c.googleMapsUrl,
        primaryType: c.primaryType,
      });
    }
  } catch (error) {
    console.error("[ai] places nearby restaurants failed", {
      name: error instanceof Error ? error.name : "unknown",
    });
  }

  try {
    const text = await searchTextActivities({
      latitude: input.latitude,
      longitude: input.longitude,
      textQuery: STYLE_QUERIES[input.style],
      radiusMeters,
      maxResultCount: 6,
      zoneKind: "route_sample",
      language: "fr",
      budget,
    });
    for (const c of text.candidates) {
      const key = c.googlePlaceId || `${c.name}:${c.latitude}:${c.longitude}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        name: c.name,
        address: c.address,
        city: c.city,
        latitude: c.latitude,
        longitude: c.longitude,
        rating: c.rating,
        ratingCount: c.reviewCount,
        priceLevel: c.priceLevel,
        websiteUrl: c.websiteUrl,
        googleMapsUrl: c.googleMapsUrl,
        primaryType: c.primaryType,
      });
    }
  } catch (error) {
    console.error("[ai] places text restaurants failed", {
      name: error instanceof Error ? error.name : "unknown",
    });
  }

  return candidates.slice(0, 10);
}
