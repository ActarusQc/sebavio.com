/**
 * Modèle météo normalisé — indépendant du fournisseur externe.
 */

export type WeatherLatLng = {
  lat: number;
  lng: number;
};

export type WeatherProviderName = "openweather" | "open-meteo" | "null";

export type WeatherActivityCondition =
  | "excellent_outdoor"
  | "good_outdoor"
  | "mixed"
  | "rain"
  | "storm"
  | "snow"
  | "extreme_heat"
  | "extreme_cold"
  | "strong_wind";

export type WeatherAlertLevel = "information" | "vigilance" | "important";

export type WeatherCondition = {
  code: number;
  main: string;
  description: string;
  iconId: string;
};

export type WeatherCurrent = {
  observedAt: string;
  temperatureC: number;
  feelsLikeC: number;
  humidity: number | null;
  pressureHpa: number | null;
  windSpeedKmh: number | null;
  windDirectionDeg: number | null;
  windGustKmh: number | null;
  visibilityM: number | null;
  cloudCoverPct: number | null;
  uvIndex: number | null;
  rainMm: number | null;
  snowMm: number | null;
  sunriseAt: string | null;
  sunsetAt: string | null;
  condition: WeatherCondition;
};

export type WeatherHourlyForecast = {
  forecastAt: string;
  temperatureC: number;
  feelsLikeC: number;
  precipitationProbability: number | null;
  rainMm: number | null;
  snowMm: number | null;
  humidity: number | null;
  pressureHpa: number | null;
  windSpeedKmh: number | null;
  windDirectionDeg: number | null;
  windGustKmh: number | null;
  visibilityM: number | null;
  cloudCoverPct: number | null;
  uvIndex: number | null;
  condition: WeatherCondition;
};

export type WeatherDailyForecast = {
  date: string;
  forecastAt: string;
  tempMinC: number;
  tempMaxC: number;
  tempDayC: number | null;
  feelsLikeDayC: number | null;
  precipitationProbability: number | null;
  rainMm: number | null;
  snowMm: number | null;
  humidity: number | null;
  pressureHpa: number | null;
  windSpeedKmh: number | null;
  windDirectionDeg: number | null;
  windGustKmh: number | null;
  cloudCoverPct: number | null;
  uvIndex: number | null;
  sunriseAt: string | null;
  sunsetAt: string | null;
  condition: WeatherCondition;
  /** Compatibilité Open-Meteo / UI historique. */
  weatherCode: number;
  summary: string;
  precipitationMm: number | null;
};

export type WeatherAlert = {
  id: string;
  title: string;
  senderName: string;
  startAt: string;
  endAt: string;
  description: string;
  summary: string;
  tags: string[];
  level: WeatherAlertLevel;
};

export type WeatherForecast = {
  provider: WeatherProviderName;
  latitude: number;
  longitude: number;
  timezone: string;
  timezoneOffsetSeconds: number;
  fetchedAt: string;
  current?: WeatherCurrent;
  hourly: WeatherHourlyForecast[];
  daily: WeatherDailyForecast[];
  alerts: WeatherAlert[];
};

export type WeatherForecastParts = {
  current?: boolean;
  hourly?: boolean;
  daily?: boolean;
  alerts?: boolean;
};

export type WeatherForecastInput = {
  latitude: number;
  longitude: number;
  parts?: WeatherForecastParts;
};

export type WeatherProviderAvailability = {
  available: boolean;
  reason?: "disabled" | "missing_key" | "provider_error" | "quota_reached";
};

/**
 * Contrat fournisseur météo — le métier n'appelle jamais l'API directement.
 */
export interface WeatherProvider {
  readonly name: WeatherProviderName;
  readonly horizonDays: number;
  isAvailable(): WeatherProviderAvailability;
  getForecast(input: WeatherForecastInput): Promise<WeatherForecast>;
}

/** @deprecated Utiliser WeatherForecast — conservé pour routes legacy. */
export type WeatherForecastResult = {
  location: WeatherLatLng;
  provider: string;
  horizonDays: number;
  daily: WeatherDailyForecast[];
};

/** @deprecated Utiliser WeatherForecast.current. */
export type WeatherCurrentConditions = {
  observedAt: string;
  weatherCode: number;
  summary: string;
  temperatureC: number;
};

/** @deprecated Utiliser WeatherForecast. */
export type WeatherCurrentResult = {
  location: WeatherLatLng;
  provider: string;
  current: WeatherCurrentConditions;
};

export type WeatherCacheProximity = "far" | "mid" | "near" | "live";

export type WeatherDisplayWindow =
  "none" | "too_early_detail" | "daily" | "hourly" | "live";
