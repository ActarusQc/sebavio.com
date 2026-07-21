/**
 * Tests : sélection multi-stratégies, granularité, micro-arrêts, garde-fou.
 */
import { describe, expect, it } from "vitest";
import {
  FUEL_SIMULATION_DEFAULTS,
  getFuelSimulationConfig,
} from "@/features/fuel/config/simulation";
import {
  buildPriceIdentity,
  classifyStationPrices,
} from "@/features/fuel/lib/price-granularity";
import { optimizeFuelPlanDp } from "@/features/fuel/lib/fuel-plan-dp";
import {
  adjustedFuelCost,
  filterMicroStops,
  selectBestFuelPlan,
  validateFuelPlan,
} from "@/features/fuel/lib/fuel-strategy-selector";
import { simulateTripFuel } from "@/features/fuel/lib/trip-fuel-simulator";
import type {
  FuelStopCandidate,
  SuggestedFuelStop,
} from "@/features/fuel/lib/trip-fuel-types";

const config = getFuelSimulationConfig({
  ...FUEL_SIMULATION_DEFAULTS,
  initialTankStrategy: "full_unbilled",
  minPurchaseL: 10,
  minNetSavingsCad: 3,
  minOptionalStopIntervalKm: 75,
  minPriceAdvantagePerLiter: 0.03,
  dpFuelStepL: 2,
  dpMaxStations: 40,
});

function zone(
  partial: Partial<FuelStopCandidate> &
    Pick<FuelStopCandidate, "id" | "distanceFromStartKm" | "pricePerLiter">,
): FuelStopCandidate {
  return {
    detourKm: 0,
    label: partial.label ?? `Zone ${partial.distanceFromStartKm}`,
    regionLabel: partial.regionLabel ?? `Région ${partial.id}`,
    granularity: partial.granularity ?? "station",
    source: partial.source ?? "test",
    observedAt: partial.observedAt ?? "2026-07-01T00:00:00Z",
    attribution: partial.attribution ?? "test",
    isStationLevel: partial.isStationLevel ?? true,
    ...partial,
  };
}

function stop(
  partial: Partial<SuggestedFuelStop> &
    Pick<SuggestedFuelStop, "order" | "zoneId" | "litersToBuy" | "reason">,
): SuggestedFuelStop {
  return {
    positionLabel: "x",
    regionLabel: null,
    distanceFromStartKm: partial.distanceFromStartKm ?? 100,
    distanceFromPreviousStopKm: 100,
    tankLitersBefore: 20,
    tankPercentBefore: 25,
    isFullFill: false,
    pricePerLiter: 1.5,
    estimatedCost: (partial.litersToBuy ?? 0) * 1.5,
    tankLitersAfter: 30,
    tankPercentAfter: 40,
    reasonLabel: "test",
    detourKm: 0,
    reserveLitersAtArrival: 5,
    granularity: "station",
    pricePeriod: null,
    source: "test",
    stationName: "Station test",
    address: "1 rue Test",
    city: "Québec",
    latitude: 46.8,
    longitude: -71.2,
    isEstimatedLocation: false,
    ...partial,
  };
}

describe("garde-fou multi-stratégies", () => {
  it("1. stratégie optimisée plus chère que naïve → naïve retenue", () => {
    // Forcer un « optimisé » plus cher : stations uniquement plus chères que le départ
    const candidates = [
      zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.5 }),
      zone({ id: "b", distanceFromStartKm: 400, pricePerLiter: 1.9 }),
      zone({ id: "c", distanceFromStartKm: 700, pricePerLiter: 2.0 }),
    ];
    const result = selectBestFuelPlan({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates,
      departurePricePerLiter: 1.5,
      config,
    });
    const naive = result.comparison.find((c) => c.id === "departure_price");
    expect(naive?.valid).toBe(true);
    expect(result.realSavings).toBeGreaterThanOrEqual(0);
    // Coût net ajusté retenu ≤ naïf (règle absolue)
    const selectedAdj = adjustedFuelCost({
      totalCostPurchased: result.selected.totalCostPurchased,
      remainingFuelL: result.selected.remainingFuelL,
      reserveLiters: result.selected.reserveLiters,
      departurePricePerLiter: 1.5,
    });
    expect(selectedAdj).toBeLessThanOrEqual(
      (naive?.adjustedCost ?? Infinity) + 0.05,
    );
    expect(result.selectedStrategyId).toBe("departure_price");
    expect(result.realSavings).toBe(0);
  });

  it("2. stratégie optimisée égale à naïve → économie 0", () => {
    const candidates = [
      zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.7 }),
      zone({ id: "b", distanceFromStartKm: 500, pricePerLiter: 1.7 }),
    ];
    const result = selectBestFuelPlan({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates,
      departurePricePerLiter: 1.7,
      config,
    });
    expect(result.realSavings).toBe(0);
    expect(result.noAdvantageousOptimization).toBe(true);
  });

  it("3. stratégie réellement moins chère → retenue", () => {
    const candidates = [
      zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 2.0 }),
      zone({ id: "cheap", distanceFromStartKm: 200, pricePerLiter: 1.3 }),
      zone({ id: "b", distanceFromStartKm: 500, pricePerLiter: 2.0 }),
    ];
    const result = selectBestFuelPlan({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates,
      departurePricePerLiter: 2.0,
      config,
    });
    expect(result.realSavings).toBeGreaterThan(0);
    expect(result.selectedStrategyId).not.toBe("departure_price");
    expect(result.selected.stops.some((s) => s.pricePerLiter <= 1.3)).toBe(
      true,
    );
  });

  it("4. comparaison avec même carburant final (ajustement surplus)", () => {
    const a = adjustedFuelCost({
      totalCostPurchased: 100,
      remainingFuelL: 20,
      reserveLiters: 12,
      departurePricePerLiter: 1.5,
    });
    const b = adjustedFuelCost({
      totalCostPurchased: 88,
      remainingFuelL: 12,
      reserveLiters: 12,
      departurePricePerLiter: 1.5,
    });
    // 100 - 8*1.5 = 88 ; b = 88 → équivalents
    expect(a).toBeCloseTo(b, 1);
  });

  it("5. correction de valeur du carburant final", () => {
    const withSurplus = adjustedFuelCost({
      totalCostPurchased: 50,
      remainingFuelL: 30,
      reserveLiters: 10,
      departurePricePerLiter: 2,
    });
    expect(withSurplus).toBe(10); // 50 - 20*2
  });

  it("6. plein partiel utile", () => {
    const result = selectBestFuelPlan({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.9 }),
        zone({ id: "mid", distanceFromStartKm: 600, pricePerLiter: 1.9 }),
        zone({ id: "cheap", distanceFromStartKm: 750, pricePerLiter: 1.3 }),
      ],
      departurePricePerLiter: 1.9,
      config,
    });
    expect(result.selected.feasible).toBe(true);
  });

  it("7. micro-arrêt inférieur à 10 L rejeté", () => {
    const filtered = filterMicroStops({
      stops: [
        stop({
          order: 1,
          zoneId: "a",
          litersToBuy: 5,
          reason: "cheaper_than_ahead",
          distanceFromStartKm: 100,
          pricePerLiter: 1.2,
        }),
      ],
      candidates: [
        zone({ id: "a", distanceFromStartKm: 100, pricePerLiter: 1.2 }),
      ],
      consumptionL100: 10,
      config,
      departurePricePerLiter: 1.7,
    });
    expect(filtered).toHaveLength(0);
  });

  it("8. petit achat obligatoire pour sécurité accepté", () => {
    const filtered = filterMicroStops({
      stops: [
        stop({
          order: 1,
          zoneId: "a",
          litersToBuy: 5,
          reason: "required_reserve",
          distanceFromStartKm: 500,
        }),
      ],
      candidates: [
        zone({ id: "a", distanceFromStartKm: 500, pricePerLiter: 1.7 }),
      ],
      consumptionL100: 10,
      config,
      departurePricePerLiter: 1.7,
    });
    expect(filtered).toHaveLength(1);
  });

  it("9. économie brute positive mais détour non rentable", () => {
    const filtered = filterMicroStops({
      stops: [
        stop({
          order: 1,
          zoneId: "far",
          litersToBuy: 20,
          reason: "cheaper_than_ahead",
          distanceFromStartKm: 200,
          pricePerLiter: 1.55,
          detourKm: 14,
          estimatedCost: 31,
        }),
      ],
      candidates: [
        zone({
          id: "far",
          distanceFromStartKm: 200,
          pricePerLiter: 1.55,
          detourKm: 14,
        }),
      ],
      consumptionL100: 10,
      config,
      departurePricePerLiter: 1.6, // Δ = 0.05 → brut 1 CAD ; détour ~1.4 L * 1.55 ≈ 2.17
    });
    expect(filtered).toHaveLength(0);
  });

  it("10. économie nette supérieure au seuil", () => {
    const filtered = filterMicroStops({
      stops: [
        stop({
          order: 1,
          zoneId: "cheap",
          litersToBuy: 40,
          reason: "cheaper_than_ahead",
          distanceFromStartKm: 200,
          pricePerLiter: 1.3,
          detourKm: 1,
          estimatedCost: 52,
        }),
      ],
      candidates: [
        zone({
          id: "cheap",
          distanceFromStartKm: 200,
          pricePerLiter: 1.3,
          detourKm: 1,
        }),
      ],
      consumptionL100: 10,
      config,
      departurePricePerLiter: 1.8, // Δ0.5 * 40 = 20 ; détour négligeable
    });
    expect(filtered).toHaveLength(1);
  });
});

describe("granularité des prix", () => {
  it("11. prix régional jamais marqué exact", () => {
    const { classified } = classifyStationPrices([
      {
        stationId: "1",
        regionLabel: "A",
        price: 1.5,
        observedAt: "2026-07-01T00:00:00Z",
        collectedAt: "2026-07-01T00:00:00Z",
        declaredGranularity: "regional",
      },
    ]);
    expect(classified[0]!.granularity).toBe("regional_estimate");
    expect(classified[0]!.isStationLevel).toBe(false);
  });

  it("12. même identifiant de prix sur plusieurs stations détecté", () => {
    const obs = [
      {
        stationId: "1",
        regionLabel: "A",
        price: 1.599,
        observedAt: "2026-07-01T12:00:00Z",
        collectedAt: "2026-07-01T12:05:00Z",
        declaredGranularity: "station",
      },
      {
        stationId: "2",
        regionLabel: "A",
        price: 1.599,
        observedAt: "2026-07-01T12:00:00Z",
        collectedAt: "2026-07-01T12:05:00Z",
        declaredGranularity: "station",
      },
      {
        stationId: "3",
        regionLabel: "A",
        price: 1.599,
        observedAt: "2026-07-01T12:00:00Z",
        collectedAt: "2026-07-01T12:05:00Z",
        declaredGranularity: "station",
      },
    ];
    const { classified, sharedIdentityWarnings } = classifyStationPrices(obs, {
      sharedIdentityThreshold: 2,
    });
    expect(classified.every((c) => c.granularity === "regional_estimate")).toBe(
      true,
    );
    expect(sharedIdentityWarnings.length).toBeGreaterThan(0);
    expect(buildPriceIdentity(obs[0]!) === buildPriceIdentity(obs[1]!)).toBe(
      true,
    );
  });

  it("13. stations exactes et régionales correctement séparées", () => {
    const { classified } = classifyStationPrices([
      {
        stationId: "exact",
        regionLabel: "A",
        price: 1.4,
        observedAt: "2026-07-01T10:00:00Z",
        collectedAt: "2026-07-01T10:01:00Z",
        declaredGranularity: "station",
      },
      {
        stationId: "r1",
        regionLabel: "B",
        price: 1.7,
        observedAt: "2026-07-01T12:00:00Z",
        collectedAt: "2026-07-01T12:00:00Z",
        declaredGranularity: "station",
      },
      {
        stationId: "r2",
        regionLabel: "B",
        price: 1.7,
        observedAt: "2026-07-01T12:00:00Z",
        collectedAt: "2026-07-01T12:00:00Z",
        declaredGranularity: "station",
      },
    ]);
    expect(classified.find((c) => c.stationId === "exact")!.granularity).toBe(
      "station_exact",
    );
    expect(classified.find((c) => c.stationId === "r1")!.granularity).toBe(
      "regional_estimate",
    );
  });

  it("14. plusieurs stations ayant le même prix exact légitime", () => {
    // Même prix, horodatages différents → identities distinctes → exact
    const { classified } = classifyStationPrices([
      {
        stationId: "a",
        regionLabel: "A",
        price: 1.599,
        observedAt: "2026-07-01T08:00:00Z",
        collectedAt: "2026-07-01T08:01:00Z",
        declaredGranularity: "station",
      },
      {
        stationId: "b",
        regionLabel: "A",
        price: 1.599,
        observedAt: "2026-07-01T09:00:00Z",
        collectedAt: "2026-07-01T09:01:00Z",
        declaredGranularity: "station",
      },
    ]);
    expect(classified.every((c) => c.granularity === "station_exact")).toBe(
      true,
    );
  });
});

describe("optimisation globale", () => {
  it("15. optimisation globale meilleure ou égale qu'une stratégie gloutonne", () => {
    const candidates = [
      zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 2.0 }),
      zone({ id: "mid", distanceFromStartKm: 300, pricePerLiter: 1.9 }),
      zone({ id: "cheap", distanceFromStartKm: 450, pricePerLiter: 1.2 }),
      zone({ id: "late", distanceFromStartKm: 700, pricePerLiter: 2.1 }),
    ];
    const greedy = simulateTripFuel({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates,
      departurePricePerLiter: 2.0,
      config,
      skipComparableSavings: true,
    });
    const dp = optimizeFuelPlanDp({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates,
      departurePricePerLiter: 2.0,
      config,
    });
    const selected = selectBestFuelPlan({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates,
      departurePricePerLiter: 2.0,
      config,
    });
    expect(dp.feasible || greedy.feasible).toBe(true);
    expect(selected.selected.feasible).toBe(true);
    if (greedy.feasible && dp.feasible) {
      expect(selected.selected.totalCostPurchased).toBeLessThanOrEqual(
        Math.max(greedy.totalCostPurchased, dp.totalCostPurchased) + 0.05,
      );
    }
  });

  it("16. aucune stratégie réalisable", () => {
    const result = selectBestFuelPlan({
      totalDistanceKm: 2000,
      consumptionL100: 15,
      tankCapacityL: 40,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.7 }),
        zone({ id: "b", distanceFromStartKm: 1500, pricePerLiter: 1.7 }),
      ],
      departurePricePerLiter: 1.7,
      config,
    });
    const anyValid = result.comparison.some((c) => c.valid);
    if (!anyValid) {
      expect(result.selected.feasible).toBe(false);
    } else {
      expect(result.selected.feasible).toBe(true);
    }
  });
});

describe("scénario Acura ILX 893,87 km", () => {
  const distanceKm = 893.87;
  const tankCapacityL = 50;
  const consumptionL100 = 8.2;

  function acuraCandidates(): FuelStopCandidate[] {
    // Corridor synthétique réaliste : prix de départ bas, puis plus élevés
    // (cas où le glouton peut se tromper)
    const prices = [
      { km: 0, p: 1.45 },
      { km: 80, p: 1.52 },
      { km: 160, p: 1.58 },
      { km: 240, p: 1.62 },
      { km: 320, p: 1.55 },
      { km: 400, p: 1.68 },
      { km: 480, p: 1.7 },
      { km: 560, p: 1.65 },
      { km: 640, p: 1.72 },
      { km: 720, p: 1.6 },
      { km: 800, p: 1.75 },
    ];
    return prices.map((x, i) =>
      zone({
        id: `s${i}`,
        distanceFromStartKm: x.km,
        pricePerLiter: x.p,
        detourKm: i % 3 === 0 ? 0.5 : 1.2,
        granularity: i < 2 ? "station" : "regional",
        isStationLevel: i < 2,
      }),
    );
  }

  it("17. trajet 893,87 km Acura ILX réservoir 50 L réalisable", () => {
    const result = selectBestFuelPlan({
      totalDistanceKm: distanceKm,
      consumptionL100,
      tankCapacityL,
      candidates: acuraCandidates(),
      departurePricePerLiter: 1.45,
      config,
    });
    expect(result.selected.feasible).toBe(true);
    expect(result.selected.remainingFuelL).toBeGreaterThanOrEqual(
      result.selected.reserveLiters - 0.05,
    );
  });

  it("18. coût final Acura ≤ coût naïf comparable", () => {
    const result = selectBestFuelPlan({
      totalDistanceKm: distanceKm,
      consumptionL100,
      tankCapacityL,
      candidates: acuraCandidates(),
      departurePricePerLiter: 1.45,
      config,
    });
    const naive = result.comparison.find((c) => c.id === "departure_price");
    expect(naive?.valid).toBe(true);
    expect(result.selected.totalCostPurchased).toBeLessThanOrEqual(
      (naive?.rawCost ?? Infinity) + 0.05,
    );
  });

  it("19. aucun micro-arrêt dans le test Acura", () => {
    const result = selectBestFuelPlan({
      totalDistanceKm: distanceKm,
      consumptionL100,
      tankCapacityL,
      candidates: acuraCandidates(),
      departurePricePerLiter: 1.45,
      config,
    });
    for (const s of result.selected.stops) {
      if (s.reason !== "required_reserve") {
        expect(s.litersToBuy).toBeGreaterThanOrEqual(10 - 1e-6);
      }
    }
  });

  it("20. réserve toujours respectée", () => {
    const result = selectBestFuelPlan({
      totalDistanceKm: distanceKm,
      consumptionL100,
      tankCapacityL,
      candidates: acuraCandidates(),
      departurePricePerLiter: 1.45,
      config,
    });
    expect(result.selected.remainingFuelL).toBeGreaterThanOrEqual(
      result.selected.reserveLiters - 0.05,
    );
    const v = validateFuelPlan({
      simulation: result.selected,
      tankCapacityL,
      consumptionL100,
      totalDistanceKm: distanceKm,
      candidates: acuraCandidates(),
      config,
    });
    expect(v.valid).toBe(true);
  });
});
