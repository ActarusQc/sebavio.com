import {
  placeTypesForInterests,
  textQueriesForProfile,
} from "@/features/trips/activities/activity-category-mapper";
import {
  MAX_CANDIDATES_BEFORE_RANKING,
  MAX_DETOUR_CALCULATIONS,
  MAX_FINAL_SUGGESTIONS,
  MAX_RESULTS_PER_ZONE,
  MAX_SEARCH_ZONES,
  MAX_TEXT_QUERIES_PER_GENERATION,
  SEARCH_RADIUS_METERS,
  SEARCH_ZONE_SPACING_KM,
  type ActivityCandidate,
  type RankedActivityCandidate,
  type TripPurpose,
  type ActivityInterest,
} from "@/features/trips/activities/activity-types";
import {
  getTripActivityProviderMode,
  mapPool,
  searchNearbyActivities,
  searchTextActivities,
} from "@/features/trips/activities/google-places-activity-provider";
import { getMockActivityCandidates } from "@/features/trips/activities/mock-activity-provider";
import {
  createPlacesCallBudget,
  MAX_PLACES_CALLS_PER_GENERATION,
} from "@/features/trips/activities/places-call-budget";
import {
  PlacesProviderError,
  userFacingPlacesError,
} from "@/features/trips/activities/places-errors";
import {
  dedupeCandidates,
  filterByMaxDetour,
  scoreActivityCandidate,
} from "@/features/trips/activities/trip-activity-ranking-service";
import {
  estimateGeographicDetour,
  isObviouslyTooFar,
  sampleRoutePoints,
  type RouteGeometry,
} from "@/features/trips/activities/trip-activity-detour-service";

export type SearchGenerationMeta = {
  tripId: string;
  generationId: string;
  searchZoneCount: number;
  rawCandidateCount: number;
  deduplicatedCount: number;
  rankedCount: number;
  returnedCount: number;
  cacheHit: boolean;
  durationMs: number;
  provider: "google" | "mock";
  detourCalculations: number;
  filteredByDetour: number;
  googleCallsUsed: number;
  googleCallsSkipped: number;
  cacheHits: number;
  maxGoogleCalls: number;
  error?: string;
  errorCode?: string;
  userMessage?: string;
};

export async function searchAndRankTripActivities(input: {
  tripId: string;
  userId: string;
  purpose: TripPurpose;
  interests: ActivityInterest[];
  childAges: number[];
  budgetPreference?: string | null;
  durationPreference?: string | null;
  maxDetourMinutes: number;
  environmentPreference?: string | null;
  activityLevel?: string | null;
  accessibilityNeeds: string[];
  travelingWithPet: boolean;
  route: RouteGeometry;
  rejectedPlaceIds: Set<string>;
  keptPlaceIds: Set<string>;
}): Promise<{
  ranked: RankedActivityCandidate[];
  meta: SearchGenerationMeta;
}> {
  const started = Date.now();
  const provider = getTripActivityProviderMode();
  const budget = createPlacesCallBudget({
    tripId: input.tripId,
    userId: input.userId,
    maxCalls: MAX_PLACES_CALLS_PER_GENERATION,
  });
  let detourCalculations = 0;

  const zones = sampleRoutePoints(
    input.route.polyline,
    input.route.origin,
    input.route.destination,
    input.route.waypoints,
    SEARCH_ZONE_SPACING_KM,
    MAX_SEARCH_ZONES,
  );

  // Un seul lot de types (max 5) — 1 Nearby / zone (plus de multi-chunks)
  const placeTypes = placeTypesForInterests(input.interests).slice(0, 5);
  const textQueries = textQueriesForProfile({
    purpose: input.purpose,
    interests: input.interests,
    childAges: input.childAges,
    environmentPreference: input.environmentPreference,
  }).slice(0, MAX_TEXT_QUERIES_PER_GENERATION);

  let candidates: ActivityCandidate[] = [];
  let providerError: PlacesProviderError | null = null;

  try {
    if (provider === "mock") {
      candidates = getMockActivityCandidates({
        lat: input.route.destination.lat,
        lng: input.route.destination.lng,
      });
    } else {
      // Prioriser destination puis échantillons route
      const orderedZones = [
        ...zones.filter((z) => z.kind === "destination"),
        ...zones.filter((z) => z.kind === "stop"),
        ...zones.filter((z) => z.kind === "route_sample"),
      ];

      // Concurrence 2 — évite rafales 429 Google
      const nearbyResults = await mapPool(orderedZones, 2, async (zone) => {
        if (budget.used >= budget.maxCalls) {
          budget.skipped += 1;
          return [] as ActivityCandidate[];
        }
        const res = await searchNearbyActivities({
          latitude: zone.point.lat,
          longitude: zone.point.lng,
          includedTypes: placeTypes,
          radiusMeters: SEARCH_RADIUS_METERS,
          maxResultCount: MAX_RESULTS_PER_ZONE,
          zoneKind: zone.kind,
          budget,
        });
        if (
          res.error &&
          res.error.code !== "budget_exhausted" &&
          !providerError
        ) {
          providerError = res.error;
        }
        return res.candidates;
      });

      candidates = nearbyResults.flat();

      // Text Search : destination uniquement, ≤ 2 requêtes
      const destination = orderedZones.find((z) => z.kind === "destination");
      if (destination) {
        for (const q of textQueries) {
          if (budget.used >= budget.maxCalls) {
            budget.skipped += 1;
            break;
          }
          const res = await searchTextActivities({
            latitude: destination.point.lat,
            longitude: destination.point.lng,
            textQuery: q,
            radiusMeters: SEARCH_RADIUS_METERS,
            maxResultCount: 8,
            zoneKind: "destination",
            budget,
          });
          if (
            res.error &&
            res.error.code !== "budget_exhausted" &&
            !providerError
          ) {
            providerError = res.error;
          }
          candidates.push(...res.candidates);
        }
      }

      if (candidates.length === 0 && providerError) {
        return {
          ranked: [],
          meta: baseMeta({
            input,
            budget,
            zones: orderedZones.length,
            started,
            provider,
            detourCalculations: 0,
            rawCount: 0,
            deduped: 0,
            ranked: 0,
            returned: 0,
            filteredByDetour: 0,
            error: providerError,
          }),
        };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "search_failed";
    console.warn("[trip-activities] search error", {
      tripId: input.tripId,
      generationId: budget.generationId,
      error: message,
    });
    return {
      ranked: [],
      meta: baseMeta({
        input,
        budget,
        zones: zones.length,
        started,
        provider,
        detourCalculations: 0,
        rawCount: 0,
        deduped: 0,
        ranked: 0,
        returned: 0,
        filteredByDetour: 0,
        errorCode: "search_failed",
        userMessage:
          "Les suggestions d'activités sont temporairement indisponibles.",
        errorMessage: message,
      }),
    };
  }

  const rawCount = candidates.length;
  const deduped = dedupeCandidates(candidates)
    .filter((c) => !input.rejectedPlaceIds.has(c.googlePlaceId))
    .filter((c) => !input.keptPlaceIds.has(c.googlePlaceId))
    .slice(0, MAX_CANDIDATES_BEFORE_RANKING);

  const prefiltered = deduped.filter(
    (c) =>
      !isObviouslyTooFar(
        { lat: c.latitude, lng: c.longitude },
        input.route,
        input.maxDetourMinutes,
      ),
  );

  const withGeo = prefiltered.map((c) => {
    const est = estimateGeographicDetour(
      { lat: c.latitude, lng: c.longitude },
      input.route,
    );
    detourCalculations += 1;
    return { candidate: c, est };
  });

  withGeo.sort((a, b) => {
    const da = a.est?.detourDurationMinutes ?? 99;
    const db = b.est?.detourDurationMinutes ?? 99;
    return da - db;
  });

  const topForDetour = withGeo.slice(0, MAX_DETOUR_CALCULATIONS);

  const ranked = topForDetour.map(({ candidate, est }) => {
    const segment =
      candidate.searchZoneKind === "destination"
        ? "destination"
        : "along_route";
    return scoreActivityCandidate({
      candidate,
      profile: {
        purpose: input.purpose,
        interests: input.interests,
        childAges: input.childAges,
        budgetPreference:
          (input.budgetPreference as
            "free" | "budget" | "moderate" | "any" | null) ?? "any",
        durationPreference:
          (input.durationPreference as
            "under_1h" | "1_2h" | "2_4h" | "half_day" | "any" | null) ?? "any",
        maxDetourMinutes: input.maxDetourMinutes,
        environmentPreference:
          (input.environmentPreference as
            "indoor" | "outdoor" | "both" | null) ?? "both",
        activityLevel:
          (input.activityLevel as
            "very_low" | "low" | "moderate" | "high" | null) ?? "moderate",
        accessibilityNeeds: input.accessibilityNeeds as (
          "mobility" | "stroller" | "none"
        )[],
        travelingWithPet: input.travelingWithPet,
      },
      detourDurationMinutes: est?.detourDurationMinutes ?? null,
      detourDistanceKm: est?.detourDistanceKm ?? null,
      routePositionKm: est?.routePositionKm ?? null,
      suggestedForSegment: segment,
    });
  });

  ranked.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  const beforeFilter = ranked.length;
  const filtered = filterByMaxDetour(ranked, input.maxDetourMinutes).slice(
    0,
    MAX_FINAL_SUGGESTIONS,
  );

  // Erreur Google non fatale si on a déjà des résultats (génération partielle)
  const softError = filtered.length > 0 ? null : providerError;

  const meta = baseMeta({
    input,
    budget,
    zones: zones.length,
    started,
    provider,
    detourCalculations,
    rawCount,
    deduped: deduped.length,
    ranked: beforeFilter,
    returned: filtered.length,
    filteredByDetour: beforeFilter - filtered.length,
    error: softError,
  });

  console.info("[trip-activities] generation", meta);

  return { ranked: filtered, meta };
}

function baseMeta(args: {
  input: { tripId: string };
  budget: ReturnType<typeof createPlacesCallBudget>;
  zones: number;
  started: number;
  provider: "google" | "mock";
  detourCalculations: number;
  rawCount: number;
  deduped: number;
  ranked: number;
  returned: number;
  filteredByDetour: number;
  error?: PlacesProviderError | null;
  errorCode?: string;
  userMessage?: string;
  errorMessage?: string;
}): SearchGenerationMeta {
  return {
    tripId: args.input.tripId,
    generationId: args.budget.generationId,
    searchZoneCount: args.zones,
    rawCandidateCount: args.rawCount,
    deduplicatedCount: args.deduped,
    rankedCount: args.ranked,
    returnedCount: args.returned,
    cacheHit: args.budget.cacheHits > 0,
    durationMs: Date.now() - args.started,
    provider: args.provider,
    detourCalculations: args.detourCalculations,
    filteredByDetour: args.filteredByDetour,
    googleCallsUsed: args.budget.used,
    googleCallsSkipped: args.budget.skipped,
    cacheHits: args.budget.cacheHits,
    maxGoogleCalls: args.budget.maxCalls,
    error: args.error?.code ?? args.errorMessage,
    errorCode: args.error?.code ?? args.errorCode,
    userMessage: args.error
      ? userFacingPlacesError(args.error)
      : args.userMessage,
  };
}
