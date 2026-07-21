/**
 * Feature `subscriptions` / types.
 */

export type LimitedTripPreviewInput = {
  /** Distance indicative (km), sans géométrie précise. */
  approximateDistanceKm?: number | null;
  /** Durée indicative (minutes). */
  approximateDurationMinutes?: number | null;
  /** Nombre approximatif d'arrêts. */
  stopCount?: number | null;
  /** Estimation carburant (litres). */
  fuelLitersEstimate?: number | null;
};

export type LimitedTripPreview = {
  isApproximate: true;
  distanceKmRange: { min: number; max: number } | null;
  durationMinutesRange: { min: number; max: number } | null;
  stopsRange: { min: number; max: number } | null;
  fuelLitersRange: { min: number; max: number } | null;
};
