/**
 * Google Places API (New) — recherches activités (serveur uniquement).
 * Nearby Search + Text Search. Jamais de clé serveur côté client.
 */
import {
  MAX_RESULTS_PER_ZONE,
  SEARCH_RADIUS_METERS,
  type ActivityCandidate,
} from "@/features/trips/activities/activity-types";
import type { PlacesCallBudget } from "@/features/trips/activities/places-call-budget";
import {
  assertTripActivityPlacesHourlyBudget,
  consumeGenerationCall,
  recordCacheHit,
} from "@/features/trips/activities/places-call-budget";
import {
  parsePlacesHttpError,
  PlacesProviderError,
  type PlacesOperation,
} from "@/features/trips/activities/places-errors";
import {
  buildSearchCacheKey,
  getCachedCandidates,
  setCachedCandidates,
} from "@/features/trips/activities/trip-activity-cache";

type PlacesNearbyResponse = {
  places?: Array<{
    id?: string;
    name?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    shortFormattedAddress?: string;
    googleMapsUri?: string;
    websiteUri?: string;
    location?: { latitude?: number; longitude?: number };
    primaryType?: string;
    types?: string[];
    rating?: number;
    userRatingCount?: number;
    priceLevel?: string;
    photos?: Array<{ name?: string }>;
    addressComponents?: Array<{
      longText?: string;
      types?: string[];
    }>;
  }>;
};

const FETCH_TIMEOUT_MS = 10_000;
const MAX_CONCURRENCY = 3;

function getPlacesApiKey(): string {
  return (
    process.env.GOOGLE_PLACES_SERVER_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

export function isGooglePlacesConfigured(): boolean {
  return getPlacesApiKey().length > 0;
}

export function getTripActivityProviderMode(): "google" | "mock" {
  const mode = (process.env.TRIP_ACTIVITY_PROVIDER ?? "google")
    .trim()
    .toLowerCase();
  if (mode === "mock") {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[trip-activities] TRIP_ACTIVITY_PROVIDER=mock en production — données simulées",
      );
    }
    return "mock";
  }
  if (!isGooglePlacesConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[trip-activities] Clé Places absente — fallback mock désactivé en production",
      );
      return "google";
    }
    return "mock";
  }
  return "google";
}

function extractCity(
  components: Array<{ longText?: string; types?: string[] }> | undefined | null,
): string | null {
  if (!components?.length) return null;
  for (const type of [
    "locality",
    "postal_town",
    "administrative_area_level_3",
  ]) {
    const hit = components.find((c) => c.types?.includes(type));
    if (hit?.longText?.trim()) return hit.longText.trim();
  }
  return null;
}

function mapPlace(
  place: NonNullable<PlacesNearbyResponse["places"]>[number],
  zoneKind: ActivityCandidate["searchZoneKind"],
): ActivityCandidate | null {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  const displayName = place.displayName?.text?.trim();
  if (
    lat == null ||
    lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !displayName
  ) {
    return null;
  }
  const placeId =
    place.id?.replace(/^places\//, "") ||
    place.name?.replace(/^places\//, "") ||
    "";
  if (!placeId) return null;

  const photoRef = place.photos?.[0]?.name ?? null;

  return {
    googlePlaceId: placeId,
    name: displayName,
    address:
      place.formattedAddress?.trim() ||
      place.shortFormattedAddress?.trim() ||
      null,
    city: extractCity(place.addressComponents),
    latitude: lat,
    longitude: lng,
    primaryType: place.primaryType ?? null,
    types: place.types ?? [],
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? null,
    priceLevel: place.priceLevel ?? null,
    websiteUrl: place.websiteUri ?? null,
    googleMapsUrl:
      place.googleMapsUri?.trim() ||
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${placeId}`,
    photoReference: photoRef,
    estimatedVisitMinutes: null,
    searchZoneKind: zoneKind,
  };
}

/** FieldMask Places API (New) — champs supportés uniquement. */
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.types",
  "places.primaryType",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.photos",
  "places.addressComponents",
].join(",");

type FetchPlacesResult =
  | { ok: true; data: PlacesNearbyResponse }
  | { ok: false; error: PlacesProviderError };

async function fetchPlaces(
  url: string,
  body: Record<string, unknown>,
  context: {
    operation: PlacesOperation;
    budget: PlacesCallBudget;
  },
): Promise<FetchPlacesResult> {
  const apiKey = getPlacesApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: new PlacesProviderError(
        "not_configured",
        "Clé Google Places serveur absente",
      ),
    };
  }

  // Budget génération (ex. 10) — stop avant explosion
  if (!consumeGenerationCall(context.budget)) {
    return {
      ok: false,
      error: new PlacesProviderError(
        "budget_exhausted",
        "Budget d'appels Places de la génération atteint",
        null,
      ),
    };
  }

  // Budget horaire dédié activités (≠ maps:rl geocode/directions)
  try {
    await assertTripActivityPlacesHourlyBudget(context.budget.userId);
  } catch (error) {
    if (error instanceof PlacesProviderError) {
      return { ok: false, error };
    }
    return {
      ok: false,
      error: new PlacesProviderError(
        "sebavio_rate_limited",
        "Budget horaire activités indisponible",
        429,
      ),
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      return {
        ok: false,
        error: parsePlacesHttpError(res.status, bodyText, {
          operation: context.operation,
          tripId: context.budget.tripId,
          generationId: context.budget.generationId,
          retryAfterHeader: res.headers.get("retry-after"),
        }),
      };
    }
    return {
      ok: true,
      data: (await res.json()) as PlacesNearbyResponse,
    };
  } catch (error) {
    const aborted =
      error instanceof Error &&
      (error.name === "AbortError" || /abort/i.test(error.message));
    return {
      ok: false,
      error: new PlacesProviderError(
        aborted ? "timeout" : "network_error",
        aborted ? "Timeout Places" : "Erreur réseau Places",
      ),
    };
  } finally {
    clearTimeout(timer);
  }
}

export type ActivitySearchResult = {
  candidates: ActivityCandidate[];
  cacheHit: boolean;
  skipped?: boolean;
  error?: PlacesProviderError;
};

export async function searchNearbyActivities(input: {
  latitude: number;
  longitude: number;
  includedTypes: string[];
  radiusMeters?: number;
  maxResultCount?: number;
  zoneKind: ActivityCandidate["searchZoneKind"];
  language?: string;
  budget: PlacesCallBudget;
}): Promise<ActivitySearchResult> {
  const radiusMeters = Math.min(
    Math.max(input.radiusMeters ?? SEARCH_RADIUS_METERS, 500),
    50000,
  );
  const maxResultCount = Math.min(
    Math.max(input.maxResultCount ?? MAX_RESULTS_PER_ZONE, 1),
    20,
  );
  const language = input.language ?? "fr";
  const day = new Date().toISOString().slice(0, 10);
  const types = input.includedTypes.slice(0, 5);

  const cacheKey = buildSearchCacheKey({
    lat: input.latitude,
    lng: input.longitude,
    radiusM: radiusMeters,
    types,
    language,
    day,
  });
  const cached = await getCachedCandidates(cacheKey);
  if (cached) {
    recordCacheHit(input.budget);
    return { candidates: cached, cacheHit: true };
  }

  if (!isGooglePlacesConfigured()) {
    return {
      candidates: [],
      cacheHit: false,
      error: new PlacesProviderError(
        "not_configured",
        "Clé Google Places serveur absente",
      ),
    };
  }

  const body: Record<string, unknown> = {
    locationRestriction: {
      circle: {
        center: { latitude: input.latitude, longitude: input.longitude },
        radius: radiusMeters,
      },
    },
    maxResultCount,
    languageCode: language,
    regionCode: "CA",
  };
  if (types.length > 0) {
    body.includedTypes = types;
  }

  const result = await fetchPlaces(
    "https://places.googleapis.com/v1/places:searchNearby",
    body,
    { operation: "searchNearby", budget: input.budget },
  );

  if (!result.ok) {
    return {
      candidates: [],
      cacheHit: false,
      skipped: result.error.code === "budget_exhausted",
      error: result.error,
    };
  }

  const candidates = (result.data.places ?? [])
    .map((p) => mapPlace(p, input.zoneKind))
    .filter((c): c is ActivityCandidate => c != null);

  await setCachedCandidates(cacheKey, candidates);
  return { candidates, cacheHit: false };
}

export async function searchTextActivities(input: {
  latitude: number;
  longitude: number;
  textQuery: string;
  radiusMeters?: number;
  maxResultCount?: number;
  zoneKind: ActivityCandidate["searchZoneKind"];
  language?: string;
  budget: PlacesCallBudget;
}): Promise<ActivitySearchResult> {
  const radiusMeters = Math.min(
    Math.max(input.radiusMeters ?? SEARCH_RADIUS_METERS, 500),
    50000,
  );
  const maxResultCount = Math.min(
    Math.max(input.maxResultCount ?? MAX_RESULTS_PER_ZONE, 1),
    20,
  );
  const language = input.language ?? "fr";
  const day = new Date().toISOString().slice(0, 10);

  const cacheKey = buildSearchCacheKey({
    lat: input.latitude,
    lng: input.longitude,
    radiusM: radiusMeters,
    types: [],
    textQuery: input.textQuery,
    language,
    day,
  });
  const cached = await getCachedCandidates(cacheKey);
  if (cached) {
    recordCacheHit(input.budget);
    return { candidates: cached, cacheHit: true };
  }

  if (!isGooglePlacesConfigured()) {
    return {
      candidates: [],
      cacheHit: false,
      error: new PlacesProviderError(
        "not_configured",
        "Clé Google Places serveur absente",
      ),
    };
  }

  const result = await fetchPlaces(
    "https://places.googleapis.com/v1/places:searchText",
    {
      textQuery: input.textQuery,
      maxResultCount,
      languageCode: language,
      regionCode: "CA",
      locationBias: {
        circle: {
          center: { latitude: input.latitude, longitude: input.longitude },
          radius: radiusMeters,
        },
      },
    },
    { operation: "searchText", budget: input.budget },
  );

  if (!result.ok) {
    return {
      candidates: [],
      cacheHit: false,
      skipped: result.error.code === "budget_exhausted",
      error: result.error,
    };
  }

  const candidates = (result.data.places ?? [])
    .map((p) => mapPlace(p, input.zoneKind))
    .filter((c): c is ActivityCandidate => c != null);

  await setCachedCandidates(cacheKey, candidates);
  return { candidates, cacheHit: false };
}

/** Exécute des tâches avec concurrence limitée. */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]!);
    }
  }
  const n = Math.min(concurrency, items.length, MAX_CONCURRENCY);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}
