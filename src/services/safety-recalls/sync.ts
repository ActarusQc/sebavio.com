import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { createInAppNotification } from "@/features/notifications/services/create";
import { fetchTransportCanadaRecalls } from "./transport-canada";

export async function syncVehicleSafetyRecalls(
  userId: string,
  vehicleId: string,
): Promise<{
  upserted: number;
  unavailable: boolean;
  warning?: string;
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

  if (!make || !modelName || !year) {
    throw new AppError(
      "RECALL_001",
      "Année, marque et modèle requis pour rechercher les rappels de sécurité.",
      400,
    );
  }

  const { recalls, unavailable, errorMessage } =
    await fetchTransportCanadaRecalls({
      year,
      make,
      model: modelName,
      vin: vehicle.vin,
    });

  const now = new Date();
  let upserted = 0;

  for (const recall of recalls) {
    const existing = await prisma.vehicleSafetyRecall.findUnique({
      where: {
        vehicleId_source_externalRecallId: {
          vehicleId,
          source: recall.source,
          externalRecallId: recall.externalRecallId,
        },
      },
    });

    if (existing) {
      // Ne pas écraser un statut utilisateur (repaired / not_applicable / dismissed).
      const preserveStatus = [
        "repaired",
        "not_applicable",
        "dismissed",
      ].includes(existing.status);
      await prisma.vehicleSafetyRecall.update({
        where: { id: existing.id },
        data: {
          manufacturer: recall.manufacturer ?? null,
          model: recall.model ?? null,
          year: recall.year ?? null,
          title: recall.title,
          summary: recall.summary ?? null,
          riskDescription: recall.riskDescription ?? null,
          correctiveAction: recall.correctiveAction ?? null,
          recallDate: recall.recallDate ? new Date(recall.recallDate) : null,
          officialUrl: recall.officialUrl ?? null,
          vinMatchUncertain: recall.vinMatchUncertain,
          lastCheckedAt: now,
          ...(preserveStatus ? {} : {}),
        },
      });
    } else {
      await prisma.vehicleSafetyRecall.create({
        data: {
          vehicleId,
          externalRecallId: recall.externalRecallId,
          source: recall.source,
          manufacturer: recall.manufacturer ?? null,
          model: recall.model ?? null,
          year: recall.year ?? null,
          title: recall.title,
          summary: recall.summary ?? null,
          riskDescription: recall.riskDescription ?? null,
          correctiveAction: recall.correctiveAction ?? null,
          recallDate: recall.recallDate ? new Date(recall.recallDate) : null,
          officialUrl: recall.officialUrl ?? null,
          status: "possibly_applicable",
          vinMatchUncertain: true,
          lastCheckedAt: now,
        },
      });
      upserted += 1;

      await createInAppNotification({
        userId,
        type: "maintenance",
        title: "Nouveau rappel de sécurité",
        body: recall.title,
        priority: "high",
        dedupeKey: `recall:${vehicleId}:${recall.source}:${recall.externalRecallId}`,
        sourceEntity: "vehicle_safety_recall",
        sourceId: vehicleId,
        href: `/dashboard/vehicles/${vehicleId}/maintenance`,
      });
    }
  }

  // Mettre à jour lastCheckedAt même sans nouveaux résultats.
  if (!unavailable) {
    await prisma.vehicleSafetyRecall.updateMany({
      where: { vehicleId, source: "transport_canada" },
      data: { lastCheckedAt: now },
    });
  }

  return {
    upserted,
    unavailable,
    warning: unavailable
      ? (errorMessage ??
        "Impossible de synchroniser les rappels Transport Canada.")
      : recalls.length === 0
        ? "Aucun rappel trouvé pour cette combinaison année / marque / modèle."
        : undefined,
  };
}

export async function listVehicleSafetyRecalls(
  userId: string,
  vehicleId: string,
) {
  const vehicle = await prisma.userVehicle.findFirst({
    where: { id: vehicleId, userId, deletedAt: null },
    select: { id: true },
  });
  if (!vehicle) {
    throw new AppError("VEH_001", "Véhicule introuvable", 404);
  }

  return prisma.vehicleSafetyRecall.findMany({
    where: { vehicleId },
    orderBy: [{ status: "asc" }, { recallDate: "desc" }],
  });
}

export async function updateVehicleSafetyRecall(
  userId: string,
  vehicleId: string,
  recallId: string,
  status:
    | "open"
    | "possibly_applicable"
    | "repaired"
    | "not_applicable"
    | "dismissed",
) {
  const vehicle = await prisma.userVehicle.findFirst({
    where: { id: vehicleId, userId, deletedAt: null },
    select: { id: true },
  });
  if (!vehicle) {
    throw new AppError("VEH_001", "Véhicule introuvable", 404);
  }

  const recall = await prisma.vehicleSafetyRecall.findFirst({
    where: { id: recallId, vehicleId },
  });
  if (!recall) {
    throw new AppError("RECALL_002", "Rappel de sécurité introuvable", 404);
  }

  return prisma.vehicleSafetyRecall.update({
    where: { id: recallId },
    data: { status },
  });
}
