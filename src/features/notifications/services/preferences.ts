import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  updateNotificationPreferencesSchema,
  type UpdateNotificationPreferencesInput,
} from "@/features/notifications/schemas";
import { toPreferencesDto } from "@/features/notifications/services/mappers";
import type {
  NotificationPreferencesDto,
  NotificationType,
} from "@/features/notifications/types";

export async function ensureNotificationPreferences(userId: string) {
  const existing = await prisma.notificationPreference.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  return prisma.notificationPreference.create({
    data: { userId },
  });
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferencesDto> {
  const prefs = await ensureNotificationPreferences(userId);
  return toPreferencesDto(prefs);
}

export async function updateNotificationPreferences(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<NotificationPreferencesDto> {
  let input: UpdateNotificationPreferencesInput;
  try {
    input = updateNotificationPreferencesSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "NOTIF_003",
        error.issues[0]?.message ?? "Préférences invalides",
        400,
      );
    }
    throw error;
  }

  const before = await ensureNotificationPreferences(userId);

  const updated = await prisma.notificationPreference.update({
    where: { userId },
    data: {
      inAppMaintenance: input.inAppMaintenance,
      inAppTrip: input.inAppTrip,
      inAppBudget: input.inAppBudget,
      inAppWeather: input.inAppWeather,
      inAppFuel: input.inAppFuel,
      emailMaintenance: input.emailMaintenance,
      emailTrip: input.emailTrip,
      emailBudget: input.emailBudget,
      emailWeather: input.emailWeather,
      emailFuel: input.emailFuel,
      pushMaintenance: input.pushMaintenance,
      pushTrip: input.pushTrip,
      pushBudget: input.pushBudget,
      pushWeather: input.pushWeather,
      pushFuel: input.pushFuel,
    },
  });

  await writeAuditLog({
    userId,
    entity: "notification_preferences",
    entityId: userId,
    action: "update",
    oldValue: {
      inAppMaintenance: before.inAppMaintenance,
      inAppTrip: before.inAppTrip,
      inAppBudget: before.inAppBudget,
    },
    newValue: {
      inAppMaintenance: updated.inAppMaintenance,
      inAppTrip: updated.inAppTrip,
      inAppBudget: updated.inAppBudget,
    },
    ipAddress,
  });

  return toPreferencesDto(updated);
}

/** true si l’utilisateur accepte ce type en in-app. */
export async function isInAppTypeAllowed(
  userId: string,
  type: NotificationType,
): Promise<boolean> {
  const global = await prisma.userPreference.findUnique({
    where: { userId },
    select: { notificationsEnabled: true },
  });
  if (global && !global.notificationsEnabled) {
    return false;
  }

  const prefs = await ensureNotificationPreferences(userId);
  switch (type) {
    case "maintenance":
      return prefs.inAppMaintenance;
    case "trip":
      return prefs.inAppTrip;
    case "budget":
      return prefs.inAppBudget;
    case "weather":
      return prefs.inAppWeather;
    case "fuel":
      return prefs.inAppFuel;
    default:
      return false;
  }
}
