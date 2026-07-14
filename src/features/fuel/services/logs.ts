import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  fuelLogCreateSchema,
  fuelLogUpdateSchema,
  type FuelLogCreateInput,
  type FuelLogUpdateInput,
} from "@/features/fuel/schemas";
import { resolveFuelAmounts } from "@/features/fuel/lib/amounts";
import { computeConsumptionStats } from "@/features/fuel/lib/consumption";
import { resolveRealAvgAfterRecalc } from "@/features/fuel/lib/consumption";
import { toFuelLogDto, toFuelStatsDto } from "@/features/fuel/services/mappers";
import type {
  FuelLogDto,
  FuelStatsDto,
  PaginatedFuelLogs,
} from "@/features/fuel/types";
import {
  assertOdometerNotDecreasing,
  bumpOdometerIfHigher,
} from "@/features/vehicles/services/odometer";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

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
    if (error instanceof Error && error.message.includes("Écart > 2")) {
      throw new AppError("FUEL_003", error.message, 400);
    }
    if (
      error instanceof Error &&
      error.message.includes("au moins deux valeurs")
    ) {
      throw new AppError("FUEL_003", error.message, 400);
    }
    throw error;
  }
}

function resolveAmountsOrThrow(input: {
  liters?: number | null;
  pricePerLiter?: number | null;
  totalCost?: number | null;
}) {
  try {
    return resolveFuelAmounts(input);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Montants carburant invalides";
    const code = message.includes("Écart > 2") ? "FUEL_003" : "FUEL_003";
    throw new AppError(code, message, 400);
  }
}

async function getOwnedVehicleLite(userId: string, vehicleId: string) {
  const vehicle = await prisma.userVehicle.findFirst({
    where: { id: vehicleId, userId, deletedAt: null },
    select: {
      id: true,
      currentOdometer: true,
      modelId: true,
      model: { select: { avgConsumption: true } },
    },
  });
  if (!vehicle) {
    throw new AppError("VEH_001", "Véhicule introuvable", 404);
  }
  return vehicle;
}

export async function getOwnedFuelLogOrThrow(
  userId: string,
  fuelLogId: string,
) {
  const log = await prisma.fuelLog.findFirst({
    where: {
      id: fuelLogId,
      deletedAt: null,
      vehicle: { userId, deletedAt: null },
    },
  });
  if (!log) {
    throw new AppError("FUEL_001", "Plein introuvable", 404);
  }
  return log;
}

/**
 * Recalcule real_avg_consumption.
 * Moins de 2 pleins complets → null (pas de moyenne orpheline).
 */
export async function recalculateRealAvgConsumption(
  tx: Prisma.TransactionClient,
  vehicleId: string,
): Promise<number | null> {
  const logs = await tx.fuelLog.findMany({
    where: { vehicleId, deletedAt: null },
    select: { odometerKm: true, liters: true, isFull: true },
    orderBy: { odometerKm: "asc" },
  });

  const fullCount = logs.filter((l) => l.isFull).length;
  const stats = computeConsumptionStats(
    logs.map((l) => ({
      odometerKm: l.odometerKm,
      liters: Number(l.liters),
      isFull: l.isFull,
    })),
  );

  const value = resolveRealAvgAfterRecalc(fullCount, stats.realAvgConsumption);

  await tx.userVehicle.update({
    where: { id: vehicleId },
    data: {
      realAvgConsumption:
        value != null ? new Prisma.Decimal(value.toFixed(2)) : null,
    },
  });
  return value;
}

function assertNoDuplicateFullOdometer(
  existingFullOdometers: number[],
  odometerKm: number,
  excludeId?: string,
  existingId?: string,
): void {
  void excludeId;
  void existingId;
  if (existingFullOdometers.includes(odometerKm)) {
    throw new AppError(
      "FUEL_002",
      "Deux pleins complets au même odomètre sont impossibles",
      400,
    );
  }
}

export async function listVehicleFuelLogs(
  userId: string,
  vehicleId: string,
  rawQuery: Record<string, string | undefined> = {},
): Promise<PaginatedFuelLogs> {
  await getOwnedVehicleLite(userId, vehicleId);

  const page = Math.max(1, Number(rawQuery.page) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(rawQuery.pageSize) || DEFAULT_PAGE_SIZE),
  );

  const where = { vehicleId, deletedAt: null };
  const [total, rows] = await Promise.all([
    prisma.fuelLog.count({ where }),
    prisma.fuelLog.findMany({
      where,
      orderBy: [{ filledAt: "desc" }, { odometerKm: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map(toFuelLogDto),
    total,
    page,
    pageSize,
  };
}

export async function getFuelLogById(
  userId: string,
  fuelLogId: string,
): Promise<FuelLogDto> {
  const log = await getOwnedFuelLogOrThrow(userId, fuelLogId);
  return toFuelLogDto(log);
}

export async function getVehicleFuelStats(
  userId: string,
  vehicleId: string,
): Promise<FuelStatsDto> {
  await getOwnedVehicleLite(userId, vehicleId);

  const logs = await prisma.fuelLog.findMany({
    where: { vehicleId, deletedAt: null },
    orderBy: { odometerKm: "asc" },
  });

  const consumption = computeConsumptionStats(
    logs.map((l) => ({
      odometerKm: l.odometerKm,
      liters: Number(l.liters),
      isFull: l.isFull,
    })),
  );

  const fullFillCount = logs.filter((l) => l.isFull).length;
  const totalSpent = logs.reduce((s, l) => s + Number(l.totalCost), 0);
  const avgPricePerLiter =
    logs.length > 0
      ? logs.reduce((s, l) => s + Number(l.pricePerLiter), 0) / logs.length
      : null;

  return toFuelStatsDto({
    consumption,
    fullFillCount,
    totalFillCount: logs.length,
    avgPricePerLiter,
    totalSpent,
  });
}

export async function createFuelLog(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<FuelLogDto> {
  const input = parseZod(
    () => fuelLogCreateSchema.parse(raw),
    "Plein invalide",
  ) as FuelLogCreateInput;

  const vehicle = await getOwnedVehicleLite(userId, input.vehicleId);
  assertOdometerNotDecreasing(
    vehicle.currentOdometer,
    input.odometerKm,
    "FUEL_002",
  );

  const amounts = resolveAmountsOrThrow({
    liters: input.liters,
    pricePerLiter: input.pricePerLiter,
    totalCost: input.totalCost,
  });

  if (input.isFull) {
    const siblings = await prisma.fuelLog.findMany({
      where: {
        vehicleId: input.vehicleId,
        deletedAt: null,
        isFull: true,
      },
      select: { odometerKm: true },
    });
    assertNoDuplicateFullOdometer(
      siblings.map((s) => s.odometerKm),
      input.odometerKm,
    );
  }

  const created = await prisma.$transaction(async (tx) => {
    const log = await tx.fuelLog.create({
      data: {
        vehicleId: input.vehicleId,
        filledAt: input.filledAt,
        odometerKm: input.odometerKm,
        liters: new Prisma.Decimal(amounts.liters.toFixed(3)),
        pricePerLiter: new Prisma.Decimal(amounts.pricePerLiter.toFixed(3)),
        totalCost: new Prisma.Decimal(amounts.totalCost.toFixed(2)),
        isFull: input.isFull,
        fuelType: input.fuelType ?? null,
        stationName: input.stationName ?? null,
        notes: input.notes ?? null,
      },
    });

    await bumpOdometerIfHigher(
      tx,
      vehicle.id,
      vehicle.currentOdometer,
      input.odometerKm,
    );
    await recalculateRealAvgConsumption(tx, vehicle.id);
    return log;
  });

  await writeAuditLog({
    userId,
    entity: "fuel_logs",
    entityId: created.id,
    action: "create",
    newValue: {
      vehicleId: created.vehicleId,
      odometerKm: created.odometerKm,
      liters: created.liters.toString(),
      totalCost: created.totalCost.toString(),
      isFull: created.isFull,
    },
    ipAddress,
  });

  return toFuelLogDto(created);
}

export async function updateFuelLog(
  userId: string,
  fuelLogId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<FuelLogDto> {
  const existing = await getOwnedFuelLogOrThrow(userId, fuelLogId);
  const input = parseZod(
    () => fuelLogUpdateSchema.parse(raw),
    "Plein invalide",
  ) as FuelLogUpdateInput;

  const vehicle = await getOwnedVehicleLite(userId, existing.vehicleId);

  const nextOdo = input.odometerKm ?? existing.odometerKm;
  // Comparer au courant véhicule hors ce plein : si on baisse sous current
  // et que ce plein était le max, on autorise seulement ≥ autres références.
  // Règle produit : jamais inférieur à current_odometer du véhicule,
  // sauf si current vient de CE plein — alors ≥ 0 et on ne bump pas à la baisse.
  const odoFloor =
    vehicle.currentOdometer === existing.odometerKm
      ? 0
      : vehicle.currentOdometer;
  if (vehicle.currentOdometer !== existing.odometerKm) {
    assertOdometerNotDecreasing(odoFloor, nextOdo, "FUEL_002");
  } else if (nextOdo < 0) {
    throw new AppError("FUEL_002", "Kilométrage invalide", 400);
  }

  const amountTouched =
    input.liters !== undefined ||
    input.pricePerLiter !== undefined ||
    input.totalCost !== undefined;

  let amounts = {
    liters: Number(existing.liters),
    pricePerLiter: Number(existing.pricePerLiter),
    totalCost: Number(existing.totalCost),
  };

  if (amountTouched) {
    const provided = {
      liters: input.liters !== undefined ? input.liters : null,
      pricePerLiter:
        input.pricePerLiter !== undefined ? input.pricePerLiter : null,
      totalCost: input.totalCost !== undefined ? input.totalCost : null,
    };
    const providedCount = [
      provided.liters,
      provided.pricePerLiter,
      provided.totalCost,
    ].filter((v) => v != null).length;

    if (providedCount === 1) {
      // Une seule valeur → recalcule avec le couple complémentaire existant.
      if (provided.liters != null) {
        amounts = resolveAmountsOrThrow({
          liters: provided.liters,
          pricePerLiter: amounts.pricePerLiter,
          totalCost: null,
        });
      } else if (provided.pricePerLiter != null) {
        amounts = resolveAmountsOrThrow({
          liters: amounts.liters,
          pricePerLiter: provided.pricePerLiter,
          totalCost: null,
        });
      } else {
        amounts = resolveAmountsOrThrow({
          liters: amounts.liters,
          pricePerLiter: null,
          totalCost: provided.totalCost,
        });
      }
    } else {
      amounts = resolveAmountsOrThrow(provided);
    }
  }

  const nextIsFull = input.isFull ?? existing.isFull;
  if (nextIsFull) {
    const siblings = await prisma.fuelLog.findMany({
      where: {
        vehicleId: existing.vehicleId,
        deletedAt: null,
        isFull: true,
        id: { not: fuelLogId },
      },
      select: { odometerKm: true },
    });
    assertNoDuplicateFullOdometer(
      siblings.map((s) => s.odometerKm),
      nextOdo,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const log = await tx.fuelLog.update({
      where: { id: fuelLogId },
      data: {
        ...(input.filledAt !== undefined ? { filledAt: input.filledAt } : {}),
        ...(input.odometerKm !== undefined
          ? { odometerKm: input.odometerKm }
          : {}),
        ...(amountTouched
          ? {
              liters: new Prisma.Decimal(amounts.liters.toFixed(3)),
              pricePerLiter: new Prisma.Decimal(
                amounts.pricePerLiter.toFixed(3),
              ),
              totalCost: new Prisma.Decimal(amounts.totalCost.toFixed(2)),
            }
          : {}),
        ...(input.isFull !== undefined ? { isFull: input.isFull } : {}),
        ...(input.fuelType !== undefined ? { fuelType: input.fuelType } : {}),
        ...(input.stationName !== undefined
          ? { stationName: input.stationName }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    await bumpOdometerIfHigher(
      tx,
      vehicle.id,
      vehicle.currentOdometer,
      nextOdo,
    );
    await recalculateRealAvgConsumption(tx, vehicle.id);
    return log;
  });

  await writeAuditLog({
    userId,
    entity: "fuel_logs",
    entityId: fuelLogId,
    action: "update",
    oldValue: {
      odometerKm: existing.odometerKm,
      liters: existing.liters.toString(),
      totalCost: existing.totalCost.toString(),
    },
    newValue: {
      odometerKm: updated.odometerKm,
      liters: updated.liters.toString(),
      totalCost: updated.totalCost.toString(),
    },
    ipAddress,
  });

  return toFuelLogDto(updated);
}

export async function deleteFuelLog(
  userId: string,
  fuelLogId: string,
  ipAddress?: string | null,
): Promise<void> {
  const existing = await getOwnedFuelLogOrThrow(userId, fuelLogId);

  await prisma.$transaction(async (tx) => {
    await tx.fuelLog.update({
      where: { id: fuelLogId },
      data: { deletedAt: new Date() },
    });
    await recalculateRealAvgConsumption(tx, existing.vehicleId);
  });

  await writeAuditLog({
    userId,
    entity: "fuel_logs",
    entityId: fuelLogId,
    action: "delete",
    oldValue: {
      vehicleId: existing.vehicleId,
      odometerKm: existing.odometerKm,
      liters: existing.liters.toString(),
    },
    ipAddress,
  });
}
