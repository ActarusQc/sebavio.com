import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  manufacturerCreateSchema,
  manufacturerUpdateSchema,
  manufacturersListSchema,
  type ManufacturerCreateInput,
  type ManufacturerUpdateInput,
} from "@/features/vehicle-catalog/schemas";
import { toManufacturerDto } from "@/features/vehicle-catalog/services/mappers";
import type {
  ManufacturerDto,
  PaginatedResult,
} from "@/features/vehicle-catalog/types";

export async function listManufacturers(
  rawQuery: Record<string, string | string[] | undefined>,
): Promise<PaginatedResult<ManufacturerDto>> {
  const query = Object.fromEntries(
    Object.entries(rawQuery).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

  const input = manufacturersListSchema.parse(query);
  const where = {
    ...(input.active !== undefined ? { active: input.active } : {}),
    ...(input.keyword
      ? {
          name: {
            contains: input.keyword,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.manufacturer.count({ where }),
    prisma.manufacturer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
  ]);

  return {
    items: rows.map(toManufacturerDto),
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
  };
}

export async function getManufacturerById(
  id: string,
): Promise<ManufacturerDto> {
  const row = await prisma.manufacturer.findUnique({ where: { id } });
  if (!row) {
    throw new AppError("CAT_001", "Constructeur introuvable", 404);
  }
  return toManufacturerDto(row);
}

export async function createManufacturer(
  raw: unknown,
  actorId: string,
  ipAddress?: string | null,
): Promise<ManufacturerDto> {
  let input: ManufacturerCreateInput;
  try {
    input = manufacturerCreateSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? "Données invalides",
        400,
      );
    }
    throw error;
  }

  const existing = await prisma.manufacturer.findUnique({
    where: { name: input.name },
  });
  if (existing) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Un constructeur avec ce nom existe déjà",
      409,
    );
  }

  const created = await prisma.manufacturer.create({
    data: {
      name: input.name,
      countryCode: input.countryCode ?? null,
      website: input.website ?? null,
      supportUrl: input.supportUrl ?? null,
      logoUrl: input.logoUrl ?? null,
      active: input.active ?? true,
      source: "manual",
    },
  });

  await writeAuditLog({
    userId: actorId,
    entity: "manufacturers",
    entityId: created.id,
    action: "create",
    newValue: toManufacturerDto(created),
    ipAddress,
  });

  return toManufacturerDto(created);
}

export async function updateManufacturer(
  id: string,
  raw: unknown,
  actorId: string,
  ipAddress?: string | null,
): Promise<ManufacturerDto> {
  let input: ManufacturerUpdateInput;
  try {
    input = manufacturerUpdateSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? "Données invalides",
        400,
      );
    }
    throw error;
  }

  const before = await prisma.manufacturer.findUnique({ where: { id } });
  if (!before) {
    throw new AppError("CAT_001", "Constructeur introuvable", 404);
  }

  if (input.name && input.name !== before.name) {
    const clash = await prisma.manufacturer.findUnique({
      where: { name: input.name },
    });
    if (clash) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Un constructeur avec ce nom existe déjà",
        409,
      );
    }
  }

  const updated = await prisma.manufacturer.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.countryCode !== undefined
        ? { countryCode: input.countryCode }
        : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.supportUrl !== undefined
        ? { supportUrl: input.supportUrl }
        : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });

  await writeAuditLog({
    userId: actorId,
    entity: "manufacturers",
    entityId: id,
    action: "update",
    oldValue: toManufacturerDto(before),
    newValue: toManufacturerDto(updated),
    ipAddress,
  });

  return toManufacturerDto(updated);
}
