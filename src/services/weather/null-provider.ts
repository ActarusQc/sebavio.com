import { WeatherError } from "./errors";
import type {
  WeatherForecast,
  WeatherForecastInput,
  WeatherProvider,
  WeatherProviderAvailability,
} from "./types";

/**
 * Fournisseur dégradé : météo désactivée ou non configurée.
 */
export class NullWeatherProvider implements WeatherProvider {
  readonly name = "null" as const;
  readonly horizonDays = 0;

  isAvailable(): WeatherProviderAvailability {
    return { available: false, reason: "disabled" };
  }

  async getForecast(_input: WeatherForecastInput): Promise<WeatherForecast> {
    void _input;
    throw new WeatherError("disabled", "Données météo indisponibles", 503);
  }
}
