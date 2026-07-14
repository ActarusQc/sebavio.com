import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "@/features/vehicles/constants";
import {
  odometerUpdateSchema,
  vehicleCreateSchema,
  vehicleDocumentCreateSchema,
  vehiclePhotoCreateSchema,
  vehiclesListSchema,
  vehicleUpdateSchema,
  type VehicleCreateInput,
  type VehicleUpdateInput,
} from "@/features/vehicles/schemas";
import {
  clampPageSize,
  estimateRangeKm,
  toDocumentDto,
  toPhotoDto,
  toSettingsDto,
  toVehicleDto,
} from "@/features/vehicles/services/mappers";
import { assertOdometerNotDecreasing } from "@/features/vehicles/services/odometer";
import type {
  PaginatedVehicles,
  UserVehicleDetailDto,
  UserVehicleDocumentDto,
  UserVehicleDto,
  VehiclePhotoDto,
} from "@/features/vehicles/types";

const modelInclude = {
  manufacturer: { select: { name: true } },
} as const;

const vehicleListInclude = {
  model: { include: modelInclude },
} as const;

const vehicleDetailInclude = {
  model: { include: modelInclude },
  photos: { orderBy: { displayOrder: "asc" as const } },
  documents: { orderBy: { createdAt: "desc" as const } },
  settings: true,
} as const;

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

function isVinUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

/** Véhicule du user actif ou 404 (ne révèle pas l'existence hors périmètre). */
export async function getOwnedVehicleOrThrow(
  userId: string,
  vehicleId: string,
) {
  const vehicle = await prisma.userVehicle.findFirst({
    where: { id: vehicleId, userId, deletedAt: null },
    include: vehicleDetailInclude,
  });
  if (!vehicle) {
    throw new AppError("VEH_001", "Véhicule introuvable", 404);
  }
  return vehicle;
}

async function assertModelExists(modelId: string) {
  const model = await prisma.vehicleModel.findUnique({
    where: { id: modelId },
    select: { id: true },
  });
  if (!model) {
    throw new AppError("VEH_003", "Modèle inexistant", 400);
  }
}

function resolveCreateFlags(input: VehicleCreateInput): {
  modelId: string | null;
  isManualEntry: boolean;
} {
  if (input.modelId) {
    return { modelId: input.modelId, isManualEntry: false };
  }
  return { modelId: null, isManualEntry: true };
}

export async function listVehicles(
  userId: string,
  rawQuery: Record<string, string | string[] | undefined>,
): Promise<PaginatedVehicles> {
  const query = Object.fromEntries(
    Object.entries(rawQuery).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = parseZod(
    () => vehiclesListSchema.parse(query),
    "Paramètres de liste invalides",
  );
  const pageSize = clampPageSize(
    parsed.pageSize ?? DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );
  const page = parsed.page ?? 1;
  const skip = (page - 1) * pageSize;

  const where: Prisma.UserVehicleWhereInput = {
    userId,
    deletedAt: null,
  };

  const [total, rows] = await Promise.all([
    prisma.userVehicle.count({ where }),
    prisma.userVehicle.findMany({
      where,
      include: vehicleListInclude,
      orderBy: [{ primaryVehicle: "desc" }, { updatedAt: "desc" }],
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map(toVehicleDto),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getVehicleById(
  userId: string,
  vehicleId: string,
): Promise<UserVehicleDetailDto> {
  const row = await getOwnedVehicleOrThrow(userId, vehicleId);
  const base = toVehicleDto(row);
  return {
    ...base,
    photos: row.photos.map(toPhotoDto),
    documents: row.documents.map(toDocumentDto),
    settings: row.settings ? toSettingsDto(row.settings) : null,
    stats: {
      photoCount: row.photos.length,
      documentCount: row.documents.length,
      estimatedRangeKm: estimateRangeKm(row),
    },
  };
}

export async function createVehicle(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<UserVehicleDto> {
  const input = parseZod(
    () => vehicleCreateSchema.parse(raw),
    "Véhicule invalide",
  );
  const flags = resolveCreateFlags(input);

  if (flags.modelId) {
    await assertModelExists(flags.modelId);
  }

  const makePrimary = input.primaryVehicle === true;

  try {
    const created = await prisma.$transaction(async (tx) => {
      if (makePrimary) {
        await tx.userVehicle.updateMany({
          where: { userId, deletedAt: null, primaryVehicle: true },
          data: { primaryVehicle: false },
        });
      }

      const count = await tx.userVehicle.count({
        where: { userId, deletedAt: null },
      });

      return tx.userVehicle.create({
        data: {
          userId,
          modelId: flags.modelId,
          isManualEntry: flags.isManualEntry,
          manualManufacturerName: flags.isManualEntry
            ? input.manualManufacturerName
            : (input.manualManufacturerName ?? null),
          manualModelName: flags.isManualEntry
            ? input.manualModelName
            : (input.manualModelName ?? null),
          manualYear: flags.isManualEntry
            ? input.manualYear
            : (input.manualYear ?? null),
          manualCategory: input.manualCategory ?? null,
          manualTrim: input.manualTrim ?? null,
          nickname: input.nickname ?? null,
          vin: input.vin ?? null,
          licensePlate: input.licensePlate ?? null,
          purchaseDate: input.purchaseDate ?? null,
          purchasePrice: input.purchasePrice ?? null,
          currentOdometer: input.currentOdometer,
          odometerUpdatedAt: new Date(),
          realAvgConsumption: input.realAvgConsumption ?? null,
          tankCapacityOverride: input.tankCapacityOverride ?? null,
          primaryVehicle: makePrimary || count === 0,
          settings: { create: {} },
        },
        include: vehicleListInclude,
      });
    });

    await writeAuditLog({
      userId,
      entity: "user_vehicle",
      entityId: created.id,
      action: "create",
      newValue: {
        modelId: created.modelId,
        isManualEntry: created.isManualEntry,
        nickname: created.nickname,
        vin: created.vin,
        currentOdometer: created.currentOdometer,
      },
      ipAddress,
    });

    return toVehicleDto(created);
  } catch (error) {
    if (isVinUniqueViolation(error)) {
      throw new AppError("VEH_002", "VIN déjà utilisé", 409);
    }
    throw error;
  }
}

export async function updateVehicle(
  userId: string,
  vehicleId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<UserVehicleDto> {
  const input = parseZod(
    () => vehicleUpdateSchema.parse(raw),
    "Véhicule invalide",
  );
  const existing = await getOwnedVehicleOrThrow(userId, vehicleId);

  let nextModelId = existing.modelId;
  let nextIsManual = existing.isManualEntry;

  if (input.modelId !== undefined) {
    if (input.modelId) {
      await assertModelExists(input.modelId);
      nextModelId = input.modelId;
      nextIsManual = false;
    } else {
      nextModelId = null;
      nextIsManual = true;
    }
  } else if (input.isManualEntry === true) {
    nextModelId = null;
    nextIsManual = true;
  } else if (input.isManualEntry === false && existing.modelId) {
    nextIsManual = false;
  }

  if (nextIsManual && nextModelId === null) {
    const manufacturer =
      input.manualManufacturerName !== undefined
        ? input.manualManufacturerName
        : existing.manualManufacturerName;
    const modelName =
      input.manualModelName !== undefined
        ? input.manualModelName
        : existing.manualModelName;
    const year =
      input.manualYear !== undefined ? input.manualYear : existing.manualYear;
    if (!manufacturer?.trim() || !modelName?.trim() || year == null) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Marque, modèle et année requis en saisie manuelle",
        400,
      );
    }
  }

  if (
    input.currentOdometer !== undefined &&
    input.currentOdometer < existing.currentOdometer
  ) {
    throw new AppError("VEH_004", "Kilométrage invalide", 400);
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (input.primaryVehicle === true) {
        await tx.userVehicle.updateMany({
          where: {
            userId,
            deletedAt: null,
            primaryVehicle: true,
            NOT: { id: vehicleId },
          },
          data: { primaryVehicle: false },
        });
      }

      return tx.userVehicle.update({
        where: { id: vehicleId },
        data: {
          modelId: nextModelId,
          isManualEntry: nextIsManual,
          ...(input.manualManufacturerName !== undefined
            ? { manualManufacturerName: input.manualManufacturerName }
            : {}),
          ...(input.manualModelName !== undefined
            ? { manualModelName: input.manualModelName }
            : {}),
          ...(input.manualYear !== undefined
            ? { manualYear: input.manualYear }
            : {}),
          ...(input.manualCategory !== undefined
            ? { manualCategory: input.manualCategory }
            : {}),
          ...(input.manualTrim !== undefined
            ? { manualTrim: input.manualTrim }
            : {}),
          ...(input.nickname !== undefined ? { nickname: input.nickname } : {}),
          ...(input.vin !== undefined ? { vin: input.vin } : {}),
          ...(input.licensePlate !== undefined
            ? { licensePlate: input.licensePlate }
            : {}),
          ...(input.purchaseDate !== undefined
            ? { purchaseDate: input.purchaseDate }
            : {}),
          ...(input.purchasePrice !== undefined
            ? { purchasePrice: input.purchasePrice }
            : {}),
          ...(input.currentOdometer !== undefined
            ? {
                currentOdometer: input.currentOdometer,
                odometerUpdatedAt: new Date(),
              }
            : {}),
          ...(input.realAvgConsumption !== undefined
            ? { realAvgConsumption: input.realAvgConsumption }
            : {}),
          ...(input.tankCapacityOverride !== undefined
            ? { tankCapacityOverride: input.tankCapacityOverride }
            : {}),
          ...(input.primaryVehicle !== undefined
            ? { primaryVehicle: input.primaryVehicle }
            : {}),
        },
        include: vehicleListInclude,
      });
    });

    await writeAuditLog({
      userId,
      entity: "user_vehicle",
      entityId: vehicleId,
      action: "update",
      oldValue: {
        modelId: existing.modelId,
        isManualEntry: existing.isManualEntry,
        nickname: existing.nickname,
        vin: existing.vin,
        currentOdometer: existing.currentOdometer,
        primaryVehicle: existing.primaryVehicle,
      },
      newValue: {
        modelId: updated.modelId,
        isManualEntry: updated.isManualEntry,
        nickname: updated.nickname,
        vin: updated.vin,
        currentOdometer: updated.currentOdometer,
        primaryVehicle: updated.primaryVehicle,
      },
      ipAddress,
    });

    return toVehicleDto(updated);
  } catch (error) {
    if (isVinUniqueViolation(error)) {
      throw new AppError("VEH_002", "VIN déjà utilisé", 409);
    }
    throw error;
  }
}

export async function deleteVehicle(
  userId: string,
  vehicleId: string,
  ipAddress?: string | null,
): Promise<void> {
  const existing = await getOwnedVehicleOrThrow(userId, vehicleId);

  await prisma.userVehicle.update({
    where: { id: vehicleId },
    data: { deletedAt: new Date(), primaryVehicle: false },
  });

  await writeAuditLog({
    userId,
    entity: "user_vehicle",
    entityId: vehicleId,
    action: "delete",
    oldValue: {
      nickname: existing.nickname,
      vin: existing.vin,
      primaryVehicle: existing.primaryVehicle,
    },
    ipAddress,
  });
}

export async function updateOdometer(
  userId: string,
  vehicleId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<UserVehicleDto> {
  const input = parseZod(
    () => odometerUpdateSchema.parse(raw),
    "Kilométrage invalide",
  );
  const existing = await getOwnedVehicleOrThrow(userId, vehicleId);

  assertOdometerNotDecreasing(
    existing.currentOdometer,
    input.currentOdometer,
    "VEH_004",
  );

  const updated = await prisma.userVehicle.update({
    where: { id: vehicleId },
    data: {
      currentOdometer: input.currentOdometer,
      odometerUpdatedAt: new Date(),
    },
    include: vehicleListInclude,
  });

  await writeAuditLog({
    userId,
    entity: "user_vehicle",
    entityId: vehicleId,
    action: "odometer_update",
    oldValue: { currentOdometer: existing.currentOdometer },
    newValue: { currentOdometer: updated.currentOdometer },
    ipAddress,
  });

  return toVehicleDto(updated);
}

export async function setPrimaryVehicle(
  userId: string,
  vehicleId: string,
  ipAddress?: string | null,
): Promise<UserVehicleDto> {
  await getOwnedVehicleOrThrow(userId, vehicleId);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.userVehicle.updateMany({
      where: { userId, deletedAt: null, primaryVehicle: true },
      data: { primaryVehicle: false },
    });
    return tx.userVehicle.update({
      where: { id: vehicleId },
      data: { primaryVehicle: true },
      include: vehicleListInclude,
    });
  });

  await writeAuditLog({
    userId,
    entity: "user_vehicle",
    entityId: vehicleId,
    action: "set_primary",
    newValue: { primaryVehicle: true },
    ipAddress,
  });

  return toVehicleDto(updated);
}

export async function addVehiclePhoto(
  userId: string,
  vehicleId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<VehiclePhotoDto> {
  await getOwnedVehicleOrThrow(userId, vehicleId);
  const input = parseZod(
    () => vehiclePhotoCreateSchema.parse(raw),
    "Photo invalide",
  );

  const photo = await prisma.vehiclePhoto.create({
    data: {
      vehicleId,
      photoUrl: input.photoUrl,
      caption: input.caption ?? null,
      displayOrder: input.displayOrder ?? 0,
    },
  });

  await writeAuditLog({
    userId,
    entity: "vehicle_photo",
    entityId: photo.id,
    action: "create",
    newValue: { vehicleId, photoUrl: photo.photoUrl },
    ipAddress,
  });

  return toPhotoDto(photo);
}

export async function addVehicleDocument(
  userId: string,
  vehicleId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<UserVehicleDocumentDto> {
  await getOwnedVehicleOrThrow(userId, vehicleId);
  const input = parseZod(
    () => vehicleDocumentCreateSchema.parse(raw),
    "Document invalide",
  );

  if (!input.fileUrl) {
    throw new AppError("VEH_005", "Document non valide", 400);
  }

  const doc = await prisma.userVehicleDocument.create({
    data: {
      vehicleId,
      type: input.type,
      title: input.title,
      fileUrl: input.fileUrl,
      expiryDate: input.expiryDate ?? null,
    },
  });

  await writeAuditLog({
    userId,
    entity: "user_vehicle_document",
    entityId: doc.id,
    action: "create",
    newValue: { vehicleId, type: doc.type, title: doc.title },
    ipAddress,
  });

  return toDocumentDto(doc);
}

/** Historique d'entretien du véhicule (délègue au module maintenance). */
export async function listVehicleMaintenance(
  userId: string,
  vehicleId: string,
) {
  const { listVehicleHistory } =
    await import("@/features/maintenance/services/history");
  return listVehicleHistory(userId, vehicleId);
}

export type { VehicleCreateInput, VehicleUpdateInput };
