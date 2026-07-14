/** Constantes module Notifications (Doc 6 §11 / Doc 10 Partie 18). */

export const NOTIFICATION_TYPES = [
  "maintenance",
  "trip",
  "budget",
  "weather",
  "fuel",
] as const;

export const NOTIFICATION_CHANNELS = ["in_app", "email", "push"] as const;

export const NOTIFICATION_PRIORITIES = ["low", "normal", "high"] as const;

/** Seuil voyage à venir (jours) — plan validé. */
export const TRIP_UPCOMING_DAYS = 7;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Clé Redis badge non-lues. */
export function unreadCacheKey(userId: string): string {
  return `notif:unread:${userId}`;
}

export function maintenanceDedupeKey(scheduleId: string): string {
  return `maintenance:${scheduleId}`;
}

export function budgetExceededDedupeKey(tripId: string): string {
  return `budget_exceeded:${tripId}`;
}

/** Inclut la date de départ : un report invalide l’ancienne clé. */
export function tripUpcomingDedupeKey(
  tripId: string,
  departureDateKey: string,
): string {
  return `trip_upcoming:${tripId}:${departureDateKey}`;
}
