/**
 * Feature `notifications` — centre in-app, préférences, dispatcher.
 */
export {
  listNotifications,
  getNotificationById,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  syncBudgetExceededNotification,
  dispatchNotifications,
} from "./services";

export {
  NotificationBell,
  NotificationsList,
  NotificationPreferencesForm,
} from "./components";

export type {
  NotificationDto,
  NotificationPreferencesDto,
  PaginatedNotifications,
  DispatchReport,
} from "./types";
