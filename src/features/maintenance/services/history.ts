import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  documentCreateSchema,
  historyCreateSchema,
  historyListSchema,
  historyUpdateSchema,
  type DocumentCreateInput,
  type HistoryCreateInput,
  type HistoryUpdateInput,
} from "@/features/maintenance/schemas";
import {
  clampPageSize,
  toDocumentDto,
  toHistoryDto,
} from "@/features/maintenance/services/mappers";
import {
  getOwnedVehicleForMaintenance,
  recalculateInTx,
} from "@/features/maintenance/services/schedule";
import { MAX_PAGE_SIZE } from "@/features/maintenance/constants";
import {
  assertOdometerNotDecreasing,
  bumpOdometerIfHigher,
} from "@/features/vehicles/services/odometer";
import type {
  MaintenanceDocumentDto,
  MaintenanceHistoryDto,
  PaginatedHistory,
} from "@/features/maintenance/types";

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

const historyInclude = {
  template: { select: { title: true } },
  documents: { orderBy: { uploadedAt: "desc" as const } },
} as const;

async function getOwnedHistoryOrThrow(userId: string, historyId: string) {
  const row = await prisma.maintenanceHistory.findFirst({
    where: {
      id: historyId,
      deletedAt: null,
      vehicle: { userId, deletedAt: null },
    },
    include: historyInclude,
  });
  if (!row) {
    throw new AppError("MNT_001", "Entretien introuvable", 404);
  }
  return row;
}

export async function listHistory(
  userId: string,
  rawQuery: Record<string, string | string[] | undefined>,
): Promise<PaginatedHistory> {
  const query = Object.fromEntries(
    Object.entries(rawQuery).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = parseZod(
    () => historyListSchema.parse(query),
    "Paramètres de liste invalides",
  );
  const pageSize = clampPageSize(parsed.pageSize, MAX_PAGE_SIZE);
  const page = parsed.page;

  if (parsed.vehicleId) {
    await getOwnedVehicleForMaintenance(userId, parsed.vehicleId);
  }

  const where = {
    deletedAt: null,
    vehicle: { userId, deletedAt: null },
    ...(parsed.vehicleId ? { vehicleId: parsed.vehicleId } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.maintenanceHistory.count({ where }),
    prisma.maintenanceHistory.findMany({
      where,
      include: historyInclude,
      orderBy: [{ performedDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map(toHistoryDto),
    page,
    pageSize,
    total,
  };
}

export async function listVehicleHistory(
  userId: string,
  vehicleId: string,
): Promise<{ items: MaintenanceHistoryDto[] }> {
  await getOwnedVehicleForMaintenance(userId, vehicleId);
  const rows = await prisma.maintenanceHistory.findMany({
    where: { vehicleId, deletedAt: null },
    include: historyInclude,
    orderBy: [{ performedDate: "desc" }, { createdAt: "desc" }],
  });
  return { items: rows.map(toHistoryDto) };
}

export async function getHistoryById(
  userId: string,
  historyId: string,
): Promise<MaintenanceHistoryDto> {
  const row = await getOwnedHistoryOrThrow(userId, historyId);
  return toHistoryDto(row);
}

export async function createHistory(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<MaintenanceHistoryDto> {
  const input = parseZod(
    () => historyCreateSchema.parse(raw),
    "Entretien invalide",
  ) as HistoryCreateInput;

  const vehicle = await getOwnedVehicleForMaintenance(userId, input.vehicleId);

  assertOdometerNotDecreasing(
    vehicle.currentOdometer,
    input.performedOdometer,
    "MNT_002",
  );

  if (input.templateId) {
    const template = await prisma.maintenanceTemplate.findUnique({
      where: { id: input.templateId },
    });
    if (!template) {
      throw new AppError("MNT_004", "Programme constructeur absent", 404);
    }
    if (vehicle.modelId && template.modelId !== vehicle.modelId) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Gabarit non lié au modèle du véhicule",
        400,
      );
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const history = await tx.maintenanceHistory.create({
      data: {
        vehicleId: input.vehicleId,
        templateId: input.templateId,
        performedDate: input.performedDate,
        performedOdometer: input.performedOdometer,
        provider: input.provider ?? null,
        cost: input.cost ?? null,
        currency: input.currency ?? null,
        notes: input.notes ?? null,
      },
      include: historyInclude,
    });

    await bumpOdometerIfHigher(
      tx,
      vehicle.id,
      vehicle.currentOdometer,
      input.performedOdometer,
    );

    // Marquer l'échéance ouverte du gabarit comme complétée avant recalcul.
    if (input.templateId) {
      await tx.maintenanceSchedule.updateMany({
        where: {
          vehicleId: vehicle.id,
          templateId: input.templateId,
          status: { in: ["upcoming", "overdue"] },
        },
        data: { status: "completed" },
      });
    }

    await recalculateInTx(tx, {
      vehicleId: vehicle.id,
      modelId: vehicle.modelId,
      purchaseDate: vehicle.purchaseDate,
      currentOdometer: Math.max(
        vehicle.currentOdometer,
        input.performedOdometer,
      ),
    });

    return history;
  });

  await writeAuditLog({
    userId,
    entity: "maintenance_history",
    entityId: created.id,
    action: "create",
    newValue: {
      vehicleId: created.vehicleId,
      templateId: created.templateId,
      performedDate: created.performedDate.toISOString().slice(0, 10),
      performedOdometer: created.performedOdometer,
      cost: created.cost?.toString() ?? null,
    },
    ipAddress,
  });

  return toHistoryDto(created);
}

export async function updateHistory(
  userId: string,
  historyId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<MaintenanceHistoryDto> {
  const existing = await getOwnedHistoryOrThrow(userId, historyId);
  const input = parseZod(
    () => historyUpdateSchema.parse(raw),
    "Entretien invalide",
  ) as HistoryUpdateInput;

  const vehicle = await getOwnedVehicleForMaintenance(
    userId,
    existing.vehicleId,
  );

  if (input.templateId) {
    const template = await prisma.maintenanceTemplate.findUnique({
      where: { id: input.templateId },
    });
    if (!template) {
      throw new AppError("MNT_004", "Programme constructeur absent", 404);
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const history = await tx.maintenanceHistory.update({
      where: { id: historyId },
      data: {
        templateId:
          input.templateId !== undefined ? input.templateId : undefined,
        performedDate: input.performedDate ?? undefined,
        performedOdometer: input.performedOdometer ?? undefined,
        provider: input.provider !== undefined ? input.provider : undefined,
        cost: input.cost !== undefined ? input.cost : undefined,
        currency: input.currency !== undefined ? input.currency : undefined,
        notes: input.notes !== undefined ? input.notes : undefined,
      },
      include: historyInclude,
    });

    await recalculateInTx(tx, {
      vehicleId: vehicle.id,
      modelId: vehicle.modelId,
      purchaseDate: vehicle.purchaseDate,
      currentOdometer: vehicle.currentOdometer,
    });

    return history;
  });

  await writeAuditLog({
    userId,
    entity: "maintenance_history",
    entityId: historyId,
    action: "update",
    oldValue: {
      performedOdometer: existing.performedOdometer,
      cost: existing.cost?.toString() ?? null,
    },
    newValue: {
      performedOdometer: updated.performedOdometer,
      cost: updated.cost?.toString() ?? null,
    },
    ipAddress,
  });

  return toHistoryDto(updated);
}

/**
 * Soft delete + recalcul automatique du schedule du véhicule (ajustement Partie 10).
 */
export async function deleteHistory(
  userId: string,
  historyId: string,
  ipAddress?: string | null,
): Promise<void> {
  const existing = await getOwnedHistoryOrThrow(userId, historyId);
  const vehicle = await getOwnedVehicleForMaintenance(
    userId,
    existing.vehicleId,
  );

  await prisma.$transaction(async (tx) => {
    await tx.maintenanceHistory.update({
      where: { id: historyId },
      data: { deletedAt: new Date() },
    });

    await recalculateInTx(tx, {
      vehicleId: vehicle.id,
      modelId: vehicle.modelId,
      purchaseDate: vehicle.purchaseDate,
      currentOdometer: vehicle.currentOdometer,
    });
  });

  await writeAuditLog({
    userId,
    entity: "maintenance_history",
    entityId: historyId,
    action: "delete",
    oldValue: {
      vehicleId: existing.vehicleId,
      templateId: existing.templateId,
      performedDate: existing.performedDate.toISOString().slice(0, 10),
    },
    ipAddress,
  });
}

export async function addHistoryDocument(
  userId: string,
  historyId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<MaintenanceDocumentDto> {
  await getOwnedHistoryOrThrow(userId, historyId);
  const input = parseZod(
    () => documentCreateSchema.parse(raw),
    "Document invalide",
  ) as DocumentCreateInput;

  if (!input.fileUrl) {
    throw new AppError("MNT_005", "Document invalide", 400);
  }

  const doc = await prisma.maintenanceDocument.create({
    data: {
      historyId,
      documentType: input.documentType,
      fileUrl: input.fileUrl,
    },
  });

  await writeAuditLog({
    userId,
    entity: "maintenance_documents",
    entityId: doc.id,
    action: "create",
    newValue: {
      historyId,
      documentType: doc.documentType,
      fileUrl: doc.fileUrl,
    },
    ipAddress,
  });

  return toDocumentDto(doc);
}
