import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { downloadRegieExcel, resolveRegieExcelUrl } from "./download";
import { parseRegieXlsx } from "./parse";
import {
  INGEST_COOLDOWN_MS,
  MIN_STATION_ROWS_DEFAULT,
  MISSING_STREAK_SOFT_DELETE,
  type ParseSkipReason,
  type ParsedStationRow,
  type RegieFuelType,
} from "./constants";

export type IngestReport = {
  status: "success" | "refused" | "failed";
  sourceUrl: string | null;
  durationMs: number;
  sheetName?: string;
  rowCount?: number;
  stationsProcessed: number;
  stationsCreated: number;
  stationsUpdated: number;
  stationsUnchanged: number;
  pricesInserted: number;
  pricesUnchanged: number;
  missingStreakIncremented: number;
  softDeleted: number;
  skipped: Array<{ row: number; reason: ParseSkipReason }>;
  skipCounts: Record<string, number>;
  anomaly?: string;
  error?: string;
  capturedAt?: string;
};

export type IngestOptions = {
  /** Buffer local (tests) — saute le téléchargement. */
  buffer?: Buffer;
  sourceUrl?: string;
  minStationRows?: number;
  /** Ignore le cooldown 30 min (tests uniquement). */
  skipCooldown?: boolean;
  now?: Date;
};

function countSkips(
  skipped: Array<{ reason: string }>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of skipped) {
    out[s.reason] = (out[s.reason] ?? 0) + 1;
  }
  return out;
}

async function assertCooldown(now: Date, skip?: boolean) {
  if (skip) return;
  const last = await prisma.fuelIngestion.findFirst({
    where: { status: "success" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, status: true },
  });
  if (!last) return;
  const elapsed = now.getTime() - last.createdAt.getTime();
  if (elapsed < INGEST_COOLDOWN_MS) {
    const waitMin = Math.ceil((INGEST_COOLDOWN_MS - elapsed) / 60000);
    throw new AppError(
      "FUEL_005",
      `Ingestion refusée — patientez ${waitMin} min (cooldown 30 min)`,
      429,
    );
  }
}

async function latestPriceMap(stationId: string): Promise<Map<string, number>> {
  const rows = await prisma.$queryRaw<
    Array<{ fuel_type: string; price: Prisma.Decimal }>
  >`
    SELECT DISTINCT ON (fuel_type) fuel_type, price
    FROM fuel_prices
    WHERE station_id = ${stationId}::uuid
    ORDER BY fuel_type, captured_at DESC
  `;
  return new Map(rows.map((r) => [r.fuel_type, Number(r.price)]));
}

async function upsertStationAndPrices(
  row: ParsedStationRow,
  capturedAt: Date,
): Promise<{
  created: boolean;
  updated: boolean;
  pricesInserted: number;
  pricesUnchanged: number;
}> {
  const existing = await prisma.fuelStation.findUnique({
    where: { externalKey: row.externalKey },
  });

  let stationId: string;
  let created = false;
  let updated = false;

  if (!existing) {
    const createdRow = await prisma.fuelStation.create({
      data: {
        externalKey: row.externalKey,
        name: row.name,
        banner: row.banner,
        address: row.address,
        region: row.region,
        postalCode: row.postalCode,
        latitude:
          row.latitude != null ? new Prisma.Decimal(row.latitude) : null,
        longitude:
          row.longitude != null ? new Prisma.Decimal(row.longitude) : null,
        missingStreak: 0,
        lastSeenAt: capturedAt,
        deletedAt: null,
      },
    });
    stationId = createdRow.id;
    created = true;
  } else {
    stationId = existing.id;
    const needsUpdate =
      existing.name !== row.name ||
      existing.banner !== row.banner ||
      existing.address !== row.address ||
      existing.region !== row.region ||
      existing.postalCode !== row.postalCode ||
      Number(existing.latitude) !== (row.latitude ?? Number.NaN) ||
      Number(existing.longitude) !== (row.longitude ?? Number.NaN) ||
      existing.deletedAt != null ||
      existing.missingStreak !== 0;

    await prisma.fuelStation.update({
      where: { id: stationId },
      data: {
        name: row.name,
        banner: row.banner,
        address: row.address,
        region: row.region,
        postalCode: row.postalCode,
        latitude:
          row.latitude != null ? new Prisma.Decimal(row.latitude) : null,
        longitude:
          row.longitude != null ? new Prisma.Decimal(row.longitude) : null,
        missingStreak: 0,
        lastSeenAt: capturedAt,
        deletedAt: null,
      },
    });
    updated = needsUpdate;
  }

  const current = await latestPriceMap(stationId);
  let pricesInserted = 0;
  let pricesUnchanged = 0;

  for (const [fuelType, price] of Object.entries(row.prices) as Array<
    [RegieFuelType, number]
  >) {
    const prev = current.get(fuelType);
    if (prev != null && Math.abs(prev - price) < 0.0005) {
      pricesUnchanged += 1;
      continue;
    }
    await prisma.fuelPrice.create({
      data: {
        stationId,
        fuelType,
        price: new Prisma.Decimal(price.toFixed(3)),
        capturedAt,
      },
    });
    pricesInserted += 1;
  }

  return { created, updated, pricesInserted, pricesUnchanged };
}

/**
 * Ingestion Régie Essence Québec.
 * Ne vide jamais les tables ; soft-delete seulement après 3 absences consécutives
 * et si le fichier dépasse le seuil de lignes.
 */
export async function ingestRegieFuelPrices(
  options: IngestOptions = {},
): Promise<IngestReport> {
  const now = options.now ?? new Date();
  const startedAt = now;
  const minRows = options.minStationRows ?? MIN_STATION_ROWS_DEFAULT;
  let sourceUrl: string | null = options.sourceUrl ?? null;

  try {
    await assertCooldown(now, options.skipCooldown);
  } catch (error) {
    if (error instanceof AppError && error.code === "FUEL_005") {
      const report: IngestReport = {
        status: "refused",
        sourceUrl,
        durationMs: Date.now() - startedAt.getTime(),
        stationsProcessed: 0,
        stationsCreated: 0,
        stationsUpdated: 0,
        stationsUnchanged: 0,
        pricesInserted: 0,
        pricesUnchanged: 0,
        missingStreakIncremented: 0,
        softDeleted: 0,
        skipped: [],
        skipCounts: {},
        anomaly: error.message,
      };
      await prisma.fuelIngestion.create({
        data: {
          status: "refused",
          sourceUrl,
          startedAt,
          finishedAt: new Date(),
          report: report as unknown as Prisma.InputJsonValue,
        },
      });
      return report;
    }
    throw error;
  }

  const ingestion = await prisma.fuelIngestion.create({
    data: {
      status: "failed",
      sourceUrl,
      startedAt,
    },
  });

  try {
    let buffer = options.buffer;
    if (!buffer) {
      const resolved = await resolveRegieExcelUrl(options.sourceUrl);
      sourceUrl = resolved.url;
      buffer = await downloadRegieExcel(resolved.url);
    }

    const parsed = parseRegieXlsx(buffer);
    const rowCount = parsed.stations.length;

    if (rowCount < minRows) {
      const report: IngestReport = {
        status: "refused",
        sourceUrl,
        durationMs: Date.now() - startedAt.getTime(),
        sheetName: parsed.sheetName,
        rowCount,
        stationsProcessed: 0,
        stationsCreated: 0,
        stationsUpdated: 0,
        stationsUnchanged: 0,
        pricesInserted: 0,
        pricesUnchanged: 0,
        missingStreakIncremented: 0,
        softDeleted: 0,
        skipped: parsed.skipped,
        skipCounts: countSkips(parsed.skipped),
        anomaly: `Fichier anormalement petit (${rowCount} stations < ${minRows}) — ingestion refusée, données précédentes intactes`,
      };
      await prisma.fuelIngestion.update({
        where: { id: ingestion.id },
        data: {
          status: "refused",
          sourceUrl,
          finishedAt: new Date(),
          report: report as unknown as Prisma.InputJsonValue,
        },
      });
      return report;
    }

    const capturedAt = now;
    let stationsCreated = 0;
    let stationsUpdated = 0;
    let stationsUnchanged = 0;
    let pricesInserted = 0;
    let pricesUnchanged = 0;
    const seenKeys = new Set<string>();

    for (const station of parsed.stations) {
      seenKeys.add(station.externalKey);
      const result = await upsertStationAndPrices(station, capturedAt);
      if (result.created) stationsCreated += 1;
      else if (result.updated) stationsUpdated += 1;
      else stationsUnchanged += 1;
      pricesInserted += result.pricesInserted;
      pricesUnchanged += result.pricesUnchanged;
    }

    const active = await prisma.fuelStation.findMany({
      where: { deletedAt: null },
      select: { id: true, externalKey: true, missingStreak: true },
    });

    let missingStreakIncremented = 0;
    let softDeleted = 0;

    for (const station of active) {
      if (seenKeys.has(station.externalKey)) continue;
      const nextStreak = station.missingStreak + 1;
      missingStreakIncremented += 1;
      await prisma.fuelStation.update({
        where: { id: station.id },
        data: {
          missingStreak: nextStreak,
          ...(nextStreak >= MISSING_STREAK_SOFT_DELETE
            ? { deletedAt: capturedAt }
            : {}),
        },
      });
      if (nextStreak >= MISSING_STREAK_SOFT_DELETE) softDeleted += 1;
    }

    const report: IngestReport = {
      status: "success",
      sourceUrl,
      durationMs: Date.now() - startedAt.getTime(),
      sheetName: parsed.sheetName,
      rowCount,
      stationsProcessed: parsed.stations.length,
      stationsCreated,
      stationsUpdated,
      stationsUnchanged,
      pricesInserted,
      pricesUnchanged,
      missingStreakIncremented,
      softDeleted,
      skipped: parsed.skipped,
      skipCounts: countSkips(parsed.skipped),
      capturedAt: capturedAt.toISOString(),
    };

    await prisma.fuelIngestion.update({
      where: { id: ingestion.id },
      data: {
        status: "success",
        sourceUrl,
        finishedAt: new Date(),
        report: report as unknown as Prisma.InputJsonValue,
      },
    });

    return report;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Échec ingestion Régie";
    const report: IngestReport = {
      status: "failed",
      sourceUrl,
      durationMs: Date.now() - startedAt.getTime(),
      stationsProcessed: 0,
      stationsCreated: 0,
      stationsUpdated: 0,
      stationsUnchanged: 0,
      pricesInserted: 0,
      pricesUnchanged: 0,
      missingStreakIncremented: 0,
      softDeleted: 0,
      skipped: [],
      skipCounts: {},
      error: message,
    };
    await prisma.fuelIngestion.update({
      where: { id: ingestion.id },
      data: {
        status: "failed",
        sourceUrl,
        finishedAt: new Date(),
        report: report as unknown as Prisma.InputJsonValue,
      },
    });
    return report;
  }
}
