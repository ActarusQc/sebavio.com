/**
 * Sélection de la stratégie de ravitaillement la moins coûteuse.
 *
 * Méthode de comparaison du carburant final (documentée) :
 * niveau cible à destination = réserve minimale ;
 * coût net ajusté =
 *   coût_achats − max(0, restant − réserve) × prix_départ
 * Ainsi une stratégie qui arrive presque vide n'est pas favorisée,
 * et une qui conserve du carburant utile n'est pas pénalisée.
 *
 * Règle absolue : jamais recommander une stratégie plus chère que
 * la référence naïve comparable ; économie affichée ≥ 0.
 */

import type { FuelSimulationConfig } from "@/features/fuel/config/simulation";
import { optimizeFuelPlanDp } from "@/features/fuel/lib/fuel-plan-dp";
import {
  litersForDistanceKm,
  rangeKmFromLiters,
  tankFraction,
} from "@/features/fuel/lib/fuel-range-calculator";
import {
  effectiveReserveLiters,
  usableFuelLiters,
} from "@/features/fuel/lib/fuel-reserve-policy";
import { simulateTripFuel } from "@/features/fuel/lib/trip-fuel-simulator";
import {
  FUEL_STOP_REASON_LABELS,
  type FuelStopCandidate,
  type FuelStopReason,
  type SuggestedFuelStop,
  type TripFuelSimulationResult,
} from "@/features/fuel/lib/trip-fuel-types";

export type FuelStrategyId =
  | "departure_price"
  | "necessary_only"
  | "full_fills"
  | "partial_to_cheaper"
  | "anticipate_expensive"
  | "greedy_current"
  | "dp_global";

export type StrategyCandidateResult = {
  id: FuelStrategyId;
  label: string;
  simulation: TripFuelSimulationResult;
  /** Coût d'achats brut. */
  rawCost: number;
  /** Coût net après crédit du surplus vs réserve. */
  adjustedCost: number;
  valid: boolean;
  rejectionReasons: string[];
};

export type SelectBestFuelPlanResult = {
  selected: TripFuelSimulationResult;
  selectedStrategyId: FuelStrategyId;
  selectedStrategyLabel: string;
  /** true si aucune stratégie n'est moins chère que la naïve. */
  noAdvantageousOptimization: boolean;
  comparison: StrategyCandidateResult[];
  naiveAdjustedCost: number;
  realSavings: number;
};

const STRATEGY_LABELS: Record<FuelStrategyId, string> = {
  departure_price: "Ravitaillement au prix de départ",
  necessary_only: "Ravitaillement uniquement lorsque nécessaire",
  full_fills: "Plein complet à chaque arrêt nécessaire",
  partial_to_cheaper: "Achats partiels vers zone moins chère",
  anticipate_expensive: "Achats anticipés si prix suivants plus élevés",
  greedy_current: "Optimiseur glouton",
  dp_global: "Optimisation globale (DP)",
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Coût net comparable : crédit du carburant au-dessus de la réserve
 * valorisé au prix de départ.
 */
export function adjustedFuelCost(input: {
  totalCostPurchased: number;
  remainingFuelL: number;
  reserveLiters: number;
  departurePricePerLiter: number;
}): number {
  const surplus = Math.max(0, input.remainingFuelL - input.reserveLiters);
  return round2(
    input.totalCostPurchased - surplus * input.departurePricePerLiter,
  );
}

export function isSafetyStopReason(reason: FuelStopReason): boolean {
  return (
    reason === "required_reserve" ||
    reason === "unreachable" ||
    reason === "none_before_destination"
  );
}

/**
 * Filtre les micro-arrêts facultatifs non rentables.
 * Les arrêts de sécurité ne sont jamais supprimés.
 */
export function filterMicroStops(input: {
  stops: SuggestedFuelStop[];
  candidates: FuelStopCandidate[];
  consumptionL100: number;
  config: FuelSimulationConfig;
  departurePricePerLiter: number;
}): SuggestedFuelStop[] {
  const { stops, candidates, consumptionL100, config, departurePricePerLiter } =
    input;
  if (stops.length === 0) return stops;

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const kept: SuggestedFuelStop[] = [];
  let lastOptionalKm = -Infinity;

  for (const stop of stops) {
    const safety = isSafetyStopReason(stop.reason);
    const smallBuy = stop.litersToBuy + 1e-9 < config.minPurchaseL;

    if (safety) {
      kept.push(stop);
      continue;
    }

    if (smallBuy) {
      // Achat < min autorisé seulement si sécurité — déjà couvert
      continue;
    }

    const intervalOk =
      stop.distanceFromStartKm - lastOptionalKm >=
      config.minOptionalStopIntervalKm - 1e-6;

    const cand = byId.get(stop.zoneId);
    const refPrice = departurePricePerLiter;
    const priceDelta = refPrice - stop.pricePerLiter;
    if (priceDelta < config.minPriceAdvantagePerLiter - 1e-9) {
      // Pas d'avantage de prix suffisant pour un arrêt facultatif
      continue;
    }

    const gross = priceDelta * stop.litersToBuy;
    const detourKm = cand?.detourKm ?? stop.detourKm;
    const detourCost =
      litersForDistanceKm(detourKm, consumptionL100) * stop.pricePerLiter;
    const net = gross - detourCost;

    if (net + 1e-9 < config.minNetSavingsCad) continue;
    if (!intervalOk && kept.length > 0) continue;

    kept.push(stop);
    lastOptionalKm = stop.distanceFromStartKm;
  }

  return kept.map((s, i) => ({ ...s, order: i + 1 }));
}

/**
 * Valide qu'un plan respecte contraintes + cohérence des coûts.
 */
export function validateFuelPlan(input: {
  simulation: TripFuelSimulationResult;
  tankCapacityL: number;
  consumptionL100: number;
  totalDistanceKm: number;
  candidates: FuelStopCandidate[];
  config: FuelSimulationConfig;
}): { valid: boolean; reasons: string[] } {
  const {
    simulation: sim,
    tankCapacityL,
    consumptionL100,
    totalDistanceKm,
    candidates,
    config,
  } = input;
  const reasons: string[] = [];

  if (!sim.feasible) {
    reasons.push("Plan non réalisable.");
    return { valid: false, reasons };
  }
  if (sim.remainingFuelL < -1e-3) {
    reasons.push("Niveau négatif.");
  }
  if (sim.remainingFuelL + 1e-2 < sim.reserveLiters) {
    reasons.push("Réserve violée à destination.");
  }

  const ids = new Set(candidates.map((c) => c.id));
  let prevKm = 0;
  let fuel = sim.initialFuelL;

  for (const stop of sim.stops) {
    if (!ids.has(stop.zoneId) && !stop.zoneId.endsWith("-origin")) {
      // origin clone autorisé
      const base = stop.zoneId.replace(/-origin$/, "");
      if (!ids.has(base) && !ids.has(stop.zoneId)) {
        reasons.push(`Station inaccessible : ${stop.zoneId}`);
      }
    }
    if (stop.litersToBuy > tankCapacityL + 1e-6) {
      reasons.push("Achat supérieur à la capacité.");
    }
    if (stop.tankLitersAfter > tankCapacityL + 0.05) {
      reasons.push("Réservoir dépassé après achat.");
    }
    if (
      !isSafetyStopReason(stop.reason) &&
      stop.litersToBuy + 1e-9 < config.minPurchaseL
    ) {
      reasons.push("Micro-arrêt non justifié.");
    }
    const drive = Math.max(0, stop.distanceFromStartKm - prevKm);
    fuel -= litersForDistanceKm(drive, consumptionL100);
    if (fuel + 0.05 < sim.reserveLiters) {
      reasons.push("Réserve violée à un arrêt.");
    }
    fuel += stop.litersToBuy;
    prevKm = stop.distanceFromStartKm;
  }

  fuel -= litersForDistanceKm(
    Math.max(0, totalDistanceKm - prevKm),
    consumptionL100,
  );
  if (fuel + 0.05 < sim.reserveLiters) {
    reasons.push("Réserve finale incohérente après resimulation.");
  }

  const recomputed = sim.stops.reduce((s, st) => s + st.estimatedCost, 0);
  if (Math.abs(recomputed - sim.totalCostPurchased) > 0.05) {
    reasons.push("Coût incohérent vs somme des arrêts.");
  }

  if (
    sim.estimatedSavingsVsNaive != null &&
    sim.estimatedSavingsVsNaive < -0.01
  ) {
    reasons.push("Économie négative annoncée.");
  }

  return { valid: reasons.length === 0, reasons };
}

function simulateNecessaryOnly(
  input: Parameters<typeof simulateTripFuel>[0] & {
    mode: "necessary" | "full_fills";
  },
): TripFuelSimulationResult {
  // Réutilise le glouton puis force les achats : pour necessary on
  // désactive l'anticipation en relevant le seuil de recherche à 100 %
  // (sauf réserve) — ou full fills via post-traitement.
  if (input.mode === "necessary") {
    return simulateTripFuel({
      ...input,
      config: {
        ...input.config,
        // N'anticiper jamais : seuil très bas + avantage élevé
        searchThresholdFraction: 0.01,
        minPriceAdvantagePerLiter: 999,
        lookAheadKm: 1,
      },
      skipComparableSavings: true,
    });
  }

  const base = simulateTripFuel({
    ...input,
    config: {
      ...input.config,
      searchThresholdFraction: 0.01,
      minPriceAdvantagePerLiter: 999,
      lookAheadKm: 1,
    },
    skipComparableSavings: true,
  });
  if (!base.feasible) return base;

  // Transformer chaque arrêt en plein complet (re-simuler)
  const { totalDistanceKm, consumptionL100, tankCapacityL, config } = input;
  const reserveL = effectiveReserveLiters({
    tankCapacityL,
    consumptionL100,
    config,
  });
  let fuelL = tankCapacityL;
  let km = 0;
  let litersPurchased = 0;
  let totalCost = 0;
  const stops: SuggestedFuelStop[] = [];
  const candById = new Map(input.candidates.map((c) => [c.id, c] as const));

  for (const stop of base.stops) {
    const cand = candById.get(stop.zoneId);
    const detour = cand?.detourKm ?? stop.detourKm;
    const drive =
      Math.max(0, stop.distanceFromStartKm - km) + Math.max(0, detour);
    fuelL -= litersForDistanceKm(drive, consumptionL100);
    km = stop.distanceFromStartKm;
    const room = Math.max(0, tankCapacityL - fuelL);
    const buy = room;
    if (buy < 1e-6) continue;
    const price = stop.pricePerLiter;
    const cost = round2(buy * price);
    stops.push({
      ...stop,
      order: stops.length + 1,
      tankLitersBefore: round3(fuelL),
      tankPercentBefore: round2(tankFraction(fuelL, tankCapacityL) * 100),
      litersToBuy: round3(buy),
      isFullFill: true,
      estimatedCost: cost,
      tankLitersAfter: round3(fuelL + buy),
      tankPercentAfter: round2(tankFraction(fuelL + buy, tankCapacityL) * 100),
      reason: "required_reserve",
      reasonLabel: FUEL_STOP_REASON_LABELS.required_reserve,
      detourKm: round3(detour),
      reserveLitersAtArrival: round3(fuelL - reserveL),
    });
    fuelL += buy;
    litersPurchased += buy;
    totalCost += cost;
  }

  fuelL -= litersForDistanceKm(totalDistanceKm - km, consumptionL100);
  const feasible = fuelL + 0.05 >= reserveL && fuelL >= -1e-3;

  return {
    ...base,
    remainingFuelL: round3(Math.max(0, fuelL)),
    remainingFuelPercent: round2(
      tankFraction(Math.max(0, fuelL), tankCapacityL) * 100,
    ),
    litersPurchased: round3(litersPurchased),
    totalCostPurchased: round2(totalCost),
    averagePricePerLiter:
      litersPurchased > 0 ? round3(totalCost / litersPurchased) : null,
    suggestedStopCount: stops.length,
    stops,
    feasible,
    failureReason: feasible ? null : "unreachable",
    estimatedSavingsVsNaive: null,
  };
}

function applyMicroFilterToSim(
  sim: TripFuelSimulationResult,
  input: {
    candidates: FuelStopCandidate[];
    consumptionL100: number;
    tankCapacityL: number;
    totalDistanceKm: number;
    config: FuelSimulationConfig;
    departurePricePerLiter: number;
  },
): TripFuelSimulationResult {
  if (!sim.feasible || sim.stops.length === 0) return sim;

  const filtered = filterMicroStops({
    stops: sim.stops,
    candidates: input.candidates,
    consumptionL100: input.consumptionL100,
    config: input.config,
    departurePricePerLiter: input.departurePricePerLiter,
  });

  // Si on a retiré des arrêts, resimuler avec seulement ces stations forcées
  // en rejouant le glouton nécessaire sur les stations retenues + toutes
  // pour la sécurité — plus simple : recalculer coût/litres des stops filtrés
  // et vérifier faisabilité en rejouant la trajectoire.
  if (filtered.length === sim.stops.length) {
    return { ...sim, stops: filtered, suggestedStopCount: filtered.length };
  }

  const reserveL = sim.reserveLiters;
  let fuelL = input.tankCapacityL;
  let km = 0;
  let litersPurchased = 0;
  let totalCost = 0;
  const rebuilt: SuggestedFuelStop[] = [];
  let prevStopKm = 0;

  for (const stop of filtered) {
    const drive = Math.max(0, stop.distanceFromStartKm - km) + stop.detourKm;
    fuelL -= litersForDistanceKm(drive, input.consumptionL100);
    km = stop.distanceFromStartKm;
    if (fuelL + 0.05 < reserveL) {
      // Filtrage trop agressif — garder le plan original
      return sim;
    }
    const buy = stop.litersToBuy;
    rebuilt.push({
      ...stop,
      order: rebuilt.length + 1,
      tankLitersBefore: round3(fuelL),
      tankPercentBefore: round2(tankFraction(fuelL, input.tankCapacityL) * 100),
      tankLitersAfter: round3(fuelL + buy),
      tankPercentAfter: round2(
        tankFraction(fuelL + buy, input.tankCapacityL) * 100,
      ),
      distanceFromPreviousStopKm: round3(km - prevStopKm),
    });
    fuelL += buy;
    litersPurchased += buy;
    totalCost += stop.estimatedCost;
    prevStopKm = km;
  }

  fuelL -= litersForDistanceKm(
    input.totalDistanceKm - km,
    input.consumptionL100,
  );
  if (fuelL + 0.05 < reserveL) return sim;

  // Vérifier que les stations non retenues n'étaient pas nécessaires :
  // si l'autonomie entre arrêts filtrés dépasse la portée, abandonner le filtre
  return {
    ...sim,
    stops: rebuilt,
    suggestedStopCount: rebuilt.length,
    litersPurchased: round3(litersPurchased),
    totalCostPurchased: round2(totalCost),
    averagePricePerLiter:
      litersPurchased > 0 ? round3(totalCost / litersPurchased) : null,
    remainingFuelL: round3(Math.max(0, fuelL)),
    remainingFuelPercent: round2(
      tankFraction(Math.max(0, fuelL), input.tankCapacityL) * 100,
    ),
  };
}

export type SelectBestFuelPlanInput = {
  totalDistanceKm: number;
  consumptionL100: number;
  tankCapacityL: number;
  candidates: FuelStopCandidate[];
  departurePricePerLiter: number | null;
  config: FuelSimulationConfig;
};

export function selectBestFuelPlan(
  input: SelectBestFuelPlanInput,
): SelectBestFuelPlanResult {
  const departurePrice = input.departurePricePerLiter ?? 0;
  const baseInput = {
    totalDistanceKm: input.totalDistanceKm,
    consumptionL100: input.consumptionL100,
    tankCapacityL: input.tankCapacityL,
    candidates: input.candidates,
    departurePricePerLiter: input.departurePricePerLiter,
    config: input.config,
    skipComparableSavings: true as const,
  };

  const reserveL = effectiveReserveLiters({
    tankCapacityL: input.tankCapacityL,
    consumptionL100: input.consumptionL100,
    config: input.config,
  });

  const runners: Array<{
    id: FuelStrategyId;
    run: () => TripFuelSimulationResult;
  }> = [
    {
      id: "departure_price",
      run: () =>
        simulateTripFuel({
          ...baseInput,
          candidates: input.candidates.map((c) => ({
            ...c,
            pricePerLiter:
              departurePrice > 0 ? departurePrice : c.pricePerLiter,
          })),
        }),
    },
    {
      id: "necessary_only",
      run: () => simulateNecessaryOnly({ ...baseInput, mode: "necessary" }),
    },
    {
      id: "full_fills",
      run: () => simulateNecessaryOnly({ ...baseInput, mode: "full_fills" }),
    },
    {
      id: "partial_to_cheaper",
      run: () => simulateTripFuel(baseInput),
    },
    {
      id: "anticipate_expensive",
      run: () => simulateTripFuel(baseInput),
    },
    {
      id: "greedy_current",
      run: () => simulateTripFuel(baseInput),
    },
    {
      id: "dp_global",
      run: () => optimizeFuelPlanDp(baseInput),
    },
  ];

  const comparison: StrategyCandidateResult[] = [];

  for (const { id, run } of runners) {
    let sim: TripFuelSimulationResult;
    try {
      sim = run();
    } catch {
      comparison.push({
        id,
        label: STRATEGY_LABELS[id],
        simulation: {
          totalDistanceKm: input.totalDistanceKm,
          totalConsumptionL: 0,
          initialFuelL: input.tankCapacityL,
          remainingFuelL: 0,
          remainingFuelPercent: 0,
          litersPurchased: 0,
          totalCostPurchased: 0,
          averagePricePerLiter: null,
          suggestedStopCount: 0,
          stops: [],
          naiveCostAtDeparturePrice: 0,
          estimatedSavingsVsNaive: null,
          priceConfidence: "none",
          priceSourceSummary: "",
          pricePeriodSummary: null,
          reserveLiters: reserveL,
          reservePercent: 0,
          searchThresholdPercent: 0,
          feasible: false,
          failureReason: "unreachable",
          warnings: ["Échec d'évaluation."],
        },
        rawCost: Number.POSITIVE_INFINITY,
        adjustedCost: Number.POSITIVE_INFINITY,
        valid: false,
        rejectionReasons: ["Exception durant l'évaluation."],
      });
      continue;
    }

    if (id !== "departure_price") {
      sim = applyMicroFilterToSim(sim, {
        candidates: input.candidates,
        consumptionL100: input.consumptionL100,
        tankCapacityL: input.tankCapacityL,
        totalDistanceKm: input.totalDistanceKm,
        config: input.config,
        departurePricePerLiter: departurePrice,
      });
    }

    const validation = validateFuelPlan({
      simulation: sim,
      tankCapacityL: input.tankCapacityL,
      consumptionL100: input.consumptionL100,
      totalDistanceKm: input.totalDistanceKm,
      candidates: input.candidates,
      config: input.config,
    });

    const adj = adjustedFuelCost({
      totalCostPurchased: sim.totalCostPurchased,
      remainingFuelL: sim.remainingFuelL,
      reserveLiters: sim.reserveLiters,
      departurePricePerLiter: departurePrice,
    });

    comparison.push({
      id,
      label: STRATEGY_LABELS[id],
      simulation: sim,
      rawCost: sim.totalCostPurchased,
      adjustedCost: validation.valid ? adj : Number.POSITIVE_INFINITY,
      valid: validation.valid,
      rejectionReasons: validation.reasons,
    });
  }

  const naive = comparison.find((c) => c.id === "departure_price");
  const naiveAdjusted =
    naive && naive.valid ? naive.adjustedCost : Number.POSITIVE_INFINITY;

  const valid = comparison.filter(
    (c) => c.valid && Number.isFinite(c.adjustedCost),
  );

  // Ne jamais retenir une stratégie plus chère (coût net) que la naïve
  const eligible = valid.filter((c) => c.adjustedCost <= naiveAdjusted + 0.01);

  let winner: StrategyCandidateResult | undefined;
  if (eligible.length > 0) {
    // Préférer le coût net minimal ; à égalité, la référence naïve
    winner = eligible.reduce((best, c) => {
      if (c.adjustedCost < best.adjustedCost - 1e-9) return c;
      if (Math.abs(c.adjustedCost - best.adjustedCost) <= 0.01) {
        if (c.id === "departure_price") return c;
        if (best.id === "departure_price") return best;
      }
      return best;
    });
  } else if (naive?.valid) {
    winner = naive;
  } else if (valid.length > 0) {
    winner = valid.reduce((best, c) =>
      c.adjustedCost < best.adjustedCost - 1e-9 ? c : best,
    );
  }

  if (!winner) {
    const failed = simulateTripFuel(baseInput);
    return {
      selected: {
        ...failed,
        estimatedSavingsVsNaive: 0,
        naiveCostAtDeparturePrice: naive?.rawCost ?? 0,
        warnings: [
          ...failed.warnings,
          "Aucune stratégie réalisable pour cet itinéraire.",
        ],
        selectedStrategyId: "departure_price",
        selectedStrategyLabel: STRATEGY_LABELS.departure_price,
        noAdvantageousOptimization: true,
        strategyComparison: comparison.map(summarize),
      },
      selectedStrategyId: "departure_price",
      selectedStrategyLabel: STRATEGY_LABELS.departure_price,
      noAdvantageousOptimization: true,
      comparison,
      naiveAdjustedCost: naiveAdjusted,
      realSavings: 0,
    };
  }

  const savings = round2(Math.max(0, naiveAdjusted - winner.adjustedCost));
  const noAdvantage =
    winner.id === "departure_price" ||
    savings < 0.01 ||
    winner.adjustedCost >= naiveAdjusted - 0.01;

  // Si égalité ou pas d'avantage : retenir la naïve explicitement
  const finalWinner = noAdvantage && naive?.valid ? naive : winner;
  const finalSavings = noAdvantage
    ? 0
    : round2(Math.max(0, naiveAdjusted - finalWinner.adjustedCost));

  const selected: TripFuelSimulationResult = {
    ...finalWinner.simulation,
    naiveCostAtDeparturePrice: round2(
      naive?.rawCost ?? finalWinner.simulation.naiveCostAtDeparturePrice,
    ),
    estimatedSavingsVsNaive: finalSavings,
    selectedStrategyId: finalWinner.id,
    selectedStrategyLabel: STRATEGY_LABELS[finalWinner.id],
    noAdvantageousOptimization: finalSavings < 0.01,
    strategyComparison: comparison.map(summarize),
    warnings: [
      ...finalWinner.simulation.warnings,
      ...(finalSavings < 0.01
        ? [
            "Aucune stratégie moins coûteuse que le ravitaillement standard n’a été trouvée pour cet itinéraire.",
          ]
        : []),
    ],
  };

  return {
    selected,
    selectedStrategyId: finalWinner.id,
    selectedStrategyLabel: STRATEGY_LABELS[finalWinner.id],
    noAdvantageousOptimization: finalSavings < 0.01,
    comparison,
    naiveAdjustedCost: Number.isFinite(naiveAdjusted) ? naiveAdjusted : 0,
    realSavings: finalSavings,
  };
}

function summarize(c: StrategyCandidateResult) {
  return {
    id: c.id,
    label: c.label,
    rawCost: Number.isFinite(c.rawCost) ? round2(c.rawCost) : null,
    adjustedCost: Number.isFinite(c.adjustedCost)
      ? round2(c.adjustedCost)
      : null,
    valid: c.valid,
    stopCount: c.simulation.suggestedStopCount,
    remainingFuelL: c.simulation.remainingFuelL,
    rejectionReasons: c.rejectionReasons,
  };
}

/** Helper tests : portée sûre. */
export function canReachWithReserve(input: {
  fuelL: number;
  reserveL: number;
  distanceKm: number;
  consumptionL100: number;
}): boolean {
  const usable = usableFuelLiters(input.fuelL, input.reserveL);
  return (
    rangeKmFromLiters(usable, input.consumptionL100) + 1e-6 >= input.distanceKm
  );
}
