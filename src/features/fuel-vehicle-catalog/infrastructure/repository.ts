import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { NormalizedCatalogRow } from "../domain/types";

export async function createSyncRun(startedAt: Date) {
  return prisma.vehicleCatalogSync.create({
    data: {
      id: randomUUID(),
      status: "running",
      startedAt,
    },
  });
}

export async function hasRunningSync(): Promise<boolean> {
  const row = await prisma.vehicleCatalogSync.findFirst({
    where: { status: "running" },
    orderBy: { startedAt: "desc" },
    select: { id: true, startedAt: true },
  });
  if (!row) return false;
  const ageMs = Date.now() - row.startedAt.getTime();
  return ageMs < 2 * 60 * 60 * 1000;
}

export async function completeSyncRun(
  id: string,
  data: {
    status: string;
    completedAt: Date;
    sourceDataset?: string | null;
    sourceResourceUrl?: string | null;
    sourceChecksum?: string | null;
    sourceModifiedAt?: Date | null;
    recordsRead: number;
    recordsCreated: number;
    recordsUpdated: number;
    recordsUnchanged: number;
    recordsRejected: number;
    errorMessage?: string | null;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return prisma.vehicleCatalogSync.update({
    where: { id },
    data,
  });
}

export async function getLatestSuccessfulChecksums(): Promise<
  Map<string, string>
> {
  const rows = await prisma.vehicleCatalogSync.findMany({
    where: { status: { in: ["success", "partial"] } },
    orderBy: { startedAt: "desc" },
    take: 20,
    select: { metadata: true, sourceChecksum: true, sourceResourceUrl: true },
  });
  const map = new Map<string, string>();
  for (const row of rows) {
    const meta = row.metadata as {
      resourceChecksums?: Record<string, string>;
    } | null;
    if (meta?.resourceChecksums) {
      for (const [url, sum] of Object.entries(meta.resourceChecksums)) {
        if (!map.has(url)) map.set(url, sum);
      }
    } else if (row.sourceResourceUrl && row.sourceChecksum) {
      if (!map.has(row.sourceResourceUrl)) {
        map.set(row.sourceResourceUrl, row.sourceChecksum);
      }
    }
  }
  return map;
}

function toDecimal(n: number | null | undefined): Prisma.Decimal | null {
  if (n == null) return null;
  return new Prisma.Decimal(n);
}

function rowData(row: NormalizedCatalogRow, importedAt: Date) {
  return {
    modelYear: row.modelYear,
    make: row.make,
    makeNormalized: row.makeNormalized,
    model: row.model,
    modelNormalized: row.modelNormalized,
    configuration: row.configuration,
    vehicleClass: row.vehicleClass,
    engineSizeLitres: toDecimal(row.engineSizeLitres),
    cylinders: row.cylinders,
    transmission: row.transmission,
    transmissionCode: row.transmissionCode,
    fuelType: row.fuelType,
    normalizedFuelType: row.normalizedFuelType,
    cityConsumptionL100Km: toDecimal(row.cityConsumptionL100Km),
    highwayConsumptionL100Km: toDecimal(row.highwayConsumptionL100Km),
    combinedConsumptionL100Km: toDecimal(row.combinedConsumptionL100Km),
    combinedMpg: toDecimal(row.combinedMpg),
    co2EmissionsGKm: row.co2EmissionsGKm,
    co2Rating: row.co2Rating,
    smogRating: row.smogRating,
    electricConsumptionKwh100Km: toDecimal(row.electricConsumptionKwh100Km),
    electricRangeKm: row.electricRangeKm,
    sourceName: row.sourceName,
    sourceDataset: row.sourceDataset,
    sourceResourceUrl: row.sourceResourceUrl,
    sourceYear: row.sourceYear,
    importedAt,
    isActive: true,
    rawData: row.rawData as Prisma.InputJsonValue,
  };
}

function decEq(
  a: { toString(): string } | null | undefined,
  b: number | null | undefined,
): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Number(a.toString()) === Number(b);
}

export async function upsertCatalogBatch(
  rows: NormalizedCatalogRow[],
  importedAt: Date,
): Promise<{ created: number; updated: number; unchanged: number }> {
  if (rows.length === 0) {
    return { created: 0, updated: 0, unchanged: 0 };
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  const keys = rows.map((r) => r.sourceKey);
  const existing = await prisma.vehicleCatalogEntry.findMany({
    where: { sourceKey: { in: keys } },
    select: {
      id: true,
      sourceKey: true,
      combinedConsumptionL100Km: true,
      cityConsumptionL100Km: true,
      highwayConsumptionL100Km: true,
      fuelType: true,
      transmission: true,
      electricRangeKm: true,
      co2EmissionsGKm: true,
      isActive: true,
    },
  });
  const byKey = new Map(existing.map((e) => [e.sourceKey, e]));

  const toCreate: NormalizedCatalogRow[] = [];
  const toUpdate: Array<{ id: string; row: NormalizedCatalogRow }> = [];

  for (const row of rows) {
    const prev = byKey.get(row.sourceKey);
    if (!prev) {
      toCreate.push(row);
      continue;
    }
    const same =
      decEq(prev.combinedConsumptionL100Km, row.combinedConsumptionL100Km) &&
      decEq(prev.cityConsumptionL100Km, row.cityConsumptionL100Km) &&
      decEq(prev.highwayConsumptionL100Km, row.highwayConsumptionL100Km) &&
      prev.fuelType === row.fuelType &&
      prev.transmission === row.transmission &&
      prev.electricRangeKm === row.electricRangeKm &&
      prev.co2EmissionsGKm === row.co2EmissionsGKm &&
      prev.isActive === true;
    if (same) {
      unchanged += 1;
    } else {
      toUpdate.push({ id: prev.id, row });
    }
  }

  if (toCreate.length > 0) {
    const result = await prisma.vehicleCatalogEntry.createMany({
      data: toCreate.map((row) => ({
        id: randomUUID(),
        sourceKey: row.sourceKey,
        ...rowData(row, importedAt),
      })),
      skipDuplicates: true,
    });
    created += result.count;
  }

  for (const item of toUpdate) {
    await prisma.vehicleCatalogEntry.update({
      where: { id: item.id },
      data: rowData(item.row, importedAt),
    });
    updated += 1;
  }

  return { created, updated, unchanged };
}

export async function getCatalogStats() {
  const [total, yearsAgg, lastSync] = await Promise.all([
    prisma.vehicleCatalogEntry.count({ where: { isActive: true } }),
    prisma.vehicleCatalogEntry.groupBy({
      by: ["modelYear"],
      where: { isActive: true },
      _count: true,
      orderBy: { modelYear: "desc" },
    }),
    prisma.vehicleCatalogSync.findFirst({
      orderBy: { startedAt: "desc" },
    }),
  ]);

  return {
    totalActive: total,
    years: yearsAgg.map((y) => y.modelYear),
    yearMin: yearsAgg.length
      ? Math.min(...yearsAgg.map((y) => y.modelYear))
      : null,
    yearMax: yearsAgg.length
      ? Math.max(...yearsAgg.map((y) => y.modelYear))
      : null,
    lastSync,
  };
}
