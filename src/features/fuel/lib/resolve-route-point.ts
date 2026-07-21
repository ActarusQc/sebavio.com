/**
 * Interpolation d'un point sur la polyline réelle à une distance donnée.
 */
import {
  getPointAlongRoute,
  haversineKm,
  type LatLng,
} from "@/features/fuel/lib/route-segmentation";

export const REFUEL_STOP_ROUTE_DISTANCE_TOLERANCE_KM = 15;
export const REFUEL_STOP_MAX_ROUTE_POINT_DISTANCE_KM = 25;
export const REFUEL_STOP_MAX_DETOUR_KM = 15;
/** Distance locale au-delà de laquelle la ville de départ ne peut pas être le lieu de l'arrêt. */
export const REFUEL_STOP_LOCAL_CITY_MAX_KM = 40;

export type RoutePointAtDistance = {
  latitude: number;
  longitude: number;
  distanceFromStartKm: number;
  distanceRemainingKm: number;
  routeSegmentIndex: number;
};

/**
 * Décode / parcourt la polyline, trouve le segment contenant `distanceFromStartKm`,
 * interpole lat/lng (linéaire sur le segment, distances Haversine cumulées).
 */
export function resolveRoutePointAtDistance(input: {
  path: LatLng[];
  distanceFromStartKm: number;
  totalDistanceKm: number;
}): RoutePointAtDistance | null {
  const { path, totalDistanceKm } = input;
  if (path.length === 0 || !(totalDistanceKm > 0)) return null;

  const target = Math.max(
    0,
    Math.min(input.distanceFromStartKm, totalDistanceKm),
  );

  if (path.length === 1) {
    return {
      latitude: path[0]!.lat,
      longitude: path[0]!.lng,
      distanceFromStartKm: target,
      distanceRemainingKm: Math.max(0, totalDistanceKm - target),
      routeSegmentIndex: 0,
    };
  }

  const rawCum: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    rawCum.push(rawCum[i - 1]! + haversineKm(path[i - 1]!, path[i]!));
  }
  const rawTotal = rawCum[rawCum.length - 1]!;
  if (!(rawTotal > 0)) {
    return {
      latitude: path[0]!.lat,
      longitude: path[0]!.lng,
      distanceFromStartKm: target,
      distanceRemainingKm: Math.max(0, totalDistanceKm - target),
      routeSegmentIndex: 0,
    };
  }

  const scale = totalDistanceKm / rawTotal;
  const cum = rawCum.map((d) => d * scale);

  let i = 1;
  while (i < cum.length && cum[i]! < target) i++;
  const i1 = Math.min(i, path.length - 1);
  const i0 = Math.max(0, i1 - 1);
  const c0 = cum[i0]!;
  const c1 = cum[i1]!;
  const span = c1 - c0;
  const t = span > 0 ? (target - c0) / span : 0;
  const a = path[i0]!;
  const b = path[i1]!;

  return {
    latitude: a.lat + (b.lat - a.lat) * t,
    longitude: a.lng + (b.lng - a.lng) * t,
    distanceFromStartKm: Math.round(target * 1000) / 1000,
    distanceRemainingKm:
      Math.round(Math.max(0, totalDistanceKm - target) * 1000) / 1000,
    routeSegmentIndex: i0,
  };
}

/** Polyline aller inversée pour le retour (ordre des points + distances recalculées à l'usage). */
export function reverseRoutePath(path: LatLng[]): LatLng[] {
  return [...path].reverse();
}

/** @deprecated — préférer resolveRoutePointAtDistance */
export function pointAlongRouteLegacy(
  path: LatLng[],
  distanceFromStartKm: number,
  totalDistanceKm?: number,
): LatLng | null {
  return getPointAlongRoute(path, distanceFromStartKm, totalDistanceKm);
}
