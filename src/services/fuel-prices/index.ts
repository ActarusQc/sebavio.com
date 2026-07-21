export type {
  FuelPriceProvider,
  FuelPriceQuote,
  FuelPriceLookupInput,
  FuelPriceSourceKind,
} from "./types";
export { PersonalAverageFuelPriceProvider } from "./personal-average";
export { CompositeFuelPriceProvider } from "./composite";
export {
  ingestRegieFuelPrices,
  parseRegieXlsx,
  parseCentsPrice,
  mapVehicleFuelToRegie,
  resolveRegieExcelUrl,
  RegieQuebecFuelPriceProvider,
  tryRegieQuote,
} from "./regie-quebec";
export type { IngestReport, IngestOptions } from "./regie-quebec";
export {
  FdeFuelPriceProvider,
  tryFdeQuote,
  lookupFuelPriceReference,
  mapSebavioFuelToFde,
  selectReferencePrice,
  median,
  assertFdeRateLimit,
} from "./fde";

import { CompositeFuelPriceProvider } from "./composite";
import type { FuelPriceProvider } from "./types";

let providerOverride: FuelPriceProvider | null = null;

export function setFuelPriceProviderForTests(
  provider: FuelPriceProvider | null,
): void {
  providerOverride = provider;
}

export function createFuelPriceProviderFromEnv(): FuelPriceProvider {
  return new CompositeFuelPriceProvider();
}

export function getFuelPriceProvider(): FuelPriceProvider {
  return providerOverride ?? createFuelPriceProviderFromEnv();
}
