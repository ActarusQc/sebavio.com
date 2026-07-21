/**
 * Optimisation globale des arrêts carburant (programmation dynamique).
 * État : (index station, niveau carburant discrétisé).
 * Objectif : coût d'achat minimal pour atteindre la destination
 * en respectant la réserve, avec niveau final cible = réserve.
 */

import type { FuelSimulationConfig } from "@/features/fuel/config/simulation";
import {
  litersForDistanceKm,
  rangeKmFromLiters,
  tankFraction,
} from "@/features/fuel/lib/fuel-range-calculator";
import {
  effectiveReserveLiters,
  usableFuelLiters,
} from "@/features/fuel/lib/fuel-reserve-policy";
import {
  FUEL_STOP_REASON_LABELS,
  positionLabelFromCandidate,
  stationFieldsFromCandidate,
  type FuelStopCandidate,
  type SuggestedFuelStop,
  type TripFuelSimulationResult,
} from "@/features/fuel/lib/trip-fuel-types";

export type OptimizeFuelPlanDpInput = {
  totalDistanceKm: number;
  consumptionL100: number;
  tankCapacityL: number;
  candidates: FuelStopCandidate[];
  departurePricePerLiter: number | null;
  config: FuelSimulationConfig;
};

type Node = FuelStopCandidate & { index: number };

type Pred = {
  prevI: number;
  prevF: number;
  buyL: number;
  stationId: string;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function bucket(fuelL: number, step: number): number {
  return Math.max(0, Math.round(fuelL / step));
}

function fromBucket(b: number, step: number): number {
  return b * step;
}

/**
 * Réduit les candidats : une station tous les ~bucketKm (la moins chère)
 * + les N moins chères globales + origine.
 */
export function sparsifyCandidatesForDp(
  candidates: FuelStopCandidate[],
  totalDistanceKm: number,
  maxStations: number,
): FuelStopCandidate[] {
  const priced = candidates
    .filter((c) => c.pricePerLiter > 0 && Number.isFinite(c.pricePerLiter))
    .filter((c) => c.detourKm <= 30)
    .sort((a, b) => a.distanceFromStartKm - b.distanceFromStartKm);

  if (priced.length <= maxStations) return priced;

  const bucketKm = Math.max(
    20,
    totalDistanceKm / Math.max(10, maxStations - 2),
  );
  const selected = new Map<string, FuelStopCandidate>();

  const origin = priced[0];
  if (origin) selected.set(origin.id, origin);

  for (let km = 0; km < totalDistanceKm; km += bucketKm) {
    const inBucket = priced.filter(
      (c) =>
        c.distanceFromStartKm >= km - 1e-6 &&
        c.distanceFromStartKm < km + bucketKm,
    );
    if (inBucket.length === 0) continue;
    const best = inBucket.reduce((a, b) =>
      a.pricePerLiter <= b.pricePerLiter ? a : b,
    );
    selected.set(best.id, best);
  }

  const rest = priced
    .filter((c) => !selected.has(c.id))
    .sort((a, b) => a.pricePerLiter - b.pricePerLiter);
  for (const c of rest) {
    if (selected.size >= maxStations) break;
    selected.set(c.id, c);
  }

  return [...selected.values()].sort(
    (a, b) => a.distanceFromStartKm - b.distanceFromStartKm,
  );
}

export function optimizeFuelPlanDp(
  input: OptimizeFuelPlanDpInput,
): TripFuelSimulationResult {
  const {
    totalDistanceKm,
    consumptionL100,
    tankCapacityL,
    candidates: raw,
    departurePricePerLiter,
    config,
  } = input;

  const warnings: string[] = [];
  const reserveL = effectiveReserveLiters({
    tankCapacityL,
    consumptionL100,
    config,
  });
  const reservePercent = tankFraction(reserveL, tankCapacityL) * 100;
  const initialFuelL = tankCapacityL;
  const totalConsumptionL = litersForDistanceKm(
    totalDistanceKm,
    consumptionL100,
  );
  const departurePrice = departurePricePerLiter ?? 0;
  const step = Math.max(1, config.dpFuelStepL);
  const maxF = bucket(tankCapacityL, step);

  const empty = (
    feasible: boolean,
    failureReason: TripFuelSimulationResult["failureReason"],
    extraWarnings: string[],
  ): TripFuelSimulationResult => ({
    totalDistanceKm,
    totalConsumptionL: round3(totalConsumptionL),
    initialFuelL: round3(initialFuelL),
    remainingFuelL: round3(initialFuelL),
    remainingFuelPercent: round2(
      tankFraction(initialFuelL, tankCapacityL) * 100,
    ),
    litersPurchased: 0,
    totalCostPurchased: 0,
    averagePricePerLiter: null,
    suggestedStopCount: 0,
    stops: [],
    naiveCostAtDeparturePrice: round2(totalConsumptionL * departurePrice),
    estimatedSavingsVsNaive: null,
    priceConfidence: "none",
    priceSourceSummary: "DP",
    pricePeriodSummary: null,
    reserveLiters: round3(reserveL),
    reservePercent: round2(reservePercent),
    searchThresholdPercent: config.searchThresholdFraction * 100,
    feasible,
    failureReason,
    warnings: [...warnings, ...extraWarnings],
  });

  if (
    !(totalDistanceKm > 0) ||
    !(consumptionL100 > 0) ||
    !(tankCapacityL > 0)
  ) {
    return empty(false, "no_price_data", ["Paramètres invalides."]);
  }
  if (reserveL >= tankCapacityL - 1e-6) {
    return empty(false, "unreachable", ["Réserve >= capacité."]);
  }

  const sparsified = sparsifyCandidatesForDp(
    raw,
    totalDistanceKm,
    config.dpMaxStations,
  );

  if (sparsified.length === 0) {
    const safe = rangeKmFromLiters(
      usableFuelLiters(initialFuelL, reserveL),
      consumptionL100,
    );
    if (safe + 1e-6 >= totalDistanceKm) {
      const remaining = initialFuelL - totalConsumptionL;
      return {
        ...empty(true, null, []),
        remainingFuelL: round3(remaining),
        remainingFuelPercent: round2(
          tankFraction(remaining, tankCapacityL) * 100,
        ),
      };
    }
    return empty(false, "no_price_data", ["Aucune station."]);
  }

  const nodes: Node[] = sparsified.map((c, index) => ({ ...c, index }));
  const destKm = totalDistanceKm;
  const destIndex = nodes.length; // nœud virtuel destination

  // dp[i][f] = min cost to ARRIVE at i with fuel bucket f (before buy)
  const INF = Number.POSITIVE_INFINITY;
  const dp: number[][] = Array.from({ length: destIndex + 1 }, () =>
    Array.from({ length: maxF + 1 }, () => INF),
  );
  const pred: (Pred | null)[][] = Array.from({ length: destIndex + 1 }, () =>
    Array.from({ length: maxF + 1 }, () => null),
  );

  // Départ : on « arrive » au premier nœud ≤ 0.5 km avec réservoir plein,
  // ou on démarre virtuellement à km=0 avec full tank.
  const startFuelB = bucket(initialFuelL, step);
  // Nœud virtuel de départ index -1 simulé : on peut rejoindre toute station
  // accessible depuis km=0 avec le plein.
  // Depuis le départ (plein), rejoindre toute station dans l'autonomie sûre
  for (let j = 0; j < nodes.length; j++) {
    const st = nodes[j]!;
    const drive =
      Math.max(0, st.distanceFromStartKm) + Math.max(0, st.detourKm);
    const need = litersForDistanceKm(drive, consumptionL100);
    const arrive = initialFuelL - need;
    if (arrive + 1e-6 < reserveL) continue;
    if (st.detourKm > config.maxDetourKm * 2) continue;
    const fb = bucket(arrive, step);
    if (fb > maxF) continue;
    if (0 < dp[j]![fb]!) {
      dp[j]![fb!] = 0;
      pred[j]![fb!] = {
        prevI: -1,
        prevF: startFuelB,
        buyL: 0,
        stationId: "__start__",
      };
    }
  }

  // Aussi : si on peut atteindre la destination sans arrêt
  {
    const need = litersForDistanceKm(destKm, consumptionL100);
    const arrive = initialFuelL - need;
    if (arrive + 1e-6 >= reserveL) {
      const fb = bucket(arrive, step);
      dp[destIndex]![Math.min(fb, maxF)]! = 0;
      pred[destIndex]![Math.min(fb, maxF)]! = {
        prevI: -1,
        prevF: startFuelB,
        buyL: 0,
        stationId: "__start__",
      };
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    const st = nodes[i]!;
    for (let f = 0; f <= maxF; f++) {
      const costArrive = dp[i]![f]!;
      if (!Number.isFinite(costArrive)) continue;
      const fuelArrive = fromBucket(f, step);
      if (fuelArrive + 1e-6 < reserveL) continue;

      const room = tankCapacityL - fuelArrive;
      // Options d'achat : 0, minPurchase, plein, pas de discrétisation
      const buyOptions = new Set<number>([0]);
      if (room > 1e-6) {
        buyOptions.add(round3(room));
        if (config.minPurchaseL < room) {
          buyOptions.add(round3(Math.min(config.minPurchaseL, room)));
        }
        for (let b = step; b < room; b += step) {
          buyOptions.add(round3(Math.min(room, b)));
        }
        // Assez pour atteindre la destination
        const needDest =
          litersForDistanceKm(
            Math.max(0, destKm - st.distanceFromStartKm),
            consumptionL100,
          ) + reserveL;
        if (needDest > fuelArrive) {
          buyOptions.add(round3(Math.min(room, needDest - fuelArrive)));
        }
      }

      for (const buyL of buyOptions) {
        if (buyL < -1e-9 || buyL > room + 1e-6) continue;
        const fuelAfter = fuelArrive + buyL;
        const costAfter = costArrive + buyL * st.pricePerLiter;

        // Vers stations suivantes
        for (let j = i + 1; j < nodes.length; j++) {
          const next = nodes[j]!;
          if (next.detourKm > config.maxDetourKm * 2) continue;
          const drive =
            Math.max(0, next.distanceFromStartKm - st.distanceFromStartKm) +
            Math.max(0, next.detourKm);
          // On ne compte le détour de la station courante qu'à l'arrivée
          const need = litersForDistanceKm(drive, consumptionL100);
          const arriveNext = fuelAfter - need;
          if (arriveNext + 1e-6 < reserveL) continue;
          const usable = usableFuelLiters(fuelAfter, reserveL);
          if (rangeKmFromLiters(usable, consumptionL100) + 1e-6 < drive) {
            continue;
          }
          const fb = bucket(arriveNext, step);
          if (fb > maxF) continue;
          if (costAfter + 1e-9 < dp[j]![fb]!) {
            dp[j]![fb!] = costAfter;
            pred[j]![fb!] = {
              prevI: i,
              prevF: f,
              buyL,
              stationId: st.id,
            };
          }
        }

        // Vers destination
        {
          const drive = Math.max(0, destKm - st.distanceFromStartKm);
          const need = litersForDistanceKm(drive, consumptionL100);
          const arriveDest = fuelAfter - need;
          if (arriveDest + 1e-6 >= reserveL) {
            const fb = bucket(arriveDest, step);
            const clamped = Math.min(fb, maxF);
            if (costAfter + 1e-9 < dp[destIndex]![clamped]!) {
              dp[destIndex]![clamped!] = costAfter;
              pred[destIndex]![clamped!] = {
                prevI: i,
                prevF: f,
                buyL,
                stationId: st.id,
              };
            }
          }
        }
      }
    }
  }

  // Meilleur coût à destination avec fuel >= reserve
  let bestCost = INF;
  let bestF = -1;
  for (let f = bucket(reserveL, step); f <= maxF; f++) {
    const c = dp[destIndex]![f]!;
    if (c < bestCost - 1e-9) {
      bestCost = c;
      bestF = f;
    }
  }

  if (bestF < 0 || !Number.isFinite(bestCost)) {
    return empty(false, "unreachable", [
      "DP : aucune trajectoire réalisable avec la réserve.",
    ]);
  }

  // Reconstruction des achats (de la fin vers le début)
  type BuyEvent = {
    station: Node;
    buyL: number;
    cost: number;
  };
  const buys: BuyEvent[] = [];
  let ci = destIndex;
  let cf = bestF;
  while (ci >= 0) {
    const p = pred[ci]![cf]!;
    if (!p || p.prevI < 0) break;
    if (p.buyL > 1e-6) {
      const st = nodes[p.prevI]!;
      buys.push({
        station: st,
        buyL: p.buyL,
        cost: p.buyL * st.pricePerLiter,
      });
    }
    ci = p.prevI;
    cf = p.prevF;
  }
  buys.reverse();

  // Resimulation linéaire pour produire les stops détaillés
  let fuelL = initialFuelL;
  let km = 0;
  let litersPurchased = 0;
  let totalCost = 0;
  const stops: SuggestedFuelStop[] = [];
  let prevStopKm = 0;

  for (const ev of buys) {
    const st = ev.station;
    const drive =
      Math.max(0, st.distanceFromStartKm - km) + Math.max(0, st.detourKm);
    fuelL -= litersForDistanceKm(drive, consumptionL100);
    km = st.distanceFromStartKm;
    if (fuelL < reserveL - 0.05) {
      return empty(false, "unreachable", ["DP resimulation : réserve violée."]);
    }
    const buyL = Math.min(ev.buyL, tankCapacityL - fuelL);
    if (buyL <= 1e-6) continue;
    const cost = round2(buyL * st.pricePerLiter);
    const isFullFill = buyL >= tankCapacityL - fuelL - 0.05;
    const loc = stationFieldsFromCandidate(st);
    stops.push({
      order: stops.length + 1,
      zoneId: st.id,
      positionLabel: positionLabelFromCandidate(st),
      regionLabel: st.regionLabel ?? null,
      distanceFromStartKm: round3(km),
      distanceFromPreviousStopKm: round3(km - prevStopKm),
      tankLitersBefore: round3(fuelL),
      tankPercentBefore: round2(tankFraction(fuelL, tankCapacityL) * 100),
      litersToBuy: round3(buyL),
      isFullFill,
      pricePerLiter: round3(st.pricePerLiter),
      estimatedCost: cost,
      tankLitersAfter: round3(fuelL + buyL),
      tankPercentAfter: round2(tankFraction(fuelL + buyL, tankCapacityL) * 100),
      reason: isFullFill
        ? "full_ahead_more_expensive"
        : "partial_before_cheaper",
      reasonLabel: isFullFill
        ? FUEL_STOP_REASON_LABELS.full_ahead_more_expensive
        : FUEL_STOP_REASON_LABELS.partial_before_cheaper,
      detourKm: round3(st.detourKm),
      reserveLitersAtArrival: round3(fuelL - reserveL),
      granularity: st.granularity,
      pricePeriod: st.observedAt ?? null,
      source: st.source,
      sourceType: st.sourceType,
      isExactForStation: st.isExactForStation,
      priceIdentity: st.priceIdentity,
      stationName: loc.stationName,
      address: loc.address,
      city: loc.city,
      latitude: loc.latitude,
      longitude: loc.longitude,
      isEstimatedLocation: loc.isEstimatedLocation,
    });
    fuelL += buyL;
    litersPurchased += buyL;
    totalCost += cost;
    prevStopKm = km;
  }

  // Fin trajet
  fuelL -= litersForDistanceKm(destKm - km, consumptionL100);
  km = destKm;
  if (fuelL < reserveL - 0.05 || fuelL < -1e-3) {
    return empty(false, "unreachable", [
      "DP resimulation : niveau final sous la réserve.",
    ]);
  }

  const avg = litersPurchased > 0 ? round3(totalCost / litersPurchased) : null;

  return {
    totalDistanceKm,
    totalConsumptionL: round3(totalConsumptionL),
    initialFuelL: round3(initialFuelL),
    remainingFuelL: round3(Math.max(0, fuelL)),
    remainingFuelPercent: round2(
      tankFraction(Math.max(0, fuelL), tankCapacityL) * 100,
    ),
    litersPurchased: round3(litersPurchased),
    totalCostPurchased: round2(totalCost),
    averagePricePerLiter: avg,
    suggestedStopCount: stops.length,
    stops,
    naiveCostAtDeparturePrice: round2(totalConsumptionL * departurePrice),
    estimatedSavingsVsNaive: null,
    priceConfidence: stops.some((s) => s.granularity === "station")
      ? "high"
      : "low",
    priceSourceSummary: "optimisation_globale_dp",
    pricePeriodSummary: stops[0]?.pricePeriod ?? null,
    reserveLiters: round3(reserveL),
    reservePercent: round2(reservePercent),
    searchThresholdPercent: config.searchThresholdFraction * 100,
    feasible: true,
    failureReason: null,
    warnings,
  };
}
