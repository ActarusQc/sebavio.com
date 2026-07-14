import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  modelsSearchSchema,
  vehicleModelCreateSchema,
  vehicleModelUpdateSchema,
  type VehicleModelCreateInput,
  type VehicleModelUpdateInput,
} from "@/features/vehicle-catalog/schemas";
import {
  toDocumentDto,
  toKnownIssueDto,
  toSpecificationsDto,
  toVehicleModelDto,
} from "@/features/vehicle-catalog/services/mappers";
import type {
  KnownIssueDto,
  PaginatedResult,
  VehicleDocumentDto,
  VehicleModelDto,
  VehicleSpecificationsDto,
} from "@/features/vehicle-catalog/types";

function parseSearchQuery(
  rawQuery: Record<string, string | string[] | undefined>,
) {
  const query = Object.fromEntries(
    Object.entries(rawQuery).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

  try {
    return modelsSearchSchema.parse(query);
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      if (issue?.path.includes("year")) {
        throw new AppError("CAT_003", "Année invalide", 400);
      }
      throw new AppError(
        "VALIDATION_ERROR",
        issue?.message ?? "Paramètres de recherche invalides",
        400,
      );
    }
    throw error;
  }
}

function buildModelWhere(
  input: ReturnType<typeof modelsSearchSchema.parse>,
): Prisma.VehicleModelWhereInput {
  const and: Prisma.VehicleModelWhereInput[] = [];

  if (input.manufacturerId) {
    and.push({ manufacturerId: input.manufacturerId });
  } else if (input.manufacturer) {
    and.push({
      manufacturer: {
        name: { equals: input.manufacturer, mode: "insensitive" },
      },
    });
  }

  if (input.category) and.push({ category: input.category });
  if (input.year !== undefined) and.push({ year: input.year });
  if (input.fuelType) and.push({ fuelType: input.fuelType });
  if (input.engine) {
    and.push({
      engine: { contains: input.engine, mode: "insensitive" },
    });
  }
  if (input.keyword) {
    and.push({
      OR: [
        { modelName: { contains: input.keyword, mode: "insensitive" } },
        { trim: { contains: input.keyword, mode: "insensitive" } },
        { engine: { contains: input.keyword, mode: "insensitive" } },
        {
          manufacturer: {
            name: { contains: input.keyword, mode: "insensitive" },
          },
        },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

function sortOrder(
  sort: ReturnType<typeof modelsSearchSchema.parse>["sort"],
): Prisma.VehicleModelOrderByWithRelationInput[] {
  switch (sort) {
    case "year_asc":
      return [{ year: "asc" }, { modelName: "asc" }];
    case "name_asc":
      return [{ modelName: "asc" }, { year: "desc" }];
    case "name_desc":
      return [{ modelName: "desc" }, { year: "desc" }];
    case "year_desc":
    default:
      return [{ year: "desc" }, { modelName: "asc" }];
  }
}

export async function listModels(
  rawQuery: Record<string, string | string[] | undefined>,
): Promise<PaginatedResult<VehicleModelDto>> {
  const input = parseSearchQuery(rawQuery);
  const where = buildModelWhere(input);

  const [total, rows] = await Promise.all([
    prisma.vehicleModel.count({ where }),
    prisma.vehicleModel.findMany({
      where,
      include: { manufacturer: { select: { name: true } } },
      orderBy: sortOrder(input.sort),
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
  ]);

  return {
    items: rows.map(toVehicleModelDto),
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
  };
}

export async function getModelById(id: string): Promise<VehicleModelDto> {
  const row = await prisma.vehicleModel.findUnique({
    where: { id },
    include: { manufacturer: { select: { name: true } } },
  });
  if (!row) {
    throw new AppError("CAT_002", "Modèle introuvable", 404);
  }
  return toVehicleModelDto(row);
}

export async function getModelSpecifications(
  id: string,
): Promise<VehicleSpecificationsDto> {
  const row = await prisma.vehicleModel.findUnique({ where: { id } });
  if (!row) {
    throw new AppError("CAT_002", "Modèle introuvable", 404);
  }
  return toSpecificationsDto(row);
}

export async function getModelDocuments(
  id: string,
): Promise<VehicleDocumentDto[]> {
  const model = await prisma.vehicleModel.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!model) {
    throw new AppError("CAT_002", "Modèle introuvable", 404);
  }

  const rows = await prisma.vehicleDocument.findMany({
    where: { modelId: id },
    orderBy: { title: "asc" },
  });
  return rows.map(toDocumentDto);
}

export async function getModelKnownIssues(
  id: string,
): Promise<KnownIssueDto[]> {
  const model = await prisma.vehicleModel.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!model) {
    throw new AppError("CAT_002", "Modèle introuvable", 404);
  }

  const rows = await prisma.knownIssue.findMany({
    where: { modelId: id },
    orderBy: [{ severity: "desc" }, { title: "asc" }],
  });
  return rows.map(toKnownIssueDto);
}

/** Programme d'entretien constructeur (délègue au module maintenance). */
export async function getModelMaintenance(id: string) {
  const { listTemplatesForModel } =
    await import("@/features/maintenance/services/templates");
  return listTemplatesForModel(id);
}

function toDecimalInput(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return value;
}

export async function createModel(
  raw: unknown,
  actorId: string,
  ipAddress?: string | null,
): Promise<VehicleModelDto> {
  let input: VehicleModelCreateInput;
  try {
    input = vehicleModelCreateSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      if (issue?.path.includes("year")) {
        throw new AppError("CAT_003", "Année invalide", 400);
      }
      throw new AppError(
        "VALIDATION_ERROR",
        issue?.message ?? "Données invalides",
        400,
      );
    }
    throw error;
  }

  const manufacturer = await prisma.manufacturer.findUnique({
    where: { id: input.manufacturerId },
  });
  if (!manufacturer) {
    throw new AppError("CAT_001", "Constructeur introuvable", 404);
  }

  const trim = input.trim ?? "";
  const clash = await prisma.vehicleModel.findFirst({
    where: {
      manufacturerId: input.manufacturerId,
      year: input.year,
      trim,
      modelName: input.modelName,
    },
  });
  if (clash) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Ce modèle (constructeur, année, version) existe déjà",
      409,
    );
  }

  const created = await prisma.vehicleModel.create({
    data: {
      manufacturerId: input.manufacturerId,
      category: input.category,
      modelName: input.modelName,
      trim,
      year: input.year,
      engine: input.engine ?? null,
      transmission: input.transmission ?? null,
      driveType: input.driveType ?? null,
      fuelType: input.fuelType ?? null,
      fuelCapacityL: toDecimalInput(input.fuelCapacityL),
      avgConsumption: toDecimalInput(input.avgConsumption),
      lengthM: toDecimalInput(input.lengthM),
      widthM: toDecimalInput(input.widthM),
      heightM: toDecimalInput(input.heightM),
      gvwrKg: input.gvwrKg ?? null,
      sleepingCapacity: input.sleepingCapacity ?? null,
      freshWaterL: input.freshWaterL ?? null,
      greyWaterL: input.greyWaterL ?? null,
      blackWaterL: input.blackWaterL ?? null,
      source: "manual",
    },
    include: { manufacturer: { select: { name: true } } },
  });

  await writeAuditLog({
    userId: actorId,
    entity: "vehicle_models",
    entityId: created.id,
    action: "create",
    newValue: toVehicleModelDto(created),
    ipAddress,
  });

  return toVehicleModelDto(created);
}

export async function updateModel(
  id: string,
  raw: unknown,
  actorId: string,
  ipAddress?: string | null,
): Promise<VehicleModelDto> {
  let input: VehicleModelUpdateInput;
  try {
    input = vehicleModelUpdateSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      if (issue?.path.includes("year")) {
        throw new AppError("CAT_003", "Année invalide", 400);
      }
      throw new AppError(
        "VALIDATION_ERROR",
        issue?.message ?? "Données invalides",
        400,
      );
    }
    throw error;
  }

  const before = await prisma.vehicleModel.findUnique({
    where: { id },
    include: { manufacturer: { select: { name: true } } },
  });
  if (!before) {
    throw new AppError("CAT_002", "Modèle introuvable", 404);
  }

  if (input.manufacturerId) {
    const manufacturer = await prisma.manufacturer.findUnique({
      where: { id: input.manufacturerId },
    });
    if (!manufacturer) {
      throw new AppError("CAT_001", "Constructeur introuvable", 404);
    }
  }

  const nextManufacturerId = input.manufacturerId ?? before.manufacturerId;
  const nextYear = input.year ?? before.year;
  const nextTrim = input.trim ?? before.trim;
  const nextName = input.modelName ?? before.modelName;

  const clash = await prisma.vehicleModel.findFirst({
    where: {
      manufacturerId: nextManufacturerId,
      year: nextYear,
      trim: nextTrim,
      modelName: nextName,
      NOT: { id },
    },
  });
  if (clash) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Ce modèle (constructeur, année, version) existe déjà",
      409,
    );
  }

  const updated = await prisma.vehicleModel.update({
    where: { id },
    data: {
      ...(input.manufacturerId !== undefined
        ? { manufacturerId: input.manufacturerId }
        : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.modelName !== undefined ? { modelName: input.modelName } : {}),
      ...(input.trim !== undefined ? { trim: input.trim } : {}),
      ...(input.year !== undefined ? { year: input.year } : {}),
      ...(input.engine !== undefined ? { engine: input.engine } : {}),
      ...(input.transmission !== undefined
        ? { transmission: input.transmission }
        : {}),
      ...(input.driveType !== undefined ? { driveType: input.driveType } : {}),
      ...(input.fuelType !== undefined ? { fuelType: input.fuelType } : {}),
      ...(input.fuelCapacityL !== undefined
        ? { fuelCapacityL: toDecimalInput(input.fuelCapacityL) }
        : {}),
      ...(input.avgConsumption !== undefined
        ? { avgConsumption: toDecimalInput(input.avgConsumption) }
        : {}),
      ...(input.lengthM !== undefined
        ? { lengthM: toDecimalInput(input.lengthM) }
        : {}),
      ...(input.widthM !== undefined
        ? { widthM: toDecimalInput(input.widthM) }
        : {}),
      ...(input.heightM !== undefined
        ? { heightM: toDecimalInput(input.heightM) }
        : {}),
      ...(input.gvwrKg !== undefined ? { gvwrKg: input.gvwrKg } : {}),
      ...(input.sleepingCapacity !== undefined
        ? { sleepingCapacity: input.sleepingCapacity }
        : {}),
      ...(input.freshWaterL !== undefined
        ? { freshWaterL: input.freshWaterL }
        : {}),
      ...(input.greyWaterL !== undefined
        ? { greyWaterL: input.greyWaterL }
        : {}),
      ...(input.blackWaterL !== undefined
        ? { blackWaterL: input.blackWaterL }
        : {}),
    },
    include: { manufacturer: { select: { name: true } } },
  });

  await writeAuditLog({
    userId: actorId,
    entity: "vehicle_models",
    entityId: id,
    action: "update",
    oldValue: toVehicleModelDto(before),
    newValue: toVehicleModelDto(updated),
    ipAddress,
  });

  return toVehicleModelDto(updated);
}
