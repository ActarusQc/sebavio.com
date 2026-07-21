import { decodeGooglePolyline } from "@/features/maps/lib/polyline";
import { haversineKm } from "@/lib/geo";
import type { LatLng } from "@/services/maps/types";

export type RouteGeometry = {
  polyline: string | null;
  origin: LatLng;
  destination: LatLng;
  waypoints: LatLng[];
  totalDistanceKm: number | null;
  totalDurationMin: number | null;
};

export type DetourEstimate = {
  detourDistanceKm: number;
  detourDurationMinutes: number;
  routePositionKm: number;
  distanceFromStartKm: number;
  remainingDistanceKm: number;
  method: "geographic_estimate" | "directions";
  segmentAnchor: LatLng;
};

function cumulativeDistances(path: LatLng[]): {
  points: LatLng[];
  cumKm: number[];
} {
  const cumKm: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    const d = haversineKm(
      path[i - 1]!.lat,
      path[i - 1]!.lng,
      path[i]!.lat,
      path[i]!.lng,
    );
    cumKm.push(cumKm[i - 1]! + d);
  }
  return { points: path, cumKm };
}

function nearestOnRoute(
  path: LatLng[],
  point: LatLng,
): { index: number; distanceKm: number; positionKm: number } {
  const { cumKm } = cumulativeDistances(path);
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = haversineKm(path[i]!.lat, path[i]!.lng, point.lat, point.lng);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return {
    index: bestIdx,
    distanceKm: bestDist,
    positionKm: cumKm[bestIdx] ?? 0,
  };
}

/**
 * Estimation géographique du détour local (sans appel Directions).
 * Détour ≈ 2 × distance perpendiculaire au corridor (aller-retour vers l'activité).
 */
export function estimateGeographicDetour(
  activity: LatLng,
  route: RouteGeometry,
): DetourEstimate | null {
  let path: LatLng[] = [];
  if (route.polyline) {
    path = decodeGooglePolyline(route.polyline);
  }
  if (path.length < 2) {
    path = [route.origin, ...route.waypoints, route.destination];
  }
  if (path.length < 2) return null;

  const nearest = nearestOnRoute(path, activity);
  const lateralKm = nearest.distanceKm;
  const detourDistanceKm = Math.round(lateralKm * 2 * 10) / 10;
  // ~50 km/h moyenne corridor + marge manœuvre
  const detourDurationMinutes = Math.max(
    1,
    Math.round((detourDistanceKm / 50) * 60 + 3),
  );
  const totalKm =
    route.totalDistanceKm ??
    cumulativeDistances(path).cumKm[path.length - 1] ??
    0;

  return {
    detourDistanceKm,
    detourDurationMinutes,
    routePositionKm: Math.round(nearest.positionKm * 10) / 10,
    distanceFromStartKm: Math.round(nearest.positionKm * 10) / 10,
    remainingDistanceKm: Math.round((totalKm - nearest.positionKm) * 10) / 10,
    method: "geographic_estimate",
    segmentAnchor: path[nearest.index]!,
  };
}

export function isObviouslyTooFar(
  activity: LatLng,
  route: RouteGeometry,
  maxDetourMinutes: number,
): boolean {
  const est = estimateGeographicDetour(activity, route);
  if (!est) return false;
  // marge ×1.6 avant élimination précoce
  return est.detourDurationMinutes > maxDetourMinutes * 1.6;
}

/**
 * Détour réel via Directions : ancreA → activité → ancreB vs ancreA → anbreB.
 */
export async function computeDirectionsDetour(input: {
  activity: LatLng;
  anchorA: LatLng;
  anchorB: LatLng;
  directions: (
    origin: LatLng,
    destination: LatLng,
    waypoints?: LatLng[],
  ) => Promise<{ distanceKm: number; durationMin: number }>;
}): Promise<{
  detourDistanceKm: number;
  detourDurationMinutes: number;
  method: "directions";
} | null> {
  try {
    const [direct, via] = await Promise.all([
      input.directions(input.anchorA, input.anchorB),
      input.directions(input.anchorA, input.anchorB, [input.activity]),
    ]);
    const detourDistanceKm =
      Math.round(Math.max(0, via.distanceKm - direct.distanceKm) * 10) / 10;
    const detourDurationMinutes = Math.max(
      0,
      via.durationMin - direct.durationMin,
    );
    return {
      detourDistanceKm,
      detourDurationMinutes,
      method: "directions",
    };
  } catch {
    return null;
  }
}

export function sampleRoutePoints(
  polyline: string | null,
  origin: LatLng,
  destination: LatLng,
  waypoints: LatLng[],
  spacingKm: number,
  maxPoints: number,
): Array<{ point: LatLng; kind: "destination" | "stop" | "route_sample" }> {
  const samples: Array<{
    point: LatLng;
    kind: "destination" | "stop" | "route_sample";
  }> = [];

  samples.push({ point: destination, kind: "destination" });
  for (const wp of waypoints) {
    samples.push({ point: wp, kind: "stop" });
  }

  let path: LatLng[] = [];
  if (polyline) path = decodeGooglePolyline(polyline);
  if (path.length < 2) path = [origin, ...waypoints, destination];

  if (path.length >= 2) {
    const { points, cumKm } = cumulativeDistances(path);
    const total = cumKm[cumKm.length - 1] ?? 0;
    const step = Math.max(
      spacingKm,
      total > 0 ? total / (maxPoints - 1) : spacingKm,
    );
    let next = step;
    for (let i = 1; i < points.length - 1; i++) {
      if ((cumKm[i] ?? 0) >= next) {
        samples.push({ point: points[i]!, kind: "route_sample" });
        next += step;
      }
    }
  }

  // Dédupliquer zones qui se chevauchent (~25 km)
  const deduped: typeof samples = [];
  for (const s of samples) {
    const near = deduped.find(
      (d) =>
        haversineKm(d.point.lat, d.point.lng, s.point.lat, s.point.lng) < 25,
    );
    if (!near) deduped.push(s);
    else if (s.kind === "destination" || s.kind === "stop") {
      // prioriser destination / stops
      const idx = deduped.indexOf(near);
      deduped[idx] = s;
    }
  }

  return deduped.slice(0, maxPoints);
}
