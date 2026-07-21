import { AppError } from "@/lib/errors";

/** Domaines FDE autorisés en production (anti-SSRF). */
export const FDE_ALLOWED_PRODUCTION_HOSTS = new Set(["fde.monteregia.com"]);

export type FdeConfig = {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  nearbyDefaultRadiusKm: number;
  nearbyMaxRadiusKm: number;
  nearbyDefaultLimit: number;
  nearbyMaxLimit: number;
  cacheTtlSeconds: number;
  /**
   * Âge max pour considérer un prix « frais » (station_exact).
   * Au-delà : station conservée, prix traité comme estimation.
   */
  stalePriceMaxHours: number;
  /**
   * Âge max envoyé à FDE nearby pour DÉCOUVRIR les stations (≤ 168 h / API).
   * Indépendant de stalePriceMaxHours : évite un corridor vide si les prix
   * ont > 24 h mais que les stations existent toujours.
   */
  discoveryMaxAgeHours: number;
  allowStaleCacheHours: number;
};

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw == null || raw.trim() === "") return fallback;
  const v = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  return fallback;
}

function parsePositiveInt(
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

function parsePositiveNumber(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function assertHttpsInProduction(
  baseUrl: string,
  nodeEnv: string | undefined,
): void {
  if (nodeEnv !== "production") return;
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new AppError("FDE_002", "Configuration FDE invalide (URL)", 500);
  }
  if (url.protocol !== "https:") {
    throw new AppError(
      "FDE_002",
      "FDE_BASE_URL doit utiliser HTTPS en production",
      500,
    );
  }
  if (!FDE_ALLOWED_PRODUCTION_HOSTS.has(url.hostname)) {
    throw new AppError(
      "FDE_002",
      "FDE_BASE_URL hors domaine autorisé en production",
      500,
    );
  }
}

/**
 * Lit et valide la configuration FDE (serveur uniquement).
 * Ne journalise jamais la clé.
 */
export function loadFdeConfig(env: NodeJS.ProcessEnv = process.env): FdeConfig {
  const enabled = parseBool(env.FDE_ENABLED, false);
  const baseUrl = (env.FDE_BASE_URL ?? "https://fde.monteregia.com").replace(
    /\/+$/,
    "",
  );
  const apiKey = env.FDE_API_KEY?.trim() ?? "";

  if (enabled && !apiKey) {
    if (env.NODE_ENV === "production") {
      throw new AppError(
        "FDE_002",
        "FDE activé sans FDE_API_KEY — démarrage refusé",
        500,
      );
    }
    throw new AppError("FDE_002", "FDE activé sans FDE_API_KEY", 503);
  }

  if (enabled) {
    assertHttpsInProduction(baseUrl, env.NODE_ENV);
  }

  return {
    enabled,
    baseUrl,
    apiKey,
    timeoutMs: parsePositiveInt(env.FDE_TIMEOUT_MS, 5000, 500, 60_000),
    nearbyDefaultRadiusKm: parsePositiveNumber(
      env.FDE_NEARBY_DEFAULT_RADIUS_KM,
      10,
      0.5,
      100,
    ),
    nearbyMaxRadiusKm: parsePositiveNumber(
      env.FDE_NEARBY_MAX_RADIUS_KM,
      50,
      1,
      100,
    ),
    nearbyDefaultLimit: parsePositiveInt(
      env.FDE_NEARBY_DEFAULT_LIMIT,
      20,
      1,
      100,
    ),
    nearbyMaxLimit: parsePositiveInt(env.FDE_NEARBY_MAX_LIMIT, 50, 1, 100),
    cacheTtlSeconds: parsePositiveInt(env.FDE_CACHE_TTL_SECONDS, 300, 0, 3600),
    stalePriceMaxHours: parsePositiveInt(
      env.FDE_STALE_PRICE_MAX_HOURS,
      24,
      1,
      168,
    ),
    discoveryMaxAgeHours: parsePositiveInt(
      env.FDE_DISCOVERY_MAX_AGE_HOURS,
      168,
      24,
      168,
    ),
    allowStaleCacheHours: parsePositiveInt(
      env.FDE_ALLOW_STALE_CACHE_HOURS,
      6,
      0,
      48,
    ),
  };
}

let cachedConfig: FdeConfig | null = null;

export function getFdeConfig(): FdeConfig {
  if (!cachedConfig) {
    cachedConfig = loadFdeConfig();
  }
  return cachedConfig;
}

/** Tests uniquement. */
export function resetFdeConfigCache(): void {
  cachedConfig = null;
}

export function isFdeEnabled(): boolean {
  try {
    return getFdeConfig().enabled;
  } catch {
    return false;
  }
}
