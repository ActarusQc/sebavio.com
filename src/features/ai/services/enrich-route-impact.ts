import "server-only";

import { estimateGeographicDetour } from "@/features/trips/activities/trip-activity-detour-service";
import { prisma } from "@/lib/prisma";
import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import type { RouteSearchContext } from "@/features/ai/services/route-search-context";

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Recalcule les impacts trajet Sebavio (ne fait pas confiance au modèle).
 */
export async function enrichRestaurantRouteImpacts(input: {
  tripId: string;
  userId: string;
  response: TripAssistantResponse;
  routeSearch: RouteSearchContext | null;
}): Promise<TripAssistantResponse> {
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

  const midKm = input.routeSearch?.midpoint.routeDistanceFromOriginKm ?? null;

  const restaurantRecommendations = recs.map((r) => {
    const lat = r.location.latitude;
    const lng = r.location.longitude;
    if (lat == null || lng == null) {
      return {
        ...r,
        routeImpact: {
          distanceFromMidpointKm: null,
          estimatedDetourKm: null,
          estimatedDetourMinutes: null,
          locatedBeforeOrAfterMidpoint: "unknown" as const,
        },
        verificationRequired: true,
      };
    }

    const detour = estimateGeographicDetour({ lat, lng }, geometry);
    let located: "before" | "near" | "after" | "unknown" = "unknown";
    let distanceFromMidpointKm: number | null = null;

    if (detour && midKm != null) {
      distanceFromMidpointKm =
        Math.round(Math.abs(detour.routePositionKm - midKm) * 10) / 10;
      if (distanceFromMidpointKm <= 15) located = "near";
      else if (detour.routePositionKm < midKm) located = "before";
      else located = "after";
    }

    return {
      ...r,
      routeImpact: {
        distanceFromMidpointKm,
        estimatedDetourKm: detour?.detourDistanceKm ?? null,
        estimatedDetourMinutes: detour?.detourDurationMinutes ?? null,
        locatedBeforeOrAfterMidpoint: located,
      },
    };
  });

  return { ...input.response, restaurantRecommendations };
}
