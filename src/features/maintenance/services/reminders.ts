import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  postponeReminderSchema,
  type PostponeReminderInput,
} from "@/features/maintenance/schemas";
import { toNotificationDto } from "@/features/maintenance/services/mappers";
import type { MaintenanceNotificationDto } from "@/features/maintenance/types";

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

/**
 * Liste les rappels structurés (maintenance_notifications) des véhicules du user.
 * Pas d'envoi réel — le module Notifications consommera ces lignes plus tard.
 */
export async function listReminders(
  userId: string,
): Promise<MaintenanceNotificationDto[]> {
  const rows = await prisma.maintenanceNotification.findMany({
    where: {
      vehicle: { userId, deletedAt: null },
    },
    include: {
      schedule: { include: { template: true } },
    },
    orderBy: [{ notificationDate: "asc" }],
  });
  return rows.map(toNotificationDto);
}

export async function postponeReminder(
  userId: string,
  notificationId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<MaintenanceNotificationDto> {
  const input = parseZod(
    () => postponeReminderSchema.parse(raw ?? {}),
    "Report invalide",
  ) as PostponeReminderInput;

  const existing = await prisma.maintenanceNotification.findFirst({
    where: {
      id: notificationId,
      vehicle: { userId, deletedAt: null },
    },
    include: {
      schedule: { include: { template: true } },
    },
  });
  if (!existing) {
    throw new AppError("MNT_001", "Entretien introuvable", 404);
  }

  const nextDate = new Date(existing.notificationDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + input.days);

  const updated = await prisma.maintenanceNotification.update({
    where: { id: notificationId },
    data: {
      notificationDate: nextDate,
      ...(input.type ? { type: input.type } : {}),
    },
    include: {
      schedule: { include: { template: true } },
    },
  });

  await writeAuditLog({
    userId,
    entity: "maintenance_notifications",
    entityId: notificationId,
    action: "postpone",
    oldValue: { notificationDate: existing.notificationDate.toISOString() },
    newValue: {
      notificationDate: updated.notificationDate.toISOString(),
      reason: input.reason ?? null,
      days: input.days,
    },
    ipAddress,
  });

  return toNotificationDto(updated);
}
