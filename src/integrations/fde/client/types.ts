import type { z } from "zod";

import type {
  fuelTypeSchema,
  fuelTypesListSchema,
  latestRegionalPricesSchema,
  regionalPriceListSchema,
  regionalPriceSchema,
  regionSchema,
  regionsListSchema,
  sourceSchema,
  sourcesListSchema,
  statusSchema,
} from "./schemas";

export type FuelRegionalPrice = z.infer<typeof regionalPriceSchema>;
export type FuelRegionalPriceList = z.infer<typeof regionalPriceListSchema>;
export type FuelLatestRegionalPrices = z.infer<
  typeof latestRegionalPricesSchema
>;
export type FuelRegion = z.infer<typeof regionSchema>;
export type FuelRegionsList = z.infer<typeof regionsListSchema>;
export type FuelFuelType = z.infer<typeof fuelTypeSchema>;
export type FuelFuelTypesList = z.infer<typeof fuelTypesListSchema>;
export type FuelSource = z.infer<typeof sourceSchema>;
export type FuelSourcesList = z.infer<typeof sourcesListSchema>;
export type FuelStatus = z.infer<typeof statusSchema>;

export type FdeFuelPricesClientOptions = {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly fetch?: typeof fetch;
  readonly timeoutMs?: number;
  readonly userAgent?: string;
};

export type LatestRegionalPricesParams = {
  readonly country?: string;
  readonly subdivision?: string;
  readonly region?: string;
  readonly fuelType?: string;
  readonly provider?: string;
  readonly source?: string;
  readonly signal?: AbortSignal;
};

export type RegionalPriceHistoryParams = {
  readonly country?: string;
  readonly subdivision?: string;
  readonly region?: string;
  readonly fuelType: string;
  readonly provider?: string;
  readonly source?: string;
  readonly observedFrom?: string;
  readonly observedTo?: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly sort?: "observedAt" | "collectedAt" | "id";
  readonly order?: "asc" | "desc";
  readonly signal?: AbortSignal;
};

export type ListRegionsParams = {
  readonly country?: string;
  readonly subdivision?: string;
  readonly provider?: string;
  readonly source?: string;
  readonly fuelType?: string;
  readonly signal?: AbortSignal;
};

export type RequestOptions = {
  readonly signal?: AbortSignal;
};
