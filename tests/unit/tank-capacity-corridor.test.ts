import { describe, expect, it } from "vitest";
import {
  FUEL_SIMULATION_DEFAULTS,
  getFuelSimulationConfig,
} from "@/features/fuel/config/simulation";
import { resolveTankCapacity } from "@/features/fuel/lib/resolve-tank-capacity";
import { estimateTripFuelCost } from "@/features/fuel/lib/consumption";
import { simulateTripFuel } from "@/features/fuel/lib/trip-fuel-simulator";
import type { FuelStopCandidate } from "@/features/fuel/lib/trip-fuel-types";
import { projectOntoRoute } from "@/features/fuel/services/route-price-zones";
import { dedupeWarnings } from "@/features/fuel/services/refuel-plan-mapper";

const config = getFuelSimulationConfig({
  ...FUEL_SIMULATION_DEFAULTS,
});

function zone(
  partial: Partial<FuelStopCandidate> &
    Pick<FuelStopCandidate, "id" | "distanceFromStartKm" | "pricePerLiter">,
): FuelStopCandidate {
  return {
    detourKm: 0,
    label: partial.label ?? `Zone ${partial.distanceFromStartKm}`,
    regionLabel: partial.regionLabel ?? `Région ${partial.id}`,
    granularity: partial.granularity ?? "regional",
    source: partial.source ?? "test",
    observedAt: partial.observedAt ?? "2026-07-01T00:00:00Z",
    attribution: partial.attribution ?? "test",
    isStationLevel: partial.isStationLevel ?? false,
    ...partial,
  };
}

describe("resolveTankCapacity", () => {
  it("1. capacité exacte catalogue", () => {
    const r = resolveTankCapacity({
      overrideL: null,
      catalogEntryL: 50,
      legacyModelL: null,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.capacityL).toBe(50);
      expect(r.source).toBe("catalog");
    }
  });

  it("2. capacité manuelle prioritaire", () => {
    const r = resolveTankCapacity({
      overrideL: 48.5,
      catalogEntryL: 50,
      legacyModelL: 55,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.capacityL).toBe(48.5);
      expect(r.source).toBe("user_manual");
      expect(r.confidence).toBe("high");
    }
  });

  it("3. sans capacité → missing", () => {
    const r = resolveTankCapacity({
      overrideL: null,
      catalogEntryL: null,
      legacyModelL: null,
    });
    expect(r.ok).toBe(false);
  });

  it("4. aucun fallback automatique à 80 L", () => {
    const r = resolveTankCapacity({
      overrideL: null,
      catalogEntryL: null,
      legacyModelL: null,
    });
    expect(r.ok).toBe(false);
    expect(
      "capacityL" in r ? (r as { capacityL?: number }).capacityL : undefined,
    ).toBeUndefined();
  });
});

describe("économie comparable", () => {
  it("18. bases cohérentes (même plein initial, achats au prix départ vs optimisé)", () => {
    const candidates = [
      zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 2.0 }),
      zone({ id: "b", distanceFromStartKm: 400, pricePerLiter: 1.4 }),
      zone({ id: "c", distanceFromStartKm: 700, pricePerLiter: 1.9 }),
    ];
    const optimized = simulateTripFuel({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 50,
      candidates,
      departurePricePerLiter: 2.0,
      config,
    });
    const unfairOld = estimateTripFuelCost({
      distanceKm: 900,
      consumptionL100: 10,
      pricePerLiter: 2.0,
    });
    expect(optimized.feasible).toBe(true);
    expect(optimized.estimatedSavingsVsNaive).not.toBeNull();
    // L'économie comparable ne doit PAS égaler (toute conso × prix départ − achats)
    const falseSavings = unfairOld.estimatedCost - optimized.totalCostPurchased;
    expect(optimized.estimatedSavingsVsNaive).not.toBeCloseTo(falseSavings, 0);
    expect(optimized.naiveCostAtDeparturePrice).toBeLessThanOrEqual(
      unfairOld.estimatedCost + 0.01,
    );
  });
});

describe("avertissements", () => {
  it("19. aucun doublon", () => {
    const w = dedupeWarnings([
      "Prix vieillissant — susceptibles de changer.",
      "Prix vieillissant — susceptibles de changer.",
      "Couverture faible",
    ]);
    expect(w).toEqual([
      "Prix vieillissant — susceptibles de changer.",
      "Couverture faible",
    ]);
  });
});

describe("non-régression Acura ILX ~894 km", () => {
  it("capacité réelle 50 L, plusieurs stations, pas de 80 L", () => {
    const distanceKm = 893.87;
    const consumptionL100 = 8.2;
    const tankL = 50; // saisie manuelle / constructeur — pas 80
    const stations: FuelStopCandidate[] = [];
    for (let km = 0; km <= 850; km += 40) {
      const regionPrice =
        km < 200 ? 1.72 : km < 500 ? 1.58 : km < 700 ? 1.79 : 1.85;
      stations.push(
        zone({
          id: `s-${km}`,
          distanceFromStartKm: km,
          pricePerLiter: regionPrice,
          granularity: km % 120 === 0 ? "station" : "regional",
          isStationLevel: km % 120 === 0,
          regionLabel:
            km < 200
              ? "Montréal"
              : km < 500
                ? "Mauricie"
                : km < 700
                  ? "Bas-Saint-Laurent"
                  : "Gaspésie",
        }),
      );
    }

    const r = simulateTripFuel({
      totalDistanceKm: distanceKm,
      consumptionL100,
      tankCapacityL: tankL,
      candidates: stations,
      departurePricePerLiter: 1.72,
      config,
    });

    expect(r.feasible).toBe(true);
    expect(r.initialFuelL).toBe(50);
    expect(r.initialFuelL).not.toBe(80);
    expect(stations.length).toBeGreaterThan(10);
    expect(r.suggestedStopCount).toBeGreaterThanOrEqual(1);
    expect(r.litersPurchased).toBeGreaterThan(8.2);
    expect(r.estimatedSavingsVsNaive).not.toBeNull();
    // Ancienne fausse économie (~133 $) ne doit pas réapparaître
    const falseEconomy =
      estimateTripFuelCost({
        distanceKm,
        consumptionL100,
        pricePerLiter: 1.72,
      }).estimatedCost - r.totalCostPurchased;
    expect(r.estimatedSavingsVsNaive!).toBeLessThan(falseEconomy - 20);
  });

  it("20. incapacité sans capacité réservoir (résolution)", () => {
    expect(
      resolveTankCapacity({
        overrideL: null,
        catalogEntryL: null,
        legacyModelL: null,
      }).ok,
    ).toBe(false);
  });
});

describe("projectOntoRoute", () => {
  it("projette une station hors tracé", () => {
    const path = [
      { lat: 45.5, lng: -73.6 },
      { lat: 46.0, lng: -73.0 },
      { lat: 46.8, lng: -71.2 },
    ];
    const p = projectOntoRoute({
      station: { lat: 46.01, lng: -73.01 },
      path,
      totalDistanceKm: 300,
    });
    expect(p.perpendicularKm).toBeLessThan(5);
    expect(p.distanceFromStartKm).toBeGreaterThan(0);
    expect(p.distanceFromStartKm).toBeLessThan(300);
  });
});

describe("legacy model capacity", () => {
  it("utilise vehicle_models.fuelCapacityL", () => {
    const r = resolveTankCapacity({
      overrideL: null,
      catalogEntryL: null,
      legacyModelL: 65,
    });
    expect(r.ok && r.source).toBe("legacy_model");
    expect(r.ok && r.capacityL).toBe(65);
  });
});
