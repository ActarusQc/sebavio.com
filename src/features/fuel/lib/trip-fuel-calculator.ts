/**
 * Calcul du coût réel des pleins (départ, en route, destination, final).
 * Distingue argent dépensé vs valeur du carburant consommé.
 */

import type { FuelSimulationConfig } from "@/features/fuel/config/simulation";
import { getFuelSimulationConfig } from "@/features/fuel/config/simulation";
import {
  litersForDistanceKm,
  rangeKmFromLiters,
  tankFraction,
} from "@/features/fuel/lib/fuel-range-calculator";
import { effectiveReserveLiters } from "@/features/fuel/lib/fuel-reserve-policy";
import { simulateTripFuelWithInitial } from "@/features/fuel/lib/trip-fuel-simulator";
import type {
  FuelStopCandidate,
  SuggestedFuelStop,
  TripFuelSimulationResult,
} from "@/features/fuel/lib/trip-fuel-types";
import type { FuelEstimateInput } from "@/features/fuel/schemas";

export type TripLegKind = "outbound" | "return";

export type CalculatedFillStop = {
  id: string;
  leg: TripLegKind;
  kind: "departure" | "en_route" | "destination" | "final";
  order: number;
  distanceFromStartKm: number;
  distanceRemainingKm: number;
  positionLabel: string;
  regionLabel: string | null;
  pricePerLiter: number | null;
  priceSource: string;
  priceGranularity: "station" | "regional" | "unknown" | "manual";
  pricePeriod: string | null;
  litersAdded: number;
  tankLitersBefore: number;
  tankLitersAfter: number;
  tankPercentBefore: number;
  tankPercentAfter: number;
  cost: number;
  rangeAfterKm: number;
  reasonLabel: string;
  detourKm: number;
  stationName: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  isEstimatedLocation: boolean;
  /** true si le prix n'est pas exact pour cette station. */
  priceIsEstimate?: boolean;
  /** Bannière / marque (Petro-Canada, Ultramar…). */
  stationBrand?: string | null;
  placeId?: string | null;
  googleMapsUrl?: string | null;
  /** Distance station → point d'arrêt sur la route (km). */
  distanceFromRouteKm?: number | null;
};

export type TripLegSummary = {
  leg: TripLegKind;
  distanceKm: number;
  litersConsumed: number;
  purchaseCost: number;
  stops: CalculatedFillStop[];
};

export type TripFuelCalculationResult = {
  feasible: boolean;
  failureMessage: string | null;
  tankCapacityL: number;
  consumptionL100: number;
  reserveLiters: number;
  usableCapacityL: number;
  usefulRangeKm: number;
  initialFuelL: number;
  fuelAfterDepartureRefillL: number;
  remainingFuelL: number;
  outbound: TripLegSummary;
  returnLeg: TripLegSummary | null;
  totalDistanceKm: number;
  totalLitersConsumed: number;
  totalStopCount: number;
  departureFillCost: number;
  enRouteFillCost: number;
  destinationFillCost: number;
  finalFillCost: number;
  moneySpent: number;
  consumedFuelValue: number;
  averagePurchasePrice: number | null;
  refillStrategy: NonNullable<FuelEstimateInput["refillStrategy"]>;
  selectedStrategyLabel: string;
  warnings: string[];
  simulation: TripFuelSimulationResult | null;
  allStops: CalculatedFillStop[];
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function resolveInitialFuelLiters(input: {
  tankCapacityL: number;
  initialFuel: FuelEstimateInput["initialFuel"];
}): number {
  const mode = input.initialFuel?.mode ?? "full";
  const value = input.initialFuel?.value;
  switch (mode) {
    case "empty":
      return 0;
    case "quarter":
      return input.tankCapacityL * 0.25;
    case "half":
      return input.tankCapacityL * 0.5;
    case "three_quarters":
      return input.tankCapacityL * 0.75;
    case "percentage":
      return (
        (input.tankCapacityL * Math.min(100, Math.max(0, value ?? 100))) / 100
      );
    case "litres":
      return Math.min(input.tankCapacityL, Math.max(0, value ?? 0));
    case "full":
    default:
      return input.tankCapacityL;
  }
}

export function resolveReserveLiters(input: {
  tankCapacityL: number;
  consumptionL100: number;
  reserve: FuelEstimateInput["reserve"];
  config: FuelSimulationConfig;
}): number {
  if (input.reserve?.mode === "litres") {
    return Math.min(
      input.tankCapacityL * 0.9,
      Math.max(0, input.reserve.value),
    );
  }
  if (input.reserve?.mode === "percentage") {
    return (input.tankCapacityL * input.reserve.value) / 100;
  }
  return effectiveReserveLiters({
    tankCapacityL: input.tankCapacityL,
    consumptionL100: input.consumptionL100,
    config: input.config,
  });
}

export function reverseCandidatesForReturn(
  candidates: FuelStopCandidate[],
  totalDistanceKm: number,
): FuelStopCandidate[] {
  return candidates
    .map((c) => ({
      ...c,
      id: `ret-${c.id}`,
      distanceFromStartKm: Math.max(0, totalDistanceKm - c.distanceFromStartKm),
    }))
    .sort((a, b) => a.distanceFromStartKm - b.distanceFromStartKm);
}

function mapSuggestedStops(
  stops: SuggestedFuelStop[],
  leg: TripLegKind,
  consumptionL100: number,
  legDistanceKm: number,
): CalculatedFillStop[] {
  return stops.map((s) => ({
    id: `${leg}-${s.zoneId}-${s.order}`,
    leg,
    kind: "en_route" as const,
    order: 0,
    distanceFromStartKm: s.distanceFromStartKm,
    distanceRemainingKm: Math.max(0, legDistanceKm - s.distanceFromStartKm),
    positionLabel: s.positionLabel,
    regionLabel: s.regionLabel,
    pricePerLiter: s.pricePerLiter,
    priceSource: s.source,
    priceGranularity:
      s.granularity === "station"
        ? ("station" as const)
        : s.granularity === "regional"
          ? ("regional" as const)
          : ("unknown" as const),
    pricePeriod: s.pricePeriod,
    litersAdded: s.litersToBuy,
    tankLitersBefore: s.tankLitersBefore,
    tankLitersAfter: s.tankLitersAfter,
    tankPercentBefore: s.tankPercentBefore,
    tankPercentAfter: s.tankPercentAfter,
    cost: s.estimatedCost,
    rangeAfterKm: rangeKmFromLiters(s.tankLitersAfter, consumptionL100),
    reasonLabel: s.reasonLabel,
    detourKm: s.detourKm,
    stationName: s.stationName,
    address: s.address,
    city: s.city,
    latitude: s.latitude,
    longitude: s.longitude,
    isEstimatedLocation: s.isEstimatedLocation,
    priceIsEstimate: s.isExactForStation === false,
    placeId: s.zoneId.startsWith("zone-") ? null : s.zoneId,
  }));
}

function strategyLabel(
  strategy: NonNullable<FuelEstimateInput["refillStrategy"]>,
): string {
  switch (strategy) {
    case "full_tank":
      return "Remplir complètement le réservoir";
    case "required_only":
      return "Ajouter seulement la quantité nécessaire";
    case "optimized":
      return "Optimisation de coût";
  }
}

function runLeg(input: {
  totalDistanceKm: number;
  consumptionL100: number;
  tankCapacityL: number;
  initialFuelL: number;
  candidates: FuelStopCandidate[];
  departurePricePerLiter: number | null;
  config: FuelSimulationConfig;
  strategy: NonNullable<FuelEstimateInput["refillStrategy"]>;
  reserveL: number;
}): TripFuelSimulationResult {
  const config: FuelSimulationConfig = {
    ...input.config,
    reserveFraction: input.reserveL / input.tankCapacityL,
    reserveMinKm: 0,
    initialTankStrategy: "full_unbilled",
  };

  const common = {
    totalDistanceKm: input.totalDistanceKm,
    consumptionL100: input.consumptionL100,
    tankCapacityL: input.tankCapacityL,
    candidates: input.candidates,
    departurePricePerLiter: input.departurePricePerLiter,
    config,
    initialFuelL: input.initialFuelL,
    skipComparableSavings: true as const,
  };

  if (input.strategy === "full_tank") {
    return simulateTripFuelWithInitial({
      ...common,
      config: {
        ...config,
        searchThresholdFraction: 0.01,
        minPriceAdvantagePerLiter: 999,
      },
      forceFullFills: true,
    });
  }

  if (input.strategy === "required_only") {
    return simulateTripFuelWithInitial({
      ...common,
      config: {
        ...config,
        searchThresholdFraction: 0.01,
        minPriceAdvantagePerLiter: 999,
      },
      forceFullFills: false,
    });
  }

  // optimized : compare full / required / greedy, garde le moins cher valide
  const variants = [
    simulateTripFuelWithInitial({
      ...common,
      config: {
        ...config,
        searchThresholdFraction: 0.01,
        minPriceAdvantagePerLiter: 999,
      },
      forceFullFills: true,
    }),
    simulateTripFuelWithInitial({
      ...common,
      config: {
        ...config,
        searchThresholdFraction: 0.01,
        minPriceAdvantagePerLiter: 999,
      },
      forceFullFills: false,
    }),
    simulateTripFuelWithInitial({ ...common, forceFullFills: false }),
  ];
  const ok = variants.filter((v) => v.feasible);
  if (ok.length === 0) return variants[2]!;
  const naive = variants[1]!;
  const best = ok.reduce((a, b) =>
    a.totalCostPurchased <= b.totalCostPurchased ? a : b,
  );
  if (
    naive.feasible &&
    best.totalCostPurchased > naive.totalCostPurchased + 0.01
  ) {
    return naive;
  }
  return best;
}

export function calculateTripFuelPlan(input: {
  outboundDistanceKm: number;
  returnDistanceKm: number | null;
  includeReturnTrip: boolean;
  consumptionL100: number;
  tankCapacityL: number;
  options: FuelEstimateInput;
  outboundCandidates: FuelStopCandidate[];
  returnCandidates?: FuelStopCandidate[] | null;
  departurePricePerLiter: number | null;
  config?: FuelSimulationConfig;
}): TripFuelCalculationResult {
  const config = input.config ?? getFuelSimulationConfig();
  const warnings: string[] = [];
  const strategy = input.options.refillStrategy ?? "full_tank";
  const departurePrice = input.departurePricePerLiter ?? 0;

  const reserveL = resolveReserveLiters({
    tankCapacityL: input.tankCapacityL,
    consumptionL100: input.consumptionL100,
    reserve: input.options.reserve,
    config,
  });
  const usableCapacityL = Math.max(0, input.tankCapacityL - reserveL);
  const usefulRangeKm = rangeKmFromLiters(
    usableCapacityL,
    input.consumptionL100,
  );
  const initialFuelL = resolveInitialFuelLiters({
    tankCapacityL: input.tankCapacityL,
    initialFuel: input.options.initialFuel,
  });

  let fuelL = initialFuelL;
  let departureFillCost = 0;
  let departureLiters = 0;
  const departureStops: CalculatedFillStop[] = [];
  const refillMode = input.options.departureRefill?.mode ?? "none";

  if (refillMode === "automatic") {
    departureLiters = Math.max(0, input.tankCapacityL - fuelL);
    if (departureLiters > 1e-9) {
      if (!(departurePrice > 0)) {
        return emptyFail(
          input,
          reserveL,
          usableCapacityL,
          usefulRangeKm,
          initialFuelL,
          "Prix de départ indisponible pour le plein automatique.",
          warnings,
        );
      }
      departureFillCost = departureLiters * departurePrice;
      fuelL = input.tankCapacityL;
      departureStops.push(
        makeDepartureStop({
          label: "Plein de départ",
          initialFuelL,
          fuelAfter: fuelL,
          liters: departureLiters,
          cost: departureFillCost,
          pricePerLiter: departurePrice,
          source: "Prix au départ",
          granularity: "station",
          reason: "Plein initial automatique",
          tankCapacityL: input.tankCapacityL,
          consumptionL100: input.consumptionL100,
          outboundDistanceKm: input.outboundDistanceKm,
        }),
      );
    }
  } else if (refillMode === "manual_total") {
    const manual = input.options.departureRefill?.manualTotal ?? 0;
    departureLiters = Math.max(0, input.tankCapacityL - fuelL);
    departureFillCost = manual;
    if (departureLiters > 1e-9 || manual > 0) {
      fuelL = departureLiters > 1e-9 ? input.tankCapacityL : fuelL;
      departureStops.push(
        makeDepartureStop({
          label: "Plein de départ (manuel)",
          initialFuelL,
          fuelAfter: fuelL,
          liters: departureLiters,
          cost: departureFillCost,
          pricePerLiter:
            departureLiters > 1e-9 ? manual / departureLiters : null,
          source: "Saisie manuelle",
          granularity: "manual",
          reason: "Plein initial au montant saisi",
          tankCapacityL: input.tankCapacityL,
          consumptionL100: input.consumptionL100,
          outboundDistanceKm: input.outboundDistanceKm,
        }),
      );
    }
  }

  const fuelAfterDepartureRefillL = fuelL;
  const legConfig = {
    ...config,
    reserveFraction: reserveL / input.tankCapacityL,
    reserveMinKm: 0,
  };

  const outboundSim = runLeg({
    totalDistanceKm: input.outboundDistanceKm,
    consumptionL100: input.consumptionL100,
    tankCapacityL: input.tankCapacityL,
    initialFuelL: fuelL,
    candidates: input.outboundCandidates,
    departurePricePerLiter: input.departurePricePerLiter,
    config: legConfig,
    strategy,
    reserveL,
  });

  if (!outboundSim.feasible) {
    return emptyFail(
      input,
      reserveL,
      usableCapacityL,
      usefulRangeKm,
      initialFuelL,
      outboundSim.warnings[0] ??
        "Aucun arrêt carburant accessible n’a été trouvé avant la limite d’autonomie du véhicule.",
      [...warnings, ...outboundSim.warnings],
      fuelAfterDepartureRefillL,
    );
  }

  const outboundEnRoute = mapSuggestedStops(
    outboundSim.stops,
    "outbound",
    input.consumptionL100,
    input.outboundDistanceKm,
  );
  let enRouteFillCost = outboundEnRoute.reduce((s, x) => s + x.cost, 0);
  fuelL = outboundSim.remainingFuelL;

  let destinationFillCost = 0;
  let finalFillCost = 0;
  const destStops: CalculatedFillStop[] = [];

  if (input.options.refillAtDestination && departurePrice > 0) {
    const room = input.tankCapacityL - fuelL;
    if (room >= Math.min(10, input.tankCapacityL * 0.05) && room > 0.5) {
      const cost = room * departurePrice;
      destinationFillCost = cost;
      destStops.push({
        id: "outbound-destination",
        leg: "outbound",
        kind: "destination",
        order: 0,
        distanceFromStartKm: input.outboundDistanceKm,
        distanceRemainingKm: 0,
        positionLabel: "Plein à destination",
        regionLabel: null,
        pricePerLiter: departurePrice,
        priceSource: "Prix au départ (repli destination)",
        priceGranularity: "unknown",
        pricePeriod: null,
        litersAdded: room,
        tankLitersBefore: fuelL,
        tankLitersAfter: fuelL + room,
        tankPercentBefore: tankFraction(fuelL, input.tankCapacityL) * 100,
        tankPercentAfter: 100,
        cost,
        rangeAfterKm: rangeKmFromLiters(fuelL + room, input.consumptionL100),
        reasonLabel: "Plein prévu à destination",
        detourKm: 0,
        stationName: null,
        address: null,
        city: null,
        latitude: null,
        longitude: null,
        isEstimatedLocation: true,
      });
      fuelL += room;
    }
  }

  const outbound: TripLegSummary = {
    leg: "outbound",
    distanceKm: input.outboundDistanceKm,
    litersConsumed: litersForDistanceKm(
      input.outboundDistanceKm,
      input.consumptionL100,
    ),
    purchaseCost: departureFillCost + enRouteFillCost + destinationFillCost,
    stops: [...departureStops, ...outboundEnRoute, ...destStops],
  };

  let returnLeg: TripLegSummary | null = null;

  if (input.includeReturnTrip) {
    const returnKm =
      input.returnDistanceKm && input.returnDistanceKm > 0
        ? input.returnDistanceKm
        : input.outboundDistanceKm;
    if (
      !input.returnDistanceKm ||
      Math.abs(input.returnDistanceKm - input.outboundDistanceKm) < 0.05
    ) {
      warnings.push(
        "Distance retour alignée sur l'aller (itinéraire retour distinct non disponible).",
      );
    }

    const returnCandidates =
      input.returnCandidates && input.returnCandidates.length > 0
        ? input.returnCandidates
        : reverseCandidatesForReturn(input.outboundCandidates, returnKm);

    const returnSim = runLeg({
      totalDistanceKm: returnKm,
      consumptionL100: input.consumptionL100,
      tankCapacityL: input.tankCapacityL,
      initialFuelL: fuelL,
      candidates: returnCandidates,
      departurePricePerLiter: input.departurePricePerLiter,
      config: legConfig,
      strategy,
      reserveL,
    });

    if (!returnSim.feasible) {
      return emptyFail(
        input,
        reserveL,
        usableCapacityL,
        usefulRangeKm,
        initialFuelL,
        returnSim.warnings[0] ??
          "Impossible de calculer un plan sûr pour le retour.",
        [...warnings, ...returnSim.warnings],
        fuelAfterDepartureRefillL,
      );
    }

    const returnEnRoute = mapSuggestedStops(
      returnSim.stops,
      "return",
      input.consumptionL100,
      returnKm,
    );
    const returnCost = returnEnRoute.reduce((s, x) => s + x.cost, 0);
    enRouteFillCost += returnCost;
    fuelL = returnSim.remainingFuelL;
    returnLeg = {
      leg: "return",
      distanceKm: returnKm,
      litersConsumed: litersForDistanceKm(returnKm, input.consumptionL100),
      purchaseCost: returnCost,
      stops: returnEnRoute,
    };
  }

  const finalStops: CalculatedFillStop[] = [];
  if (input.options.finishWithFullTank && departurePrice > 0) {
    const room = input.tankCapacityL - fuelL;
    if (room > 1e-6) {
      finalFillCost = room * departurePrice;
      const leg: TripLegKind = returnLeg ? "return" : "outbound";
      finalStops.push({
        id: `${leg}-final`,
        leg,
        kind: "final",
        order: 0,
        distanceFromStartKm: returnLeg
          ? returnLeg.distanceKm
          : input.outboundDistanceKm,
        distanceRemainingKm: 0,
        positionLabel: "Plein final (réservoir plein)",
        regionLabel: null,
        pricePerLiter: departurePrice,
        priceSource: "Prix au départ (repli)",
        priceGranularity: "unknown",
        pricePeriod: null,
        litersAdded: room,
        tankLitersBefore: fuelL,
        tankLitersAfter: input.tankCapacityL,
        tankPercentBefore: tankFraction(fuelL, input.tankCapacityL) * 100,
        tankPercentAfter: 100,
        cost: finalFillCost,
        rangeAfterKm: rangeKmFromLiters(
          input.tankCapacityL,
          input.consumptionL100,
        ),
        reasonLabel: "Terminer avec un réservoir plein",
        detourKm: 0,
        stationName: null,
        address: null,
        city: null,
        latitude: null,
        longitude: null,
        isEstimatedLocation: true,
      });
      fuelL = input.tankCapacityL;
      if (returnLeg) {
        returnLeg = {
          ...returnLeg,
          purchaseCost: returnLeg.purchaseCost + finalFillCost,
          stops: [...returnLeg.stops, ...finalStops],
        };
      } else {
        outbound.stops.push(...finalStops);
        outbound.purchaseCost += finalFillCost;
      }
    }
  }

  const totalDistanceKm = outbound.distanceKm + (returnLeg?.distanceKm ?? 0);
  const totalLitersConsumed =
    outbound.litersConsumed + (returnLeg?.litersConsumed ?? 0);
  const moneySpent =
    departureFillCost + enRouteFillCost + destinationFillCost + finalFillCost;

  const litersPurchased =
    departureLiters +
    outboundEnRoute.reduce((s, x) => s + x.litersAdded, 0) +
    destStops.reduce((s, x) => s + x.litersAdded, 0) +
    (returnLeg?.stops.reduce((s, x) => s + x.litersAdded, 0) ?? 0) +
    finalStops.reduce((s, x) => s + x.litersAdded, 0);

  const valuationPrice =
    litersPurchased > 1e-9
      ? moneySpent / litersPurchased
      : departurePrice > 0
        ? departurePrice
        : 0;

  let consumedFuelValue = totalLitersConsumed * valuationPrice;
  if (input.options.includeExistingFuelValue && departurePrice > 0) {
    const fromTank = Math.min(initialFuelL, totalLitersConsumed);
    const fromPurchases = Math.max(0, totalLitersConsumed - fromTank);
    consumedFuelValue =
      fromTank * departurePrice +
      fromPurchases * (valuationPrice || departurePrice);
  } else if (!input.options.includeExistingFuelValue) {
    // Valeur théorique de la conso au prix moyen d'achat / départ
    consumedFuelValue =
      totalLitersConsumed * (valuationPrice || departurePrice);
  }

  // Avoid double-counting final in return
  const uniqueStops =
    returnLeg && finalStops.length > 0
      ? [...outbound.stops, ...returnLeg.stops]
      : returnLeg
        ? [...outbound.stops, ...returnLeg.stops]
        : [...outbound.stops];

  let order = 0;
  for (const s of uniqueStops) {
    if (s.kind === "departure") s.order = 0;
    else s.order = ++order;
  }

  warnings.push(...outboundSim.warnings);

  return {
    feasible: true,
    failureMessage: null,
    tankCapacityL: input.tankCapacityL,
    consumptionL100: input.consumptionL100,
    reserveLiters: round3(reserveL),
    usableCapacityL: round3(usableCapacityL),
    usefulRangeKm: round2(usefulRangeKm),
    initialFuelL: round3(initialFuelL),
    fuelAfterDepartureRefillL: round3(fuelAfterDepartureRefillL),
    remainingFuelL: round3(fuelL),
    outbound: {
      ...outbound,
      litersConsumed: round3(outbound.litersConsumed),
      purchaseCost: round2(outbound.purchaseCost),
    },
    returnLeg: returnLeg
      ? {
          ...returnLeg,
          litersConsumed: round3(returnLeg.litersConsumed),
          purchaseCost: round2(returnLeg.purchaseCost),
        }
      : null,
    totalDistanceKm: round2(totalDistanceKm),
    totalLitersConsumed: round3(totalLitersConsumed),
    totalStopCount: uniqueStops.filter(
      (s) => s.litersAdded > 1e-9 || s.cost > 0,
    ).length,
    departureFillCost: round2(departureFillCost),
    enRouteFillCost: round2(enRouteFillCost),
    destinationFillCost: round2(destinationFillCost),
    finalFillCost: round2(finalFillCost),
    moneySpent: round2(moneySpent),
    consumedFuelValue: round2(consumedFuelValue),
    averagePurchasePrice: valuationPrice > 0 ? round3(valuationPrice) : null,
    refillStrategy: strategy,
    selectedStrategyLabel: strategyLabel(strategy),
    warnings: [...new Set(warnings)],
    simulation: outboundSim,
    allStops: uniqueStops,
  };
}

function makeDepartureStop(input: {
  label: string;
  initialFuelL: number;
  fuelAfter: number;
  liters: number;
  cost: number;
  pricePerLiter: number | null;
  source: string;
  granularity: CalculatedFillStop["priceGranularity"];
  reason: string;
  tankCapacityL: number;
  consumptionL100: number;
  outboundDistanceKm?: number;
}): CalculatedFillStop {
  return {
    id: "outbound-departure",
    leg: "outbound",
    kind: "departure",
    order: 0,
    distanceFromStartKm: 0,
    distanceRemainingKm: input.outboundDistanceKm ?? 0,
    positionLabel: input.label,
    regionLabel: null,
    pricePerLiter: input.pricePerLiter,
    priceSource: input.source,
    priceGranularity: input.granularity,
    pricePeriod: null,
    litersAdded: input.liters,
    tankLitersBefore: input.initialFuelL,
    tankLitersAfter: input.fuelAfter,
    tankPercentBefore:
      tankFraction(input.initialFuelL, input.tankCapacityL) * 100,
    tankPercentAfter: tankFraction(input.fuelAfter, input.tankCapacityL) * 100,
    cost: input.cost,
    rangeAfterKm: rangeKmFromLiters(input.fuelAfter, input.consumptionL100),
    reasonLabel: input.reason,
    detourKm: 0,
    stationName: null,
    address: null,
    city: null,
    latitude: null,
    longitude: null,
    isEstimatedLocation: false,
  };
}

function emptyFail(
  input: {
    outboundDistanceKm: number;
    consumptionL100: number;
    tankCapacityL: number;
    options: FuelEstimateInput;
  },
  reserveL: number,
  usableCapacityL: number,
  usefulRangeKm: number,
  initialFuelL: number,
  message: string,
  warnings: string[],
  fuelAfterDepartureRefillL?: number,
): TripFuelCalculationResult {
  const strategy = input.options.refillStrategy ?? "full_tank";
  return {
    feasible: false,
    failureMessage: message,
    tankCapacityL: input.tankCapacityL,
    consumptionL100: input.consumptionL100,
    reserveLiters: reserveL,
    usableCapacityL,
    usefulRangeKm,
    initialFuelL,
    fuelAfterDepartureRefillL: fuelAfterDepartureRefillL ?? initialFuelL,
    remainingFuelL: initialFuelL,
    outbound: {
      leg: "outbound",
      distanceKm: input.outboundDistanceKm,
      litersConsumed: 0,
      purchaseCost: 0,
      stops: [],
    },
    returnLeg: null,
    totalDistanceKm: input.outboundDistanceKm,
    totalLitersConsumed: 0,
    totalStopCount: 0,
    departureFillCost: 0,
    enRouteFillCost: 0,
    destinationFillCost: 0,
    finalFillCost: 0,
    moneySpent: 0,
    consumedFuelValue: 0,
    averagePurchasePrice: null,
    refillStrategy: strategy,
    selectedStrategyLabel: strategyLabel(strategy),
    warnings,
    simulation: null,
    allStops: [],
  };
}
