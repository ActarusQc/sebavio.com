import { getRedis } from "@/lib/redis";
import { WEATHER_CACHE_TTL_SECONDS } from "@/lib/constants";
import type {
  WeatherCurrentResult,
  WeatherForecastResult,
  WeatherLatLng,
} from "./types";

/** Arrondi ~1,1 km — une même zone partage le cache. */
export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

export function forecastCacheKey(location: WeatherLatLng): string {
  return `weather:forecast:${roundCoord(location.lat)}:${roundCoord(location.lng)}`;
}

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

export async function getCachedForecast(
  location: WeatherLatLng,
): Promise<WeatherForecastResult | null> {
  const raw = await withRedis((redis) => redis.get(forecastCacheKey(location)));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WeatherForecastResult;
  } catch {
    return null;
  }
}

export async function setCachedForecast(
  location: WeatherLatLng,
  value: WeatherForecastResult,
): Promise<void> {
  await withRedis((redis) =>
    redis.set(
      forecastCacheKey(location),
      JSON.stringify(value),
      "EX",
      WEATHER_CACHE_TTL_SECONDS,
    ),
  );
}

export async function getCachedCurrent(
  location: WeatherLatLng,
): Promise<WeatherCurrentResult | null> {
  const raw = await withRedis((redis) => redis.get(currentCacheKey(location)));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WeatherCurrentResult;
  } catch {
    return null;
  }
}

export async function setCachedCurrent(
  location: WeatherLatLng,
  value: WeatherCurrentResult,
): Promise<void> {
  await withRedis((redis) =>
    redis.set(
      currentCacheKey(location),
      JSON.stringify(value),
      "EX",
      WEATHER_CACHE_TTL_SECONDS,
    ),
  );
}
