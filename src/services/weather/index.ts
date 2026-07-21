import { loadWeatherConfig } from "./config";
import { coalesceAsync } from "./coalesce";
import {
  getCachedForecastEntry,
  setCachedForecastEntry,
  setNegativeCache,
  hasNegativeCache,
} from "./cache";
import { assertAndIncrementDailyQuota, canCallProvider } from "./daily-quota";
import { isWeatherError, WeatherError } from "./errors";
import { logWeatherEvent, weatherMetricInc } from "./metrics";
import { NullWeatherProvider } from "./null-provider";
import { OpenMeteoProvider } from "./open-meteo-provider";
import { OpenWeatherProvider } from "./openweather/provider";
import { assertWeatherRateLimit } from "./rate-limit";
import type {
  WeatherCacheProximity,
  WeatherCurrentResult,
  WeatherForecast,
  WeatherForecastInput,
  WeatherForecastParts,
  WeatherForecastResult,
  WeatherLatLng,
  WeatherProvider,
  WeatherProviderAvailability,
} from "./types";

export type { WeatherEnvConfig } from "./config";
export { loadWeatherConfig } from "./config";
export {
  WeatherActivityClassifier,
  weatherActivityClassifier,
} from "./activity-classifier";
export { clusterWeatherLocations } from "./cluster";
export {
  resolveDisplayWindow,
  shouldCallProvider,
  resolveCacheProximity,
  cacheTtlSeconds,
  computeTripTiming,
} from "./window";
export { metersPerSecondToKmh, popToPercent, roundCoord } from "./units";
export { forecastCacheKey } from "./cache";
export { clearCoalesceForTests } from "./coalesce";
export { resetWeatherMetricsForTests } from "./metrics";
export { OpenWeatherProvider } from "./openweather/provider";
export { OpenMeteoProvider } from "./open-meteo-provider";
export { mapOneCall3ToForecast } from "./openweather/mapper";
export type * from "./types";

export type WeatherService = {
  availability(): WeatherProviderAvailability;
  getForecast(
    userId: string,
    input: WeatherForecastInput,
    options?: {
      proximity?: WeatherCacheProximity;
      windowKey?: string;
      allowStaleOnQuota?: boolean;
    },
  ): Promise<{
    forecast: WeatherForecast;
    fromCache: boolean;
    stale: boolean;
    nextRefreshAt?: string;
  }>;
  /** Compat routes legacy. */
  getForecastLegacy(
    userId: string,
    location: WeatherLatLng,
  ): Promise<WeatherForecastResult>;
  getCurrent(
    userId: string,
    location: WeatherLatLng,
  ): Promise<WeatherCurrentResult>;
  tryGetForecast(
    userId: string,
    input: WeatherForecastInput,
    options?: {
      proximity?: WeatherCacheProximity;
      windowKey?: string;
    },
  ): Promise<{
    forecast: WeatherForecast;
    fromCache: boolean;
    stale: boolean;
    nextRefreshAt?: string;
  } | null>;
  tryGetCurrent(
    userId: string,
    location: WeatherLatLng,
  ): Promise<WeatherCurrentResult | null>;
};

let providerOverride: WeatherProvider | null = null;

export function setWeatherProviderForTests(
  provider: WeatherProvider | null,
): void {
  providerOverride = provider;
}

export function createWeatherProviderFromEnv(): WeatherProvider {
  const config = loadWeatherConfig();

  if (!config.enabled || config.provider === "off") {
    return new NullWeatherProvider();
  }

  if (config.provider === "openweather") {
    return new OpenWeatherProvider({
      config,
      onHttpCall: () => assertAndIncrementDailyQuota(config.maxDailyCalls),
    });
  }

  return new OpenMeteoProvider({
    apiKey: config.openMeteoApiKey || undefined,
  });
}

function resolveProvider(): WeatherProvider {
  return providerOverride ?? createWeatherProviderFromEnv();
}

function assertValidLocation(lat: number, lng: number): void {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    throw new WeatherError(
      "invalid_location",
      "Position invalide ou introuvable",
      400,
    );
  }
}

function toLegacyForecast(
  forecast: WeatherForecast,
  horizonDays: number,
): WeatherForecastResult {
  return {
    location: { lat: forecast.latitude, lng: forecast.longitude },
    provider: forecast.provider,
    horizonDays,
    daily: forecast.daily,
  };
}

export function createWeatherService(
  provider?: WeatherProvider,
): WeatherService {
  const resolved = provider ?? resolveProvider();
  const config = loadWeatherConfig();

  async function getForecast(
    userId: string,
    input: WeatherForecastInput,
    options?: {
      proximity?: WeatherCacheProximity;
      windowKey?: string;
      allowStaleOnQuota?: boolean;
    },
  ) {
    assertValidLocation(input.latitude, input.longitude);
    const proximity = options?.proximity ?? "mid";
    const windowKey = options?.windowKey ?? proximity;
    const parts: WeatherForecastParts = input.parts ?? {
      current: true,
      hourly: true,
      daily: true,
      alerts: true,
    };
    const location = { lat: input.latitude, lng: input.longitude };
    const providerName = resolved.name;

    const cached = await getCachedForecastEntry(
      providerName,
      location,
      parts,
      windowKey,
    );
    if (cached && !cached.stale) {
      weatherMetricInc("cache_hit");
      return {
        forecast: cached.forecast,
        fromCache: true,
        stale: false,
        nextRefreshAt: cached.expiresAt,
      };
    }

    if (await hasNegativeCache(providerName, location, parts, windowKey)) {
      if (cached?.stale) {
        weatherMetricInc("stale_fallback");
        return {
          forecast: cached.forecast,
          fromCache: true,
          stale: true,
          nextRefreshAt: undefined,
        };
      }
      throw new WeatherError("temporary", "Données météo indisponibles", 503, {
        retryable: true,
      });
    }

    if (!resolved.isAvailable().available) {
      if (cached?.stale) {
        weatherMetricInc("stale_fallback");
        return {
          forecast: cached.forecast,
          fromCache: true,
          stale: true,
        };
      }
      throw new WeatherError("disabled", "Données météo indisponibles", 503);
    }

    const allowed = await canCallProvider(config.maxDailyCalls);
    if (!allowed) {
      weatherMetricInc("quota_blocked");
      if (cached) {
        weatherMetricInc("stale_fallback");
        return {
          forecast: cached.forecast,
          fromCache: true,
          stale: true,
        };
      }
      throw new WeatherError(
        "quota_reached",
        "Limite quotidienne d'appels météo atteinte",
        429,
      );
    }

    await assertWeatherRateLimit(userId);

    const coalesceKey = [
      providerName,
      location.lat.toFixed(2),
      location.lng.toFixed(2),
      windowKey,
      JSON.stringify(parts),
    ].join("|");

    try {
      const forecast = await coalesceAsync(coalesceKey, async () => {
        weatherMetricInc("cache_miss");
        // OpenWeather incrémente via onHttpCall ; Open-Meteo aussi pour le plafond global.
        if (resolved.name !== "openweather") {
          await assertAndIncrementDailyQuota(config.maxDailyCalls);
        }
        return resolved.getForecast({ ...input, parts });
      });

      await setCachedForecastEntry(
        providerName,
        location,
        forecast,
        proximity,
        parts,
        windowKey,
      );

      return {
        forecast,
        fromCache: false,
        stale: false,
      };
    } catch (error) {
      weatherMetricInc("provider_error");
      logWeatherEvent("provider_error", {
        kind: isWeatherError(error) ? error.kind : "unknown",
      });

      const retryable =
        isWeatherError(error) &&
        (error.retryable ||
          error.kind === "temporary" ||
          error.kind === "timeout");

      if (retryable) {
        await setNegativeCache(providerName, location, parts, windowKey);
      }

      if (
        cached &&
        (options?.allowStaleOnQuota !== false ||
          (isWeatherError(error) &&
            (error.kind === "quota_reached" ||
              error.kind === "rate_limited" ||
              error.kind === "temporary" ||
              error.kind === "timeout")))
      ) {
        weatherMetricInc("stale_fallback");
        return {
          forecast: cached.forecast,
          fromCache: true,
          stale: true,
        };
      }

      throw error;
    }
  }

  return {
    availability() {
      const configAvail = loadWeatherConfig();
      if (!configAvail.enabled) {
        return { available: false, reason: "disabled" };
      }
      return resolved.isAvailable();
    },

    getForecast,

    async getForecastLegacy(userId, location) {
      const result = await getForecast(userId, {
        latitude: location.lat,
        longitude: location.lng,
        parts: { current: false, hourly: false, daily: true, alerts: false },
      });
      return toLegacyForecast(result.forecast, resolved.horizonDays);
    },

    async getCurrent(userId, location) {
      const result = await getForecast(
        userId,
        {
          latitude: location.lat,
          longitude: location.lng,
          parts: {
            current: true,
            hourly: false,
            daily: false,
            alerts: false,
          },
        },
        { proximity: "near", windowKey: "current" },
      );
      const c = result.forecast.current;
      if (!c) {
        throw new WeatherError(
          "unavailable",
          "Données météo indisponibles",
          503,
        );
      }
      return {
        location,
        provider: result.forecast.provider,
        current: {
          observedAt: c.observedAt,
          weatherCode: c.condition.code,
          summary: c.condition.description,
          temperatureC: c.temperatureC,
        },
      };
    },

    async tryGetForecast(userId, input, options) {
      try {
        return await getForecast(userId, input, {
          ...options,
          allowStaleOnQuota: true,
        });
      } catch {
        return null;
      }
    },

    async tryGetCurrent(userId, location) {
      try {
        return await this.getCurrent(userId, location);
      } catch {
        return null;
      }
    },
  };
}

export function getWeatherService(): WeatherService {
  return createWeatherService();
}
