/**
 * Types du moteur de simulation / plan de ravitaillement.
 */

export type FuelPriceGranularity = "station" | "regional" | "unknown";

export type FuelPriceSourceType =
  | "station_exact"
  | "city_estimate"
  | "regional_estimate"
  | "route_fallback"
  | "origin_fallback";

export type FuelStopCandidate = {
  id: string;
  /** Distance le long du trajet depuis le départ (km). */
  distanceFromStartKm: number;
  /** Détour hors tracé pour atteindre la zone (km). */
  detourKm: number;
  pricePerLiter: number;
  label: string;
  regionLabel?: string | null;
  granularity: FuelPriceGranularity;
  source: string;
  observedAt?: string | null;
  attribution?: string | null;
  /** true si prix réel de stations ; false si estimation régionale. */
  isStationLevel: boolean;
  /** Classification fine de la source du prix (indépendante du lieu). */
  sourceType?: FuelPriceSourceType;
  /** true uniquement si le prix est propre à cette station. */
  isExactForStation?: boolean;
  priceIdentity?: string | null;
  /** Nom commercial de la station (sans suffixe d'estimation). */
  stationName?: string | null;
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type FuelStationLocationFields = {
  stationName: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  /**
   * Lieu estimé (pas de station réelle) — indépendant du prix.
   * Une station réelle avec prix régional → isEstimatedLocation = false.
   */
  isEstimatedLocation: boolean;
};

/** Station identifiable (nom + coords), indépendamment de la granularité prix. */
export function candidateHasRealStationIdentity(c: FuelStopCandidate): boolean {
  const name =
    c.stationName?.trim() ||
    c.label.replace(/\s*\(prix régional estimé\)\s*$/i, "").trim();
  if (!name) return false;
  if (/^km\s*\d/i.test(name)) return false;
  if (/^zone[-_]/i.test(c.id) || /^zone\b/i.test(name)) return false;
  if (/repli|départ\s*\(/i.test(name)) return false;
  if (/^Zone de ravitaillement/i.test(name)) return false;
  return (
    c.latitude != null &&
    c.longitude != null &&
    Number.isFinite(c.latitude) &&
    Number.isFinite(c.longitude)
  );
}

export function stationFieldsFromCandidate(
  c: FuelStopCandidate,
): FuelStationLocationFields {
  const cleanName =
    c.stationName?.trim() ||
    c.label
      .replace(/\s*\(prix régional estimé\)\s*$/i, "")
      .replace(/^Zone de ravitaillement.*—\s*/i, "")
      .trim() ||
    null;
  const hasIdentity = candidateHasRealStationIdentity(c);
  return {
    stationName: hasIdentity ? cleanName || null : null,
    address: hasIdentity ? c.address?.trim() || null : null,
    // Ne pas utiliser regionLabel (région tarifaire) comme ville d'arrêt
    city: hasIdentity ? c.city?.trim() || null : null,
    latitude:
      c.latitude != null && Number.isFinite(c.latitude) ? c.latitude : null,
    longitude:
      c.longitude != null && Number.isFinite(c.longitude) ? c.longitude : null,
    // Lieu exact si station réelle — même avec prix régional
    isEstimatedLocation: !hasIdentity,
  };
}

/** Libellé d'arrêt : nom de station si identité réelle, sinon zone estimée. */
export function positionLabelFromCandidate(c: FuelStopCandidate): string {
  const loc = stationFieldsFromCandidate(c);
  if (loc.stationName) return loc.stationName;
  const clean = c.label.replace(/\s*\(prix régional estimé\)\s*$/i, "").trim();
  return `Zone de ravitaillement recommandée selon les prix régionaux disponibles — ${clean}`;
}

export type FuelStopReason =
  | "required_reserve"
  | "cheaper_than_ahead"
  | "partial_before_cheaper"
  | "full_ahead_more_expensive"
  | "none_before_destination"
  | "unreachable"
  | "no_price_data";

export const FUEL_STOP_REASON_LABELS: Record<FuelStopReason, string> = {
  required_reserve:
    "Ravitaillement requis pour respecter la réserve de sécurité",
  cheaper_than_ahead: "Prix inférieur aux zones suivantes",
  partial_before_cheaper: "Plein partiel recommandé avant une zone moins chère",
  full_ahead_more_expensive:
    "Plein anticipé recommandé, car les prix à venir sont plus élevés",
  none_before_destination: "Aucun arrêt requis avant la destination",
  unreachable:
    "Impossible d'atteindre un prochain ravitaillement en toute sécurité",
  no_price_data: "Aucune donnée de prix disponible",
};

export type SuggestedFuelStop = {
  order: number;
  zoneId: string;
  positionLabel: string;
  regionLabel: string | null;
  distanceFromStartKm: number;
  distanceFromPreviousStopKm: number;
  tankLitersBefore: number;
  tankPercentBefore: number;
  litersToBuy: number;
  isFullFill: boolean;
  pricePerLiter: number;
  estimatedCost: number;
  tankLitersAfter: number;
  tankPercentAfter: number;
  reason: FuelStopReason;
  reasonLabel: string;
  detourKm: number;
  reserveLitersAtArrival: number;
  granularity: FuelPriceGranularity;
  pricePeriod: string | null;
  source: string;
  sourceType?: FuelPriceSourceType;
  isExactForStation?: boolean;
  priceIdentity?: string | null;
  stationName: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  isEstimatedLocation: boolean;
};

export type FuelStrategyComparisonRow = {
  id: string;
  label: string;
  rawCost: number | null;
  adjustedCost: number | null;
  valid: boolean;
  stopCount: number;
  remainingFuelL: number;
  rejectionReasons: string[];
};

export type TripFuelSimulationResult = {
  totalDistanceKm: number;
  totalConsumptionL: number;
  initialFuelL: number;
  remainingFuelL: number;
  remainingFuelPercent: number;
  litersPurchased: number;
  totalCostPurchased: number;
  averagePricePerLiter: number | null;
  suggestedStopCount: number;
  stops: SuggestedFuelStop[];
  /**
   * Coût stratégie naïve comparable :
   * même plein initial non facturé, mêmes arrêts forcés par autonomie,
   * tous les achats au prix du départ.
   */
  naiveCostAtDeparturePrice: number;
  /**
   * Économie réelle vs stratégie naïve comparable (≥ 0).
   * Jamais négative : si aucune optimisation avantageuse, 0.
   */
  estimatedSavingsVsNaive: number | null;
  priceConfidence: "high" | "medium" | "low" | "none";
  priceSourceSummary: string;
  pricePeriodSummary: string | null;
  reserveLiters: number;
  reservePercent: number;
  searchThresholdPercent: number;
  warnings: string[];
  feasible: boolean;
  failureReason: FuelStopReason | null;
  /** Stratégie finalement retenue après comparaison. */
  selectedStrategyId?: string;
  selectedStrategyLabel?: string;
  /** true si aucune stratégie n'est moins chère que le ravitaillement standard. */
  noAdvantageousOptimization?: boolean;
  strategyComparison?: FuelStrategyComparisonRow[];
};
