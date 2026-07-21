import "server-only";

import { decodeGooglePolyline } from "@/features/maps/lib/polyline";
import { resolveRoutePointAtDistance } from "@/features/fuel/lib/resolve-route-point";
import { sampleRoutePoints } from "@/features/fuel/lib/route-segmentation";
import { reverseGeocodeRoutePoint } from "@/features/fuel/services/reverse-geocode-route-point";
import { prisma } from "@/lib/prisma";
import type { LatLng } from "@/services/maps/types";

export type RouteSearchContext = {
  origin: {
    label: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    label: string;
    latitude: number;
    longitude: number;
  };
  midpoint: {
    latitude: number;
    longitude: number;
    routeDistanceFromOriginKm: number;
    nearbyCities: string[];
  };
  totalDistanceKm: number;
  searchRadiusKm: number;
  maxDetourKm: number;
  routeCorridor: Array<{
    latitude: number;
    longitude: number;
  }>;
  searchHints: string[];
};

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Point médian à 50 % de la distance routière (polyline), pas le barycentre.
 */
export async function buildRouteSearchContext(input: {
  tripId: string;
  userId: string;
  searchRadiusKm: number;
  maxDetourKm: number;
}): Promise<RouteSearchContext | null> {
  const trip = await prisma.trip.findFirst({
    where: { id: input.tripId, userId: input.userId, deletedAt: null },
    include: {
      route: true,
      stops: {
        orderBy: { sequence: "asc" },
        select: {
          latitude: true,
          longitude: true,
          direction: true,
          stopType: true,
        },
      },
    },
  });
  if (!trip?.route) return null;

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
    return null;
  }

  const totalDistanceKm = toNum(trip.route.distanceKm);
  if (totalDistanceKm == null || totalDistanceKm <= 0) return null;

  let path: LatLng[] = [];
  if (trip.route.polyline) {
    path = decodeGooglePolyline(trip.route.polyline);
  }
  if (path.length < 2) {
    const waypoints: LatLng[] = trip.stops
      .filter(
        (s) =>
          s.direction === "outbound" &&
          s.stopType !== "fuel" &&
          toNum(s.latitude) != null &&
          toNum(s.longitude) != null,
      )
      .map((s) => ({
        lat: toNum(s.latitude)!,
        lng: toNum(s.longitude)!,
      }));
    path = [
      { lat: originLat, lng: originLng },
      ...waypoints,
      { lat: destLat, lng: destLng },
    ];
  }
  if (path.length < 2) return null;

  const midDistanceKm = totalDistanceKm / 2;
  const midPoint = resolveRoutePointAtDistance({
    path,
    distanceFromStartKm: midDistanceKm,
    totalDistanceKm,
  });
  if (!midPoint) return null;

  const corridorSamples = sampleRoutePoints({
    path,
    totalDistanceKm,
    intervalKm: Math.max(40, totalDistanceKm / 8),
    maxSamples: 12,
  }).map((p) => ({
    latitude: Math.round(p.lat * 1000) / 1000,
    longitude: Math.round(p.lng * 1000) / 1000,
  }));

  const nearbyCities = new Set<string>();
  const geoPoints = [
    { latitude: midPoint.latitude, longitude: midPoint.longitude },
    ...corridorSamples.slice(
      Math.max(0, Math.floor(corridorSamples.length / 2) - 2),
      Math.floor(corridorSamples.length / 2) + 3,
    ),
  ];

  for (const p of geoPoints) {
    try {
      const geo = await reverseGeocodeRoutePoint({
        latitude: p.latitude,
        longitude: p.longitude,
        userId: input.userId,
      });
      if (geo.locality?.trim()) nearbyCities.add(geo.locality.trim());
    } catch {
      /* best-effort */
    }
  }

  // Indices de recherche (pas de ville hardcodée) — aide le modèle à cibler le corridor
  const searchHints = [
    `Point médian routier (~${Math.round(midDistanceKm)} km) : ${midPoint.latitude.toFixed(3)}, ${midPoint.longitude.toFixed(3)}`,
    `Rayon initial : ${input.searchRadiusKm} km`,
    nearbyCities.size
      ? `Secteurs proches : ${[...nearbyCities].join(", ")}`
      : "Identifier les villes du corridor autour du point médian via recherche Web",
  ];

  return {
    origin: {
      label: trip.origin,
      latitude: Math.round(originLat * 1000) / 1000,
      longitude: Math.round(originLng * 1000) / 1000,
    },
    destination: {
      label: trip.destination,
      latitude: Math.round(destLat * 1000) / 1000,
      longitude: Math.round(destLng * 1000) / 1000,
    },
    midpoint: {
      latitude: Math.round(midPoint.latitude * 1000) / 1000,
      longitude: Math.round(midPoint.longitude * 1000) / 1000,
      routeDistanceFromOriginKm: Math.round(midDistanceKm * 10) / 10,
      nearbyCities: [...nearbyCities].slice(0, 8),
    },
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    searchRadiusKm: input.searchRadiusKm,
    maxDetourKm: input.maxDetourKm,
    routeCorridor: corridorSamples,
    searchHints,
  };
}

/** Export pour tests unitaires du point médian (sans géocodage). */
export function computeRouteMidpointForTests(input: {
  path: LatLng[];
  totalDistanceKm: number;
}): {
  latitude: number;
  longitude: number;
  routeDistanceFromOriginKm: number;
} | null {
  const mid = resolveRoutePointAtDistance({
    path: input.path,
    distanceFromStartKm: input.totalDistanceKm / 2,
    totalDistanceKm: input.totalDistanceKm,
  });
  if (!mid) return null;
  return {
    latitude: mid.latitude,
    longitude: mid.longitude,
    routeDistanceFromOriginKm: mid.distanceFromStartKm,
  };
}
