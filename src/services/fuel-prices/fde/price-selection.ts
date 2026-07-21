/**
 * Sélection du prix de référence — médiane (limite les extrêmes).
 * Ne pas utiliser le minimum comme estimation par défaut.
 */

export type PricingMethod =
  "nearby-station-median" | "selected-station" | "regional-fallback";

export function median(values: number[]): number {
  if (values.length === 0) {
    throw new Error("median requires at least one value");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid]!;
  }
  return roundPrice((sorted[mid - 1]! + sorted[mid]!) / 2);
}

/**
 * ≥ 1 station → médiane (1 station = ce prix, couverture faible).
 * 0 → null (caller déclenche fallback régional).
 */
export function selectReferencePrice(prices: number[]): {
  priceCadPerLitre: number;
  pricingMethod: PricingMethod;
  stationCount: number;
  lowCoverage: boolean;
} | null {
  const valid = prices.filter((p) => Number.isFinite(p) && p > 0 && p < 10);
  if (valid.length === 0) return null;

  if (valid.length === 1) {
    return {
      priceCadPerLitre: roundPrice(valid[0]!),
      pricingMethod: "selected-station",
      stationCount: 1,
      lowCoverage: true,
    };
  }

  return {
    priceCadPerLitre: roundPrice(median(valid)),
    pricingMethod: "nearby-station-median",
    stationCount: valid.length,
    lowCoverage: valid.length < 5,
  };
}

export function roundPrice(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function isPriceFreshEnough(
  observedAt: string,
  maxAgeHours: number,
  now = Date.now(),
): boolean {
  const ts = Date.parse(observedAt);
  if (!Number.isFinite(ts)) return false;
  return now - ts <= maxAgeHours * 60 * 60 * 1000;
}
