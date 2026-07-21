import { describe, expect, it } from "vitest";
import {
  getEffectiveVehicleSpecifications,
  hashVehicleFuelSpecs,
  parseDecimalInput,
  roundSpecDecimal,
} from "@/features/vehicles/lib/effective-specs";
import { resolveVehicleConsumption } from "@/features/fuel/lib/resolve-consumption";
import { resolveTankCapacity } from "@/features/fuel/lib/resolve-tank-capacity";
import { estimateTripFuelCost } from "@/features/fuel/lib/consumption";
import { buildTripVehicleSnapshot } from "@/features/vehicles/lib/trip-vehicle-snapshot";
import { vehicleUpdateSchema } from "@/features/vehicles/schemas";

describe("parseDecimalInput (virgule française)", () => {
  it("accepte 6,5 et 6.5", () => {
    expect(parseDecimalInput("6,5")).toBe(6.5);
    expect(parseDecimalInput("6.5")).toBe(6.5);
    expect(parseDecimalInput(" 6,50 ")).toBe(6.5);
  });
});

describe("getEffectiveVehicleSpecifications", () => {
  it("1. utilise la conso constructeur 8 sans override", () => {
    const specs = getEffectiveVehicleSpecifications({
      manufacturerConsumptionL100: 8,
      customConsumptionL100: null,
    });
    expect(specs.consumptionLPer100Km).toBe(8);
    expect(specs.consumption.source).toBe("manufacturer");
  });

  it("2. utilise la conso personnalisée 6.5", () => {
    const specs = getEffectiveVehicleSpecifications({
      manufacturerConsumptionL100: 8,
      customConsumptionL100: 6.5,
    });
    expect(specs.consumptionLPer100Km).toBe(6.5);
    expect(specs.consumption.source).toBe("user_override");
    expect(specs.consumption.manufacturerValue).toBe(8);
    expect(specs.consumption.customValue).toBe(6.5);
  });

  it("5. rétablir = custom null → constructeur", () => {
    const before = getEffectiveVehicleSpecifications({
      manufacturerConsumptionL100: 8,
      customConsumptionL100: 6.5,
    });
    expect(before.consumptionLPer100Km).toBe(6.5);
    const after = getEffectiveVehicleSpecifications({
      manufacturerConsumptionL100: 8,
      customConsumptionL100: null,
    });
    expect(after.consumptionLPer100Km).toBe(8);
    expect(after.consumption.source).toBe("manufacturer");
  });

  it("8. capacité réservoir personnalisée", () => {
    const specs = getEffectiveVehicleSpecifications({
      manufacturerTankCapacityL: 60,
      customTankCapacityL: 55,
    });
    expect(specs.tankCapacityLiters).toBe(55);
    expect(specs.tankCapacity.source).toBe("user_override");
  });

  it("9. type de carburant personnalisé", () => {
    const specs = getEffectiveVehicleSpecifications({
      manufacturerFuelType: "regular",
      customFuelType: "premium",
    });
    expect(specs.fuelType).toBe("premium");
    expect(specs.fuelTypeSpec.source).toBe("user_override");
  });
});

describe("resolveVehicleConsumption + coût", () => {
  it("priorise l'override utilisateur sur le catalogue", () => {
    const resolved = resolveVehicleConsumption({
      customConsumptionL100: 6.5,
      catalogAvgConsumption: 8,
      realAvgConsumption: 7.2,
      fullFillCount: 5,
    });
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.consumptionL100).toBe(6.5);
      expect(resolved.source).toBe("user_override");
    }
  });

  it("6. recalcul du coût total après modification", () => {
    const withManufacturer = estimateTripFuelCost({
      distanceKm: 500,
      consumptionL100: 8,
      pricePerLiter: 1.5,
    });
    const withCustom = estimateTripFuelCost({
      distanceKm: 500,
      consumptionL100: 6.5,
      pricePerLiter: 1.5,
    });
    expect(withCustom.estimatedCost).toBeLessThan(
      withManufacturer.estimatedCost,
    );
    expect(withCustom.litersNeeded).toBe(32.5);
  });

  it("14. même conso effective aller et retour", () => {
    const resolved = resolveVehicleConsumption({
      customConsumptionL100: 6.5,
      catalogAvgConsumption: 8,
    });
    expect(resolved.ok && resolved.consumptionL100).toBe(6.5);
    const outbound = estimateTripFuelCost({
      distanceKm: 200,
      consumptionL100: 6.5,
      pricePerLiter: 1.4,
    });
    const inbound = estimateTripFuelCost({
      distanceKm: 200,
      consumptionL100: 6.5,
      pricePerLiter: 1.4,
    });
    expect(outbound.litersNeeded).toBe(inbound.litersNeeded);
  });
});

describe("réservoir et validation", () => {
  it("capacité personnalisée borne le réservoir", () => {
    const tank = resolveTankCapacity({
      overrideL: 50,
      catalogEntryL: 60,
      legacyModelL: null,
    });
    expect(tank.ok && tank.capacityL).toBe(50);
    const initialFuelLiters = 50 * 0.5;
    expect(initialFuelLiters).toBe(25);
  });
});

describe("snapshot voyage terminé", () => {
  it("15. fige les specs effectives", () => {
    const snap = buildTripVehicleSnapshot({
      vehicleId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      currentOdometer: 120000,
      manufacturerConsumptionL100: 8,
      customConsumptionL100: 6.5,
      tankCapacityOverride: 55,
      manufacturerTankCapacityL: 60,
      manufacturerFuelType: "regular",
      customFuelType: "premium",
      fuelType: "premium",
    });
    expect(snap.consumptionLPer100Km).toBe(6.5);
    expect(snap.tankCapacityLiters).toBe(55);
    expect(snap.fuelType).toBe("premium");
    expect(snap.specsHash).toBe(
      hashVehicleFuelSpecs({
        consumptionLPer100Km: 6.5,
        tankCapacityLiters: 55,
        fuelType: "premium",
      }),
    );
  });
});

describe("validation schéma (virgule + bornes)", () => {
  it("3. accepte 6,5 via preprocess", () => {
    const result = vehicleUpdateSchema.safeParse({
      catalogEntryId: "11111111-1111-4111-8111-111111111111",
      customConsumptionL100: "6,5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customConsumptionL100).toBe(6.5);
    }
  });

  it("refuse conso hors bornes", () => {
    expect(
      vehicleUpdateSchema.safeParse({
        catalogEntryId: "11111111-1111-4111-8111-111111111111",
        customConsumptionL100: 0.5,
      }).success,
    ).toBe(false);
    expect(
      vehicleUpdateSchema.safeParse({
        catalogEntryId: "11111111-1111-4111-8111-111111111111",
        customConsumptionL100: 101,
      }).success,
    ).toBe(false);
  });

  it("arrondit à 2 décimales", () => {
    expect(roundSpecDecimal(6.555)).toBe(6.56);
  });
});

describe("11. pas d'écrasement catalogue global", () => {
  it("conserve manufacturerValue distinct de customValue", () => {
    const specs = getEffectiveVehicleSpecifications({
      manufacturerConsumptionL100: 8,
      customConsumptionL100: 6.5,
    });
    expect(specs.consumption.manufacturerValue).toBe(8);
    expect(specs.consumption.customValue).toBe(6.5);
  });
});
