import {
  FUEL_STOP_REASON_LABELS,
  type TripFuelSimulationResult,
} from "@/features/fuel/lib/trip-fuel-types";
import type {
  CalculatedFillStop,
  TripFuelCalculationResult,
  TripLegSummary,
} from "@/features/fuel/lib/trip-fuel-calculator";
import type { CorridorCoverageStats } from "@/features/fuel/services/route-price-zones";
import type {
  FuelCalculationDto,
  FuelCorridorCoverageDto,
  FuelFillStopDto,
  FuelLegSummaryDto,
  FuelRefuelPlanDto,
  FuelRefuelStopDto,
  FuelStrategyComparisonDto,
} from "@/features/fuel/types";

function n(v: number, digits: number): string {
  return v.toFixed(digits);
}

function mapPriceSourceCode(
  granularity: CalculatedFillStop["priceGranularity"],
  source: string,
): string {
  if (granularity === "manual") return "manual";
  if (granularity === "station") return "station_exact";
  if (granularity === "regional") return "regional_estimate";
  if (/manuel/i.test(source)) return "manual";
  if (/régional|regional|ville/i.test(source)) return "regional_estimate";
  return source || "unknown";
}

function toFillStopDto(
  s: CalculatedFillStop,
  fuelType: string,
  sequence: number,
): FuelFillStopDto {
  const hasStationMeta =
    s.stationName != null ||
    s.address != null ||
    s.city != null ||
    (s.latitude != null && s.longitude != null);

  return {
    id: s.id,
    leg: s.leg,
    kind: s.kind,
    order: s.order,
    sequence,
    distanceFromStartKm: n(s.distanceFromStartKm, 2),
    distanceRemainingKm: n(s.distanceRemainingKm, 2),
    positionLabel: s.positionLabel,
    regionLabel: s.regionLabel,
    station: hasStationMeta
      ? {
          name: s.stationName,
          address: s.address,
          city: s.city,
          latitude: s.latitude != null ? n(s.latitude, 6) : null,
          longitude: s.longitude != null ? n(s.longitude, 6) : null,
          brand: s.stationBrand ?? null,
          placeId: s.placeId ?? null,
          googleMapsUrl: s.googleMapsUrl ?? null,
          distanceFromRouteKm:
            s.distanceFromRouteKm != null ? n(s.distanceFromRouteKm, 1) : null,
        }
      : null,
    isEstimatedLocation: s.isEstimatedLocation,
    fuelType,
    pricePerLiter: s.pricePerLiter != null ? n(s.pricePerLiter, 3) : null,
    priceSource: mapPriceSourceCode(s.priceGranularity, s.priceSource),
    priceGranularity: s.priceGranularity,
    pricePeriod: s.pricePeriod,
    priceIsEstimate: s.priceIsEstimate ?? s.priceGranularity !== "station",
    litersAdded: n(s.litersAdded, 2),
    tankLitersBefore: n(s.tankLitersBefore, 2),
    tankLitersAfter: n(s.tankLitersAfter, 2),
    tankPercentBefore: n(s.tankPercentBefore, 1),
    tankPercentAfter: n(s.tankPercentAfter, 1),
    cost: n(s.cost, 2),
    rangeAfterKm: n(s.rangeAfterKm, 1),
    reasonLabel: s.reasonLabel,
    detourKm: n(s.detourKm, 1),
  };
}

function toLegDto(leg: TripLegSummary, fuelType: string): FuelLegSummaryDto {
  let enRouteSeq = 0;
  const stops = leg.stops.map((s) => {
    const sequence =
      s.kind === "en_route"
        ? ++enRouteSeq
        : s.kind === "departure"
          ? 0
          : s.order;
    return toFillStopDto(s, fuelType, sequence);
  });
  return {
    leg: leg.leg,
    distanceKm: n(leg.distanceKm, 2),
    litersConsumed: n(leg.litersConsumed, 2),
    purchaseCost: n(leg.purchaseCost, 2),
    stops,
    refuelStops: stops.filter((s) => s.kind === "en_route"),
  };
}

export function toCalculationDto(
  calc: TripFuelCalculationResult,
  fuelType: string,
): FuelCalculationDto {
  let enRouteSeq = 0;
  const allStops = calc.allStops.map((s) => {
    const sequence =
      s.kind === "en_route"
        ? ++enRouteSeq
        : s.kind === "departure"
          ? 0
          : s.order;
    return toFillStopDto(s, fuelType, sequence);
  });

  return {
    feasible: calc.feasible,
    failureMessage: calc.failureMessage,
    fuelType,
    includeReturnTrip: calc.returnLeg != null,
    refillStrategy: calc.refillStrategy,
    selectedStrategyLabel: calc.selectedStrategyLabel,
    usefulRangeKm: n(calc.usefulRangeKm, 2),
    usableCapacityL: n(calc.usableCapacityL, 2),
    reserveLiters: n(calc.reserveLiters, 2),
    initialFuelL: n(calc.initialFuelL, 2),
    remainingFuelL: n(calc.remainingFuelL, 2),
    departureFillCost: n(calc.departureFillCost, 2),
    enRouteFillCost: n(calc.enRouteFillCost, 2),
    destinationFillCost: n(calc.destinationFillCost, 2),
    finalFillCost: n(calc.finalFillCost, 2),
    moneySpent: n(calc.moneySpent, 2),
    consumedFuelValue: n(calc.consumedFuelValue, 2),
    totalDistanceKm: n(calc.totalDistanceKm, 2),
    totalLitersConsumed: n(calc.totalLitersConsumed, 2),
    totalStopCount: calc.totalStopCount,
    outbound: toLegDto(calc.outbound, fuelType),
    returnLeg: calc.returnLeg ? toLegDto(calc.returnLeg, fuelType) : null,
    allStops,
  };
}

export function toCoverageDto(
  coverage: CorridorCoverageStats | null | undefined,
): FuelCorridorCoverageDto | null {
  if (!coverage) return null;
  return {
    samplePoints: coverage.samplePoints,
    nearbyCalls: coverage.nearbyCalls,
    rawStationHits: coverage.rawStationHits,
    uniqueStations: coverage.uniqueStations,
    stationsInCorridor: coverage.stationsInCorridor,
    withExactPrice: coverage.withExactPrice,
    withCityPrice: coverage.withCityPrice ?? 0,
    withRegionalPrice: coverage.withRegionalPrice,
    withoutPrice: coverage.withoutPrice,
    rejectedTooFar: coverage.rejectedTooFar ?? 0,
    candidates: coverage.candidates,
    analyzedByOptimizer: coverage.analyzedByOptimizer ?? coverage.candidates,
    retainedStops: coverage.retainedStops ?? 0,
    regions: coverage.regions,
    distinctPriceValues: coverage.distinctPriceValues ?? 0,
    distinctPriceIdentities: coverage.distinctPriceIdentities ?? 0,
  };
}

export function toRefuelPlanDto(
  sim: TripFuelSimulationResult,
  coverage?: CorridorCoverageStats | null,
): FuelRefuelPlanDto {
  const stops: FuelRefuelStopDto[] = sim.stops.map((s) => ({
    order: s.order,
    positionLabel: s.positionLabel,
    regionLabel: s.regionLabel,
    distanceFromStartKm: n(s.distanceFromStartKm, 1),
    distanceFromPreviousStopKm: n(s.distanceFromPreviousStopKm, 1),
    tankLitersBefore: n(s.tankLitersBefore, 1),
    tankPercentBefore: n(s.tankPercentBefore, 1),
    litersToBuy: n(s.litersToBuy, 1),
    isFullFill: s.isFullFill,
    pricePerLiter: n(s.pricePerLiter, 3),
    estimatedCost: n(s.estimatedCost, 2),
    tankLitersAfter: n(s.tankLitersAfter, 1),
    tankPercentAfter: n(s.tankPercentAfter, 1),
    reasonLabel: s.reasonLabel,
    detourKm: n(s.detourKm, 1),
    reserveLitersAtArrival: n(s.reserveLitersAtArrival, 1),
    granularity: s.granularity,
    pricePeriod: s.pricePeriod,
    source: s.source,
  }));

  const strategyComparison: FuelStrategyComparisonDto[] = (
    sim.strategyComparison ?? []
  ).map((row) => ({
    id: row.id,
    label: row.label,
    rawCost: row.rawCost != null ? n(row.rawCost, 2) : null,
    adjustedCost: row.adjustedCost != null ? n(row.adjustedCost, 2) : null,
    valid: row.valid,
    stopCount: row.stopCount,
    remainingFuelL: n(row.remainingFuelL, 1),
  }));

  return {
    initialFuelL: n(sim.initialFuelL, 1),
    remainingFuelL: n(sim.remainingFuelL, 1),
    remainingFuelPercent: n(sim.remainingFuelPercent, 1),
    litersPurchased: n(sim.litersPurchased, 1),
    averagePricePerLiter:
      sim.averagePricePerLiter != null ? n(sim.averagePricePerLiter, 3) : null,
    suggestedStopCount: sim.suggestedStopCount,
    naiveCostAtDeparturePrice: n(sim.naiveCostAtDeparturePrice, 2),
    estimatedSavingsVsNaive:
      sim.estimatedSavingsVsNaive != null
        ? n(sim.estimatedSavingsVsNaive, 2)
        : null,
    selectedStrategyId: sim.selectedStrategyId ?? null,
    selectedStrategyLabel: sim.selectedStrategyLabel ?? null,
    noAdvantageousOptimization: Boolean(sim.noAdvantageousOptimization),
    strategyComparison,
    priceConfidence: sim.priceConfidence,
    priceSourceSummary: sim.priceSourceSummary,
    pricePeriodSummary: sim.pricePeriodSummary,
    reserveLiters: n(sim.reserveLiters, 1),
    reservePercent: n(sim.reservePercent, 1),
    searchThresholdPercent: n(sim.searchThresholdPercent, 0),
    feasible: sim.feasible,
    failureReasonLabel: sim.failureReason
      ? FUEL_STOP_REASON_LABELS[sim.failureReason]
      : null,
    stops,
    coverage: toCoverageDto(coverage),
  };
}

export function dedupeWarnings(warnings: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of warnings) {
    const key = w.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}
