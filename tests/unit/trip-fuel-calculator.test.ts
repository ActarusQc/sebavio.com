/**
 * Tests du calculateur de pleins (argent dépensé vs consommé).
 */
import { describe, expect, it } from "vitest";
import {
  FUEL_SIMULATION_DEFAULTS,
  getFuelSimulationConfig,
} from "@/features/fuel/config/simulation";
import {
  calculateTripFuelPlan,
  resolveInitialFuelLiters,
} from "@/features/fuel/lib/trip-fuel-calculator";
import type { FuelStopCandidate } from "@/features/fuel/lib/trip-fuel-types";
import { fuelEstimateSchema } from "@/features/fuel/schemas";

const config = getFuelSimulationConfig({
  ...FUEL_SIMULATION_DEFAULTS,
  initialTankStrategy: "full_unbilled",
});

function zone(
  partial: Partial<FuelStopCandidate> &
    Pick<FuelStopCandidate, "id" | "distanceFromStartKm" | "pricePerLiter">,
): FuelStopCandidate {
  return {
    detourKm: 0,
    label: partial.label ?? `Zone ${partial.distanceFromStartKm}`,
    regionLabel: null,
    granularity: "station",
    source: "test",
    observedAt: "2026-07-01T00:00:00Z",
    attribution: null,
    isStationLevel: true,
    ...partial,
  };
}

const baseCandidates = [
  zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.65 }),
  zone({ id: "b", distanceFromStartKm: 400, pricePerLiter: 1.67 }),
  zone({ id: "c", distanceFromStartKm: 700, pricePerLiter: 1.7 }),
];

describe("resolveInitialFuelLiters", () => {
  it("plein / fractions / litres", () => {
    expect(
      resolveInitialFuelLiters({
        tankCapacityL: 50,
        initialFuel: { mode: "full" },
      }),
    ).toBe(50);
    expect(
      resolveInitialFuelLiters({
        tankCapacityL: 50,
        initialFuel: { mode: "half" },
      }),
    ).toBe(25);
    expect(
      resolveInitialFuelLiters({
        tankCapacityL: 50,
        initialFuel: { mode: "litres", value: 10 },
      }),
    ).toBe(10);
  });
});

describe("calculateTripFuelPlan", () => {
  it("1. plein initial automatique", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 100,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 10,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "half" },
        departureRefill: { mode: "automatic" },
        refillStrategy: "full_tank",
      }),
      outboundCandidates: baseCandidates,
      departurePricePerLiter: 1.65,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.departureFillCost).toBeCloseTo(25 * 1.65, 1);
    expect(r.moneySpent).toBeCloseTo(r.departureFillCost, 1);
  });

  it("2. plein initial manuel de 50 $", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 100,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 10,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "empty" },
        departureRefill: { mode: "manual_total", manualTotal: 50 },
        refillStrategy: "full_tank",
      }),
      outboundCandidates: baseCandidates,
      departurePricePerLiter: 1.65,
      config,
    });
    expect(r.departureFillCost).toBe(50);
    expect(r.moneySpent).toBeGreaterThanOrEqual(50);
  });

  it("3–4. trajet avec second plein → total ≥ 100 $", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 900,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 10,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "empty" },
        departureRefill: { mode: "manual_total", manualTotal: 50 },
        refillStrategy: "full_tank",
        reserve: { mode: "percentage", value: 15 },
      }),
      outboundCandidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.0 }),
        zone({ id: "b", distanceFromStartKm: 350, pricePerLiter: 1.0 }),
        zone({ id: "c", distanceFromStartKm: 700, pricePerLiter: 1.0 }),
      ],
      departurePricePerLiter: 1.0,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.departureFillCost).toBe(50);
    expect(r.enRouteFillCost).toBeGreaterThanOrEqual(50);
    expect(r.moneySpent).toBeGreaterThanOrEqual(100);
    expect(
      r.allStops.filter((s) => s.kind === "en_route").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("5. réservoir déjà plein au départ", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 200,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 10,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "full_tank",
      }),
      outboundCandidates: baseCandidates,
      departurePricePerLiter: 1.65,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.moneySpent).toBe(0);
    expect(r.departureFillCost).toBe(0);
  });

  it("6. coût consommé ≠ argent dépensé", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 200,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 10,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        includeExistingFuelValue: false,
        refillStrategy: "full_tank",
      }),
      outboundCandidates: baseCandidates,
      departurePricePerLiter: 1.75,
      config,
    });
    expect(r.moneySpent).toBe(0);
    expect(r.consumedFuelValue).toBeGreaterThan(0);
    expect(r.consumedFuelValue).not.toBe(r.moneySpent);
  });

  it("7–9. types carburant via schéma", () => {
    for (const fuelType of ["regular", "premium", "diesel"] as const) {
      const parsed = fuelEstimateSchema.parse({ fuelType });
      expect(parsed.fuelType).toBe(fuelType);
    }
  });

  it("10. aller simple", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 300,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 8.2,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "full_tank",
      }),
      outboundCandidates: baseCandidates,
      departurePricePerLiter: 1.65,
      config,
    });
    expect(r.returnLeg).toBeNull();
    expect(r.totalDistanceKm).toBe(300);
  });

  it("11–12. aller-retour (même distance ou différente)", () => {
    const same = calculateTripFuelPlan({
      outboundDistanceKm: 400,
      returnDistanceKm: null,
      includeReturnTrip: true,
      consumptionL100: 10,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "full_tank",
        includeReturnTrip: true,
      }),
      outboundCandidates: baseCandidates,
      departurePricePerLiter: 1.65,
      config,
    });
    expect(same.feasible).toBe(true);
    expect(same.returnLeg).not.toBeNull();
    expect(same.totalDistanceKm).toBeCloseTo(800, 0);

    const diff = calculateTripFuelPlan({
      outboundDistanceKm: 400,
      returnDistanceKm: 450,
      includeReturnTrip: true,
      consumptionL100: 10,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "full_tank",
        includeReturnTrip: true,
        returnDistanceKm: 450,
      }),
      outboundCandidates: baseCandidates,
      departurePricePerLiter: 1.65,
      config,
    });
    expect(diff.returnLeg?.distanceKm).toBe(450);
    expect(diff.totalDistanceKm).toBeCloseTo(850, 0);
  });

  it("13. plein complet à chaque arrêt", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 900,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 10,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "full_tank",
      }),
      outboundCandidates: baseCandidates,
      departurePricePerLiter: 1.65,
      config,
    });
    expect(r.feasible).toBe(true);
    const enRoute = r.allStops.filter((s) => s.kind === "en_route");
    expect(enRoute.length).toBeGreaterThan(0);
    expect(enRoute.every((s) => s.tankLitersAfter >= 49)).toBe(true);
  });

  it("14. quantité minimale nécessaire", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 900,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 10,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "required_only",
      }),
      outboundCandidates: baseCandidates,
      departurePricePerLiter: 1.65,
      config,
    });
    expect(r.feasible).toBe(true);
  });

  it("15. stratégie optimisée", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 900,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 10,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "optimized",
      }),
      outboundCandidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 2.0 }),
        zone({ id: "cheap", distanceFromStartKm: 200, pricePerLiter: 1.3 }),
        zone({ id: "b", distanceFromStartKm: 500, pricePerLiter: 2.0 }),
      ],
      departurePricePerLiter: 2.0,
      config,
    });
    expect(r.feasible).toBe(true);
  });

  it("16. réserve minimale", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 200,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 10,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        reserve: { mode: "percentage", value: 20 },
      }),
      outboundCandidates: baseCandidates,
      departurePricePerLiter: 1.65,
      config,
    });
    expect(r.reserveLiters).toBe(10);
    expect(r.remainingFuelL).toBeGreaterThanOrEqual(10 - 0.1);
  });

  it("17–18. plein destination et final", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 200,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 10,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillAtDestination: true,
        finishWithFullTank: true,
      }),
      outboundCandidates: baseCandidates,
      departurePricePerLiter: 1.65,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.remainingFuelL).toBeCloseTo(50, 0);
    expect(r.finalFillCost + r.destinationFillCost).toBeGreaterThan(0);
  });

  it("19–21. granularité prix candidates", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 900,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 10,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "full_tank",
      }),
      outboundCandidates: [
        zone({
          id: "a",
          distanceFromStartKm: 0,
          pricePerLiter: 1.5,
          granularity: "station",
          isStationLevel: true,
        }),
        zone({
          id: "b",
          distanceFromStartKm: 300,
          pricePerLiter: 1.6,
          granularity: "regional",
          isStationLevel: false,
          label: "Région",
        }),
        zone({
          id: "c",
          distanceFromStartKm: 600,
          pricePerLiter: 1.55,
          granularity: "station",
          isStationLevel: true,
        }),
      ],
      departurePricePerLiter: 1.5,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(
      r.allStops.some(
        (s) =>
          s.priceGranularity === "regional" || s.priceGranularity === "station",
      ),
    ).toBe(true);
  });

  it("22–23. schéma rejette sans valeur quand manuel requis", () => {
    const bad = fuelEstimateSchema.safeParse({
      departureRefill: { mode: "manual_total" },
    });
    expect(bad.success).toBe(false);
  });

  it("25. arrondis d'affichage (calculs internes précis)", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 100,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 8.2,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "empty" },
        departureRefill: { mode: "automatic" },
      }),
      outboundCandidates: baseCandidates,
      departurePricePerLiter: 1.699,
      config,
    });
    // 50 * 1.699 = 84.95
    expect(r.moneySpent).toBe(84.95);
  });
});
