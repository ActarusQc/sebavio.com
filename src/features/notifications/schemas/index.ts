import { z } from "zod";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
} from "@/features/notifications/constants";

const uuid = z.string().uuid();

export const notificationsListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export const markReadSchema = z.object({
  id: uuid,
});

export const updateNotificationPreferencesSchema = z.object({
  inAppMaintenance: z.boolean(),
  inAppTrip: z.boolean(),
  inAppBudget: z.boolean(),
  inAppWeather: z.boolean(),
  inAppFuel: z.boolean(),
  emailMaintenance: z.boolean(),
  emailTrip: z.boolean(),
  emailBudget: z.boolean(),
  emailWeather: z.boolean(),
  emailFuel: z.boolean(),
  pushMaintenance: z.boolean(),
  pushTrip: z.boolean(),
  pushBudget: z.boolean(),
  pushWeather: z.boolean(),
  pushFuel: z.boolean(),
});

export type NotificationsListInput = z.infer<typeof notificationsListSchema>;
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;

/** Stubs types/canaux pour phases SMTP / Push. */
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export const notificationChannelSchema = z.enum(NOTIFICATION_CHANNELS);
export const notificationPrioritySchema = z.enum(NOTIFICATION_PRIORITIES);
