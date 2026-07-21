import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import { assertOdometerNotDecreasing } from "@/features/vehicles/services/odometer";
import { regenerateRemindersForVehicle } from "@/services/maintenance-schedule/sync";
import {
  maintenanceEventCreateSchema,
  maintenanceEventUpdateSchema,
  dismissReminderSchema,
  type MaintenanceEventCreateInput,
} from "@/features/vehicle-maintenance/schemas";

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

async function assertOwnedVehicle(userId: string, vehicleId: string) {
  const vehicle = await prisma.userVehicle.findFirst({
    where: { id: vehicleId, userId, deletedAt: null },
  });
  if (!vehicle) {
    throw new AppError("VEH_001", "Véhicule introuvable", 404);
  }
  return vehicle;
}

export async function createProviderMaintenanceEvent(
  userId: string,
  vehicleId: string,
  raw: unknown,
  ip?: string | null,
) {
  const input = parseZod(
    () => maintenanceEventCreateSchema.parse(raw),
    "Données d’entretien invalides",
  ) as MaintenanceEventCreateInput;

  const vehicle = await assertOwnedVehicle(userId, vehicleId);
  assertOdometerNotDecreasing(vehicle.currentOdometer, input.odometerKm);

  if (input.taskDefinitionId) {
    const task = await prisma.maintenanceTaskDefinition.findFirst({
      where: {
        id: input.taskDefinitionId,
        schedule: { vehicleId },
      },
    });
    if (!task) {
      throw new AppError("MNT_001", "Tâche d’entretien introuvable", 404);
    }
  }

  const event = await prisma.$transaction(async (tx) => {
    const created = await tx.maintenanceHistory.create({
      data: {
        vehicleId,
        taskDefinitionId: input.taskDefinitionId ?? null,
        performedDate: input.serviceDate,
        performedOdometer: input.odometerKm,
        status: input.status,
        provider: input.providerName,
        invoiceNumber: input.invoiceNumber,
        cost: input.cost ?? null,
        currency: input.currency ?? "CAD",
        notes: input.notes,
        attachmentUrl: input.attachmentUrl,
      },
    });

    if (input.odometerKm > vehicle.currentOdometer) {
      await tx.userVehicle.update({
        where: { id: vehicleId },
        data: {
          currentOdometer: input.odometerKm,
          odometerUpdatedAt: new Date(),
        },
      });
    }

    if (input.taskDefinitionId) {
      await tx.vehicleMaintenanceReminder.updateMany({
        where: { vehicleId, taskDefinitionId: input.taskDefinitionId },
        data: {
          status: "completed",
          completedEventId: created.id,
        },
      });
    }

    return created;
  });

  await regenerateRemindersForVehicle(userId, vehicleId);

  await writeAuditLog({
    userId,
    action: "maintenance.event.create",
    entity: "maintenance_history",
    entityId: event.id,
    newValue: { vehicleId, taskDefinitionId: input.taskDefinitionId },
    ipAddress: ip ?? null,
  });

  return event;
}

export async function updateProviderMaintenanceEvent(
  userId: string,
  vehicleId: string,
  eventId: string,
  raw: unknown,
) {
  const input = parseZod(
    () => maintenanceEventUpdateSchema.parse(raw),
    "Données invalides",
  );
  await assertOwnedVehicle(userId, vehicleId);

  const existing = await prisma.maintenanceHistory.findFirst({
    where: { id: eventId, vehicleId, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("MNT_001", "Entretien introuvable", 404);
  }

  const updated = await prisma.maintenanceHistory.update({
    where: { id: eventId },
    data: {
      ...(input.taskDefinitionId !== undefined
        ? { taskDefinitionId: input.taskDefinitionId }
        : {}),
      ...(input.serviceDate !== undefined
        ? { performedDate: input.serviceDate }
        : {}),
      ...(input.odometerKm !== undefined
        ? { performedOdometer: input.odometerKm }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.providerName !== undefined
        ? { provider: input.providerName }
        : {}),
      ...(input.invoiceNumber !== undefined
        ? { invoiceNumber: input.invoiceNumber }
        : {}),
      ...(input.cost !== undefined ? { cost: input.cost } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.attachmentUrl !== undefined
        ? { attachmentUrl: input.attachmentUrl }
        : {}),
    },
  });

  await regenerateRemindersForVehicle(userId, vehicleId);
  return updated;
}

export async function dismissProviderReminder(
  userId: string,
  vehicleId: string,
  reminderId: string,
  raw: unknown,
) {
  const input = parseZod(
    () => dismissReminderSchema.parse(raw ?? {}),
    "Données invalides",
  );
  await assertOwnedVehicle(userId, vehicleId);

  const reminder = await prisma.vehicleMaintenanceReminder.findFirst({
    where: { id: reminderId, vehicleId },
  });
  if (!reminder) {
    throw new AppError("MNT_002", "Rappel introuvable", 404);
  }

  const until = new Date();
  until.setUTCDate(until.getUTCDate() + input.days);

  return prisma.vehicleMaintenanceReminder.update({
    where: { id: reminderId },
    data: {
      status: "dismissed",
      dismissedUntil: until,
    },
  });
}

export async function listProviderReminders(userId: string, vehicleId: string) {
  await assertOwnedVehicle(userId, vehicleId);
  return prisma.vehicleMaintenanceReminder.findMany({
    where: { vehicleId },
    include: {
      taskDefinition: true,
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
}
