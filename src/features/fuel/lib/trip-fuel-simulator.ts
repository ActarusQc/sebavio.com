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
  type FuelStopReason,
  type SuggestedFuelStop,
  type TripFuelSimulationResult,
} from "@/features/fuel/lib/trip-fuel-types";

export type SimulateTripFuelInput = {
  totalDistanceKm: number;
  consumptionL100: number;
  tankCapacityL: number;
  candidates: FuelStopCandidate[];
  departurePricePerLiter: number | null;
  config: FuelSimulationConfig;
  /** Évite la récursion lors du calcul de la stratégie naïve comparable. */
  skipComparableSavings?: boolean;
  /** Niveau initial (défaut = réservoir plein). */
  initialFuelL?: number;
  /** Forcer un plein complet à chaque arrêt. */
  forceFullFills?: boolean;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function detourExtraCost(
  detourKm: number,
  consumptionL100: number,
  pricePerLiter: number,
): number {
  return litersForDistanceKm(detourKm, consumptionL100) * pricePerLiter;
}

function isDetourWorthIt(input: {
  candidate: FuelStopCandidate;
  referencePrice: number;
  consumptionL100: number;
  config: FuelSimulationConfig;
}): boolean {
  const { candidate, referencePrice, consumptionL100, config } = input;
  if (candidate.detourKm <= 0) return true;
  if (candidate.detourKm > config.maxDetourKm) return false;
  const advantage = referencePrice - candidate.pricePerLiter;
  // Dans le corridor : admissible même à prix égal (sinon la stratégie naïve
  // comparable exclut toutes les stations avec léger détour).
  if (advantage >= -config.minPriceAdvantagePerLiter / 2) return true;
  // Station plus chère + détour : exiger que l'économie (négative) ne s'applique pas —
  // on laisse le choix au filtre d'accessibilité / cheapest ; ici on refuse le détour inutile.
  const extra = detourExtraCost(
    candidate.detourKm,
    consumptionL100,
    candidate.pricePerLiter,
  );
  // Refuser un détour vers une station clairement plus chère
  return advantage * 40 > extra;
}

function cheapestIn(list: FuelStopCandidate[]): FuelStopCandidate | null {
  if (list.length === 0) return null;
  return list.reduce((best, c) => {
    if (c.pricePerLiter < best.pricePerLiter) return c;
    if (
      c.pricePerLiter === best.pricePerLiter &&
      c.distanceFromStartKm < best.distanceFromStartKm
    ) {
      return c;
    }
    return best;
  });
}

function priceConfidenceFrom(
  candidates: FuelStopCandidate[],
  stops: SuggestedFuelStop[],
): TripFuelSimulationResult["priceConfidence"] {
  if (candidates.length === 0) return "none";
  const sources =
    stops.length > 0
      ? stops.map((s) => s.granularity)
      : candidates.map((c) => c.granularity);
  if (sources.every((g) => g === "station")) return "high";
  if (sources.some((g) => g === "station")) return "medium";
  if (sources.some((g) => g === "regional")) return "low";
  return "none";
}

function ensureOriginCandidate(
  candidates: FuelStopCandidate[],
): FuelStopCandidate[] {
  if (candidates.length === 0) return candidates;
  const sorted = [...candidates].sort(
    (a, b) => a.distanceFromStartKm - b.distanceFromStartKm,
  );
  if (sorted[0]!.distanceFromStartKm <= 0.5) return sorted;
  const first = sorted[0]!;
  return [
    {
      ...first,
      id: `${first.id}-origin`,
      distanceFromStartKm: 0,
      detourKm: 0,
      label: first.label.includes("Départ")
        ? first.label
        : `Départ — ${first.label}`,
    },
    ...sorted,
  ];
}

/**
 * Simule le niveau de réservoir et optimise les arrêts de ravitaillement.
 * Moteur pur — aucune I/O.
 */
export function simulateTripFuel(
  input: SimulateTripFuelInput,
): TripFuelSimulationResult {
  const {
    totalDistanceKm,
    consumptionL100,
    tankCapacityL,
    candidates: rawCandidates,
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
  const initialFuelL = clamp(
    input.initialFuelL ?? tankCapacityL,
    0,
    tankCapacityL,
  );
  const forceFullFills = Boolean(input.forceFullFills);
  const totalConsumptionL = litersForDistanceKm(
    totalDistanceKm,
    consumptionL100,
  );
  const departurePrice = departurePricePerLiter ?? 0;
  // Ancien coût « toute conso × prix départ » — conservé seulement comme borne informative
  // si la comparaison équitable échoue ; remplacé ci-dessous quand possible.
  let naiveCostAtDeparturePrice = round2(totalConsumptionL * departurePrice);

  const base = (): Omit<
    TripFuelSimulationResult,
    "feasible" | "failureReason" | "warnings"
  > => ({
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
    naiveCostAtDeparturePrice,
    estimatedSavingsVsNaive: round2(naiveCostAtDeparturePrice),
    priceConfidence: "none",
    priceSourceSummary: "Aucune donnée",
    pricePeriodSummary: null,
    reserveLiters: round3(reserveL),
    reservePercent: round2(reservePercent),
    searchThresholdPercent: config.searchThresholdFraction * 100,
  });

  if (
    !(totalDistanceKm > 0) ||
    !(consumptionL100 > 0) ||
    !(tankCapacityL > 0)
  ) {
    return {
      ...base(),
      feasible: false,
      failureReason: "no_price_data",
      warnings: ["Paramètres véhicule / distance invalides."],
    };
  }

  if (reserveL >= tankCapacityL - 1e-6) {
    return {
      ...base(),
      feasible: false,
      failureReason: "unreachable",
      warnings: [
        "La réserve de sécurité dépasse ou égale la capacité du réservoir.",
      ],
    };
  }

  const priced = rawCandidates.filter(
    (c) => c.pricePerLiter > 0 && Number.isFinite(c.pricePerLiter),
  );
  const zones = ensureOriginCandidate(priced);

  let fuelL = initialFuelL;
  let litersPurchased = 0;
  let totalCost = 0;

  if (config.initialTankStrategy === "full_billed" && departurePrice > 0) {
    totalCost += round2(initialFuelL * departurePrice);
    litersPurchased += initialFuelL;
    warnings.push("Stratégie métier : plein initial facturé.");
  }

  if (zones.length === 0) {
    const safeRange = rangeKmFromLiters(
      usableFuelLiters(fuelL, reserveL),
      consumptionL100,
    );
    if (safeRange + 1e-6 >= totalDistanceKm) {
      const remaining = fuelL - totalConsumptionL;
      return {
        ...base(),
        remainingFuelL: round3(remaining),
        remainingFuelPercent: round2(
          tankFraction(remaining, tankCapacityL) * 100,
        ),
        litersPurchased: round3(litersPurchased),
        totalCostPurchased: round2(totalCost),
        estimatedSavingsVsNaive: round2(naiveCostAtDeparturePrice - totalCost),
        priceSourceSummary: "Aucune donnée de prix",
        feasible: true,
        failureReason: null,
        warnings: [
          "Aucune donnée de prix disponible — trajet réalisable avec le plein initial, coût d'achat = 0.",
        ],
      };
    }
    return {
      ...base(),
      feasible: false,
      failureReason: "no_price_data",
      warnings: [
        "Aucune donnée de prix disponible et autonomie insuffisante pour atteindre la destination.",
      ],
    };
  }

  const stops: SuggestedFuelStop[] = [];
  let km = 0;
  let prevStopKm = 0;
  let guard = 0;

  while (km < totalDistanceKm - 1e-6 && guard < 80) {
    guard += 1;
    const remainingKm = totalDistanceKm - km;
    const usable = usableFuelLiters(fuelL, reserveL);
    const safeRangeKm = rangeKmFromLiters(usable, consumptionL100);

    if (safeRangeKm + 1e-6 >= remainingKm) {
      fuelL -= litersForDistanceKm(remainingKm, consumptionL100);
      km = totalDistanceKm;
      break;
    }

    const deadlineKm = km + safeRangeKm;
    const fuelPct = tankFraction(fuelL, tankCapacityL);
    const room = tankCapacityL - fuelL;
    const searchActive = fuelPct <= config.searchThresholdFraction + 1e-9;
    // Distance avant que le réservoir descende sous 85 % (évite mini-pleins inutiles)
    const litersAbove85 = fuelL - tankCapacityL * 0.85;
    const kmUntilNotNearlyFull =
      litersAbove85 > 0 ? rangeKmFromLiters(litersAbove85, consumptionL100) : 0;

    const onRouteHere = zones.filter(
      (c) => c.detourKm <= 0 && Math.abs(c.distanceFromStartKm - km) <= 1,
    );
    const referencePrice =
      onRouteHere[0]?.pricePerLiter ??
      departurePrice ??
      zones[0]!.pricePerLiter;

    // Candidats strictement devant (ou ici s'il reste de la place dans le réservoir)
    let reachable = zones.filter((c) => {
      if (c.pricePerLiter <= 0) return false;
      const arrive = c.distanceFromStartKm;
      const drive = Math.max(0, arrive - km) + Math.max(0, c.detourKm);
      if (km + drive > deadlineKm + 1e-6) return false;
      if (arrive < km - 0.5) return false;
      if (arrive <= km + 0.5 && room < 1) return false; // déjà plein ici
      if (arrive <= km + 0.5 && !searchActive && room < tankCapacityL * 0.05) {
        return false;
      }
      return true;
    });

    // Filtre rentabilité du détour — seulement si des alternatives restent
    const worthIt = reachable.filter((c) =>
      isDetourWorthIt({
        candidate: c,
        referencePrice,
        consumptionL100,
        config,
      }),
    );
    if (worthIt.length > 0) {
      reachable = worthIt;
    }
    // Sinon : conserver toutes les stations accessibles (sécurité > prix)

    // Au-dessus du seuil 25 % : n'anticiper que si avantage de prix net
    // et seulement une fois le réservoir redescendu sous ~85 %
    if (!searchActive && reachable.length > 0) {
      const earlyAdvantageNeeded = config.minPriceAdvantagePerLiter * 2;
      const earlyMinKm = km + kmUntilNotNearlyFull;
      const advantageous = reachable.filter(
        (c) =>
          c.distanceFromStartKm >= earlyMinKm - 1e-6 &&
          referencePrice - c.pricePerLiter >= earlyAdvantageNeeded,
      );

      if (advantageous.length > 0) {
        reachable = advantageous;
      } else {
        const deferAfter = Math.max(earlyMinKm, km + safeRangeKm * 0.35);
        const deferred = reachable.filter(
          (c) => c.distanceFromStartKm >= deferAfter - 1e-6,
        );
        if (deferred.length > 0) {
          reachable = deferred;
        }
      }
    }

    if (reachable.length === 0) {
      return {
        ...base(),
        stops,
        litersPurchased: round3(litersPurchased),
        totalCostPurchased: round2(totalCost),
        remainingFuelL: round3(Math.max(0, fuelL)),
        remainingFuelPercent: round2(
          tankFraction(Math.max(0, fuelL), tankCapacityL) * 100,
        ),
        estimatedSavingsVsNaive: round2(naiveCostAtDeparturePrice - totalCost),
        feasible: false,
        failureReason: "unreachable",
        warnings: [
          ...warnings,
          "Impossible d'atteindre un prochain point de ravitaillement en respectant la réserve.",
        ],
      };
    }

    const target = cheapestIn(reachable)!;

    const fullTankRange = rangeKmFromLiters(
      usableFuelLiters(tankCapacityL, reserveL),
      consumptionL100,
    );
    const futureCheaper = zones.find(
      (c) =>
        c.distanceFromStartKm > target.distanceFromStartKm + 1e-6 &&
        c.distanceFromStartKm <=
          target.distanceFromStartKm + fullTankRange + 1e-6 &&
        c.pricePerLiter + config.minPriceAdvantagePerLiter <
          target.pricePerLiter &&
        isDetourWorthIt({
          candidate: c,
          referencePrice: target.pricePerLiter,
          consumptionL100,
          config,
        }),
    );

    const driveKm =
      Math.max(0, target.distanceFromStartKm - km) +
      Math.max(0, target.detourKm);
    const fuelBefore = fuelL - litersForDistanceKm(driveKm, consumptionL100);

    if (fuelBefore < reserveL - 0.05) {
      return {
        ...base(),
        stops,
        litersPurchased: round3(litersPurchased),
        totalCostPurchased: round2(totalCost),
        remainingFuelL: round3(Math.max(0, fuelBefore)),
        remainingFuelPercent: round2(
          tankFraction(Math.max(0, fuelBefore), tankCapacityL) * 100,
        ),
        estimatedSavingsVsNaive: round2(naiveCostAtDeparturePrice - totalCost),
        feasible: false,
        failureReason: "unreachable",
        warnings: [
          ...warnings,
          "L'arrêt choisi ferait passer sous la réserve de sécurité.",
        ],
      };
    }

    if (fuelBefore < -1e-6) {
      return failNegative(
        base,
        warnings,
        stops,
        litersPurchased,
        totalCost,
        fuelBefore,
        tankCapacityL,
      );
    }

    fuelL = fuelBefore;
    km = target.distanceFromStartKm;

    const remainingAfter = totalDistanceKm - km;
    const needToFinish =
      litersForDistanceKm(remainingAfter, consumptionL100) + reserveL;
    const roomNow = tankCapacityL - fuelL;

    let litersToBuy: number;
    let isFullFill: boolean;
    let reason: FuelStopReason;

    if (needToFinish <= fuelL + 1e-6) {
      litersToBuy = 0;
      isFullFill = false;
      reason = "none_before_destination";
    } else if (forceFullFills) {
      litersToBuy = roomNow;
      isFullFill = true;
      reason = "required_reserve";
    } else if (futureCheaper) {
      const toCheaper =
        futureCheaper.distanceFromStartKm -
        km +
        Math.max(0, futureCheaper.detourKm);
      const need = litersForDistanceKm(toCheaper, consumptionL100) + reserveL;
      litersToBuy = clamp(need - fuelL, 0, roomNow);
      isFullFill = litersToBuy >= roomNow - 0.05;
      reason = isFullFill ? "required_reserve" : "partial_before_cheaper";
    } else {
      const ahead = zones.filter(
        (c) =>
          c.distanceFromStartKm > km + 1e-6 &&
          c.distanceFromStartKm <= km + config.lookAheadKm + 1e-6,
      );
      const aheadMin = cheapestIn(ahead);
      const currentIsCheapest =
        aheadMin == null ||
        aheadMin.pricePerLiter >=
          target.pricePerLiter - config.minPriceAdvantagePerLiter / 2;

      if (currentIsCheapest) {
        litersToBuy = roomNow;
        isFullFill = true;
        reason =
          aheadMin != null && aheadMin.pricePerLiter > target.pricePerLiter
            ? "full_ahead_more_expensive"
            : fuelPct <= config.searchThresholdFraction
              ? "required_reserve"
              : "cheaper_than_ahead";
      } else {
        litersToBuy = clamp(needToFinish - fuelL, 0, roomNow);
        isFullFill = litersToBuy >= roomNow - 0.05;
        reason = isFullFill ? "required_reserve" : "partial_before_cheaper";
      }
    }

    if (litersToBuy <= 1e-6) {
      if (needToFinish > fuelL + 1e-6 && roomNow > 1e-6) {
        litersToBuy = clamp(Math.max(needToFinish - fuelL, 0.1), 0, roomNow);
        isFullFill = litersToBuy >= roomNow - 0.05;
        reason = "required_reserve";
      } else {
        // Impossible d'acheter ici : avancer vers la prochaine zone
        const nextZone = zones.find((c) => c.distanceFromStartKm > km + 0.5);
        if (!nextZone) {
          return {
            ...base(),
            stops,
            litersPurchased: round3(litersPurchased),
            totalCostPurchased: round2(totalCost),
            remainingFuelL: round3(Math.max(0, fuelL)),
            remainingFuelPercent: round2(
              tankFraction(Math.max(0, fuelL), tankCapacityL) * 100,
            ),
            estimatedSavingsVsNaive: null,
            feasible: false,
            failureReason: "unreachable",
            warnings: [
              ...warnings,
              "Impossible d'atteindre un prochain point de ravitaillement en respectant la réserve.",
            ],
          };
        }
        const nudge = Math.min(
          nextZone.distanceFromStartKm - km,
          Math.max(0.5, safeRangeKm * 0.1),
        );
        fuelL -= litersForDistanceKm(nudge, consumptionL100);
        km += nudge;
        if (fuelL < -1e-6) {
          return failNegative(
            base,
            warnings,
            stops,
            litersPurchased,
            totalCost,
            fuelL,
            tankCapacityL,
          );
        }
        continue;
      }
    }

    // Micro-arrêts : rejet si achat < min sauf nécessité de sécurité
    const isSafetyBuy =
      reason === "required_reserve" ||
      (needToFinish > fuelL + 1e-6 &&
        litersToBuy + 1e-9 >= needToFinish - fuelL - 0.05);
    if (
      litersToBuy + 1e-9 < config.minPurchaseL &&
      !isSafetyBuy &&
      fuelPct > config.searchThresholdFraction
    ) {
      const nextZone = zones.find((c) => c.distanceFromStartKm > km + 1);
      if (nextZone && nextZone.distanceFromStartKm <= deadlineKm) {
        const nudge = Math.min(
          nextZone.distanceFromStartKm - km,
          Math.max(1, safeRangeKm * 0.05),
        );
        fuelL -= litersForDistanceKm(nudge, consumptionL100);
        km += nudge;
        continue;
      }
    }

    // Arrêt facultatif : exiger économie nette vs prix de référence
    if (!isSafetyBuy && reason !== "required_reserve" && departurePrice > 0) {
      const priceDelta = departurePrice - target.pricePerLiter;
      const gross = priceDelta * litersToBuy;
      const detourCost = detourExtraCost(
        target.detourKm,
        consumptionL100,
        target.pricePerLiter,
      );
      const net = gross - detourCost;
      const lastOptional = [...stops]
        .reverse()
        .find((s) => s.reason !== "required_reserve");
      const intervalOk =
        !lastOptional ||
        km - lastOptional.distanceFromStartKm >=
          config.minOptionalStopIntervalKm - 1e-6;

      const optionalRejected =
        priceDelta < config.minPriceAdvantagePerLiter - 1e-9 ||
        net + 1e-9 < config.minNetSavingsCad ||
        !intervalOk;

      if (optionalRejected) {
        if (fuelPct <= config.searchThresholdFraction + 1e-9) {
          // Sous le seuil : forcer l'achat de sécurité
          litersToBuy = clamp(
            Math.max(needToFinish - fuelL, litersToBuy, config.minPurchaseL),
            0,
            roomNow,
          );
          isFullFill = litersToBuy >= roomNow - 0.05;
          reason = "required_reserve";
        } else {
          const forcedLater = zones.find(
            (c) =>
              c.distanceFromStartKm > km + 1 &&
              c.distanceFromStartKm <= deadlineKm,
          );
          if (forcedLater) {
            const nudge = Math.min(
              forcedLater.distanceFromStartKm - km,
              Math.max(1, safeRangeKm * 0.08),
            );
            fuelL -= litersForDistanceKm(nudge, consumptionL100);
            km += nudge;
            continue;
          }
          // Pas d'alternative : traiter comme requis
          litersToBuy = clamp(
            Math.max(needToFinish - fuelL, config.minPurchaseL),
            0,
            roomNow,
          );
          isFullFill = litersToBuy >= roomNow - 0.05;
          reason = "required_reserve";
        }
      }
    }

    const cost = round2(litersToBuy * target.pricePerLiter);
    const tankAfter = fuelL + litersToBuy;
    const loc = stationFieldsFromCandidate(target);
    stops.push({
      order: stops.length + 1,
      zoneId: target.id,
      positionLabel: positionLabelFromCandidate(target),
      regionLabel: target.regionLabel ?? null,
      distanceFromStartKm: round3(km),
      distanceFromPreviousStopKm: round3(km - prevStopKm),
      tankLitersBefore: round3(fuelL),
      tankPercentBefore: round2(tankFraction(fuelL, tankCapacityL) * 100),
      litersToBuy: round3(litersToBuy),
      isFullFill,
      pricePerLiter: round3(target.pricePerLiter),
      estimatedCost: cost,
      tankLitersAfter: round3(tankAfter),
      tankPercentAfter: round2(tankFraction(tankAfter, tankCapacityL) * 100),
      reason,
      reasonLabel: FUEL_STOP_REASON_LABELS[reason],
      detourKm: round3(target.detourKm),
      reserveLitersAtArrival: round3(fuelL - reserveL),
      granularity: target.granularity,
      pricePeriod: target.observedAt ?? null,
      source: target.source,
      sourceType: target.sourceType,
      isExactForStation: target.isExactForStation,
      priceIdentity: target.priceIdentity,
      stationName: loc.stationName,
      address: loc.address,
      city: loc.city,
      latitude: loc.latitude,
      longitude: loc.longitude,
      isEstimatedLocation: loc.isEstimatedLocation,
    });
    prevStopKm = km;
    fuelL = tankAfter;
    litersPurchased += litersToBuy;
    totalCost += cost;
  }

  if (km < totalDistanceKm - 1e-6) {
    return {
      ...base(),
      stops,
      litersPurchased: round3(litersPurchased),
      totalCostPurchased: round2(totalCost),
      remainingFuelL: round3(Math.max(0, fuelL)),
      remainingFuelPercent: round2(
        tankFraction(Math.max(0, fuelL), tankCapacityL) * 100,
      ),
      estimatedSavingsVsNaive: null,
      feasible: false,
      failureReason: "unreachable",
      warnings: [
        ...warnings,
        "Simulation interrompue avant la destination (boucle ou absence de points de ravitaillement).",
      ],
    };
  }

  if (fuelL < -1e-3) {
    return failNegative(
      base,
      warnings,
      stops,
      litersPurchased,
      totalCost,
      fuelL,
      tankCapacityL,
    );
  }

  fuelL = Math.max(0, fuelL);

  if (zones.some((z) => !z.isStationLevel)) {
    warnings.push(
      "Certains prix sont des estimations régionales — pas des stations garanties.",
    );
  }

  const avg = litersPurchased > 0 ? round3(totalCost / litersPurchased) : null;
  const periods = stops
    .map((s) => s.pricePeriod)
    .filter((p): p is string => Boolean(p));
  const sources = [...new Set(stops.map((s) => s.source).filter(Boolean))];
  if (sources.length === 0) sources.push(zones[0]!.source);

  let estimatedSavingsVsNaive: number | null = null;
  if (
    !input.skipComparableSavings &&
    departurePrice > 0 &&
    input.candidates.length > 0
  ) {
    const naive = simulateTripFuel({
      totalDistanceKm: input.totalDistanceKm,
      consumptionL100: input.consumptionL100,
      tankCapacityL: input.tankCapacityL,
      departurePricePerLiter: departurePrice,
      config: input.config,
      candidates: input.candidates.map((c) => ({
        ...c,
        pricePerLiter: departurePrice,
      })),
      skipComparableSavings: true,
    });
    if (naive.feasible) {
      naiveCostAtDeparturePrice = naive.totalCostPurchased;
      estimatedSavingsVsNaive = round2(naive.totalCostPurchased - totalCost);
    }
  }

  return {
    ...base(),
    remainingFuelL: round3(fuelL),
    remainingFuelPercent: round2(tankFraction(fuelL, tankCapacityL) * 100),
    litersPurchased: round3(litersPurchased),
    totalCostPurchased: round2(totalCost),
    averagePricePerLiter: avg,
    suggestedStopCount: stops.length,
    stops,
    naiveCostAtDeparturePrice,
    estimatedSavingsVsNaive,
    priceConfidence: priceConfidenceFrom(zones, stops),
    priceSourceSummary: sources.join(" · "),
    pricePeriodSummary: periods[0] ?? zones[0]?.observedAt ?? null,
    feasible: true,
    failureReason: null,
    warnings,
  };
}

function failNegative(
  base: () => Omit<
    TripFuelSimulationResult,
    "feasible" | "failureReason" | "warnings"
  >,
  warnings: string[],
  stops: SuggestedFuelStop[],
  litersPurchased: number,
  totalCost: number,
  fuelL: number,
  tankCapacityL: number,
): TripFuelSimulationResult {
  return {
    ...base(),
    stops,
    litersPurchased: round3(litersPurchased),
    totalCostPurchased: round2(totalCost),
    remainingFuelL: round3(Math.max(0, fuelL)),
    remainingFuelPercent: round2(
      tankFraction(Math.max(0, fuelL), tankCapacityL) * 100,
    ),
    estimatedSavingsVsNaive: round2(
      base().naiveCostAtDeparturePrice - totalCost,
    ),
    feasible: false,
    failureReason: "unreachable",
    warnings: [
      ...warnings,
      "Niveau de carburant projeté négatif — simulation interrompue.",
    ],
  };
}

/** Simulation depuis un niveau initial donné (plein non facturé ici). */
export function simulateTripFuelWithInitial(
  input: SimulateTripFuelInput & { initialFuelL: number },
): TripFuelSimulationResult {
  return simulateTripFuel(input);
}
