import { describe, expect, it } from "vitest";
import {
  buildSourceKey,
  normalizeFuelType,
  normalizeSearchText,
  parseLocaleNumber,
  trimCell,
} from "@/features/fuel-vehicle-catalog/domain/normalize";
import { mapHeaders } from "@/features/fuel-vehicle-catalog/domain/columns";
import { validateCatalogRow } from "@/features/fuel-vehicle-catalog/domain/validate";
import type { NormalizedCatalogRow } from "@/features/fuel-vehicle-catalog/domain/types";

describe("normalizeSearchText / marques / modèles", () => {
  it("normalise accents et casse", () => {
    expect(normalizeSearchText("Toyota")).toBe("toyota");
    expect(normalizeSearchText("  Citroën  ")).toBe("citroen");
    expect(normalizeSearchText("RAV4 Hybrid")).toBe("rav4 hybrid");
  });
});

describe("parseLocaleNumber", () => {
  it("accepte point et virgule", () => {
    expect(parseLocaleNumber("8.5")).toBe(8.5);
    expect(parseLocaleNumber("8,5")).toBe(8.5);
    expect(parseLocaleNumber("2.5 (22.3 kWh/100 km)")).toBe(2.5);
  });

  it("convertit cellules vides en null", () => {
    expect(trimCell("")).toBeNull();
    expect(trimCell("n/a")).toBeNull();
    expect(parseLocaleNumber("")).toBeNull();
    expect(parseLocaleNumber(null)).toBeNull();
  });
});

describe("normalizeFuelType", () => {
  it("mappe les codes NRCan et libellés", () => {
    expect(normalizeFuelType("X")).toBe("regular");
    expect(normalizeFuelType("Z")).toBe("premium");
    expect(normalizeFuelType("D")).toBe("diesel");
    expect(normalizeFuelType("E")).toBe("ethanol");
    expect(normalizeFuelType("N")).toBe("natural_gas");
    expect(normalizeFuelType("regular gasoline")).toBe("regular");
    expect(normalizeFuelType("essence super")).toBe("premium");
    expect(normalizeFuelType("B", { isBev: true })).toBe("electric");
    expect(normalizeFuelType("Z", { isPhev: true })).toBe("plugin_hybrid");
    expect(normalizeFuelType(null, { modelName: "Prius Hybrid" })).toBe(
      "hybrid",
    );
  });
});

describe("buildSourceKey", () => {
  it("est déterministe", () => {
    const a = buildSourceKey({
      modelYear: 2022,
      makeNormalized: "toyota",
      modelNormalized: "rav4",
      configuration: "AS8 / 2.5L / 4cyl / X",
      engineSizeLitres: 2.5,
      cylinders: 4,
      transmissionCode: "AS8",
      fuelType: "X",
      vehicleClass: "SUV",
    });
    const b = buildSourceKey({
      modelYear: 2022,
      makeNormalized: "toyota",
      modelNormalized: "rav4",
      configuration: "AS8 / 2.5L / 4cyl / X",
      engineSizeLitres: 2.5,
      cylinders: 4,
      transmissionCode: "AS8",
      fuelType: "X",
      vehicleClass: "SUV",
    });
    expect(a).toBe(b);
    expect(a).toHaveLength(40);
  });
});

describe("mapHeaders FR/EN", () => {
  it("reconnaît les colonnes anglaises", () => {
    const map = mapHeaders([
      "Model year",
      "Make",
      "Model",
      "Vehicle class",
      "Engine size (L)",
      "Cylinders",
      "Transmission",
      "Fuel type",
      "City (L/100 km)",
      "Highway (L/100 km)",
      "Combined (L/100 km)",
      "Combined (mpg)",
      "CO2 emissions (g/km)",
      "CO2 rating",
      "Smog rating",
    ]);
    expect(map.get("modelYear")).toBe(0);
    expect(map.get("make")).toBe(1);
    expect(map.get("combinedL100")).toBe(10);
  });

  it("reconnaît les colonnes françaises", () => {
    const map = mapHeaders([
      "Année modèle",
      "Marque",
      "Modèle",
      "Catégorie de véhicule",
      "Cylindrée (L)",
      "Cylindres",
      "Transmission",
      "Type de carburant",
      "Ville (L/100 km)",
      "Route (L/100 km)",
      "Combinée (L/100 km)",
      "Combinée (mi/gal)",
      "Émissions de CO2 (g/km)",
      "Indice de CO2",
      "Indice de smog",
    ]);
    expect(map.get("modelYear")).toBe(0);
    expect(map.get("make")).toBe(1);
    expect(map.get("highwayL100")).toBe(9);
  });
});

function baseRow(
  overrides: Partial<NormalizedCatalogRow> = {},
): NormalizedCatalogRow {
  return {
    sourceKey: "abc",
    modelYear: 2022,
    make: "Toyota",
    makeNormalized: "toyota",
    model: "RAV4",
    modelNormalized: "rav4",
    configuration: null,
    vehicleClass: "SUV",
    engineSizeLitres: 2.5,
    cylinders: 4,
    transmission: "automatique",
    transmissionCode: "AS8",
    fuelType: "X",
    normalizedFuelType: "regular",
    cityConsumptionL100Km: 9,
    highwayConsumptionL100Km: 7.9,
    combinedConsumptionL100Km: 8.5,
    combinedMpg: 33,
    co2EmissionsGKm: 200,
    co2Rating: 5,
    smogRating: 5,
    electricConsumptionKwh100Km: null,
    electricRangeKm: null,
    sourceName: "Ressources naturelles Canada",
    sourceDataset: "test",
    sourceResourceUrl: null,
    sourceYear: 2022,
    rawData: {},
    ...overrides,
  };
}

describe("validateCatalogRow", () => {
  it("accepte conventionnel, hybride, PHEV, BEV", () => {
    expect(validateCatalogRow(baseRow(), 1)).toBeNull();
    expect(
      validateCatalogRow(
        baseRow({
          normalizedFuelType: "hybrid",
          model: "Camry Hybrid",
        }),
        2,
      ),
    ).toBeNull();
    expect(
      validateCatalogRow(
        baseRow({
          normalizedFuelType: "plugin_hybrid",
          electricRangeKm: 60,
          combinedConsumptionL100Km: 6.4,
        }),
        3,
      ),
    ).toBeNull();
    expect(
      validateCatalogRow(
        baseRow({
          normalizedFuelType: "electric",
          cityConsumptionL100Km: null,
          highwayConsumptionL100Km: null,
          combinedConsumptionL100Km: null,
          electricConsumptionKwh100Km: 18.7,
          electricRangeKm: 400,
        }),
        4,
      ),
    ).toBeNull();
  });

  it("rejette les lignes invalides", () => {
    expect(validateCatalogRow(baseRow({ make: "" }), 1)?.reason).toMatch(
      /Marque/,
    );
    expect(
      validateCatalogRow(
        baseRow({
          cityConsumptionL100Km: null,
          highwayConsumptionL100Km: null,
          combinedConsumptionL100Km: null,
        }),
        2,
      )?.reason,
    ).toMatch(/consommation/);
    expect(
      validateCatalogRow(baseRow({ combinedConsumptionL100Km: 99 }), 3)?.reason,
    ).toMatch(/aberrante/);
    expect(
      validateCatalogRow(baseRow({ normalizedFuelType: null }), 4)?.reason,
    ).toMatch(/carburant/);
  });
});
