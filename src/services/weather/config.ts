import { WEATHER_FORECAST_HORIZON_DAYS } from "@/lib/constants";

export type WeatherEnvConfig = {
  enabled: boolean;
  provider: "openweather" | "open-meteo" | "off";
  maxDailyCalls: number;
  openWeatherApiKey: string;
  openWeatherBaseUrl: string;
  openWeatherOneCallVersion: "3" | "4";
  openMeteoApiKey: string;
  clusterRadiusKm: number;
  timeoutMs: number;
  maxRetries: number;
  horizonDays: number;
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

function normalizeProvider(
  raw: string | undefined,
): WeatherEnvConfig["provider"] {
  const name = (raw ?? "openweather").trim().toLowerCase();
  if (name === "off" || name === "disabled" || name === "null") return "off";
  if (name === "open-meteo" || name === "openmeteo") return "open-meteo";
  if (name === "openweather" || name === "open-weather") return "openweather";
  return "openweather";
}

/**
 * Validation des variables d'environnement météo.
 * Ne journalise jamais les clés.
 */
export function loadWeatherConfig(
  env: NodeJS.ProcessEnv = process.env,
): WeatherEnvConfig {
  const enabled = parseBool(env.WEATHER_ENABLED, true);
  const provider = enabled ? normalizeProvider(env.WEATHER_PROVIDER) : "off";
  const versionRaw = (env.OPENWEATHER_ONECALL_VERSION ?? "4").trim();
  const openWeatherOneCallVersion: "3" | "4" = versionRaw === "3" ? "3" : "4";

  let baseUrl = (
    env.OPENWEATHER_BASE_URL ?? "https://api.openweathermap.org"
  ).trim();
  try {
    const u = new URL(baseUrl);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      baseUrl = "https://api.openweathermap.org";
    }
    baseUrl = u.origin;
  } catch {
    baseUrl = "https://api.openweathermap.org";
  }

  return {
    enabled: enabled && provider !== "off",
    provider,
    maxDailyCalls: parsePositiveInt(env.WEATHER_MAX_DAILY_CALLS, 900, 1, 1000),
    openWeatherApiKey: env.OPENWEATHER_API_KEY?.trim() ?? "",
    openWeatherBaseUrl: baseUrl,
    openWeatherOneCallVersion,
    openMeteoApiKey: env.OPEN_METEO_API_KEY?.trim() ?? "",
    clusterRadiusKm: parsePositiveInt(
      env.WEATHER_CLUSTER_RADIUS_KM,
      20,
      1,
      200,
    ),
    timeoutMs: parsePositiveInt(env.WEATHER_TIMEOUT_MS, 12_000, 2000, 60_000),
    maxRetries: parsePositiveInt(env.WEATHER_MAX_RETRIES, 2, 0, 3),
    horizonDays: WEATHER_FORECAST_HORIZON_DAYS,
  };
}

export function assertWeatherEnvValid(config: WeatherEnvConfig): void {
  if (!config.enabled) return;
  if (config.provider === "openweather" && !config.openWeatherApiKey) {
    // Soft : le provider se déclare indisponible (missing_key).
    return;
  }
}
