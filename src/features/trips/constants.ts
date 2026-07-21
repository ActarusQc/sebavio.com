/** Constantes module voyages (Doc 4 §7 / Doc 6). */

export const TRIP_STATUSES = [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

/** Types d'étape / waypoint — jamais destination finale du Trip. */
export const STOP_TYPES = [
  "origin",
  "destination",
  "detour",
  "pass_through",
  "activity",
  "lodging",
  "camping",
  "fuel",
  "rest",
  "stop",
  "other",
] as const;
export type StopType = (typeof STOP_TYPES)[number];

/** Types proposés à l'utilisateur pour un détour / une étape manuelle. */
export const WAYPOINT_STOP_TYPES = [
  "detour",
  "pass_through",
  "activity",
  "lodging",
  "other",
] as const;
export type WaypointStopType = (typeof WAYPOINT_STOP_TYPES)[number];

export const STOP_DIRECTIONS = ["outbound", "return"] as const;
export type StopDirection = (typeof STOP_DIRECTIONS)[number];

export const STOP_TYPE_LABELS: Record<string, string> = {
  origin: "Départ",
  destination: "Destination",
  detour: "Détour",
  pass_through: "Étape de passage",
  activity: "Activité",
  lodging: "Hébergement",
  camping: "Camping",
  fuel: "Carburant",
  rest: "Repos",
  stop: "Étape",
  other: "Autre",
};

export const STOP_DIRECTION_LABELS: Record<StopDirection, string> = {
  outbound: "Trajet aller",
  return: "Trajet retour",
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  planned: "Planifié",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

/** Suggestions rapides de durée sur place (minutes). */
export const DWELL_DURATION_PRESETS = [
  { label: "0 min", minutes: 0 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 h", minutes: 60 },
  { label: "2 h", minutes: 120 },
  { label: "Demi-journée", minutes: 240 },
] as const;
