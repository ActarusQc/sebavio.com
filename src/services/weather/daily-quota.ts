import { getRedis } from "@/lib/redis";
import { loadWeatherConfig } from "./config";
import { WeatherError } from "./errors";
import { logWeatherEvent, weatherMetricInc } from "./metrics";

function utcDayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function weatherDailyQuotaKey(day = utcDayKey()): string {
  return `weather:daily_calls:${day}`;
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

export async function getDailyCallCount(): Promise<number> {
  const raw = await withRedis((redis) => redis.get(weatherDailyQuotaKey()));
  return raw ? Number(raw) || 0 : 0;
}

/**
 * Incrémente le compteur quotidien avant un appel HTTP fournisseur.
 * Refuse proprement si la limite interne est atteinte.
 */
export async function assertAndIncrementDailyQuota(
  maxCalls?: number,
): Promise<void> {
  const limit = maxCalls ?? loadWeatherConfig().maxDailyCalls;
  const key = weatherDailyQuotaKey();

  const result = await withRedis(async (redis) => {
    const count = await redis.incr(key);
    if (count === 1) {
      // Expire un peu après minuit UTC du lendemain.
      await redis.expire(key, 60 * 60 * 36);
    }
    return count;
  });

  if (result == null) {
    throw new WeatherError("unavailable", "Données météo indisponibles", 503, {
      retryable: true,
    });
  }

  if (result > limit) {
    weatherMetricInc("quota_blocked");
    logWeatherEvent("quota_reached", { count: result, limit });
    throw new WeatherError(
      "quota_reached",
      "Limite quotidienne d'appels météo atteinte",
      429,
      { retryable: false },
    );
  }

  weatherMetricInc("provider_call");
  logWeatherEvent("provider_call", { count: result, limit });
}

export async function canCallProvider(maxCalls?: number): Promise<boolean> {
  const limit = maxCalls ?? loadWeatherConfig().maxDailyCalls;
  const count = await getDailyCallCount();
  return count < limit;
}
