import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import {
  resolveUsageCondition,
  taskAppliesToCondition,
} from "@/services/maintenance-schedule/usage-profile";
import type { UsageFactorFlags } from "@/services/maintenance-schedule/types";

function sourceLabel(params: {
  official: boolean;
  sourceType: string;
  provider: string;
}): { label: string; kind: "manufacturer" | "sebavio" | "demo" | "manual" } {
  if (params.sourceType === "mock" || params.provider === "mock") {
    return {
      label:
        "Données de démonstration — ne pas utiliser comme recommandation mécanique officielle.",
      kind: "demo",
    };
  }
  if (params.official) {
    return { label: "Recommandation du fabricant", kind: "manufacturer" };
  }
  if (params.sourceType === "manual") {
    return { label: "Saisie manuelle", kind: "manual" };
  }
  return { label: "Conseil préventif Sebavio", kind: "sebavio" };
}

export async function getProviderMaintenanceDashboard(
  userId: string,
  vehicleId: string,
) {
  const vehicle = await prisma.userVehicle.findFirst({
    where: { id: vehicleId, userId, deletedAt: null },
  });
  if (!vehicle) {
    throw new AppError("VEH_001", "Véhicule introuvable", 404);
  }

  const schedule = await prisma.providerMaintenanceSchedule.findFirst({
    where: { vehicleId },
    include: { tasks: true },
    orderBy: { sourceRetrievedAt: "desc" },
  });

  const reminders = await prisma.vehicleMaintenanceReminder.findMany({
    where: { vehicleId },
    include: { taskDefinition: true },
  });

  const recalls = await prisma.vehicleSafetyRecall.findMany({
    where: {
      vehicleId,
      status: { in: ["open", "possibly_applicable"] },
    },
    orderBy: { recallDate: "desc" },
  });

  const history = await prisma.maintenanceHistory.findMany({
    where: { vehicleId, deletedAt: null },
    include: { taskDefinition: true },
    orderBy: { performedDate: "desc" },
    take: 50,
  });

  const factors = (vehicle.usageFactors ?? {}) as UsageFactorFlags;
  const effectiveCondition = resolveUsageCondition({
    profile:
      (vehicle.usageProfile as "normal" | "severe" | "automatic") ||
      "automatic",
    factors,
    annualEstimatedKm: vehicle.annualEstimatedKm,
    vehicleType: vehicle.vehicleType ?? vehicle.manualCategory,
  });

  const mapReminder = (r: (typeof reminders)[number]) => {
    const task = r.taskDefinition;
    const source = sourceLabel({
      official: task.officialManufacturerRecommendation,
      sourceType: schedule?.sourceType ?? "manual",
      provider: schedule?.provider ?? "manual",
    });

    const displayTitle = task.inspectionOnly
      ? task.title.startsWith("Inspection")
        ? task.title
        : `Inspection — ${task.title}`
      : task.title;

    return {
      id: r.id,
      taskDefinitionId: task.id,
      title: displayTitle,
      category: task.category,
      actionType: task.actionType,
      dueDate: r.dueDate?.toISOString().slice(0, 10) ?? null,
      dueOdometerKm: r.dueOdometerKm,
      status: r.status,
      priority: r.priority,
      conditionType: task.conditionType,
      inspectionOnly: task.inspectionOnly,
      officialManufacturerRecommendation:
        task.officialManufacturerRecommendation,
      sourceLabel: source.label,
      sourceKind: source.kind,
      notes: task.notes,
      remainingKm:
        r.dueOdometerKm != null
          ? r.dueOdometerKm - vehicle.currentOdometer
          : null,
    };
  };

  const active = reminders
    .filter((r) =>
      taskAppliesToCondition(
        r.taskDefinition.conditionType as "normal" | "severe" | "both",
        effectiveCondition,
      ),
    )
    .map(mapReminder);

  const overdue = active.filter((r) => r.status === "overdue");
  const dueNow = active.filter((r) => r.status === "due_now");
  const dueSoon = active.filter((r) => r.status === "due_soon");
  const upcoming = active.filter((r) => r.status === "upcoming");

  const next =
    [...overdue, ...dueNow, ...dueSoon, ...upcoming].sort((a, b) => {
      const ak = a.dueOdometerKm ?? Number.MAX_SAFE_INTEGER;
      const bk = b.dueOdometerKm ?? Number.MAX_SAFE_INTEGER;
      return ak - bk;
    })[0] ?? null;

  return {
    vehicle: {
      id: vehicle.id,
      currentOdometerKm: vehicle.currentOdometer,
      usageProfile: vehicle.usageProfile,
      effectiveCondition,
      annualEstimatedKm: vehicle.annualEstimatedKm,
    },
    summary: {
      currentOdometerKm: vehicle.currentOdometer,
      nextMaintenance: next,
      overdueCount: overdue.length,
      upcomingCount: upcoming.length + dueSoon.length + dueNow.length,
      openRecallsCount: recalls.length,
      lastSyncedAt: schedule?.sourceRetrievedAt?.toISOString() ?? null,
      isStale: schedule?.isStale ?? false,
      provider: schedule?.provider ?? null,
      warning: schedule?.isStale
        ? "Les données n’ont pas pu être actualisées."
        : schedule?.sourceType === "mock"
          ? "Données de démonstration — ne pas utiliser comme recommandation mécanique officielle."
          : null,
    },
    sections: {
      dueNow: [...overdue, ...dueNow],
      dueSoon,
      upcoming,
      history: history.map((h) => ({
        id: h.id,
        title: h.taskDefinition?.title ?? "Entretien",
        serviceDate: h.performedDate.toISOString().slice(0, 10),
        odometerKm: h.performedOdometer,
        providerName: h.provider,
        cost: h.cost?.toString() ?? null,
        currency: h.currency,
        notes: h.notes,
        status: h.status,
      })),
      recalls: recalls.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        officialUrl: r.officialUrl,
        status: r.status,
        vinMatchUncertain: r.vinMatchUncertain,
        recallDate: r.recallDate?.toISOString().slice(0, 10) ?? null,
        warning: r.vinMatchUncertain
          ? "Ce rappel pourrait concerner votre véhicule. Vérifiez auprès du fabricant ou d’un concessionnaire avec votre VIN."
          : null,
      })),
      fullCalendar: active,
    },
    emptySchedule: !schedule || schedule.tasks.length === 0,
    emptyMessage:
      !schedule || schedule.tasks.length === 0
        ? "Nous n’avons pas encore trouvé le calendrier officiel de ce véhicule. Vous pouvez ajouter vos entretiens manuellement ou réessayer la synchronisation."
        : null,
  };
}
