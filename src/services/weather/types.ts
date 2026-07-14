export type WeatherLatLng = {
  lat: number;
  lng: number;
};

export type WeatherDailyForecast = {
  date: string; // YYYY-MM-DD
  weatherCode: number;
  summary: string;
  tempMinC: number;
  tempMaxC: number;
  precipitationMm: number | null;
};

export type WeatherCurrentConditions = {
  observedAt: string; // ISO
  weatherCode: number;
  summary: string;
  temperatureC: number;
};

export type WeatherForecastResult = {
  location: WeatherLatLng;
  provider: string;
  horizonDays: number;
  daily: WeatherDailyForecast[];
};

export type WeatherCurrentResult = {
  location: WeatherLatLng;
  provider: string;
  current: WeatherCurrentConditions;
};

export type WeatherProviderAvailability = {
  available: boolean;
  reason?: "disabled" | "missing_key" | "provider_error";
};

/**
 * Contrat fournisseur météo — le métier n'appelle jamais l'API directement.
 */
export interface WeatherProvider {
  readonly name: string;
  readonly horizonDays: number;
  isAvailable(): WeatherProviderAvailability;
  getForecast(location: WeatherLatLng): Promise<WeatherForecastResult>;
  getCurrent(location: WeatherLatLng): Promise<WeatherCurrentResult>;
}
