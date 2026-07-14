import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { getOwnedVehicleOrThrow } from "@/features/vehicles/services/vehicles";
import {
  calculateNextDue,
  isApproachingDue,
} from "@/features/maintenance/services/schedule-calc";
import { toScheduleDto } from "@/features/maintenance/services/mappers";
import type { MaintenanceScheduleDto } from "@/features/maintenance/types";

type Tx = Prisma.TransactionClient;

async function getOwnedVehicleForMaintenance(
  userId: string,
  vehicleId: string,
) {
  try {
    return await getOwnedVehicleOrThrow(userId, vehicleId);
  } catch (error) {
    if (
      error instanceof AppError &&
      (error.code === "VEH_001" || error.code === "MNT_003")
    ) {
      throw new AppError("MNT_003", "Véhicule introuvable", 404);
    }
    throw error;
  }
}

/**
 * Recalcule les échéances d'un véhicule à partir des gabarits du modèle
 * et du dernier historique non supprimé.
 *
 * Notifications : AUCUNE génération en masse ici. Une ligne
 * `maintenance_notifications` (sent=false) n'est créée que si l'échéance
 * approche (14 j / 500 km). L'envoi appartient au module Notifications.
 */
export async function recalculateVehicleSchedule(
  userId: string,
  vehicleId: string,
): Promise<MaintenanceScheduleDto[]> {
  const vehicle = await getOwnedVehicleForMaintenance(userId, vehicleId);

  await prisma.$transaction(async (tx) => {
    await recalculateInTx(tx, {
      vehicleId: vehicle.id,
      modelId: vehicle.modelId,
      purchaseDate: vehicle.purchaseDate,
      currentOdometer: vehicle.currentOdometer,
    });
  });

  return listVehicleSchedule(userId, vehicleId);
}

export async function recalculateInTx(
  tx: Tx,
  params: {
    vehicleId: string;
    modelId: string | null;
    purchaseDate: Date | null;
    currentOdometer: number;
  },
): Promise<void> {
  const now = new Date();

  if (!params.modelId) {
    // Pas de modèle catalogue : rafraîchir seulement le statut des échéances existantes.
    const existing = await tx.maintenanceSchedule.findMany({
      where: {
        vehicleId: params.vehicleId,
        status: { in: ["upcoming", "overdue"] },
      },
      include: { template: true },
    });
    for (const row of existing) {
      const due = calculateNextDue({
        intervalKm: row.template?.intervalKm ?? null,
        intervalMonths: row.template?.intervalMonths ?? null,
        performedDate: null,
        performedOdometer: null,
        purchaseDate: params.purchaseDate,
        currentOdometer: params.currentOdometer,
        today: now,
      });
      // Sans historique récent, conserver les next_due déjà stockés et ne mettre à jour que le statut.
      const status =
        (row.nextDueDate &&
          row.nextDueDate.getTime() <
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate(),
            )) ||
        (row.nextDueOdometer != null &&
          row.nextDueOdometer <= params.currentOdometer)
          ? "overdue"
          : "upcoming";
      await tx.maintenanceSchedule.update({
        where: { id: row.id },
        data: { status, lastCalculatedAt: now },
      });
      await maybeCreateApproachingNotification(tx, {
        vehicleId: params.vehicleId,
        scheduleId: row.id,
        nextDueDate: row.nextDueDate,
        nextDueOdometer: row.nextDueOdometer,
        currentOdometer: params.currentOdometer,
        today: now,
      });
      void due;
    }
    return;
  }

  const templates = await tx.maintenanceTemplate.findMany({
    where: { modelId: params.modelId },
  });

  for (const template of templates) {
    const lastHistory = await tx.maintenanceHistory.findFirst({
      where: {
        vehicleId: params.vehicleId,
        templateId: template.id,
        deletedAt: null,
      },
      orderBy: [{ performedDate: "desc" }, { performedOdometer: "desc" }],
    });

    const due = calculateNextDue({
      intervalKm: template.intervalKm,
      intervalMonths: template.intervalMonths,
      performedDate: lastHistory?.performedDate ?? null,
      performedOdometer: lastHistory?.performedOdometer ?? null,
      purchaseDate: params.purchaseDate,
      currentOdometer: params.currentOdometer,
      today: now,
    });

    const openSchedule = await tx.maintenanceSchedule.findFirst({
      where: {
        vehicleId: params.vehicleId,
        templateId: template.id,
        status: { in: ["upcoming", "overdue"] },
      },
    });

    let scheduleId: string;
    if (openSchedule) {
      const updated = await tx.maintenanceSchedule.update({
        where: { id: openSchedule.id },
        data: {
          nextDueDate: due.nextDueDate,
          nextDueOdometer: due.nextDueOdometer,
          status: due.status,
          lastCalculatedAt: now,
        },
      });
      scheduleId = updated.id;
    } else {
      const created = await tx.maintenanceSchedule.create({
        data: {
          vehicleId: params.vehicleId,
          templateId: template.id,
          nextDueDate: due.nextDueDate,
          nextDueOdometer: due.nextDueOdometer,
          status: due.status,
          lastCalculatedAt: now,
        },
      });
      scheduleId = created.id;
    }

    await maybeCreateApproachingNotification(tx, {
      vehicleId: params.vehicleId,
      scheduleId,
      nextDueDate: due.nextDueDate,
      nextDueOdometer: due.nextDueOdometer,
      currentOdometer: params.currentOdometer,
      today: now,
    });
  }
}

async function maybeCreateApproachingNotification(
  tx: Tx,
  params: {
    vehicleId: string;
    scheduleId: string;
    nextDueDate: Date | null;
    nextDueOdometer: number | null;
    currentOdometer: number;
    today: Date;
  },
): Promise<void> {
  if (
    !isApproachingDue({
      nextDueDate: params.nextDueDate,
      nextDueOdometer: params.nextDueOdometer,
      currentOdometer: params.currentOdometer,
      today: params.today,
    })
  ) {
    return;
  }

  const existing = await tx.maintenanceNotification.findFirst({
    where: {
      scheduleId: params.scheduleId,
      sent: false,
    },
  });
  if (existing) return;

  const notificationDate =
    params.nextDueDate ??
    new Date(params.today.getTime() + 14 * 24 * 60 * 60 * 1000);

  await tx.maintenanceNotification.create({
    data: {
      vehicleId: params.vehicleId,
      scheduleId: params.scheduleId,
      notificationDate,
      type: "email",
      sent: false,
    },
  });
}

export async function listVehicleSchedule(
  userId: string,
  vehicleId: string,
): Promise<MaintenanceScheduleDto[]> {
  await getOwnedVehicleForMaintenance(userId, vehicleId);
  const rows = await prisma.maintenanceSchedule.findMany({
    where: { vehicleId },
    include: { template: true },
    orderBy: [{ status: "asc" }, { nextDueDate: "asc" }],
  });
  return rows.map(toScheduleDto);
}

export async function listUserSchedules(
  userId: string,
): Promise<MaintenanceScheduleDto[]> {
  const vehicles = await prisma.userVehicle.findMany({
    where: { userId, deletedAt: null },
    select: { id: true },
  });
  const ids = vehicles.map((v) => v.id);
  if (ids.length === 0) return [];

  const rows = await prisma.maintenanceSchedule.findMany({
    where: { vehicleId: { in: ids } },
    include: { template: true },
    orderBy: [{ status: "asc" }, { nextDueDate: "asc" }],
  });
  return rows.map(toScheduleDto);
}

export { getOwnedVehicleForMaintenance };
