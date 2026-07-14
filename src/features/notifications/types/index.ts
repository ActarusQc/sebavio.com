import type {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
} from "@/features/notifications/constants";

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export type NotificationDto = {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  priority: NotificationPriority;
  dedupeKey: string;
  sourceEntity: string | null;
  sourceId: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationPreferencesDto = {
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
  updatedAt: string;
};

export type PaginatedNotifications = {
  items: NotificationDto[];
  page: number;
  pageSize: number;
  total: number;
  unreadCount: number;
};

export type CreateInAppInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  priority?: NotificationPriority;
  dedupeKey: string;
  sourceEntity?: string | null;
  sourceId?: string | null;
  href?: string | null;
};

export type DispatchReport = {
  maintenanceProcessed: number;
  maintenanceCreated: number;
  maintenanceAlreadyPresent: number;
  maintenanceSkippedPrefs: number;
  tripObsoleteSoftDeleted: number;
  tripCreated: number;
  tripAlreadyPresent: number;
  tripSkippedPrefs: number;
  emailSent: number;
  emailSkippedPrefs: number;
  emailAlreadySent: number;
  emailFailed: number;
};
