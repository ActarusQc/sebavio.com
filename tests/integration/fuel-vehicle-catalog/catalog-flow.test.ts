import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  listCatalogConfigurations,
  listCatalogMakes,
  listCatalogModels,
  listCatalogYears,
} from "@/features/fuel-vehicle-catalog/application/search-service";
import { upsertCatalogBatch } from "@/features/fuel-vehicle-catalog/infrastructure/repository";
import type { NormalizedCatalogRow } from "@/features/fuel-vehicle-catalog/domain/types";
import { resolveVehicleConsumption } from "@/features/fuel/lib/resolve-consumption";
import { estimateTripFuelCost } from "@/features/fuel/lib/consumption";

const SOURCE_KEY_A = `test-nrcan-${randomUUID().slice(0, 8)}`;
const SOURCE_KEY_B = `test-nrcan-${randomUUID().slice(0, 8)}`;
let entryId: string | null = null;
let userId: string | null = null;
let vehicleId: string | null = null;

function row(
  sourceKey: string,
  overrides: Partial<NormalizedCatalogRow> = {},
): NormalizedCatalogRow {
  return {
    sourceKey,
    modelYear: 2022,
    make: "Toyota",
    makeNormalized: "toyota",
    model: "RAV4 AWD",
    modelNormalized: "rav4 awd",
    configuration: "AS8 / 2.5L / 4cyl / X",
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
    co2EmissionsGKm: 199,
    co2Rating: 5,
    smogRating: 5,
    electricConsumptionKwh100Km: null,
    electricRangeKm: null,
    sourceName: "Ressources naturelles Canada",
    sourceDataset: "fixture",
    sourceResourceUrl: "https://open.canada.ca/data/dataset/fixture",
    sourceYear: 2022,
    rawData: { Make: "Toyota" },
    ...overrides,
  };
}

describe("catalogue NRCan — flux intégration", () => {
  beforeAll(async () => {
    const first = await upsertCatalogBatch(
      [
        row(SOURCE_KEY_A),
        row(SOURCE_KEY_B, {
          model: "RAV4 LE",
          modelNormalized: "rav4 le",
          combinedConsumptionL100Km: 8.7,
        }),
      ],
      new Date(),
    );
    expect(first.created).toBe(2);

    const second = await upsertCatalogBatch(
      [
        row(SOURCE_KEY_A),
        row(SOURCE_KEY_B, {
          model: "RAV4 LE",
          modelNormalized: "rav4 le",
          combinedConsumptionL100Km: 8.7,
        }),
      ],
      new Date(),
    );
    expect(second.created).toBe(0);
    expect(second.unchanged).toBe(2);

    const updated = await upsertCatalogBatch(
      [
        row(SOURCE_KEY_A, {
          combinedConsumptionL100Km: 8.4,
          cityConsumptionL100Km: 8.9,
        }),
      ],
      new Date(),
    );
    expect(updated.updated).toBe(1);

    const entry = await prisma.vehicleCatalogEntry.findUnique({
      where: { sourceKey: SOURCE_KEY_A },
    });
    entryId = entry?.id ?? null;
    expect(entryId).toBeTruthy();
  });

  afterAll(async () => {
    if (vehicleId) {
      await prisma.userVehicle.deleteMany({ where: { id: vehicleId } });
    }
    if (userId) {
      await prisma.user.deleteMany({
        where: { id: userId, email: { startsWith: "nrcan-test-" } },
      });
    }
    await prisma.vehicleCatalogEntry.deleteMany({
      where: { sourceKey: { in: [SOURCE_KEY_A, SOURCE_KEY_B] } },
    });
  });

  it("recherche années / marques / modèles / configurations", async () => {
    const years = await listCatalogYears();
    expect(years).toContain(2022);
    const makes = await listCatalogMakes(2022);
    expect(makes.some((m) => m.value === "Toyota")).toBe(true);
    const models = await listCatalogModels(2022, "Toyota");
    expect(models.some((m) => m.value.includes("RAV4"))).toBe(true);
    const configs = await listCatalogConfigurations({
      year: 2022,
      make: "Toyota",
      model: "RAV4 AWD",
    });
    expect(configs.length).toBeGreaterThan(0);
    expect(configs[0]?.combinedConsumptionL100Km).toBeTruthy();
  });

  it("crée un véhicule utilisateur lié au catalogue", async () => {
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `nrcan-test-${randomUUID().slice(0, 8)}@example.com`,
        status: "active",
        role: "user",
        passwordHash: "test",
      },
    });
    userId = user.id;

    const entry = await prisma.vehicleCatalogEntry.findUniqueOrThrow({
      where: { sourceKey: SOURCE_KEY_A },
    });

    const vehicle = await prisma.userVehicle.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        catalogEntryId: entry.id,
        isManualEntry: false,
        manualManufacturerName: entry.make,
        manualModelName: entry.model,
        manualYear: entry.modelYear,
        fuelType: entry.normalizedFuelType,
        officialCombinedConsumptionL100: entry.combinedConsumptionL100Km,
        officialCityConsumptionL100: entry.cityConsumptionL100Km,
        officialHighwayConsumptionL100: entry.highwayConsumptionL100Km,
        consumptionDataSource: "nrcan_catalog",
        currentOdometer: 10000,
      },
    });
    vehicleId = vehicle.id;
    expect(vehicle.catalogEntryId).toBe(entry.id);
  });

  it("fallback manuel source user_manual", async () => {
    const user = await prisma.user.findFirstOrThrow({
      where: { id: userId! },
    });
    const manual = await prisma.userVehicle.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        isManualEntry: true,
        manualManufacturerName: "Custom",
        manualModelName: "Van",
        manualYear: 1990,
        fuelType: "diesel",
        officialCombinedConsumptionL100: 12.5,
        consumptionDataSource: "user_manual",
        currentOdometer: 1,
      },
    });
    expect(manual.consumptionDataSource).toBe("user_manual");
    await prisma.userVehicle.delete({ where: { id: manual.id } });
  });

  it("utilise la conso officielle pour le calcul carburant", () => {
    const resolved = resolveVehicleConsumption({
      realAvgConsumption: null,
      fullFillCount: 0,
      catalogAvgConsumption: 8.5,
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.source).toBe("catalog");
    const cost = estimateTripFuelCost({
      distanceKm: 100,
      consumptionL100: resolved.consumptionL100,
      pricePerLiter: 1.5,
    });
    expect(cost.litersNeeded).toBeCloseTo(8.5, 5);
    expect(cost.estimatedCost).toBeCloseTo(12.75, 2);
  });
});
