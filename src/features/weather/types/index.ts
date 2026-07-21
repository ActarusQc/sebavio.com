import type { WeatherActivityClassification } from "@/services/weather/activity-classifier";
import type {
  WeatherAlert,
  WeatherCurrent,
  WeatherDailyForecast,
  WeatherHourlyForecast,
} from "@/services/weather/types";

export type TripWeatherStatus =
  | "available"
  | "too_early"
  | "temporarily_unavailable"
  | "provider_limit_reached"
  | "disabled"
  | "no_coordinates";

export type TripWeatherLocationType =
  "origin" | "destination" | "stop" | "live";

export type TripWeatherLocation = {
  id: string;
  name: string;
  type: TripWeatherLocationType;
  date: string | null;
  latitude: number;
  longitude: number;
  current: WeatherCurrent | null;
  daily: WeatherDailyForecast[];
  hourly: WeatherHourlyForecast[];
  alerts: WeatherAlert[];
  activity: WeatherActivityClassification | null;
  updatedAt: string | null;
  fromCache: boolean;
  stale: boolean;
  summary: string | null;
};

export type TripWeatherResponse = {
  status: TripWeatherStatus;
  generatedAt: string;
  nextRefreshAt?: string;
  message: string | null;
  displayWindow: "none" | "too_early_detail" | "daily" | "hourly" | "live";
  locations: TripWeatherLocation[];
};

/** @deprecated — compatibilité ancienne UI / tests. */
export type StopWeatherStatus =
  "ok" | "no_coordinates" | "out_of_range" | "unavailable";

export type StopWeatherForecastDto = {
  date: string;
  weatherCode: number;
  summary: string;
  tempMinC: number;
  tempMaxC: number;
  precipitationMm: number | null;
};

export type StopWeatherDto = {
  stopId: string;
  stopName: string;
  sequence: number;
  forecastDate: string | null;
  status: StopWeatherStatus;
  message: string | null;
  forecast: StopWeatherForecastDto | null;
};

export type TripWeatherDto = {
  tripId: string;
  providerAvailable: boolean;
  horizonDays: number;
  stops: StopWeatherDto[];
  /** Nouveau contrat. */
  response?: TripWeatherResponse;
};

export type WeatherForecastApiDto = {
  available: boolean;
  provider: string | null;
  horizonDays: number;
  location: { lat: number; lng: number } | null;
  daily: StopWeatherForecastDto[];
  message: string | null;
};

export type WeatherCurrentApiDto = {
  available: boolean;
  provider: string | null;
  location: { lat: number; lng: number } | null;
  current: {
    observedAt: string;
    weatherCode: number;
    summary: string;
    temperatureC: number;
  } | null;
  message: string | null;
};
