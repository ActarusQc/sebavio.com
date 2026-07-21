import { WEATHER_FORECAST_HORIZON_DAYS } from "@/lib/constants";
import { WeatherError } from "./errors";
import { wmoWeatherSummary } from "./wmo";
import type {
  WeatherDailyForecast,
  WeatherForecast,
  WeatherForecastInput,
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
  apiKey?: string;
  fetchImpl?: typeof fetch;
};

/**
 * Open-Meteo Forecast API — adapté au modèle normalisé Sebavio.
 */
export class OpenMeteoProvider implements WeatherProvider {
  readonly name = "open-meteo" as const;
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

  async getForecast(input: WeatherForecastInput): Promise<WeatherForecast> {
    const location = { lat: input.latitude, lng: input.longitude };
    const wantCurrent = input.parts?.current !== false;
    const wantDaily = input.parts?.daily !== false;

    const base = this.apiKey ? CUSTOMER_BASE : FREE_BASE;
    const params = new URLSearchParams({
      latitude: String(location.lat),
      longitude: String(location.lng),
      timezone: "auto",
    });

    if (wantDaily) {
      params.set("forecast_days", String(this.horizonDays));
      params.set(
        "daily",
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
      );
    }
    if (wantCurrent) {
      params.set("current", "temperature_2m,weather_code");
    }
    if (this.apiKey) {
      params.set("apikey", this.apiKey);
    }

    let response: Response;
    try {
      response = await this.fetchImpl(`${base}?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      throw new WeatherError("temporary", "Données météo indisponibles", 503, {
        retryable: true,
      });
    }

    if (!response.ok) {
      throw new WeatherError(
        "unavailable",
        "Données météo indisponibles",
        503,
        {
          retryable: response.status >= 500,
        },
      );
    }

    let data: OpenMeteoDailyResponse;
    try {
      data = (await response.json()) as OpenMeteoDailyResponse;
    } catch {
      throw new WeatherError("validation", "Réponse météo invalide", 502);
    }

    if (data.error) {
      throw new WeatherError("unavailable", "Données météo indisponibles", 503);
    }

    const times = data.daily?.time ?? [];
    const codes = data.daily?.weather_code ?? [];
    const maxes = data.daily?.temperature_2m_max ?? [];
    const mins = data.daily?.temperature_2m_min ?? [];
    const precip = data.daily?.precipitation_sum ?? [];

    const daily: WeatherDailyForecast[] = times.map((date, i) => {
      const code = Number(codes[i] ?? 0);
      const summary = wmoWeatherSummary(code);
      const precipMm =
        precip[i] == null || Number.isNaN(Number(precip[i]))
          ? null
          : Number(precip[i]);
      return {
        date,
        forecastAt: `${date}T12:00:00.000Z`,
        tempMinC: Number(mins[i] ?? 0),
        tempMaxC: Number(maxes[i] ?? 0),
        tempDayC: null,
        feelsLikeDayC: null,
        precipitationProbability: null,
        rainMm: precipMm,
        snowMm: null,
        humidity: null,
        pressureHpa: null,
        windSpeedKmh: null,
        windDirectionDeg: null,
        windGustKmh: null,
        cloudCoverPct: null,
        uvIndex: null,
        sunriseAt: null,
        sunsetAt: null,
        condition: {
          code,
          main: summary,
          description: summary,
          iconId: String(code),
        },
        weatherCode: code,
        summary,
        precipitationMm: precipMm,
      };
    });

    if (wantDaily && daily.length === 0 && !data.current) {
      throw new WeatherError("unavailable", "Données météo indisponibles", 503);
    }

    const current =
      wantCurrent &&
      data.current &&
      data.current.temperature_2m != null &&
      data.current.weather_code != null
        ? {
            observedAt: data.current.time
              ? new Date(data.current.time).toISOString()
              : new Date().toISOString(),
            temperatureC: Number(data.current.temperature_2m),
            feelsLikeC: Number(data.current.temperature_2m),
            humidity: null,
            pressureHpa: null,
            windSpeedKmh: null,
            windDirectionDeg: null,
            windGustKmh: null,
            visibilityM: null,
            cloudCoverPct: null,
            uvIndex: null,
            rainMm: null,
            snowMm: null,
            sunriseAt: null,
            sunsetAt: null,
            condition: {
              code: Number(data.current.weather_code),
              main: wmoWeatherSummary(Number(data.current.weather_code)),
              description: wmoWeatherSummary(Number(data.current.weather_code)),
              iconId: String(data.current.weather_code),
            },
          }
        : undefined;

    return {
      provider: "open-meteo",
      latitude: location.lat,
      longitude: location.lng,
      timezone: "auto",
      timezoneOffsetSeconds: 0,
      fetchedAt: new Date().toISOString(),
      current,
      hourly: [],
      daily,
      alerts: [],
    };
  }
}
