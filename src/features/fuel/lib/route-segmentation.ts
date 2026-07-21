/**
 * Découpage d'itinéraire en points / segments le long du tracé.
 */

export type LatLng = { lat: number; lng: number };

export type RouteSamplePoint = {
  /** Distance cumulée depuis le départ (km). */
  distanceFromStartKm: number;
  lat: number;
  lng: number;
  label?: string;
};

export type RouteSegment = {
  index: number;
  startKm: number;
  endKm: number;
  distanceKm: number;
  start: LatLng;
  end: LatLng;
};

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Construit des points échantillonnés le long d'une polyline, en normalisant
 * les distances haversine pour coller à `totalDistanceKm` connu.
 */
export function sampleRoutePoints(input: {
  path: LatLng[];
  totalDistanceKm: number;
  intervalKm: number;
  maxSamples: number;
}): RouteSamplePoint[] {
  const { path, totalDistanceKm, intervalKm, maxSamples } = input;
  if (!(totalDistanceKm > 0)) return [];

  if (path.length < 2) {
    const p = path[0];
    if (!p) return [];
    return [
      { distanceFromStartKm: 0, lat: p.lat, lng: p.lng, label: "Départ" },
      {
        distanceFromStartKm: totalDistanceKm,
        lat: p.lat,
        lng: p.lng,
        label: "Destination",
      },
    ];
  }

  const rawCum: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    rawCum.push(rawCum[i - 1]! + haversineKm(path[i - 1]!, path[i]!));
  }
  const rawTotal = rawCum[rawCum.length - 1]!;
  const scale = rawTotal > 0 ? totalDistanceKm / rawTotal : 1;
  const cum = rawCum.map((d) => d * scale);

  const targets: number[] = [0];
  const step = Math.max(
    intervalKm,
    totalDistanceKm / Math.max(1, maxSamples - 1),
  );
  for (let d = step; d < totalDistanceKm - 1e-6; d += step) {
    targets.push(d);
    if (targets.length >= maxSamples - 1) break;
  }
  targets.push(totalDistanceKm);

  const samples: RouteSamplePoint[] = [];
  for (let ti = 0; ti < targets.length; ti++) {
    const target = targets[ti]!;
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
    samples.push({
      distanceFromStartKm: Math.round(target * 1000) / 1000,
      lat: a.lat + (b.lat - a.lat) * t,
      lng: a.lng + (b.lng - a.lng) * t,
      label:
        ti === 0
          ? "Départ"
          : ti === targets.length - 1
            ? "Destination"
            : `Km ${Math.round(target)}`,
    });
  }

  return samples;
}

export function segmentsFromSamples(
  samples: RouteSamplePoint[],
): RouteSegment[] {
  const segments: RouteSegment[] = [];
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1]!;
    const curr = samples[i]!;
    const distanceKm = curr.distanceFromStartKm - prev.distanceFromStartKm;
    if (distanceKm <= 0) continue;
    segments.push({
      index: segments.length,
      startKm: prev.distanceFromStartKm,
      endKm: curr.distanceFromStartKm,
      distanceKm,
      start: { lat: prev.lat, lng: prev.lng },
      end: { lat: curr.lat, lng: curr.lng },
    });
  }
  return segments;
}

/**
 * Construit des échantillons à partir d'étapes discrètes (origin/stops/dest)
 * lorsque la polyline est absente.
 */
export function sampleFromWaypoints(input: {
  points: LatLng[];
  totalDistanceKm: number;
}): RouteSamplePoint[] {
  const { points, totalDistanceKm } = input;
  if (points.length === 0 || !(totalDistanceKm > 0)) return [];
  if (points.length === 1) {
    return [
      {
        distanceFromStartKm: 0,
        lat: points[0]!.lat,
        lng: points[0]!.lng,
        label: "Départ",
      },
      {
        distanceFromStartKm: totalDistanceKm,
        lat: points[0]!.lat,
        lng: points[0]!.lng,
        label: "Destination",
      },
    ];
  }

  const rawCum: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    rawCum.push(rawCum[i - 1]! + haversineKm(points[i - 1]!, points[i]!));
  }
  const rawTotal = rawCum[rawCum.length - 1]!;
  const scale = rawTotal > 0 ? totalDistanceKm / rawTotal : 1;

  return points.map((p, i) => ({
    distanceFromStartKm: Math.round(rawCum[i]! * scale * 1000) / 1000,
    lat: p.lat,
    lng: p.lng,
    label:
      i === 0
        ? "Départ"
        : i === points.length - 1
          ? "Destination"
          : `Étape ${i}`,
  }));
}

/**
 * Point géographique correspondant à une distance le long d'une polyline.
 * Les distances haversine sont normalisées sur `totalDistanceKm` si fourni.
 */
export function getPointAlongRoute(
  path: LatLng[],
  distanceFromStartKm: number,
  totalDistanceKm?: number,
): LatLng | null {
  if (path.length === 0) return null;
  if (path.length === 1) return { ...path[0]! };

  const rawCum: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    rawCum.push(rawCum[i - 1]! + haversineKm(path[i - 1]!, path[i]!));
  }
  const rawTotal = rawCum[rawCum.length - 1]!;
  if (!(rawTotal > 0)) return { ...path[0]! };

  const scale =
    totalDistanceKm != null && totalDistanceKm > 0
      ? totalDistanceKm / rawTotal
      : 1;
  const cum = rawCum.map((d) => d * scale);
  const routeTotal = cum[cum.length - 1]!;
  const target = Math.max(0, Math.min(distanceFromStartKm, routeTotal));

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
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}
