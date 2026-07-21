import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";
import {
  formatConfigurationLabel,
  normalizeSearchText,
} from "../domain/normalize";
import type {
  CatalogConfigurationOption,
  CatalogMakeOption,
  CatalogModelOption,
} from "../domain/types";

const CACHE_TTL_SECONDS = 300;

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await getRedis().get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function cacheSet(key: string, value: unknown): Promise<void> {
  try {
    await getRedis().set(key, JSON.stringify(value), "EX", CACHE_TTL_SECONDS);
  } catch {
    /* cache best-effort */
  }
}

export async function listCatalogYears(): Promise<number[]> {
  const cacheKey = "sebavio:vehicle-catalog:years";
  const cached = await cacheGet<number[]>(cacheKey);
  if (cached) return cached;

  const rows = await prisma.vehicleCatalogEntry.findMany({
    where: { isActive: true },
    distinct: ["modelYear"],
    select: { modelYear: true },
    orderBy: { modelYear: "desc" },
  });
  const years = rows.map((r) => r.modelYear);
  await cacheSet(cacheKey, years);
  return years;
}

export async function listCatalogMakes(
  year: number,
): Promise<CatalogMakeOption[]> {
  const cacheKey = `sebavio:vehicle-catalog:makes:${year}`;
  const cached = await cacheGet<CatalogMakeOption[]>(cacheKey);
  if (cached) return cached;

  const rows = await prisma.vehicleCatalogEntry.findMany({
    where: { isActive: true, modelYear: year },
    distinct: ["makeNormalized"],
    select: { make: true, makeNormalized: true },
    orderBy: { make: "asc" },
  });

  const data = rows.map((r) => ({ value: r.make, label: r.make }));
  await cacheSet(cacheKey, data);
  return data;
}

export async function listCatalogModels(
  year: number,
  make: string,
): Promise<CatalogModelOption[]> {
  const makeNorm = normalizeSearchText(make);
  const cacheKey = `sebavio:vehicle-catalog:models:${year}:${makeNorm}`;
  const cached = await cacheGet<CatalogModelOption[]>(cacheKey);
  if (cached) return cached;

  const rows = await prisma.vehicleCatalogEntry.findMany({
    where: {
      isActive: true,
      modelYear: year,
      makeNormalized: makeNorm,
    },
    distinct: ["modelNormalized"],
    select: { model: true, modelNormalized: true },
    orderBy: { model: "asc" },
  });

  // Afficher le nom « de base » sans variants de transmission trop longs :
  // on garde le libellé modèle tel que publié (ex. RAV4 AWD).
  const data = rows.map((r) => ({ value: r.model, label: r.model }));
  await cacheSet(cacheKey, data);
  return data;
}

export async function listCatalogConfigurations(input: {
  year: number;
  make: string;
  model: string;
}): Promise<CatalogConfigurationOption[]> {
  const makeNorm = normalizeSearchText(input.make);
  const modelNorm = normalizeSearchText(input.model);

  const rows = await prisma.vehicleCatalogEntry.findMany({
    where: {
      isActive: true,
      modelYear: input.year,
      makeNormalized: makeNorm,
      modelNormalized: modelNorm,
    },
    orderBy: [
      { engineSizeLitres: "asc" },
      { transmission: "asc" },
      { normalizedFuelType: "asc" },
    ],
    take: 200,
  });

  return rows.map((r) => ({
    id: r.id,
    label: formatConfigurationLabel({
      model: r.model,
      engineSizeLitres:
        r.engineSizeLitres != null ? Number(r.engineSizeLitres) : null,
      transmission: r.transmission,
      normalizedFuelType: r.normalizedFuelType,
      combinedConsumptionL100Km:
        r.combinedConsumptionL100Km != null
          ? Number(r.combinedConsumptionL100Km)
          : null,
      electricRangeKm: r.electricRangeKm,
    }),
    engineSizeLitres:
      r.engineSizeLitres != null ? Number(r.engineSizeLitres) : null,
    transmission: r.transmission,
    fuelType: r.normalizedFuelType,
    combinedConsumptionL100Km:
      r.combinedConsumptionL100Km != null
        ? Number(r.combinedConsumptionL100Km)
        : null,
    cityConsumptionL100Km:
      r.cityConsumptionL100Km != null ? Number(r.cityConsumptionL100Km) : null,
    highwayConsumptionL100Km:
      r.highwayConsumptionL100Km != null
        ? Number(r.highwayConsumptionL100Km)
        : null,
    electricRangeKm: r.electricRangeKm,
    vehicleClass: r.vehicleClass,
  }));
}

export async function getCatalogEntryById(id: string) {
  const row = await prisma.vehicleCatalogEntry.findFirst({
    where: { id, isActive: true },
  });
  if (!row) {
    throw new AppError("CAT_001", "Configuration catalogue introuvable", 404);
  }
  return {
    id: row.id,
    modelYear: row.modelYear,
    make: row.make,
    model: row.model,
    configuration: row.configuration,
    vehicleClass: row.vehicleClass,
    engineSizeLitres:
      row.engineSizeLitres != null ? Number(row.engineSizeLitres) : null,
    cylinders: row.cylinders,
    transmission: row.transmission,
    fuelType: row.normalizedFuelType,
    fuelTypeRaw: row.fuelType,
    cityConsumptionL100Km:
      row.cityConsumptionL100Km != null
        ? Number(row.cityConsumptionL100Km)
        : null,
    highwayConsumptionL100Km:
      row.highwayConsumptionL100Km != null
        ? Number(row.highwayConsumptionL100Km)
        : null,
    combinedConsumptionL100Km:
      row.combinedConsumptionL100Km != null
        ? Number(row.combinedConsumptionL100Km)
        : null,
    combinedMpg: row.combinedMpg != null ? Number(row.combinedMpg) : null,
    co2EmissionsGKm: row.co2EmissionsGKm,
    co2Rating: row.co2Rating,
    smogRating: row.smogRating,
    electricConsumptionKwh100Km:
      row.electricConsumptionKwh100Km != null
        ? Number(row.electricConsumptionKwh100Km)
        : null,
    electricRangeKm: row.electricRangeKm,
    sourceName: row.sourceName,
    sourceDataset: row.sourceDataset,
    sourceYear: row.sourceYear,
    importedAt: row.importedAt.toISOString(),
    label: formatConfigurationLabel({
      model: row.model,
      engineSizeLitres:
        row.engineSizeLitres != null ? Number(row.engineSizeLitres) : null,
      transmission: row.transmission,
      normalizedFuelType: row.normalizedFuelType,
      combinedConsumptionL100Km:
        row.combinedConsumptionL100Km != null
          ? Number(row.combinedConsumptionL100Km)
          : null,
      electricRangeKm: row.electricRangeKm,
    }),
  };
}

export function normalizeMakeForQuery(make: string): string {
  return normalizeSearchText(make);
}

/** Invalide le cache après sync (best-effort, timeout court). */
export async function invalidateCatalogSearchCache(): Promise<void> {
  const run = async () => {
    const redis = getRedis();
    let cursor = "0";
    let loops = 0;
    do {
      const [next, keys] = await redis.scan(
        cursor,
        "MATCH",
        "sebavio:vehicle-catalog:*",
        "COUNT",
        100,
      );
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
      loops += 1;
      if (loops > 50) break;
    } while (cursor !== "0");
  };

  try {
    await Promise.race([
      run(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("cache invalidate timeout")), 3000),
      ),
    ]);
  } catch {
    /* ignore — le TTL Redis expire les clés */
  }
}

export type { Prisma };
