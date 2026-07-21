import { getRedis } from "@/lib/redis";
import { cacheTtlSeconds, NEGATIVE_CACHE_TTL_SECONDS } from "./window";
import { roundCoord } from "./units";
import type {
  WeatherCacheProximity,
  WeatherForecast,
  WeatherForecastParts,
  WeatherLatLng,
} from "./types";

export { roundCoord };

export type CachedWeatherEntry = {
  forecast: WeatherForecast;
  cachedAt: string;
  stale: boolean;
  expiresAt: string;
};

function partsKey(parts?: WeatherForecastParts): string {
  const p = parts ?? {};
  return [
    p.current === false ? "0" : "1",
    p.hourly === false ? "0" : "1",
    p.daily === false ? "0" : "1",
    p.alerts === false ? "0" : "1",
  ].join("");
}

export function forecastCacheKey(
  provider: string,
  location: WeatherLatLng,
  parts?: WeatherForecastParts,
  windowKey = "default",
): string {
  return [
    "weather",
    "v2",
    provider,
    roundCoord(location.lat),
    roundCoord(location.lng),
    partsKey(parts),
    windowKey,
  ].join(":");
}

/** @deprecated — clé legacy. */
export function currentCacheKey(location: WeatherLatLng): string {
  return `weather:current:${roundCoord(location.lat)}:${roundCoord(location.lng)}`;
}

async function withRedis<T>(
  fn: (redis: ReturnType<typeof getRedis>) => Promise<T>,
): Promise<T | null> {
  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }
    return await fn(redis);
  } catch {
    return null;
  }
}

export async function getCachedForecastEntry(
  provider: string,
  location: WeatherLatLng,
  parts?: WeatherForecastParts,
  windowKey = "default",
): Promise<CachedWeatherEntry | null> {
  const key = forecastCacheKey(provider, location, parts, windowKey);
  const raw = await withRedis((redis) => redis.get(key));
  if (!raw) {
    // Fallback stale dédié.
    const staleRaw = await withRedis((redis) => redis.get(`${key}:stale`));
    if (!staleRaw) return null;
    try {
      const forecast = JSON.parse(staleRaw) as WeatherForecast;
      return {
        forecast,
        cachedAt: forecast.fetchedAt,
        stale: true,
        expiresAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }
  try {
    const parsed = JSON.parse(raw) as {
      forecast: WeatherForecast;
      cachedAt: string;
      expiresAt: string;
    };
    return {
      forecast: parsed.forecast,
      cachedAt: parsed.cachedAt,
      stale: false,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function setCachedForecastEntry(
  provider: string,
  location: WeatherLatLng,
  forecast: WeatherForecast,
  proximity: WeatherCacheProximity,
  parts?: WeatherForecastParts,
  windowKey = "default",
): Promise<void> {
  const ttl = cacheTtlSeconds(proximity);
  const key = forecastCacheKey(provider, location, parts, windowKey);
  const cachedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  const payload = JSON.stringify({ forecast, cachedAt, expiresAt });

  await withRedis(async (redis) => {
    await redis.set(key, payload, "EX", ttl);
    // Copie longue durée pour fallback périmé (7 jours).
    await redis.set(
      `${key}:stale`,
      JSON.stringify(forecast),
      "EX",
      7 * 24 * 3600,
    );
  });
}

export async function setNegativeCache(
  provider: string,
  location: WeatherLatLng,
  parts?: WeatherForecastParts,
  windowKey = "default",
): Promise<void> {
  const key = `${forecastCacheKey(provider, location, parts, windowKey)}:neg`;
  await withRedis((redis) =>
    redis.set(key, "1", "EX", NEGATIVE_CACHE_TTL_SECONDS),
  );
}

export async function hasNegativeCache(
  provider: string,
  location: WeatherLatLng,
  parts?: WeatherForecastParts,
  windowKey = "default",
): Promise<boolean> {
  const key = `${forecastCacheKey(provider, location, parts, windowKey)}:neg`;
  const raw = await withRedis((redis) => redis.get(key));
  return Boolean(raw);
}

/** Compatibilité tests / anciens appels. */
export async function getCachedForecast(
  location: WeatherLatLng,
): Promise<import("./types").WeatherForecastResult | null> {
  const entry = await getCachedForecastEntry("any", location);
  if (!entry) return null;
  return {
    location,
    provider: entry.forecast.provider,
    horizonDays: entry.forecast.daily.length || 16,
    daily: entry.forecast.daily,
  };
}

export async function setCachedForecast(
  location: WeatherLatLng,
  value: import("./types").WeatherForecastResult,
): Promise<void> {
  const forecast: WeatherForecast = {
    provider: (value.provider as WeatherForecast["provider"]) || "null",
    latitude: location.lat,
    longitude: location.lng,
    timezone: "UTC",
    timezoneOffsetSeconds: 0,
    fetchedAt: new Date().toISOString(),
    hourly: [],
    daily: value.daily,
    alerts: [],
  };
  await setCachedForecastEntry(value.provider, location, forecast, "mid");
}

export async function getCachedCurrent(
  location: WeatherLatLng,
): Promise<import("./types").WeatherCurrentResult | null> {
  const entry = await getCachedForecastEntry("any", location, {
    current: true,
    hourly: false,
    daily: false,
    alerts: false,
  });
  if (!entry?.forecast.current) return null;
  const c = entry.forecast.current;
  return {
    location,
    provider: entry.forecast.provider,
    current: {
      observedAt: c.observedAt,
      weatherCode: c.condition.code,
      summary: c.condition.description,
      temperatureC: c.temperatureC,
    },
  };
}

export async function setCachedCurrent(
  location: WeatherLatLng,
  value: import("./types").WeatherCurrentResult,
): Promise<void> {
  void location;
  void value;
}
