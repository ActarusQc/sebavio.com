/**
 * Résolution et validation d'emplacement pour actions IA.
 * Les coordonnées du modèle sont non fiables jusqu'à confirmation.
 */

export type LocationSource =
  "catalog" | "user_confirmed" | "geocoded" | "ai_suggested";

export type ResolvedLocation = {
  latitude: number;
  longitude: number;
  address: string | null;
  locationSource: LocationSource;
};

export type LocationResolveFailure = {
  applicable: false;
  requiresLocationConfirmation: true;
  reasonCode:
    "AI_ACTION_LOCATION_REQUIRED" | "AI_ACTION_LOCATION_OUT_OF_CORRIDOR";
  message: string;
};

export type LocationResolveSuccess = {
  applicable: true;
  location: ResolvedLocation;
};

export type LocationResolveResult =
  LocationResolveSuccess | LocationResolveFailure;

const EARTH_KM = 6371;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Distance approximative d'un point au segment A→B (km). */
export function distanceToSegmentKm(
  point: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const ab = haversineKm(a, b);
  if (ab < 0.05) return haversineKm(point, a);
  // Projection approximative en coordonnées locales
  const ax = a.lng;
  const ay = a.lat;
  const bx = b.lng;
  const by = b.lat;
  const px = point.lng;
  const py = point.lat;
  const abx = bx - ax;
  const aby = by - ay;
  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby)),
  );
  return haversineKm(point, { lat: ay + t * aby, lng: ax + t * abx });
}

export function isValidCoordinatePair(
  latitude: unknown,
  longitude: unknown,
): boolean {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return false;
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
}

export type CorridorContext = {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  stops: Array<{ lat: number; lng: number }>;
  /** Distance totale voyage (km), pour seuils relatifs. */
  tripDistanceKm: number | null;
  /** Buffer max hors corridor (km). */
  maxCorridorDetourKm: number;
};

/**
 * Un point est dans le corridor s'il est assez proche du segment OD
 * ou d'une étape existante.
 */
export function isPointInTripCorridor(
  point: { lat: number; lng: number },
  ctx: CorridorContext,
): boolean {
  const tripKm = ctx.tripDistanceKm ?? 0;
  const maxKm = Math.max(
    ctx.maxCorridorDetourKm,
    tripKm > 0 ? tripKm * 0.25 : 0,
  );

  const toOd = distanceToSegmentKm(point, ctx.origin, ctx.destination);
  if (toOd <= maxKm) return true;

  for (const s of ctx.stops) {
    if (haversineKm(point, s) <= maxKm) return true;
  }
  if (haversineKm(point, ctx.origin) <= maxKm) return true;
  if (haversineKm(point, ctx.destination) <= maxKm) return true;
  return false;
}

/**
 * Estimation du km ajoutés en insérant un point entre prev et next.
 */
export function estimateInsertedDetourKm(input: {
  point: { lat: number; lng: number };
  prev: { lat: number; lng: number };
  next: { lat: number; lng: number };
}): number {
  const direct = haversineKm(input.prev, input.next);
  const via =
    haversineKm(input.prev, input.point) + haversineKm(input.point, input.next);
  return Math.max(0, via - direct);
}
