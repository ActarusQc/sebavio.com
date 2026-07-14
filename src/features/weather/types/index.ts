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
  /** Message UX pour out_of_range / unavailable / no_coordinates. */
  message: string | null;
  forecast: StopWeatherForecastDto | null;
};

export type TripWeatherDto = {
  tripId: string;
  providerAvailable: boolean;
  horizonDays: number;
  stops: StopWeatherDto[];
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
