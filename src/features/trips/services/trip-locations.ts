import { Prisma } from "@prisma/client";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  tripLocationsListQuerySchema,
  tripLocationsPostSchema,
  type TripLocationPointInput,
} from "@/features/trips/schemas/locations";
import {
  GEO_MAX_FUTURE_SKEW_MS,
  GEO_MAX_POINT_AGE_MS,
  GEO_SERVER_RATE_LIMIT_MS,
} from "@/features/trips/lib/geolocation";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export type TripLocationDto = {
  id: string;
  tripId: string;
  clientPointId: string;
  latitude: number;
  longitude: number;
  accuracyM: number | null;
  heading: number | null;
  speedMps: number | null;
  recordedAt: string;
  createdAt: string;
};

function decimalToNumber(
  value: Prisma.Decimal | null | undefined,
): number | null {
  if (value == null) return null;
  return Number(value);
}

function toDto(row: {
  id: string;
  tripId: string;
  clientPointId: string;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  accuracyM: Prisma.Decimal | null;
  heading: Prisma.Decimal | null;
  speedMps: Prisma.Decimal | null;
  recordedAt: Date;
  createdAt: Date;
}): TripLocationDto {
  return {
    id: row.id,
    tripId: row.tripId,
    clientPointId: row.clientPointId,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    accuracyM: decimalToNumber(row.accuracyM),
    heading: decimalToNumber(row.heading),
    speedMps: decimalToNumber(row.speedMps),
    recordedAt: row.recordedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Propriétaire strict : 404 si absent, 403 si autre propriétaire.
 * Ne journalise jamais les coordonnées.
 */
export async function assertOwnedTripForLocations(
  userId: string,
  tripId: string,
): Promise<{ id: string; status: string; userId: string }> {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, deletedAt: null },
    select: { id: true, status: true, userId: true },
  });
  if (!trip) {
    throw new AppError("TRIP_001", "Voyage introuvable", 404);
  }
  if (trip.userId !== userId) {
    throw new AppError("AUTH_006", "Accès refusé", 403);
  }
  return trip;
}

function isPointTemporallyAcceptable(
  recordedAt: Date,
  now: Date,
): "ok" | "future" | "stale" {
  const t = recordedAt.getTime();
  if (!Number.isFinite(t)) return "stale";
  if (t > now.getTime() + GEO_MAX_FUTURE_SKEW_MS) return "future";
  if (now.getTime() - t > GEO_MAX_POINT_AGE_MS) return "stale";
  return "ok";
}

export type RecordLocationsResult = {
  accepted: number;
  skipped: number;
  duplicates: number;
  latest: TripLocationDto | null;
};

/**
 * Enregistre un batch de points GPS (idempotent via clientPointId).
 * Rate-limit 10 s côté serveur sous verrou transactionnel par voyage.
 */
export async function recordTripLocations(
  userId: string,
  tripId: string,
  raw: unknown,
): Promise<RecordLocationsResult> {
  const { assertTripFeature } =
    await import("@/features/trips/services/access-gate");
  await assertTripFeature(userId, "trip.gps_tracking.enabled");

  const trip = await assertOwnedTripForLocations(userId, tripId);
  if (trip.status !== "in_progress") {
    throw new AppError(
      "TRIP_005",
      "Le suivi GPS n’est disponible que pour un voyage en cours",
      409,
    );
  }

  let parsed;
  try {
    parsed = tripLocationsPostSchema.parse(raw);
  } catch (error) {
    throw error;
  }

  const now = new Date();
  const candidates: TripLocationPointInput[] = [];
  let skipped = 0;

  for (const point of parsed.points) {
    const temporal = isPointTemporallyAcceptable(point.recordedAt, now);
    if (temporal !== "ok") {
      skipped += 1;
      continue;
    }
    candidates.push(point);
  }

  if (candidates.length === 0) {
    const latest = await getLatestTripLocation(userId, tripId);
    return { accepted: 0, skipped, duplicates: 0, latest };
  }

  const result = await prisma.$transaction(async (tx) => {
    // Verrou transactionnel par voyage (évite courses sur le rate-limit).
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${tripId}::text))
    `;

    const last = await tx.tripLocation.findFirst({
      where: { tripId },
      orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
      select: { recordedAt: true },
    });

    let lastAcceptedAt = last?.recordedAt.getTime() ?? null;
    let accepted = 0;
    let duplicates = 0;
    let rateSkipped = 0;

    // Ordre chronologique pour appliquer le rate-limit correctement.
    const ordered = [...candidates].sort(
      (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime(),
    );

    for (const point of ordered) {
      if (
        lastAcceptedAt != null &&
        point.recordedAt.getTime() - lastAcceptedAt < GEO_SERVER_RATE_LIMIT_MS
      ) {
        rateSkipped += 1;
        continue;
      }

      try {
        await tx.tripLocation.create({
          data: {
            tripId,
            userId,
            clientPointId: point.clientPointId,
            latitude: new Prisma.Decimal(point.latitude),
            longitude: new Prisma.Decimal(point.longitude),
            accuracyM:
              point.accuracyM != null
                ? new Prisma.Decimal(point.accuracyM)
                : null,
            heading:
              point.heading != null ? new Prisma.Decimal(point.heading) : null,
            speedMps:
              point.speedMps != null
                ? new Prisma.Decimal(point.speedMps)
                : null,
            recordedAt: point.recordedAt,
          },
        });
        accepted += 1;
        lastAcceptedAt = point.recordedAt.getTime();
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          duplicates += 1;
          continue;
        }
        throw error;
      }
    }

    const latestRow = await tx.tripLocation.findFirst({
      where: { tripId },
      orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
    });

    return {
      accepted,
      rateSkipped,
      duplicates,
      latest: latestRow ? toDto(latestRow) : null,
    };
  });

  return {
    accepted: result.accepted,
    skipped: skipped + result.rateSkipped,
    duplicates: result.duplicates,
    latest: result.latest,
  };
}

export async function getLatestTripLocation(
  userId: string,
  tripId: string,
): Promise<TripLocationDto | null> {
  await assertOwnedTripForLocations(userId, tripId);
  const row = await prisma.tripLocation.findFirst({
    where: { tripId },
    orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
  });
  return row ? toDto(row) : null;
}

export async function listTripLocations(
  userId: string,
  tripId: string,
  rawQuery: unknown,
): Promise<TripLocationDto[]> {
  await assertOwnedTripForLocations(userId, tripId);
  const query = tripLocationsListQuerySchema.parse(rawQuery ?? {});
  const rows = await prisma.tripLocation.findMany({
    where: {
      tripId,
      ...(query.since ? { recordedAt: { gte: query.since } } : {}),
    },
    orderBy: [{ recordedAt: "asc" }, { id: "asc" }],
    take: query.limit,
  });
  return rows.map(toDto);
}

/**
 * Purge hard des positions d'un voyage + audit unique (sans coords).
 */
export async function purgeTripLocations(
  tripId: string,
  userId: string,
  reason: "completed" | "cancelled" | "security_cleanup",
  ipAddress?: string | null,
  tx?: Prisma.TransactionClient,
): Promise<number> {
  const client = tx ?? prisma;
  const deleted = await client.tripLocation.deleteMany({ where: { tripId } });
  if (deleted.count > 0 || reason !== "security_cleanup") {
    await writeAuditLog({
      userId,
      entity: "trip_locations",
      entityId: tripId,
      action: "purge_locations",
      oldValue: { count: deleted.count },
      newValue: { reason },
      ipAddress,
    });
  }
  return deleted.count;
}

/**
 * Nettoyage de sécurité : positions liées à un voyage non in_progress.
 */
export async function cleanupStaleTripLocations(): Promise<{
  tripsProcessed: number;
  pointsDeleted: number;
}> {
  const stale = await prisma.tripLocation.findMany({
    where: {
      trip: {
        OR: [{ status: { not: "in_progress" } }, { deletedAt: { not: null } }],
      },
    },
    select: { tripId: true, userId: true },
    distinct: ["tripId"],
  });

  let pointsDeleted = 0;
  for (const row of stale) {
    const n = await purgeTripLocations(
      row.tripId,
      row.userId,
      "security_cleanup",
    );
    pointsDeleted += n;
  }
  return { tripsProcessed: stale.length, pointsDeleted };
}
