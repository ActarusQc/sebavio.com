/** Constantes catalogue véhicules (Doc 4 / Doc 6). */

export const CATALOG_DATA_SOURCES = ["manual", "import", "seed-dev"] as const;

export type CatalogDataSource = (typeof CATALOG_DATA_SOURCES)[number];

export const SEED_DEV_SOURCE = "seed-dev" as const;

export const VEHICLE_CATEGORIES = [
  "Car",
  "ClassA",
  "ClassB",
  "ClassC",
  "FifthWheel",
  "TravelTrailer",
] as const;

export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export const DRIVE_TYPES = ["FWD", "RWD", "AWD", "4x4"] as const;

export const FUEL_TYPES = [
  "Gasoline",
  "Diesel",
  "Electric",
  "Hybrid",
  "Propane",
] as const;

export const DOCUMENT_TYPES = ["Manual", "Brochure", "Specs"] as const;

export const ISSUE_SEVERITIES = ["low", "medium", "high", "critical"] as const;

/** Pagination serveur — jamais de dump complet (Doc 6 + contrainte Partie 8). */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Limites import admin catalogue. */
export const IMPORT_MAX_BYTES = 512 * 1024; // 512 Ko
export const IMPORT_MAX_LINES = 200;
