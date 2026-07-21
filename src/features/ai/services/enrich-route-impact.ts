import "server-only";

import { estimateGeographicDetour } from "@/features/trips/activities/trip-activity-detour-service";
import { prisma } from "@/lib/prisma";
import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import type { RouteSearchContext } from "@/features/ai/services/route-search-context";
import {
  RESTAURANT_MAX_BEHIND_TARGET_KM,
  RESTAURANT_SEARCH_MAX_DETOUR_MINUTES,
} from "@/features/ai/services/search-restaurants-near";
import { formatLocalClock } from "@/features/ai/lib/meal-timing";

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export type RestaurantRouteFitMeta = {
  excludedBehind: number;
  validated: number;
};

/**
 * Recalcule les impacts trajet vs progression repas (pas le mi-parcours).
 * Exclut les établissements clairement derrière le voyageur.
 */
export async function enrichRestaurantRouteImpacts(input: {
  tripId: string;
  userId: string;
  response: TripAssistantResponse;
  routeSearch: RouteSearchContext | null;
  targetProgressKm?: number | null;
  mealLocalClockLabel?: string | null;
}): Promise<TripAssistantResponse & { _routeFit?: RestaurantRouteFitMeta }> {
  const recs = input.response.restaurantRecommendations ?? [];
  if (recs.length === 0) return input.response;

  const trip = await prisma.trip.findFirst({
    where: {
      id: input.tripId,
      userId: input.userId,
      deletedAt: null,
    },
    include: { route: true, stops: true },
  });
  if (!trip?.route) return input.response;

  const originLat = toNum(trip.originLatitude);
  const originLng = toNum(trip.originLongitude);
  const destLat = toNum(trip.destinationLatitude);
  const destLng = toNum(trip.destinationLongitude);
  if (
    originLat == null ||
    originLng == null ||
    destLat == null ||
    destLng == null
  ) {
    return input.response;
  }

  const waypoints = trip.stops
    .filter(
      (s) =>
        toNum(s.latitude) != null &&
        toNum(s.longitude) != null &&
        s.direction === "outbound",
    )
    .map((s) => ({ lat: toNum(s.latitude)!, lng: toNum(s.longitude)! }));

  const geometry = {
    polyline: trip.route.polyline,
    origin: { lat: originLat, lng: originLng },
    destination: { lat: destLat, lng: destLng },
    waypoints,
    totalDistanceKm: toNum(trip.route.distanceKm),
    totalDurationMin: trip.route.estimatedDurationMin,
  };

  const targetKm =
    input.targetProgressKm ??
    input.routeSearch?.midpoint.routeDistanceFromOriginKm ??
    null;

  let excludedBehind = 0;
  const kept: typeof recs = [];

  for (const r of recs) {
    const lat = r.location.latitude;
    const lng = r.location.longitude;
    if (lat == null || lng == null) {
      kept.push({
        ...r,
        estimatedArrivalTime:
          formatLocalClock(r.estimatedArrivalTime) ??
          input.mealLocalClockLabel ??
          null,
        routeImpact: {
          distanceFromMidpointKm: null,
          estimatedDetourKm: null,
          estimatedDetourMinutes: null,
          locatedBeforeOrAfterMidpoint: "unknown",
        },
        verificationRequired: true,
      });
      continue;
    }

    const detour = estimateGeographicDetour({ lat, lng }, geometry);
    let located: "before" | "near" | "after" | "unknown" = "unknown";
    let distanceFromMidpointKm: number | null = null;

    if (detour && targetKm != null) {
      distanceFromMidpointKm =
        Math.round(Math.abs(detour.routePositionKm - targetKm) * 10) / 10;
      const behindByKm = targetKm - detour.routePositionKm;
      if (behindByKm > RESTAURANT_MAX_BEHIND_TARGET_KM) {
        excludedBehind += 1;
        continue;
      }
      if (distanceFromMidpointKm <= 20) located = "near";
      else if (detour.routePositionKm < targetKm) located = "before";
      else located = "after";
    }

    const detourMin = detour?.detourDurationMinutes ?? null;
    if (
      detourMin != null &&
      detourMin > RESTAURANT_SEARCH_MAX_DETOUR_MINUTES + 10
    ) {
      continue;
    }

    kept.push({
      ...r,
      estimatedArrivalTime:
        formatLocalClock(r.estimatedArrivalTime) ??
        input.mealLocalClockLabel ??
        "vers midi",
      routeImpact: {
        distanceFromMidpointKm,
        estimatedDetourKm: detour?.detourDistanceKm ?? null,
        estimatedDetourMinutes: detourMin,
        locatedBeforeOrAfterMidpoint: located,
      },
      // léger derrière = rechange seulement
      recommendationReason:
        located === "before"
          ? `${r.recommendationReason} (solution de rechange — légèrement en amont).`
          : r.recommendationReason,
    });
  }

  // Meilleurs d’abord : near > after > before ; faible détour
  kept.sort((a, b) => {
    const rank = (x: (typeof kept)[0]) => {
      const loc = x.routeImpact.locatedBeforeOrAfterMidpoint;
      if (loc === "near") return 0;
      if (loc === "after") return 1;
      if (loc === "before") return 3;
      return 2;
    };
    const d =
      (a.routeImpact.estimatedDetourMinutes ?? 99) -
      (b.routeImpact.estimatedDetourMinutes ?? 99);
    return rank(a) - rank(b) || d;
  });

  // Au plus un « before » en rechange, jamais en premier si d’autres existent
  const primary = kept.filter(
    (r) => r.routeImpact.locatedBeforeOrAfterMidpoint !== "before",
  );
  const backup = kept.filter(
    (r) => r.routeImpact.locatedBeforeOrAfterMidpoint === "before",
  );
  const restaurantRecommendations = [
    ...primary.slice(0, 3),
    ...(primary.length < 3 ? backup.slice(0, 3 - primary.length) : []),
  ].slice(0, 3);

  if (excludedBehind > 0) {
    console.info("[ai] restaurant_excluded_behind", {
      excludedBehind,
      targetKm,
      kept: restaurantRecommendations.length,
    });
  }

  return {
    ...input.response,
    restaurantRecommendations,
  };
}
