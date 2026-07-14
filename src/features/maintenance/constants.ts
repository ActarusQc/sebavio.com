/** Constantes module entretien (Doc 4 §6 / Doc 6 §8). */

export const MAINTENANCE_PRIORITIES = ["low", "normal", "high"] as const;

export const MAINTENANCE_SCHEDULE_STATUSES = [
  "upcoming",
  "overdue",
  "completed",
] as const;

export const MAINTENANCE_DOCUMENT_TYPES = [
  "Invoice",
  "Photo",
  "Warranty",
  "Other",
] as const;

export const MAINTENANCE_NOTIFICATION_TYPES = ["email", "push"] as const;

/** Seuil d’approche pour créer une ligne maintenance_notifications (pas d’envoi). */
export const APPROACHING_DAYS = 14;
export const APPROACHING_KM = 500;

/** Invite UI si odomètre non mis à jour depuis plus de N jours. */
export const ODOMETER_STALE_DAYS = 30;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const DEFAULT_CURRENCY = "CAD";
