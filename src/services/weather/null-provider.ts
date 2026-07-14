import { AppError } from "@/lib/errors";
import type {
  WeatherCurrentResult,
  WeatherForecastResult,
  WeatherLatLng,
  WeatherProvider,
  WeatherProviderAvailability,
} from "./types";

/**
 * Fournisseur dégradé : météo désactivée ou non configurée.
 * La fiche voyage continue sans prévisions.
 */
export class NullWeatherProvider implements WeatherProvider {
  readonly name = "null";
  readonly horizonDays = 0;

  isAvailable(): WeatherProviderAvailability {
    return { available: false, reason: "disabled" };
  }

  async getForecast(_location: WeatherLatLng): Promise<WeatherForecastResult> {
    void _location;
    throw new AppError("EXT_003", "Données météo indisponibles", 503);
  }

  async getCurrent(_location: WeatherLatLng): Promise<WeatherCurrentResult> {
    void _location;
    throw new AppError("EXT_003", "Données météo indisponibles", 503);
  }
}
