export type FuelLogDto = {
  id: string;
  vehicleId: string;
  filledAt: string;
  odometerKm: number;
  liters: string;
  pricePerLiter: string;
  totalCost: string;
  isFull: boolean;
  fuelType: string | null;
  stationName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FuelStatsDto = {
  realAvgConsumption: string | null;
  fullFillCount: number;
  totalFillCount: number;
  segmentCount: number;
  totalDistanceKm: number;
  totalLitersInSegments: number;
  avgPricePerLiter: string | null;
  totalSpent: string;
  segments: Array<{
    fromOdometer: number;
    toOdometer: number;
    distanceKm: number;
    liters: string;
    litersPer100Km: string;
  }>;
};

export type FuelRefuelStopDto = {
  order: number;
  positionLabel: string;
  regionLabel: string | null;
  distanceFromStartKm: string;
  distanceFromPreviousStopKm: string;
  tankLitersBefore: string;
  tankPercentBefore: string;
  litersToBuy: string;
  isFullFill: boolean;
  pricePerLiter: string;
  estimatedCost: string;
  tankLitersAfter: string;
  tankPercentAfter: string;
  reasonLabel: string;
  detourKm: string;
  reserveLitersAtArrival: string;
  granularity: "station" | "regional" | "unknown";
  pricePeriod: string | null;
  source: string;
};

export type FuelCorridorCoverageDto = {
  samplePoints: number;
  nearbyCalls: number;
  rawStationHits: number;
  uniqueStations: number;
  stationsInCorridor: number;
  withExactPrice: number;
  withCityPrice: number;
  withRegionalPrice: number;
  withoutPrice: number;
  rejectedTooFar: number;
  candidates: number;
  analyzedByOptimizer: number;
  retainedStops: number;
  regions: string[];
  distinctPriceValues: number;
  distinctPriceIdentities: number;
};

export type FuelStrategyComparisonDto = {
  id: string;
  label: string;
  rawCost: string | null;
  adjustedCost: string | null;
  valid: boolean;
  stopCount: number;
  remainingFuelL: string;
};

export type FuelRefuelPlanDto = {
  initialFuelL: string;
  remainingFuelL: string;
  remainingFuelPercent: string;
  litersPurchased: string;
  averagePricePerLiter: string | null;
  suggestedStopCount: number;
  naiveCostAtDeparturePrice: string;
  estimatedSavingsVsNaive: string | null;
  selectedStrategyId: string | null;
  selectedStrategyLabel: string | null;
  noAdvantageousOptimization: boolean;
  strategyComparison: FuelStrategyComparisonDto[];
  priceConfidence: "high" | "medium" | "low" | "none";
  priceSourceSummary: string;
  pricePeriodSummary: string | null;
  reserveLiters: string;
  reservePercent: string;
  searchThresholdPercent: string;
  feasible: boolean;
  failureReasonLabel: string | null;
  stops: FuelRefuelStopDto[];
  coverage: FuelCorridorCoverageDto | null;
};

export type FuelStationDto = {
  name: string | null;
  address: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  brand: string | null;
  placeId: string | null;
  googleMapsUrl: string | null;
  /** Distance station → point prévu sur l'itinéraire (km). */
  distanceFromRouteKm: string | null;
};

export type FuelFillStopDto = {
  id: string;
  leg: "outbound" | "return";
  kind: "departure" | "en_route" | "destination" | "final";
  order: number;
  sequence: number;
  distanceFromStartKm: string;
  distanceRemainingKm: string;
  positionLabel: string;
  regionLabel: string | null;
  station: FuelStationDto | null;
  isEstimatedLocation: boolean;
  fuelType: string;
  pricePerLiter: string | null;
  priceSource: string;
  priceGranularity: "station" | "regional" | "unknown" | "manual";
  pricePeriod: string | null;
  /** true si le prix n'est pas un prix station exact. */
  priceIsEstimate: boolean;
  litersAdded: string;
  tankLitersBefore: string;
  tankLitersAfter: string;
  tankPercentBefore: string;
  tankPercentAfter: string;
  cost: string;
  rangeAfterKm: string;
  reasonLabel: string;
  detourKm: string;
};

export type FuelLegSummaryDto = {
  leg: "outbound" | "return";
  distanceKm: string;
  litersConsumed: string;
  purchaseCost: string;
  stops: FuelFillStopDto[];
  /** Arrêts carburant en route uniquement (hors plein départ / final). */
  refuelStops: FuelFillStopDto[];
};

export type FuelCalculationDto = {
  feasible: boolean;
  failureMessage: string | null;
  fuelType: string;
  includeReturnTrip: boolean;
  refillStrategy: "full_tank" | "required_only" | "optimized";
  selectedStrategyLabel: string;
  usefulRangeKm: string;
  usableCapacityL: string;
  reserveLiters: string;
  initialFuelL: string;
  remainingFuelL: string;
  departureFillCost: string;
  enRouteFillCost: string;
  destinationFillCost: string;
  finalFillCost: string;
  moneySpent: string;
  consumedFuelValue: string;
  totalDistanceKm: string;
  totalLitersConsumed: string;
  totalStopCount: number;
  outbound: FuelLegSummaryDto;
  returnLeg: FuelLegSummaryDto | null;
  allStops: FuelFillStopDto[];
};

export type FuelEstimateDto = {
  isEstimate: true;
  distanceKm: string;
  vehicleLabel: string | null;
  consumptionL100: string;
  consumptionSource:
    | "real_avg"
    | "vehicle_profile"
    | "catalog"
    | "app_default"
    | "manual"
    | "user_override";
  consumptionSourceLabel: string;
  tankCapacityL: string | null;
  tankCapacitySource: string | null;
  tankCapacitySourceLabel: string | null;
  tankCapacityConfidence: "high" | "medium" | null;
  fuelType: string | null;
  pricePerLiter: string;
  priceSource:
    | "fde_station"
    | "fde_regional"
    | "regie_quebec"
    | "personal_average"
    | "user_default"
    | "not_applicable"
    | "unavailable";
  priceSourceLabel: string | null;
  priceSampleCount: number;
  litersNeeded: string;
  /** @deprecated Préférer calculation.moneySpent */
  estimatedCost: string;
  currency: "CAD";
  priceLabel: string | null;
  regionLabel: string | null;
  priceCapturedAt: string | null;
  pricingMethod: string | null;
  freshness: string | null;
  attribution: string | null;
  fallbackUsed: boolean;
  warnings: string[];
  selectedStationId: string | null;
  /** Plan de ravitaillement simulé (null si non applicable). */
  refuelPlan: FuelRefuelPlanDto | null;
  coverage: FuelCorridorCoverageDto | null;
  /** Calcul détaillé des pleins (argent dépensé vs consommé). */
  calculation: FuelCalculationDto | null;
};

export type PaginatedFuelLogs = {
  items: FuelLogDto[];
  total: number;
  page: number;
  pageSize: number;
};
