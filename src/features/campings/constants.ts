/** Constantes module campings (Doc 4 §8 / Doc 10 Partie 15). */

export const CAMPGROUND_DATA_SOURCES = [
  "manual",
  "import",
  "seed-dev",
] as const;
export type CampgroundDataSource = (typeof CAMPGROUND_DATA_SOURCES)[number];
export const SEED_DEV_SOURCE = "seed-dev" as const;

export const CAMPGROUND_TYPES = [
  "rv_park",
  "campground",
  "dump_station",
  "overnight",
  "other",
] as const;
export type CampgroundType = (typeof CAMPGROUND_TYPES)[number];

export const CAMPGROUND_SERVICES = [
  "electricity",
  "water",
  "sewer",
  "dump_station",
  "wifi",
  "propane",
  "laundry",
  "pool",
  "shower",
] as const;
export type CampgroundService = (typeof CAMPGROUND_SERVICES)[number];

export const CAMPGROUND_SERVICE_LABELS: Record<CampgroundService, string> = {
  electricity: "Électricité",
  water: "Eau",
  sewer: "Égout",
  dump_station: "Vidange",
  wifi: "Wi-Fi",
  propane: "Propane",
  laundry: "Buanderie",
  pool: "Piscine",
  shower: "Douches",
};

export const CAMPGROUND_TYPE_LABELS: Record<CampgroundType, string> = {
  rv_park: "Parc VR",
  campground: "Camping",
  dump_station: "Station de vidange",
  overnight: "Stationnement nuit",
  other: "Autre",
};

/** Seuil d'avertissement non bloquant étape ↔ camping (km). */
export const CAMPGROUND_STOP_DISTANCE_WARN_KM = 50;

export const DEFAULT_SEARCH_RADIUS_KM = 50;
export const MAX_SEARCH_RADIUS_KM = 200;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
