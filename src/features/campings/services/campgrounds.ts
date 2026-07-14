import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  campgroundCreateSchema,
  campgroundSearchSchema,
  campgroundUpdateSchema,
  type CampgroundCreateInput,
  type CampgroundUpdateInput,
} from "@/features/campings/schemas";
import { toCampgroundDto } from "@/features/campings/services/mappers";
import type {
  CampgroundDto,
  PaginatedCampgrounds,
} from "@/features/campings/types";
import { getCampgroundProvider } from "@/services/campgrounds";

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

async function resolveVehicleMaxLengthM(
  userId: string,
  vehicleId: string | undefined,
): Promise<number | null> {
  if (!vehicleId) return null;
  const vehicle = await prisma.userVehicle.findFirst({
    where: { id: vehicleId, userId, deletedAt: null },
    select: {
      model: { select: { lengthM: true } },
    },
  });
  if (!vehicle) {
    throw new AppError("VEH_001", "Véhicule introuvable", 404);
  }
  const length = vehicle.model?.lengthM ?? null;
  return length != null ? Number(length) : null;
}

export async function searchCampgrounds(
  userId: string,
  rawQuery: Record<string, string | undefined>,
): Promise<PaginatedCampgrounds> {
  const input = parseZod(
    () => campgroundSearchSchema.parse(rawQuery),
    "Paramètres de recherche invalides",
  );

  const provider = getCampgroundProvider();
  if (!provider.isAvailable().available) {
    throw new AppError("EXT_001", "Fournisseur de campings indisponible", 503);
  }

  const maxLengthM = await resolveVehicleMaxLengthM(userId, input.vehicleId);
  return provider.search({ ...input, maxLengthM });
}

export async function getCampgroundById(
  id: string,
  includeDeleted = false,
): Promise<CampgroundDto> {
  const provider = getCampgroundProvider();
  const dto = await provider.getById(id, includeDeleted);
  if (!dto) {
    throw new AppError("CAMP_001", "Camping introuvable", 404);
  }
  return dto;
}

export async function listCampgroundsAdmin(params: {
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
  q?: string;
}): Promise<PaginatedCampgrounds> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize =
    params.pageSize && params.pageSize > 0
      ? Math.min(params.pageSize, 100)
      : 20;

  const where: Prisma.CampgroundWhereInput = {
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
    prisma.campground.count({ where }),
    prisma.campground.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map((row) => toCampgroundDto(row)),
    page,
    pageSize,
    total,
  };
}

export async function createCampground(
  raw: unknown,
  adminUserId: string,
  ipAddress?: string | null,
): Promise<CampgroundDto> {
  const input: CampgroundCreateInput = parseZod(
    () => campgroundCreateSchema.parse(raw),
    "Camping invalide",
  );

  if (input.source === "seed-dev" && process.env.NODE_ENV === "production") {
    throw new AppError(
      "CAMP_004",
      "Les données seed-dev sont interdites en production",
      400,
    );
  }

  const created = await prisma.campground.create({
    data: {
      name: input.name,
      latitude: new Prisma.Decimal(input.latitude),
      longitude: new Prisma.Decimal(input.longitude),
      address: input.address ?? null,
      city: input.city ?? null,
      region: input.region ?? null,
      countryCode: input.countryCode,
      campgroundType: input.campgroundType,
      maxLengthM: decimalOrNull(input.maxLengthM) ?? null,
      services: input.services ?? [],
      petFriendly: input.petFriendly,
      rating: decimalOrNull(input.rating) ?? null,
      priceMin: decimalOrNull(input.priceMin) ?? null,
      priceMax: decimalOrNull(input.priceMax) ?? null,
      reservationUrl: input.reservationUrl ?? null,
      source: input.source,
    },
  });

  await writeAuditLog({
    userId: adminUserId,
    entity: "campgrounds",
    entityId: created.id,
    action: "create",
    newValue: { name: created.name, source: created.source },
    ipAddress,
  });

  return toCampgroundDto(created);
}

export async function updateCampground(
  id: string,
  raw: unknown,
  adminUserId: string,
  ipAddress?: string | null,
): Promise<CampgroundDto> {
  const existing = await prisma.campground.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("CAMP_001", "Camping introuvable", 404);
  }

  const input: CampgroundUpdateInput = parseZod(
    () => campgroundUpdateSchema.parse(raw),
    "Camping invalide",
  );

  const updated = await prisma.campground.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
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
      ...(input.campgroundType !== undefined
        ? { campgroundType: input.campgroundType }
        : {}),
      ...(input.maxLengthM !== undefined
        ? { maxLengthM: decimalOrNull(input.maxLengthM) }
        : {}),
      ...(input.services !== undefined ? { services: input.services } : {}),
      ...(input.petFriendly !== undefined
        ? { petFriendly: input.petFriendly }
        : {}),
      ...(input.rating !== undefined
        ? { rating: decimalOrNull(input.rating) }
        : {}),
      ...(input.priceMin !== undefined
        ? { priceMin: decimalOrNull(input.priceMin) }
        : {}),
      ...(input.priceMax !== undefined
        ? { priceMax: decimalOrNull(input.priceMax) }
        : {}),
      ...(input.reservationUrl !== undefined
        ? { reservationUrl: input.reservationUrl }
        : {}),
    },
  });

  await writeAuditLog({
    userId: adminUserId,
    entity: "campgrounds",
    entityId: id,
    action: "update",
    oldValue: { name: existing.name },
    newValue: { name: updated.name },
    ipAddress,
  });

  return toCampgroundDto(updated);
}

/**
 * Soft-delete camping — même patron que travel-groups (Partie 11bis) :
 * refus si étapes de voyages actifs (planned | in_progress) le référencent.
 * completed/cancelled : soft-delete OK, FK conservée → affichage « camping archivé ».
 */
export async function deleteCampground(
  id: string,
  adminUserId: string,
  ipAddress?: string | null,
): Promise<void> {
  const existing = await prisma.campground.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("CAMP_001", "Camping introuvable", 404);
  }

  const activeStops = await prisma.tripStop.findMany({
    where: {
      campgroundId: id,
      trip: {
        deletedAt: null,
        status: { in: ["planned", "in_progress"] },
      },
    },
    select: {
      trip: { select: { id: true, title: true } },
    },
  });

  if (activeStops.length > 0) {
    const titles = [
      ...new Set(activeStops.map((s) => `« ${s.trip.title} »`)),
    ].join(", ");
    throw new AppError(
      "CAMP_003",
      `Impossible de supprimer ce camping : lié aux voyages actifs ${titles}`,
      409,
    );
  }

  await prisma.campground.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    userId: adminUserId,
    entity: "campgrounds",
    entityId: id,
    action: "delete",
    oldValue: { name: existing.name },
    ipAddress,
  });
}
