/** Constantes module activités / POI (Doc 4 §8 / Doc 10 Partie 16). */

export const ACTIVITY_DATA_SOURCES = ["manual", "import", "seed-dev"] as const;
export type ActivityDataSource = (typeof ACTIVITY_DATA_SOURCES)[number];
export const SEED_DEV_SOURCE = "seed-dev" as const;

export const ACTIVITY_KINDS = ["activity", "poi"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  activity: "Activité",
  poi: "Point d'intérêt",
};

export const ACTIVITY_CATEGORIES = [
  "parc",
  "musee",
  "plage",
  "randonnee",
  "restaurant",
  "cascade",
  "belvedere",
  "historique",
  "nature",
  "autre",
] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  parc: "Parc",
  musee: "Musée",
  plage: "Plage",
  randonnee: "Randonnée",
  restaurant: "Restaurant",
  cascade: "Cascade",
  belvedere: "Belvédère",
  historique: "Historique",
  nature: "Nature",
  autre: "Autre",
};

/** Saisons possibles (stockées en JSONB tableau). */
export const ACTIVITY_SEASONS = [
  "spring",
  "summer",
  "fall",
  "winter",
  "year_round",
] as const;
export type ActivitySeason = (typeof ACTIVITY_SEASONS)[number];

export const ACTIVITY_SEASON_LABELS: Record<ActivitySeason, string> = {
  spring: "Printemps",
  summer: "Été",
  fall: "Automne",
  winter: "Hiver",
  year_round: "Toute l'année",
};

/** Seuil d'avertissement non bloquant étape ↔ activité (km). */
export const ACTIVITY_STOP_DISTANCE_WARN_KM = 50;

export const DEFAULT_SEARCH_RADIUS_KM = 50;
export const MAX_SEARCH_RADIUS_KM = 200;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
