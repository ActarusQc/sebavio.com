import { AppError } from "@/lib/errors";
import {
  getCachedCurrent,
  getCachedForecast,
  setCachedCurrent,
  setCachedForecast,
} from "./cache";
import { NullWeatherProvider } from "./null-provider";
import { OpenMeteoProvider } from "./open-meteo-provider";
import { assertWeatherRateLimit } from "./rate-limit";
import type {
  WeatherCurrentResult,
  WeatherForecastResult,
  WeatherLatLng,
  WeatherProvider,
  WeatherProviderAvailability,
} from "./types";

export type WeatherService = {
  availability(): WeatherProviderAvailability;
  getForecast(
    userId: string,
    location: WeatherLatLng,
  ): Promise<WeatherForecastResult>;
  getCurrent(
    userId: string,
    location: WeatherLatLng,
  ): Promise<WeatherCurrentResult>;
  /**
   * Variante soft : jamais d'exception pour panne fournisseur / rate-limit.
   * Utilisée par la fiche voyage.
   */
  tryGetForecast(
    userId: string,
    location: WeatherLatLng,
  ): Promise<WeatherForecastResult | null>;
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

function normalizeProviderName(raw: string | undefined): string {
  return (raw ?? "open-meteo").trim().toLowerCase();
}

/**
 * WEATHER_PROVIDER=open-meteo (défaut) | off | openweather (non implémenté → null).
 * OPEN_METEO_API_KEY optionnelle → endpoint commercial customer-api.
 */
export function createWeatherProviderFromEnv(): WeatherProvider {
  const name = normalizeProviderName(process.env.WEATHER_PROVIDER);

  if (name === "off" || name === "disabled" || name === "null") {
    return new NullWeatherProvider();
  }

  if (name === "openweather") {
    // Abstraction prête ; implémentation reportée (arbitrage Open-Meteo).
    return new NullWeatherProvider();
  }

  const apiKey = process.env.OPEN_METEO_API_KEY?.trim() ?? "";
  return new OpenMeteoProvider({ apiKey: apiKey || undefined });
}

function resolveProvider(): WeatherProvider {
  return providerOverride ?? createWeatherProviderFromEnv();
}

function assertValidLocation(location: WeatherLatLng): void {
  if (
    !Number.isFinite(location.lat) ||
    !Number.isFinite(location.lng) ||
    location.lat < -90 ||
    location.lat > 90 ||
    location.lng < -180 ||
    location.lng > 180
  ) {
    throw new AppError("EXT_002", "Position invalide ou introuvable", 400);
  }
}

/**
 * Si Redis/cache est down, on refuse l'appel fournisseur.
 * Un hit cache ne consomme pas le rate-limit ni le fournisseur.
 */
export function createWeatherService(
  provider?: WeatherProvider,
): WeatherService {
  const resolved = provider ?? resolveProvider();

  async function getForecast(
    userId: string,
    location: WeatherLatLng,
  ): Promise<WeatherForecastResult> {
    assertValidLocation(location);

    const cached = await getCachedForecast(location);
    if (cached) {
      return cached;
    }

    if (!resolved.isAvailable().available) {
      throw new AppError("EXT_003", "Données météo indisponibles", 503);
    }

    await assertWeatherRateLimit(userId);
    const result = await resolved.getForecast(location);
    await setCachedForecast(location, result);
    return result;
  }

  async function getCurrent(
    userId: string,
    location: WeatherLatLng,
  ): Promise<WeatherCurrentResult> {
    assertValidLocation(location);

    const cached = await getCachedCurrent(location);
    if (cached) {
      return cached;
    }

    if (!resolved.isAvailable().available) {
      throw new AppError("EXT_003", "Données météo indisponibles", 503);
    }

    await assertWeatherRateLimit(userId);
    const result = await resolved.getCurrent(location);
    await setCachedCurrent(location, result);
    return result;
  }

  return {
    availability() {
      return resolved.isAvailable();
    },

    getForecast,
    getCurrent,

    async tryGetForecast(userId, location) {
      try {
        return await getForecast(userId, location);
      } catch {
        return null;
      }
    },

    async tryGetCurrent(userId, location) {
      try {
        return await getCurrent(userId, location);
      } catch {
        return null;
      }
    },
  };
}

export function getWeatherService(): WeatherService {
  return createWeatherService();
}
