import { Prisma } from "@prisma/client";
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
import { parseSpecOverrides } from "@/features/vehicles/lib/effective-specs";
import type {
  PaginatedVehicles,
  UserVehicleDetailDto,
  UserVehicleDocumentDto,
  UserVehicleDto,
  VehiclePhotoDto,
} from "@/features/vehicles/types";

/** Marque les estimations carburant des voyages actifs comme périmées. */
async function markActiveTripsFuelStale(
  tx: Prisma.TransactionClient,
  vehicleId: string,
) {
  await tx.tripRoute.updateMany({
    where: {
      fuelEstimateStale: false,
      trip: {
        vehicleId,
        deletedAt: null,
        status: { in: ["planned", "in_progress"] },
      },
    },
    data: { fuelEstimateStale: true },
  });
}

function specsAffectingFuelChanged(
  before: {
    customConsumptionL100?: { toString(): string } | null;
    tankCapacityOverride: { toString(): string } | null;
    fuelType: string | null;
    customFuelType?: string | null;
  },
  after: {
    customConsumptionL100?: { toString(): string } | null;
    tankCapacityOverride?: { toString(): string } | null;
    fuelType?: string | null;
    customFuelType?: string | null;
  },
): boolean {
  const pairs: Array<[unknown, unknown]> = [
    [before.customConsumptionL100, after.customConsumptionL100],
    [before.tankCapacityOverride, after.tankCapacityOverride],
    [before.fuelType, after.fuelType],
    [before.customFuelType, after.customFuelType],
  ];
  for (const [b, a] of pairs) {
    if (a === undefined) continue;
    const bs = b == null ? null : String(b);
    const as = a == null ? null : String(a);
    if (bs !== as) return true;
  }
  return false;
}

const modelInclude = {
  manufacturer: { select: { name: true } },
} as const;

const catalogEntrySelect = {
  make: true,
  model: true,
  modelYear: true,
  fuelTankCapacityL: true,
  electricRangeKm: true,
  electricConsumptionKwh100Km: true,
  combinedConsumptionL100Km: true,
  normalizedFuelType: true,
} as const;

const vehicleListInclude = {
  model: { include: modelInclude },
  catalogEntry: { select: catalogEntrySelect },
} as const;

const vehicleDetailInclude = {
  model: { include: modelInclude },
  catalogEntry: { select: catalogEntrySelect },
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
  catalogEntryId: string | null;
  isManualEntry: boolean;
} {
  if (input.catalogEntryId) {
    return {
      modelId: input.modelId ?? null,
      catalogEntryId: input.catalogEntryId,
      isManualEntry: false,
    };
  }
  if (input.modelId) {
    return {
      modelId: input.modelId,
      catalogEntryId: null,
      isManualEntry: false,
    };
  }
  return { modelId: null, catalogEntryId: null, isManualEntry: true };
}

async function assertCatalogEntryExists(catalogEntryId: string) {
  const entry = await prisma.vehicleCatalogEntry.findFirst({
    where: { id: catalogEntryId, isActive: true },
  });
  if (!entry) {
    throw new AppError("VEH_003", "Configuration catalogue inexistante", 400);
  }
  return entry;
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

  const catalogEntry = flags.catalogEntryId
    ? await assertCatalogEntryExists(flags.catalogEntryId)
    : null;

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

      const fromCatalog = catalogEntry
        ? {
            catalogEntryId: catalogEntry.id,
            isManualEntry: false,
            manualManufacturerName: catalogEntry.make.slice(0, 150),
            manualModelName: catalogEntry.model.slice(0, 150),
            manualYear: catalogEntry.modelYear,
            manualTrim: catalogEntry.configuration?.slice(0, 150) ?? null,
            manualCategory: null as string | null,
            fuelType:
              input.customFuelType ??
              input.fuelType ??
              catalogEntry.normalizedFuelType,
            manufacturerFuelType: catalogEntry.normalizedFuelType,
            customFuelType: input.customFuelType ?? null,
            officialCityConsumptionL100: catalogEntry.cityConsumptionL100Km,
            officialHighwayConsumptionL100:
              catalogEntry.highwayConsumptionL100Km,
            officialCombinedConsumptionL100:
              catalogEntry.combinedConsumptionL100Km,
            consumptionDataSource: "nrcan_catalog",
            realAvgConsumption: null,
            customConsumptionL100: input.customConsumptionL100 ?? null,
            manufacturerTankCapacityL:
              input.manufacturerTankCapacityL ??
              catalogEntry.fuelTankCapacityL ??
              null,
          }
        : {
            catalogEntryId: null as string | null,
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
            fuelType: input.customFuelType ?? input.fuelType ?? null,
            manufacturerFuelType:
              input.manufacturerFuelType ?? input.fuelType ?? null,
            customFuelType: input.customFuelType ?? null,
            officialCityConsumptionL100:
              input.officialCityConsumptionL100 ?? null,
            officialHighwayConsumptionL100:
              input.officialHighwayConsumptionL100 ?? null,
            officialCombinedConsumptionL100:
              input.officialCombinedConsumptionL100 ?? null,
            consumptionDataSource: flags.isManualEntry
              ? "user_manual"
              : (input.consumptionDataSource ?? "legacy_model"),
            realAvgConsumption: null,
            customConsumptionL100: input.customConsumptionL100 ?? null,
            manufacturerTankCapacityL: input.manufacturerTankCapacityL ?? null,
          };

      return tx.userVehicle.create({
        data: {
          userId,
          modelId: flags.modelId,
          ...fromCatalog,
          nickname: input.nickname ?? null,
          vin: input.vin ?? null,
          licensePlate: input.licensePlate ?? null,
          purchaseDate: input.purchaseDate ?? null,
          purchasePrice: input.purchasePrice ?? null,
          currentOdometer: input.currentOdometer ?? 0,
          odometerUpdatedAt: new Date(),
          tankCapacityOverride: input.tankCapacityOverride ?? null,
          tankCapacitySource:
            input.tankCapacityOverride != null ? "user_manual" : null,
          tankCapacityUpdatedAt:
            input.tankCapacityOverride != null ? new Date() : null,
          specOverrides: input.specOverrides
            ? (parseSpecOverrides(input.specOverrides) ?? undefined)
            : undefined,
          specsUpdatedAt:
            input.customConsumptionL100 != null ||
            input.tankCapacityOverride != null ||
            input.customFuelType != null
              ? new Date()
              : null,
          primaryVehicle: makePrimary || count === 0,
          engine: input.engine ?? null,
          transmission: input.transmission ?? null,
          drivetrain: input.drivetrain ?? null,
          vehicleType: input.vehicleType ?? null,
          bodyClass: input.bodyClass ?? null,
          manufacturerName: input.manufacturerName ?? null,
          plantCountry: input.plantCountry ?? null,
          cylinders: input.cylinders ?? null,
          displacementL: input.displacementL ?? null,
          annualEstimatedKm: input.annualEstimatedKm ?? null,
          inServiceDate: input.inServiceDate ?? input.purchaseDate ?? null,
          identificationSource: input.identificationSource ?? null,
          identificationConfidence: input.identificationConfidence ?? null,
          usageProfile: input.usageProfile ?? "automatic",
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
        catalogEntryId: created.catalogEntryId,
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
  let nextCatalogEntryId = existing.catalogEntryId;
  let nextIsManual = existing.isManualEntry;

  if (input.catalogEntryId !== undefined) {
    if (input.catalogEntryId) {
      await assertCatalogEntryExists(input.catalogEntryId);
      nextCatalogEntryId = input.catalogEntryId;
      nextIsManual = false;
    } else {
      nextCatalogEntryId = null;
    }
  }

  if (input.modelId !== undefined) {
    if (input.modelId) {
      await assertModelExists(input.modelId);
      nextModelId = input.modelId;
      nextIsManual = false;
    } else {
      nextModelId = null;
      if (!nextCatalogEntryId) nextIsManual = true;
    }
  } else if (input.isManualEntry === true) {
    nextModelId = null;
    nextCatalogEntryId = null;
    nextIsManual = true;
  } else if (
    input.isManualEntry === false &&
    (existing.modelId || existing.catalogEntryId)
  ) {
    nextIsManual = false;
  }

  if (nextIsManual && nextModelId === null && nextCatalogEntryId === null) {
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

      const resetAll = input.resetAllManufacturerSpecs === true;

      const nextCustomFuel = resetAll
        ? null
        : input.customFuelType !== undefined
          ? input.customFuelType
          : undefined;
      const nextFuelType =
        resetAll && existing.manufacturerFuelType
          ? existing.manufacturerFuelType
          : input.customFuelType !== undefined
            ? (input.customFuelType ??
              existing.manufacturerFuelType ??
              input.fuelType ??
              existing.fuelType)
            : input.fuelType !== undefined
              ? input.fuelType
              : undefined;

      const nextCustomConso = resetAll
        ? null
        : input.customConsumptionL100 !== undefined
          ? input.customConsumptionL100
          : undefined;

      const nextTankOverride = resetAll
        ? null
        : input.tankCapacityOverride !== undefined
          ? input.tankCapacityOverride
          : undefined;

      const nextSpecOverrides = resetAll
        ? Prisma.DbNull
        : input.specOverrides !== undefined
          ? (parseSpecOverrides(input.specOverrides) ?? Prisma.DbNull)
          : undefined;

      const fuelSpecsTouch =
        resetAll ||
        specsAffectingFuelChanged(existing, {
          customConsumptionL100:
            nextCustomConso === undefined
              ? undefined
              : nextCustomConso == null
                ? null
                : ({ toString: () => String(nextCustomConso) } as {
                    toString(): string;
                  }),
          tankCapacityOverride:
            nextTankOverride === undefined
              ? undefined
              : nextTankOverride == null
                ? null
                : ({ toString: () => String(nextTankOverride) } as {
                    toString(): string;
                  }),
          fuelType: nextFuelType,
          customFuelType: nextCustomFuel,
        });

      const updatedRow = await tx.userVehicle.update({
        where: { id: vehicleId },
        data: {
          modelId: nextModelId,
          catalogEntryId: nextCatalogEntryId,
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
          ...(nextFuelType !== undefined ? { fuelType: nextFuelType } : {}),
          ...(input.manufacturerFuelType !== undefined
            ? { manufacturerFuelType: input.manufacturerFuelType }
            : {}),
          ...(nextCustomFuel !== undefined
            ? { customFuelType: nextCustomFuel }
            : {}),
          ...(input.officialCityConsumptionL100 !== undefined
            ? {
                officialCityConsumptionL100: input.officialCityConsumptionL100,
              }
            : {}),
          ...(input.officialHighwayConsumptionL100 !== undefined
            ? {
                officialHighwayConsumptionL100:
                  input.officialHighwayConsumptionL100,
              }
            : {}),
          ...(input.officialCombinedConsumptionL100 !== undefined
            ? {
                officialCombinedConsumptionL100:
                  input.officialCombinedConsumptionL100,
              }
            : {}),
          ...(input.consumptionDataSource !== undefined
            ? { consumptionDataSource: input.consumptionDataSource }
            : nextIsManual
              ? { consumptionDataSource: "user_manual" }
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
          ...(nextCustomConso !== undefined
            ? { customConsumptionL100: nextCustomConso }
            : {}),
          ...(input.manufacturerTankCapacityL !== undefined
            ? {
                manufacturerTankCapacityL: input.manufacturerTankCapacityL,
              }
            : {}),
          ...(nextTankOverride !== undefined
            ? {
                tankCapacityOverride: nextTankOverride,
                tankCapacitySource:
                  nextTankOverride != null ? "user_manual" : null,
                tankCapacityUpdatedAt:
                  nextTankOverride != null ? new Date() : null,
              }
            : {}),
          ...(nextSpecOverrides !== undefined
            ? { specOverrides: nextSpecOverrides }
            : {}),
          ...(fuelSpecsTouch ? { specsUpdatedAt: new Date() } : {}),
          ...(input.primaryVehicle !== undefined
            ? { primaryVehicle: input.primaryVehicle }
            : {}),
          ...(input.engine !== undefined ? { engine: input.engine } : {}),
          ...(input.transmission !== undefined
            ? { transmission: input.transmission }
            : {}),
          ...(input.drivetrain !== undefined
            ? { drivetrain: input.drivetrain }
            : {}),
          ...(input.vehicleType !== undefined
            ? { vehicleType: input.vehicleType }
            : {}),
          ...(input.bodyClass !== undefined
            ? { bodyClass: input.bodyClass }
            : {}),
          ...(input.manufacturerName !== undefined
            ? { manufacturerName: input.manufacturerName }
            : {}),
          ...(input.plantCountry !== undefined
            ? { plantCountry: input.plantCountry }
            : {}),
          ...(input.cylinders !== undefined
            ? { cylinders: input.cylinders }
            : {}),
          ...(input.displacementL !== undefined
            ? { displacementL: input.displacementL }
            : {}),
          ...(input.annualEstimatedKm !== undefined
            ? { annualEstimatedKm: input.annualEstimatedKm }
            : {}),
          ...(input.inServiceDate !== undefined
            ? { inServiceDate: input.inServiceDate }
            : {}),
          ...(input.identificationSource !== undefined
            ? { identificationSource: input.identificationSource }
            : {}),
          ...(input.identificationConfidence !== undefined
            ? { identificationConfidence: input.identificationConfidence }
            : {}),
          ...(input.usageProfile !== undefined
            ? { usageProfile: input.usageProfile }
            : {}),
        },
        include: vehicleListInclude,
      });

      if (fuelSpecsTouch) {
        await markActiveTripsFuelStale(tx, vehicleId);
      }

      return updatedRow;
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

  const doc = await prisma.userVehicleDocument.create({
    data: {
      vehicleId,
      type: input.type,
      title: input.title,
      fileUrl: input.fileUrl ?? "",
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
