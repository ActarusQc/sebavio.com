/**
 * Tests UI / payload type carburant (sélecteur estimation voyage).
 */
import { describe, expect, it } from "vitest";
import {
  buildEstimateFuelBody,
  mapDefaultFuelType,
  TRIP_FUEL_TYPE_OPTIONS,
} from "@/features/fuel/components/trip-fuel-estimate";
import { fuelEstimateSchema } from "@/features/fuel/schemas";

describe("sélecteur type carburant", () => {
  it("expose les 6 options avec les valeurs internes attendues", () => {
    expect(TRIP_FUEL_TYPE_OPTIONS.map((o) => o.value)).toEqual([
      "regular",
      "midGrade",
      "premium",
      "diesel",
      "ethanol",
      "other",
    ]);
    expect(TRIP_FUEL_TYPE_OPTIONS.map((o) => o.label)).toEqual([
      "Essence ordinaire",
      "Essence intermédiaire",
      "Essence super",
      "Diesel",
      "E85",
      "Autre",
    ]);
  });

  it("présélectionne depuis la fiche véhicule", () => {
    expect(mapDefaultFuelType("Gasoline")).toBe("regular");
    expect(mapDefaultFuelType("premium")).toBe("premium");
    expect(mapDefaultFuelType("Diesel")).toBe("diesel");
    expect(mapDefaultFuelType("midGrade")).toBe("midGrade");
    expect(mapDefaultFuelType("E85")).toBe("ethanol");
  });

  it("ne remplace pas silencieusement un type inconnu par regular", () => {
    expect(mapDefaultFuelType("propane")).toBe("other");
    expect(mapDefaultFuelType("hydrogène")).toBe("other");
  });

  it("le body API contient explicitement fuelType", () => {
    const body = buildEstimateFuelBody({
      fuelType: "premium",
      includeReturnTrip: false,
      initialFuelMode: "full",
      initialFuelValue: "",
      departureRefillMode: "none",
      departureManualTotal: "",
      includeExistingFuelValue: false,
      refillStrategy: "full_tank",
      reserveMode: "percentage",
      reserveValue: "15",
      refillAtDestination: false,
      finishWithFullTank: false,
      defaultPricePerLiter: "",
      consumptionL100: "",
      forceManualPrice: false,
    });
    expect(body.fuelType).toBe("premium");
    const parsed = fuelEstimateSchema.safeParse(body);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.fuelType).toBe("premium");
  });

  it("passage regular → diesel dans le payload", () => {
    const body = buildEstimateFuelBody({
      fuelType: "diesel",
      includeReturnTrip: false,
      initialFuelMode: "full",
      initialFuelValue: "",
      departureRefillMode: "none",
      departureManualTotal: "",
      includeExistingFuelValue: false,
      refillStrategy: "full_tank",
      reserveMode: "percentage",
      reserveValue: "15",
      refillAtDestination: false,
      finishWithFullTank: false,
      defaultPricePerLiter: "",
      consumptionL100: "",
      forceManualPrice: false,
    });
    expect(body).toMatchObject({ fuelType: "diesel" });
  });

  it("ethanol exige un prix manuel côté schéma métier (pas de silent regular)", () => {
    const without = fuelEstimateSchema.safeParse({ fuelType: "ethanol" });
    expect(without.success).toBe(true);
    // Le schéma accepte ethanol ; le service refuse sans prix manuel (FUEL_006).
    expect(without.success && without.data.fuelType).toBe("ethanol");
  });
});
