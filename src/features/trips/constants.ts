/** Constantes module voyages (Doc 4 §7 / Doc 6). */

export const TRIP_STATUSES = [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const STOP_TYPES = [
  "origin",
  "destination",
  "camping",
  "activity",
  "fuel",
  "rest",
  "stop",
  "other",
] as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  planned: "Planifié",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};
