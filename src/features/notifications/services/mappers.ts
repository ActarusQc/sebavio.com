import type {
  NotificationChannel,
  NotificationDto,
  NotificationPreferencesDto,
  NotificationPriority,
  NotificationType,
} from "@/features/notifications/types";

export function toNotificationDto(row: {
  id: string;
  userId: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  priority: string;
  dedupeKey: string;
  sourceEntity: string | null;
  sourceId: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): NotificationDto {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as NotificationType,
    channel: row.channel as NotificationChannel,
    title: row.title,
    body: row.body,
    priority: row.priority as NotificationPriority,
    dedupeKey: row.dedupeKey,
    sourceEntity: row.sourceEntity,
    sourceId: row.sourceId,
    href: row.href,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toPreferencesDto(row: {
  userId: string;
  inAppMaintenance: boolean;
  inAppTrip: boolean;
  inAppBudget: boolean;
  inAppWeather: boolean;
  inAppFuel: boolean;
  emailMaintenance: boolean;
  emailTrip: boolean;
  emailBudget: boolean;
  emailWeather: boolean;
  emailFuel: boolean;
  pushMaintenance: boolean;
  pushTrip: boolean;
  pushBudget: boolean;
  pushWeather: boolean;
  pushFuel: boolean;
  updatedAt: Date;
}): NotificationPreferencesDto {
  return {
    userId: row.userId,
    inAppMaintenance: row.inAppMaintenance,
    inAppTrip: row.inAppTrip,
    inAppBudget: row.inAppBudget,
    inAppWeather: row.inAppWeather,
    inAppFuel: row.inAppFuel,
    emailMaintenance: row.emailMaintenance,
    emailTrip: row.emailTrip,
    emailBudget: row.emailBudget,
    emailWeather: row.emailWeather,
    emailFuel: row.emailFuel,
    pushMaintenance: row.pushMaintenance,
    pushTrip: row.pushTrip,
    pushBudget: row.pushBudget,
    pushWeather: row.pushWeather,
    pushFuel: row.pushFuel,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function clampPageSize(size: number, max: number): number {
  return Math.min(Math.max(1, size), max);
}
