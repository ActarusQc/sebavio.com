/** Convertit m/s → km/h. */
export function metersPerSecondToKmh(ms: number): number {
  if (!Number.isFinite(ms)) return 0;
  return Math.round(ms * 3.6 * 10) / 10;
}

/** Probabilité OpenWeather (0–1) → pourcentage 0–100. */
export function popToPercent(pop: number | null | undefined): number | null {
  if (pop == null || !Number.isFinite(pop)) return null;
  return Math.round(Math.min(1, Math.max(0, pop)) * 100);
}

export function roundCoord(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
