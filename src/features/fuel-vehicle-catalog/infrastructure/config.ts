/**
 * Configuration serveur du catalogue NRCan.
 * Aucune URL non officielle en dur — le dataset CKAN est configurable.
 */

export const NRCAN_DATASET_ID = "98f1a129-f628-4ce4-b24d-6f16bf24dd64";

export const ALLOWED_DOWNLOAD_HOSTS = new Set([
  "open.canada.ca",
  "ouvert.canada.ca",
  "natural-resources.canada.ca",
  "ressources-naturelles.canada.ca",
  "ftp.maps.canada.ca",
  // CDN officiel Azure Blob du Portail du gouvernement ouvert
  "opencanada.blob.core.windows.net",
]);

export type VehicleCatalogEnv = {
  enabled: boolean;
  datasetApiUrl: string;
  datasetId: string;
  cron: string | null;
  httpTimeoutMs: number;
  maxFileSizeMb: number;
  maxRedirects: number;
  batchSize: number;
  preferLanguage: "en" | "fr";
};

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw == null || raw.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

function parseIntEnv(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export function getVehicleCatalogEnv(): VehicleCatalogEnv {
  const datasetId =
    process.env.VEHICLE_CATALOG_SOURCE_DATASET_ID?.trim() || NRCAN_DATASET_ID;
  const configuredUrl = process.env.VEHICLE_CATALOG_SOURCE_DATASET_URL?.trim();
  const datasetApiUrl =
    configuredUrl ||
    `https://open.canada.ca/data/api/3/action/package_show?id=${datasetId}`;

  return {
    enabled: parseBool(process.env.VEHICLE_CATALOG_SYNC_ENABLED, true),
    datasetApiUrl,
    datasetId,
    cron: process.env.VEHICLE_CATALOG_SYNC_CRON?.trim() || null,
    httpTimeoutMs: parseIntEnv(
      process.env.VEHICLE_CATALOG_HTTP_TIMEOUT_MS,
      60_000,
      5_000,
      300_000,
    ),
    maxFileSizeMb: parseIntEnv(
      process.env.VEHICLE_CATALOG_MAX_FILE_SIZE_MB,
      50,
      1,
      200,
    ),
    maxRedirects: parseIntEnv(
      process.env.VEHICLE_CATALOG_MAX_REDIRECTS,
      3,
      0,
      5,
    ),
    batchSize: parseIntEnv(
      process.env.VEHICLE_CATALOG_BATCH_SIZE,
      200,
      20,
      1000,
    ),
    preferLanguage:
      process.env.VEHICLE_CATALOG_PREFER_LANGUAGE?.trim().toLowerCase() === "fr"
        ? "fr"
        : "en",
  };
}

export const SOURCE_NAME = "Ressources naturelles Canada";
export const USER_AGENT =
  "SebaviaVehicleCatalog/1.0 (+https://sebavia.com; fuel-catalog-sync)";
