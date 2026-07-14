import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  activityCreateSchema,
  activitySearchSchema,
  activityUpdateSchema,
  type ActivityCreateInput,
  type ActivityUpdateInput,
} from "@/features/activities/schemas";
import { toActivityDto } from "@/features/activities/services/mappers";
import type {
  ActivityDto,
  PaginatedActivities,
} from "@/features/activities/types";
import { getActivityProvider } from "@/services/activities";

function parseZod<T>(parse: () => T, fallbackMessage: string): T {
  try {
    return parse();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? fallbackMessage,
        400,
      );
    }
    throw error;
  }
}

function decimalOrNull(
  value: number | null | undefined,
): Prisma.Decimal | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Prisma.Decimal(value);
}

export async function searchActivities(
  _userId: string,
  rawQuery: Record<string, string | undefined>,
): Promise<PaginatedActivities> {
  const input = parseZod(
    () => activitySearchSchema.parse(rawQuery),
    "Paramètres de recherche invalides",
  );

  const provider = getActivityProvider();
  if (!provider.isAvailable().available) {
    throw new AppError("EXT_001", "Fournisseur d'activités indisponible", 503);
  }

  return provider.search(input);
}

export async function getActivityById(
  id: string,
  includeDeleted = false,
): Promise<ActivityDto> {
  const provider = getActivityProvider();
  const dto = await provider.getById(id, includeDeleted);
  if (!dto) {
    throw new AppError("ACT_001", "Activité introuvable", 404);
  }
  return dto;
}

export async function listActivitiesAdmin(params: {
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
  q?: string;
}): Promise<PaginatedActivities> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize =
    params.pageSize && params.pageSize > 0
      ? Math.min(params.pageSize, 100)
      : 20;

  const where: Prisma.ActivityWhereInput = {
    ...(params.includeDeleted ? {} : { deletedAt: null }),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" } },
            { city: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map((row) => toActivityDto(row)),
    page,
    pageSize,
    total,
  };
}

export async function createActivity(
  raw: unknown,
  adminUserId: string,
  ipAddress?: string | null,
): Promise<ActivityDto> {
  const input: ActivityCreateInput = parseZod(
    () => activityCreateSchema.parse(raw),
    "Activité invalide",
  );

  if (input.source === "seed-dev" && process.env.NODE_ENV === "production") {
    throw new AppError(
      "ACT_004",
      "Les données seed-dev sont interdites en production",
      400,
    );
  }

  const created = await prisma.activity.create({
    data: {
      name: input.name,
      kind: input.kind,
      category: input.category,
      latitude: new Prisma.Decimal(input.latitude),
      longitude: new Prisma.Decimal(input.longitude),
      address: input.address ?? null,
      city: input.city ?? null,
      region: input.region ?? null,
      countryCode: input.countryCode,
      familyScore: input.familyScore ?? null,
      petFriendly: input.petFriendly,
      estimatedDurationMin: input.estimatedDurationMin ?? null,
      priceIndicative: decimalOrNull(input.priceIndicative) ?? null,
      season: input.season ?? [],
      description: input.description ?? null,
      rating: decimalOrNull(input.rating) ?? null,
      website: input.website ?? null,
      source: input.source,
    },
  });

  await writeAuditLog({
    userId: adminUserId,
    entity: "activities",
    entityId: created.id,
    action: "create",
    newValue: { name: created.name, source: created.source },
    ipAddress,
  });

  return toActivityDto(created);
}

export async function updateActivity(
  id: string,
  raw: unknown,
  adminUserId: string,
  ipAddress?: string | null,
): Promise<ActivityDto> {
  const existing = await prisma.activity.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("ACT_001", "Activité introuvable", 404);
  }

  const input: ActivityUpdateInput = parseZod(
    () => activityUpdateSchema.parse(raw),
    "Activité invalide",
  );

  const updated = await prisma.activity.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.latitude !== undefined
        ? { latitude: new Prisma.Decimal(input.latitude) }
        : {}),
      ...(input.longitude !== undefined
        ? { longitude: new Prisma.Decimal(input.longitude) }
        : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.countryCode !== undefined
        ? { countryCode: input.countryCode }
        : {}),
      ...(input.familyScore !== undefined
        ? { familyScore: input.familyScore }
        : {}),
      ...(input.petFriendly !== undefined
        ? { petFriendly: input.petFriendly }
        : {}),
      ...(input.estimatedDurationMin !== undefined
        ? { estimatedDurationMin: input.estimatedDurationMin }
        : {}),
      ...(input.priceIndicative !== undefined
        ? { priceIndicative: decimalOrNull(input.priceIndicative) }
        : {}),
      ...(input.season !== undefined ? { season: input.season } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.rating !== undefined
        ? { rating: decimalOrNull(input.rating) }
        : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
    },
  });

  await writeAuditLog({
    userId: adminUserId,
    entity: "activities",
    entityId: id,
    action: "update",
    oldValue: { name: existing.name },
    newValue: { name: updated.name },
    ipAddress,
  });

  return toActivityDto(updated);
}

/**
 * Soft-delete activité — refus si étapes de voyages actifs (planned | in_progress).
 * completed/cancelled : soft-delete OK → affichage « Activité archivée ».
 */
export async function deleteActivity(
  id: string,
  adminUserId: string,
  ipAddress?: string | null,
): Promise<void> {
  const existing = await prisma.activity.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("ACT_001", "Activité introuvable", 404);
  }

  const activeLinks = await prisma.tripStopActivity.findMany({
    where: {
      activityId: id,
      deletedAt: null,
      tripStop: {
        trip: {
          deletedAt: null,
          status: { in: ["planned", "in_progress"] },
        },
      },
    },
    select: {
      tripStop: {
        select: { trip: { select: { id: true, title: true } } },
      },
    },
  });

  if (activeLinks.length > 0) {
    const titles = [
      ...new Set(activeLinks.map((l) => `« ${l.tripStop.trip.title} »`)),
    ].join(", ");
    throw new AppError(
      "ACT_003",
      `Impossible de supprimer cette activité : liée aux voyages actifs ${titles}`,
      409,
    );
  }

  await prisma.activity.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    userId: adminUserId,
    entity: "activities",
    entityId: id,
    action: "delete",
    oldValue: { name: existing.name },
    ipAddress,
  });
}
