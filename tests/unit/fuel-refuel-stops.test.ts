/**
 * Affichage / mapping des arrêts carburant détaillés.
 */
import { describe, expect, it } from "vitest";
import { calculateTripFuelPlan } from "@/features/fuel/lib/trip-fuel-calculator";
import type { FuelStopCandidate } from "@/features/fuel/lib/trip-fuel-types";
import { toCalculationDto } from "@/features/fuel/services/refuel-plan-mapper";
import { fuelEstimateSchema } from "@/features/fuel/schemas";
import {
  FUEL_SIMULATION_DEFAULTS,
  getFuelSimulationConfig,
} from "@/features/fuel/config/simulation";

const config = getFuelSimulationConfig({
  ...FUEL_SIMULATION_DEFAULTS,
  initialTankStrategy: "full_unbilled",
});

function zone(
  partial: Partial<FuelStopCandidate> &
    Pick<FuelStopCandidate, "id" | "distanceFromStartKm" | "pricePerLiter">,
): FuelStopCandidate {
  return {
    detourKm: partial.detourKm ?? 1.8,
    label: partial.label ?? `Station ${partial.id}`,
    regionLabel: partial.regionLabel ?? "Bas-Saint-Laurent",
    granularity: partial.granularity ?? "station",
    source: partial.source ?? "FDE",
    observedAt: "2026-07-01T00:00:00Z",
    attribution: null,
    isStationLevel: partial.isStationLevel ?? true,
    stationName:
      partial.stationName ?? partial.label ?? `Station ${partial.id}`,
    address: partial.address ?? "123, route 132",
    city: partial.city ?? "Rimouski",
    latitude: partial.latitude ?? 48.45,
    longitude: partial.longitude ?? -68.52,
    ...partial,
  };
}

describe("refuelStops DTO / affichage", () => {
  it("trajet sans arrêt en route", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 100,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 8,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "full_tank",
      }),
      outboundCandidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.6 }),
      ],
      departurePricePerLiter: 1.6,
      config,
    });
    const dto = toCalculationDto(r, "premium");
    expect(dto.outbound.refuelStops).toHaveLength(0);
    expect(dto.feasible).toBe(true);
  });

  it("trajet avec un arrêt — nom, adresse, prix, litres, coût, distance", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 800,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 8.2,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "full_tank",
      }),
      outboundCandidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.65 }),
        zone({
          id: "b",
          distanceFromStartKm: 486,
          pricePerLiter: 1.789,
          stationName: "Petro-Canada",
          address: "123, route 132",
          city: "Rimouski",
          latitude: 48.4,
          longitude: -68.5,
          detourKm: 1.8,
        }),
        zone({ id: "c", distanceFromStartKm: 700, pricePerLiter: 1.7 }),
      ],
      departurePricePerLiter: 1.65,
      config,
    });
    const dto = toCalculationDto(r, "premium");
    expect(dto.outbound.refuelStops.length).toBeGreaterThanOrEqual(1);
    const stop = dto.outbound.refuelStops[0]!;
    expect(stop.sequence).toBe(1);
    expect(Number(stop.distanceFromStartKm)).toBeGreaterThan(0);
    expect(stop.station?.name).toBeTruthy();
    expect(stop.station?.address).toBeTruthy();
    expect(stop.pricePerLiter).toBeTruthy();
    expect(Number(stop.litersAdded)).toBeGreaterThan(0);
    expect(Number(stop.cost)).toBeGreaterThan(0);
    expect(stop.fuelType).toBe("premium");
    expect(stop.station?.latitude).toBeTruthy();
    expect(stop.station?.longitude).toBeTruthy();
  });

  it("plusieurs arrêts numérotés", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 1200,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 10,
      tankCapacityL: 45,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "full_tank",
      }),
      outboundCandidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.6 }),
        zone({ id: "b", distanceFromStartKm: 350, pricePerLiter: 1.62 }),
        zone({ id: "c", distanceFromStartKm: 700, pricePerLiter: 1.61 }),
        zone({ id: "d", distanceFromStartKm: 1000, pricePerLiter: 1.63 }),
      ],
      departurePricePerLiter: 1.6,
      config,
    });
    const dto = toCalculationDto(r, "regular");
    expect(dto.outbound.refuelStops.length).toBeGreaterThanOrEqual(2);
    expect(dto.outbound.refuelStops.map((s) => s.sequence)).toEqual(
      dto.outbound.refuelStops.map((_, i) => i + 1),
    );
  });

  it("station estimée avec prix régional", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 800,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 8.2,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "full_tank",
      }),
      outboundCandidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.65 }),
        zone({
          id: "b",
          distanceFromStartKm: 486,
          pricePerLiter: 1.75,
          granularity: "regional",
          isStationLevel: false,
          stationName: "Station X",
          city: "Rimouski",
          label: "Station X (prix régional estimé)",
        }),
      ],
      departurePricePerLiter: 1.65,
      config,
    });
    const dto = toCalculationDto(r, "regular");
    const stop = dto.outbound.refuelStops[0];
    expect(stop).toBeTruthy();
    // Station réelle (nom + coords) : lieu non estimé, même si le prix est régional
    expect(stop!.isEstimatedLocation).toBe(false);
    expect(stop!.priceSource).toBe("regional_estimate");
  });

  it("séparation aller et retour", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 800,
      returnDistanceKm: 800,
      includeReturnTrip: true,
      consumptionL100: 8.2,
      tankCapacityL: 50,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "full_tank",
        includeReturnTrip: true,
      }),
      outboundCandidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.65 }),
        zone({ id: "b", distanceFromStartKm: 486, pricePerLiter: 1.7 }),
        zone({ id: "c", distanceFromStartKm: 700, pricePerLiter: 1.68 }),
      ],
      departurePricePerLiter: 1.65,
      config,
    });
    const dto = toCalculationDto(r, "regular");
    expect(dto.includeReturnTrip).toBe(true);
    expect(dto.returnLeg).not.toBeNull();
    expect(dto.outbound.refuelStops.every((s) => s.leg === "outbound")).toBe(
      true,
    );
    expect(dto.returnLeg!.refuelStops.every((s) => s.leg === "return")).toBe(
      true,
    );
    // Séquences redémarrent à 1 sur le retour
    if (dto.returnLeg!.refuelStops.length > 0) {
      expect(dto.returnLeg!.refuelStops[0]!.sequence).toBe(1);
    }
  });

  it("aucune station accessible → message explicite", () => {
    const r = calculateTripFuelPlan({
      outboundDistanceKm: 2000,
      returnDistanceKm: null,
      includeReturnTrip: false,
      consumptionL100: 12,
      tankCapacityL: 40,
      options: fuelEstimateSchema.parse({
        initialFuel: { mode: "full" },
        departureRefill: { mode: "none" },
        refillStrategy: "full_tank",
      }),
      outboundCandidates: [
        zone({ id: "a", distanceFromStartKm: 0, pricePerLiter: 1.65 }),
        // Un seul candidat trop loin pour l'autonomie utile
      ],
      departurePricePerLiter: 1.65,
      config,
    });
    expect(r.feasible).toBe(false);
    const dto = toCalculationDto(r, "regular");
    expect(dto.feasible).toBe(false);
    expect(dto.failureMessage).toMatch(/arrêt|autonomie|Impossible/i);
  });
});
