import { AppError } from "@/lib/errors";
import { WEATHER_FORECAST_HORIZON_DAYS } from "@/lib/constants";
import { wmoWeatherSummary } from "./wmo";
import type {
  WeatherCurrentResult,
  WeatherDailyForecast,
  WeatherForecastResult,
  WeatherLatLng,
  WeatherProvider,
  WeatherProviderAvailability,
} from "./types";

const FREE_BASE = "https://api.open-meteo.com/v1/forecast";
const CUSTOMER_BASE = "https://customer-api.open-meteo.com/v1/forecast";

type OpenMeteoDailyResponse = {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
  };
  current?: {
    time?: string;
    temperature_2m?: number;
    weather_code?: number;
  };
  error?: boolean;
  reason?: string;
};

export type OpenMeteoProviderOptions = {
  /** Clé offre commerciale ; vide = endpoint public non-commercial. */
  apiKey?: string;
  fetchImpl?: typeof fetch;
};

/**
 * Open-Meteo Forecast API.
 * Sans clé → api.open-meteo.com (usage non-commercial).
 * Avec clé → customer-api.open-meteo.com?apikey=… (offre commerciale).
 */
export class OpenMeteoProvider implements WeatherProvider {
  readonly name = "open-meteo";
  readonly horizonDays = WEATHER_FORECAST_HORIZON_DAYS;

  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenMeteoProviderOptions = {}) {
    this.apiKey = options.apiKey?.trim() ?? "";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  isAvailable(): WeatherProviderAvailability {
    return { available: true };
  }

  private buildUrl(
    location: WeatherLatLng,
    mode: "forecast" | "current",
  ): string {
    const base = this.apiKey ? CUSTOMER_BASE : FREE_BASE;
    const params = new URLSearchParams({
      latitude: String(location.lat),
      longitude: String(location.lng),
      timezone: "auto",
    });

    if (mode === "forecast") {
      params.set("forecast_days", String(this.horizonDays));
      params.set(
        "daily",
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
      );
    } else {
      params.set("current", "temperature_2m,weather_code");
    }

    if (this.apiKey) {
      params.set("apikey", this.apiKey);
    }

    return `${base}?${params.toString()}`;
  }

  private async fetchJson(
    location: WeatherLatLng,
    mode: "forecast" | "current",
  ): Promise<OpenMeteoDailyResponse> {
    let response: Response;
    try {
      response = await this.fetchImpl(this.buildUrl(location, mode), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      throw new AppError("EXT_003", "Données météo indisponibles", 503);
    }

    if (!response.ok) {
      throw new AppError("EXT_003", "Données météo indisponibles", 503);
    }

    let data: OpenMeteoDailyResponse;
    try {
      data = (await response.json()) as OpenMeteoDailyResponse;
    } catch {
      throw new AppError("EXT_003", "Données météo indisponibles", 503);
    }

    if (data.error) {
      throw new AppError("EXT_003", "Données météo indisponibles", 503);
    }

    return data;
  }

  async getForecast(location: WeatherLatLng): Promise<WeatherForecastResult> {
    const data = await this.fetchJson(location, "forecast");
    const times = data.daily?.time ?? [];
    const codes = data.daily?.weather_code ?? [];
    const maxes = data.daily?.temperature_2m_max ?? [];
    const mins = data.daily?.temperature_2m_min ?? [];
    const precip = data.daily?.precipitation_sum ?? [];

    if (times.length === 0) {
      throw new AppError("EXT_003", "Données météo indisponibles", 503);
    }

    const daily: WeatherDailyForecast[] = times.map((date, i) => {
      const code = Number(codes[i] ?? 0);
      return {
        date,
        weatherCode: code,
        summary: wmoWeatherSummary(code),
        tempMinC: Number(mins[i] ?? 0),
        tempMaxC: Number(maxes[i] ?? 0),
        precipitationMm:
          precip[i] == null || Number.isNaN(Number(precip[i]))
            ? null
            : Number(precip[i]),
      };
    });

    return {
      location,
      provider: this.name,
      horizonDays: this.horizonDays,
      daily,
    };
  }

  async getCurrent(location: WeatherLatLng): Promise<WeatherCurrentResult> {
    const data = await this.fetchJson(location, "current");
    const current = data.current;
    if (
      !current ||
      current.temperature_2m == null ||
      current.weather_code == null
    ) {
      throw new AppError("EXT_003", "Données météo indisponibles", 503);
    }

    const code = Number(current.weather_code);
    return {
      location,
      provider: this.name,
      current: {
        observedAt: current.time
          ? new Date(current.time).toISOString()
          : new Date().toISOString(),
        weatherCode: code,
        summary: wmoWeatherSummary(code),
        temperatureC: Number(current.temperature_2m),
      },
    };
  }
}
