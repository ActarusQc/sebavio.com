import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { createInAppNotification } from "@/features/notifications/services/create";
import { getScheduleWithCacheAndFallback } from "./provider-factory";
import { computeDueStatus } from "./due-engine";
import { resolveUsageCondition, taskAppliesToCondition } from "./usage-profile";
import type { NormalizedMaintenanceTask, UsageFactorFlags } from "./types";

async function getOwnedVehicle(userId: string, vehicleId: string) {
  const vehicle = await prisma.userVehicle.findFirst({
    where: { id: vehicleId, userId, deletedAt: null },
  });
  if (!vehicle) {
    throw new AppError("VEH_001", "Véhicule introuvable", 404);
  }
  return vehicle;
}

/**
 * Synchronise le calendrier fournisseur, déduplique les tâches,
 * régénère les rappels et notifie en cas d’échec / données stale.
 */
export async function syncVehicleMaintenanceSchedule(
  userId: string,
  vehicleId: string,
  opts?: { forceRefresh?: boolean },
): Promise<{
  scheduleId: string;
  taskCount: number;
  reminderCount: number;
  fromCache: boolean;
  staleFallback: boolean;
  warning?: string;
  provider: string;
}> {
  const vehicle = await prisma.userVehicle.findFirst({
    where: { id: vehicleId, userId, deletedAt: null },
    include: { model: { include: { manufacturer: true } } },
  });
  if (!vehicle) {
    throw new AppError("VEH_001", "Véhicule introuvable", 404);
  }

  const make =
    vehicle.manualManufacturerName ??
    vehicle.manufacturerName ??
    vehicle.model?.manufacturer.name ??
    null;
  const modelName = vehicle.manualModelName ?? vehicle.model?.modelName ?? null;
  const year = vehicle.manualYear ?? vehicle.model?.year ?? null;

  let fetchResult;
  try {
    fetchResult = await getScheduleWithCacheAndFallback(
      {
        vin: vehicle.vin,
        year,
        make,
        manufacturer: vehicle.manufacturerName,
        model: modelName,
        trim: vehicle.manualTrim ?? vehicle.model?.trim ?? null,
        engine: vehicle.engine,
        fuelType: vehicle.fuelType,
        vehicleType: vehicle.vehicleType ?? vehicle.manualCategory,
      },
      opts,
    );
  } catch (error) {
    const existing = await prisma.providerMaintenanceSchedule.findUnique({
      where: {
        vehicleId_provider: {
          vehicleId,
          provider:
            (process.env.MAINTENANCE_PROVIDER ?? "mock")
              .trim()
              .toLowerCase() === "mock"
              ? "mock"
              : (process.env.MAINTENANCE_PROVIDER ?? "commercial")
                  .trim()
                  .toLowerCase(),
        },
      },
      include: { tasks: true },
    });

    if (existing) {
      await prisma.providerMaintenanceSchedule.update({
        where: { id: existing.id },
        data: {
          isStale: true,
          lastSyncError:
            error instanceof AppError
              ? error.message.slice(0, 500)
              : "Sync failed",
        },
      });

      await createInAppNotification({
        userId,
        type: "maintenance",
        title: "Échec de synchronisation d’entretien",
        body: "Le calendrier n’a pas pu être actualisé. Les données locales sont conservées.",
        priority: "normal",
        dedupeKey: `mnt-sync-fail:${vehicleId}:${new Date().toISOString().slice(0, 10)}`,
        sourceEntity: "user_vehicle",
        sourceId: vehicleId,
        href: `/dashboard/vehicles/${vehicleId}/maintenance`,
      });

      const reminders = await regenerateRemindersForVehicle(userId, vehicleId);
      return {
        scheduleId: existing.id,
        taskCount: existing.tasks.length,
        reminderCount: reminders,
        fromCache: true,
        staleFallback: true,
        warning:
          "Les données n’ont pas pu être actualisées. Affichage du dernier calendrier valide.",
        provider: existing.provider,
      };
    }

    throw error;
  }

  const { result, fromCache, staleFallback, errorMessage } = fetchResult;
  const provider = result.providerName;

  const schedule = await prisma.$transaction(async (tx) => {
    const upserted = await tx.providerMaintenanceSchedule.upsert({
      where: {
        vehicleId_provider: { vehicleId, provider },
      },
      create: {
        vehicleId,
        provider,
        providerVehicleId: result.providerVehicleId ?? null,
        sourceType: result.sourceType,
        sourceReference: result.sourceReference ?? null,
        sourceRetrievedAt: new Date(),
        sourceVersion: result.sourceVersion ?? null,
        normalConditions: result.normalConditions,
        severeConditions: result.severeConditions,
        rawDataHash: result.rawDataHash ?? null,
        isStale: staleFallback,
        lastSyncError: errorMessage?.slice(0, 500) ?? null,
      },
      update: {
        providerVehicleId: result.providerVehicleId ?? null,
        sourceType: result.sourceType,
        sourceReference: result.sourceReference ?? null,
        sourceRetrievedAt: new Date(),
        sourceVersion: result.sourceVersion ?? null,
        normalConditions: result.normalConditions,
        severeConditions: result.severeConditions,
        rawDataHash: result.rawDataHash ?? null,
        isStale: staleFallback,
        lastSyncError: errorMessage?.slice(0, 500) ?? null,
      },
    });

    const existingTasks = await tx.maintenanceTaskDefinition.findMany({
      where: { scheduleId: upserted.id },
    });
    const byExternal = new Map(
      existingTasks
        .filter((t) => t.externalId)
        .map((t) => [t.externalId as string, t]),
    );
    const seen = new Set<string>();

    for (const task of result.tasks) {
      const key = task.externalId ?? `title:${task.title}:${task.category}`;
      seen.add(key);
      const data = taskToDb(task);
      const existing = task.externalId
        ? byExternal.get(task.externalId)
        : existingTasks.find(
            (t) => t.title === task.title && t.category === task.category,
          );

      if (existing) {
        await tx.maintenanceTaskDefinition.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await tx.maintenanceTaskDefinition.create({
          data: {
            scheduleId: upserted.id,
            externalId: task.externalId ?? key,
            ...data,
          },
        });
      }
    }

    // Ne pas supprimer les tâches historiques liées à des événements —
    // on laisse les tâches absentes du nouveau flux mais on ne les efface pas
    // si un historique y est lié.
    for (const old of existingTasks) {
      const key = old.externalId ?? `title:${old.title}:${old.category}`;
      if (seen.has(key)) continue;
      const linked = await tx.maintenanceHistory.count({
        where: { taskDefinitionId: old.id, deletedAt: null },
      });
      if (linked === 0) {
        await tx.vehicleMaintenanceReminder.deleteMany({
          where: { taskDefinitionId: old.id },
        });
        await tx.maintenanceTaskDefinition.delete({ where: { id: old.id } });
      }
    }

    return upserted;
  });

  const reminderCount = await regenerateRemindersForVehicle(userId, vehicleId);

  if (staleFallback) {
    await createInAppNotification({
      userId,
      type: "maintenance",
      title: "Échec de synchronisation d’entretien",
      body: "Les données n’ont pas pu être actualisées. Le dernier calendrier valide est affiché.",
      priority: "normal",
      dedupeKey: `mnt-sync-stale:${vehicleId}:${new Date().toISOString().slice(0, 10)}`,
      sourceEntity: "user_vehicle",
      sourceId: vehicleId,
      href: `/dashboard/vehicles/${vehicleId}/maintenance`,
    });
  }

  return {
    scheduleId: schedule.id,
    taskCount: result.tasks.length,
    reminderCount,
    fromCache,
    staleFallback,
    warning: result.warning,
    provider,
  };
}

function taskToDb(task: NormalizedMaintenanceTask) {
  return {
    category: task.category,
    title: task.title,
    description: task.description ?? null,
    actionType: task.actionType,
    intervalKm: task.intervalKm ?? null,
    intervalMonths: task.intervalMonths ?? null,
    firstDueKm: task.firstDueKm ?? null,
    firstDueMonths: task.firstDueMonths ?? null,
    conditionType: task.conditionType,
    priority: task.priority,
    officialManufacturerRecommendation: task.officialManufacturerRecommendation,
    inspectionOnly: task.inspectionOnly,
    estimatedDurationMinutes: task.estimatedDurationMinutes ?? null,
    notes: task.notes ?? null,
  };
}

export async function regenerateRemindersForVehicle(
  userId: string,
  vehicleId: string,
): Promise<number> {
  const vehicle = await getOwnedVehicle(userId, vehicleId);

  const schedules = await prisma.providerMaintenanceSchedule.findMany({
    where: { vehicleId },
    include: { tasks: true },
    orderBy: { sourceRetrievedAt: "desc" },
  });

  if (schedules.length === 0) return 0;

  const schedule = schedules[0]!;
  const factors = (vehicle.usageFactors ?? {}) as UsageFactorFlags;
  const effective = resolveUsageCondition({
    profile:
      (vehicle.usageProfile as "normal" | "severe" | "automatic") ||
      "automatic",
    factors,
    annualEstimatedKm: vehicle.annualEstimatedKm,
    vehicleType: vehicle.vehicleType ?? vehicle.manualCategory,
  });

  const histories = await prisma.maintenanceHistory.findMany({
    where: { vehicleId, deletedAt: null, taskDefinitionId: { not: null } },
    orderBy: [{ performedDate: "desc" }, { performedOdometer: "desc" }],
  });

  const lastByTask = new Map<string, (typeof histories)[number]>();
  for (const h of histories) {
    if (h.taskDefinitionId && !lastByTask.has(h.taskDefinitionId)) {
      lastByTask.set(h.taskDefinitionId, h);
    }
  }

  const existingReminders = await prisma.vehicleMaintenanceReminder.findMany({
    where: { vehicleId },
  });
  const reminderByTask = new Map(
    existingReminders.map((r) => [r.taskDefinitionId, r]),
  );

  let count = 0;
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });
  const leadDays = prefs?.maintenanceLeadDays ?? 30;
  const leadKm = prefs?.maintenanceLeadKm ?? 500;

  for (const task of schedule.tasks) {
    if (
      !taskAppliesToCondition(
        task.conditionType as "normal" | "severe" | "both",
        effective,
      )
    ) {
      continue;
    }

    const last = lastByTask.get(task.id);
    const dismissed = reminderByTask.get(task.id);
    if (
      dismissed?.dismissedUntil &&
      dismissed.dismissedUntil.getTime() > Date.now()
    ) {
      continue;
    }

    const due = computeDueStatus({
      intervalKm: task.intervalKm,
      intervalMonths: task.intervalMonths,
      firstDueKm: task.firstDueKm,
      firstDueMonths: task.firstDueMonths,
      lastServiceDate: last?.performedDate ?? null,
      lastServiceOdometer: last?.performedOdometer ?? null,
      inServiceDate: vehicle.inServiceDate ?? vehicle.purchaseDate,
      currentOdometer: vehicle.currentOdometer,
      inspectionOnly: task.inspectionOnly,
    });

    const status =
      last && due.status === "unknown"
        ? "completed"
        : due.status === "unknown"
          ? "unknown"
          : due.status;

    await prisma.vehicleMaintenanceReminder.upsert({
      where: {
        vehicleId_taskDefinitionId: {
          vehicleId,
          taskDefinitionId: task.id,
        },
      },
      create: {
        vehicleId,
        taskDefinitionId: task.id,
        dueDate: due.dueDate,
        dueOdometerKm: due.dueOdometerKm,
        status,
        priority: task.priority,
        calculationSource: "calculated",
        completedEventId: status === "completed" ? (last?.id ?? null) : null,
      },
      update: {
        dueDate: due.dueDate,
        dueOdometerKm: due.dueOdometerKm,
        status:
          dismissed?.status === "dismissed" &&
          dismissed.dismissedUntil &&
          dismissed.dismissedUntil.getTime() > Date.now()
            ? "dismissed"
            : status,
        priority: task.priority,
        completedEventId: status === "completed" ? (last?.id ?? null) : null,
      },
    });
    count += 1;

    if (status === "overdue" || status === "due_now" || status === "due_soon") {
      const withinLead =
        status === "overdue" ||
        status === "due_now" ||
        (due.remainingDays != null && due.remainingDays <= leadDays) ||
        (due.remainingKm != null && due.remainingKm <= leadKm);

      if (withinLead) {
        const title =
          status === "overdue" ? "Entretien en retard" : "Entretien dû bientôt";
        await createInAppNotification({
          userId,
          type: "maintenance",
          title,
          body: `${task.title} — ${vehicle.nickname ?? "véhicule"}`,
          priority: status === "overdue" ? "high" : "normal",
          dedupeKey: `mnt-due:${vehicleId}:${task.id}:${status}`,
          sourceEntity: "maintenance_task",
          sourceId: task.id,
          href: `/dashboard/vehicles/${vehicleId}/maintenance`,
        });
      }
    }
  }

  return count;
}
