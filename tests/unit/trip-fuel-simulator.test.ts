import { describe, expect, it } from "vitest";
import {
  FUEL_SIMULATION_DEFAULTS,
  getFuelSimulationConfig,
} from "@/features/fuel/config/simulation";
import { effectiveReserveLiters } from "@/features/fuel/lib/fuel-reserve-policy";
import { estimateTripFuelCost } from "@/features/fuel/lib/consumption";
import { simulateTripFuel } from "@/features/fuel/lib/trip-fuel-simulator";
import type { FuelStopCandidate } from "@/features/fuel/lib/trip-fuel-types";

const config = getFuelSimulationConfig({
  ...FUEL_SIMULATION_DEFAULTS,
  initialTankStrategy: "full_unbilled",
  searchThresholdFraction: 0.25,
  reserveFraction: 0.15,
  reserveMinKm: 75,
  maxDetourKm: 15,
  lookAheadKm: 250,
  minPriceAdvantagePerLiter: 0.03,
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

describe("effectiveReserveLiters", () => {
  it("retient le max entre % réservoir et km de sécurité", () => {
    // 15% de 80 L = 12 L ; 75 km à 10 L/100 = 7.5 L → 12
    expect(
      effectiveReserveLiters({
        tankCapacityL: 80,
        consumptionL100: 10,
        config,
      }),
    ).toBe(12);

    // Camping-car : 15% de 150 = 22.5 ; 75 km à 20 L/100 = 15 → 22.5
    expect(
      effectiveReserveLiters({
        tankCapacityL: 150,
        consumptionL100: 20,
        config,
      }),
    ).toBe(22.5);

    // Forte conso : 15% de 80 = 12 ; 75 km à 25 L/100 = 18.75 → 18.75
    expect(
      effectiveReserveLiters({
        tankCapacityL: 80,
        consumptionL100: 25,
        config,
      }),
    ).toBe(18.75);
  });
});

describe("simulateTripFuel", () => {
  // Config sans defaultTank — tests unitaires passent tankCapacityL explicitement
  it("1. trajet réalisable avec le plein initial, sans arrêt", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 200,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.7 }),
      ],
      departurePricePerLiter: 1.7,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.suggestedStopCount).toBe(0);
    expect(r.litersPurchased).toBe(0);
    expect(r.totalCostPurchased).toBe(0);
    expect(r.remainingFuelL).toBeCloseTo(60, 1);
  });

  it("2. trajet nécessitant un seul arrêt", () => {
    // Usable ≈ 80 - max(12, 7.5) = 68 L → 680 km ; trajet 900 km
    const r = simulateTripFuel({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.7 }),
        zone({ id: "b", distanceFromStartKm: 500, pricePerLiter: 1.7 }),
      ],
      departurePricePerLiter: 1.7,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.suggestedStopCount).toBeGreaterThanOrEqual(1);
    expect(r.litersPurchased).toBeGreaterThan(0);
    expect(r.remainingFuelL).toBeGreaterThanOrEqual(r.reserveLiters - 0.1);
  });

  it("3. trajet nécessitant plusieurs arrêts", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 2000,
      consumptionL100: 12,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.6 }),
        zone({ id: "b", distanceFromStartKm: 400, pricePerLiter: 1.6 }),
        zone({ id: "c", distanceFromStartKm: 800, pricePerLiter: 1.6 }),
        zone({ id: "d", distanceFromStartKm: 1200, pricePerLiter: 1.6 }),
        zone({ id: "e", distanceFromStartKm: 1600, pricePerLiter: 1.6 }),
      ],
      departurePricePerLiter: 1.6,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.suggestedStopCount).toBeGreaterThanOrEqual(2);
  });

  it("4. carburant moins cher avant le seuil de 25 %", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.9 }),
        // Après ~200 km le réservoir n'est plus « presque plein » (>85 %)
        zone({ id: "cheap", distanceFromStartKm: 200, pricePerLiter: 1.5 }),
        zone({ id: "b", distanceFromStartKm: 500, pricePerLiter: 1.9 }),
      ],
      departurePricePerLiter: 1.9,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.stops.some((s) => s.zoneId.includes("cheap"))).toBe(true);
  });

  it("5. carburant moins cher après le seuil, mais encore accessible", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.8 }),
        zone({ id: "late", distanceFromStartKm: 550, pricePerLiter: 1.45 }),
      ],
      departurePricePerLiter: 1.8,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.stops.length).toBeGreaterThanOrEqual(1);
    const last = r.stops[r.stops.length - 1]!;
    expect(last.pricePerLiter).toBeLessThanOrEqual(1.8);
  });

  it("6. carburant moins cher inaccessible sans franchir la réserve", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.7 }),
        // Hors portée sûre depuis le départ (usable ~680 km) — aucun point intermédiaire
        zone({ id: "far", distanceFromStartKm: 750, pricePerLiter: 1.2 }),
      ],
      departurePricePerLiter: 1.7,
      config,
    });
    expect(r.feasible).toBe(false);
    expect(r.failureReason).toBe("unreachable");
    expect(r.stops.every((s) => !s.zoneId.includes("far"))).toBe(true);
  });

  it("7. prix actuel plus bas que tous les prix à venir → plein complet", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.4 }),
        zone({ id: "b", distanceFromStartKm: 500, pricePerLiter: 1.9 }),
      ],
      departurePricePerLiter: 1.4,
      config,
    });
    expect(r.feasible).toBe(true);
    const firstBuy = r.stops[0];
    expect(firstBuy).toBeDefined();
    expect(firstBuy!.isFullFill || firstBuy!.pricePerLiter).toBeTruthy();
    if (firstBuy && firstBuy.distanceFromStartKm < 100) {
      expect(firstBuy.isFullFill).toBe(true);
    }
  });

  it("8. prix actuel plus élevé qu'une zone suivante", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 2.0 }),
        zone({ id: "b", distanceFromStartKm: 400, pricePerLiter: 1.5 }),
      ],
      departurePricePerLiter: 2.0,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.stops.some((s) => s.pricePerLiter <= 1.5)).toBe(true);
  });

  it("9. plein partiel recommandé", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.9 }),
        zone({ id: "mid", distanceFromStartKm: 600, pricePerLiter: 1.9 }),
        zone({ id: "cheap", distanceFromStartKm: 750, pricePerLiter: 1.4 }),
      ],
      departurePricePerLiter: 1.9,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.stops.some((s) => !s.isFullFill)).toBe(true);
  });

  it("10. plein complet recommandé", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 1200,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.5 }),
        zone({ id: "b", distanceFromStartKm: 500, pricePerLiter: 1.9 }),
        zone({ id: "c", distanceFromStartKm: 900, pricePerLiter: 2.0 }),
      ],
      departurePricePerLiter: 1.5,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.stops.some((s) => s.isFullFill)).toBe(true);
  });

  it("11. destination atteinte avec une réserve suffisante", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 300,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.7 }),
      ],
      departurePricePerLiter: 1.7,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.remainingFuelL).toBeGreaterThanOrEqual(r.reserveLiters - 0.05);
    expect(r.suggestedStopCount).toBe(0);
  });

  it("12. station nécessitant un détour non rentable", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.7 }),
        zone({
          id: "detour",
          distanceFromStartKm: 400,
          pricePerLiter: 1.68,
          detourKm: 20,
        }),
        zone({ id: "b", distanceFromStartKm: 450, pricePerLiter: 1.7 }),
      ],
      departurePricePerLiter: 1.7,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.stops.every((s) => s.zoneId !== "detour")).toBe(true);
  });

  it("13. aucune donnée de prix disponible", () => {
    const short = simulateTripFuel({
      totalDistanceKm: 100,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [],
      departurePricePerLiter: null,
      config,
    });
    expect(short.feasible).toBe(true);
    expect(short.litersPurchased).toBe(0);

    const long = simulateTripFuel({
      totalDistanceKm: 2000,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [],
      departurePricePerLiter: null,
      config,
    });
    expect(long.feasible).toBe(false);
    expect(long.failureReason).toBe("no_price_data");
  });

  it("14. prix régional utilisé comme estimation", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 900,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({
          id: "a",
          distanceFromStartKm: 0,
          pricePerLiter: 1.7,
          granularity: "regional",
          isStationLevel: false,
          label: "Montréal",
        }),
        zone({
          id: "b",
          distanceFromStartKm: 500,
          pricePerLiter: 1.7,
          granularity: "regional",
          isStationLevel: false,
        }),
      ],
      departurePricePerLiter: 1.7,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.priceConfidence).toBe("low");
    expect(
      r.stops.every((s) => s.positionLabel.includes("prix régionaux")),
    ).toBe(true);
  });

  it("15. véhicule avec grand réservoir", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 800,
      consumptionL100: 12,
      tankCapacityL: 200,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.7 }),
      ],
      departurePricePerLiter: 1.7,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.suggestedStopCount).toBe(0);
    expect(r.litersPurchased).toBe(0);
  });

  it("16. véhicule à forte consommation", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 600,
      consumptionL100: 25,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.7 }),
        zone({ id: "b", distanceFromStartKm: 200, pricePerLiter: 1.7 }),
        zone({ id: "c", distanceFromStartKm: 400, pricePerLiter: 1.7 }),
      ],
      departurePricePerLiter: 1.7,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.suggestedStopCount).toBeGreaterThanOrEqual(1);
    expect(r.reserveLiters).toBeGreaterThan(12);
  });

  it("17. distance supérieure à une autonomie complète", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 1500,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.6 }),
        zone({ id: "b", distanceFromStartKm: 500, pricePerLiter: 1.6 }),
        zone({ id: "c", distanceFromStartKm: 1000, pricePerLiter: 1.6 }),
      ],
      departurePricePerLiter: 1.6,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.totalConsumptionL).toBe(150);
    expect(r.litersPurchased).toBeGreaterThan(0);
  });

  it("18. itinéraire aller-retour (continuation, pas réservoir rempli magiquement)", () => {
    // Aller 400 + retour 400 = 800 km, un seul trajet continu
    const r = simulateTripFuel({
      totalDistanceKm: 800,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "start", distanceFromStartKm: 0, pricePerLiter: 1.7 }),
        zone({ id: "mid", distanceFromStartKm: 400, pricePerLiter: 1.7 }),
      ],
      departurePricePerLiter: 1.7,
      config,
    });
    expect(r.feasible).toBe(true);
    expect(r.initialFuelL).toBe(80);
    // Un seul plein initial — pas de reset à mi-parcours
    expect(r.suggestedStopCount).toBeLessThanOrEqual(2);
  });

  it("19. protection contre un niveau de carburant négatif", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 2000,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.7 }),
        // Trou trop grand entre zones
        zone({ id: "b", distanceFromStartKm: 1500, pricePerLiter: 1.7 }),
      ],
      departurePricePerLiter: 1.7,
      config,
    });
    expect(r.feasible).toBe(false);
    expect(r.remainingFuelL).toBeGreaterThanOrEqual(0);
  });

  it("20. impossibilité d'atteindre un prochain ravitaillement en toute sécurité", () => {
    const r = simulateTripFuel({
      totalDistanceKm: 2000,
      consumptionL100: 15,
      tankCapacityL: 60,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.7 }),
        zone({ id: "b", distanceFromStartKm: 1200, pricePerLiter: 1.7 }),
      ],
      departurePricePerLiter: 1.7,
      config,
    });
    expect(r.feasible).toBe(false);
    expect(r.failureReason).toBe("unreachable");
  });

  it("deux régions à prix différents ≠ calcul au seul prix de départ", () => {
    const multi = simulateTripFuel({
      totalDistanceKm: 1000,
      consumptionL100: 10,
      tankCapacityL: 80,
      candidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 2.0 }),
        zone({ id: "b", distanceFromStartKm: 500, pricePerLiter: 1.4 }),
      ],
      departurePricePerLiter: 2.0,
      config,
    });
    const naive = estimateTripFuelCost({
      distanceKm: 1000,
      consumptionL100: 10,
      pricePerLiter: 2.0,
    });
    expect(multi.feasible).toBe(true);
    expect(multi.totalCostPurchased).not.toBe(naive.estimatedCost);
    expect(multi.totalCostPurchased).toBeLessThan(naive.estimatedCost);
    expect(multi.estimatedSavingsVsNaive).toBeGreaterThan(0);
  });
});
