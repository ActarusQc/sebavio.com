/**
 * Services partagés transversaux.
 */
export {
  getMapsService,
  createMapsService,
  setMapsProviderForTests,
  createMapsProviderFromEnv,
} from "./maps";
export type { MapsService } from "./maps";
export {
  getFuelPriceProvider,
  createFuelPriceProviderFromEnv,
  setFuelPriceProviderForTests,
  PersonalAverageFuelPriceProvider,
  CompositeFuelPriceProvider,
  ingestRegieFuelPrices,
} from "./fuel-prices";
export type {
  FuelPriceProvider,
  FuelPriceQuote,
  FuelPriceLookupInput,
  IngestReport,
} from "./fuel-prices";
export {
  getWeatherService,
  createWeatherService,
  setWeatherProviderForTests,
  createWeatherProviderFromEnv,
} from "./weather";
export type { WeatherService } from "./weather";
