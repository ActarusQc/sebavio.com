import { z } from "zod";

const freshnessSchema = z.object({
  observedAt: z.string(),
  collectedAt: z.string(),
  ageSeconds: z.number(),
  ageDays: z.number(),
  freshnessStatus: z.enum(["current", "aging", "stale", "unknown"]),
});

const attributionSchema = z.object({
  source: z.string(),
  dataset: z.string(),
  productId: z.string(),
  license: z.string(),
  attributionRequired: z.literal(true),
  retrievedAt: z.string().optional(),
  notice: z.string(),
  commercialReviewRequired: z.literal(true),
});

export const regionalPriceSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  sourceId: z.string(),
  countryCode: z.string(),
  subdivisionCode: z.string(),
  regionName: z.string(),
  regionCode: z.string().optional(),
  fuelType: z.string(),
  price: z.number(),
  currency: z.string(),
  unit: z.string(),
  observedAt: z.string(),
  collectedAt: z.string(),
  snapshotId: z.string().optional(),
  externalReference: z.string().optional(),
  attribution: attributionSchema.optional(),
  freshness: freshnessSchema,
});

export const paginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const regionalPriceListSchema = z.object({
  data: z.array(regionalPriceSchema),
  pagination: paginationSchema,
});

export const latestRegionalPricesSchema = z.object({
  data: z.array(regionalPriceSchema),
});

export const regionSchema = z.object({
  countryCode: z.string(),
  subdivisionCode: z.string(),
  regionCode: z.string().optional(),
  regionName: z.string(),
  providerIds: z.array(z.string()),
  sourceIds: z.array(z.string()),
  firstObservedAt: z.string(),
  lastObservedAt: z.string(),
  fuelTypes: z.array(z.string()),
  observationCount: z.number(),
});

export const regionsListSchema = z.object({
  data: z.array(regionSchema),
});

export const fuelTypeSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  availableForRegionalPrices: z.boolean(),
  availableForStationPrices: z.boolean(),
  currencies: z.array(z.string()),
  units: z.array(z.string()),
  firstObservedAt: z.string(),
  lastObservedAt: z.string(),
});

export const fuelTypesListSchema = z.object({
  data: z.array(fuelTypeSchema),
});

export const sourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  owner: z.string(),
  sourceType: z.string(),
  officialReference: z.string().optional(),
  license: z.string().optional(),
  attributionRequired: z.boolean(),
  attributionText: z.string().optional(),
  commercialUseAllowed: z.string(),
  retentionAllowed: z.string(),
  lastTermsVerificationDate: z.string().optional(),
  coverage: z.string().optional(),
  granularity: z.string().optional(),
  updateFrequency: z.string().optional(),
  status: z.string(),
  limitations: z.array(z.string()),
  attribution: attributionSchema.optional(),
  commercialReviewNotice: z.string(),
});

export const sourcesListSchema = z.object({
  data: z.array(sourceSchema),
});

export const statusSchema = z.object({
  pluginId: z.string(),
  version: z.string(),
  runtimeState: z.string(),
  enabled: z.boolean(),
  synchronizationEnabled: z.boolean(),
  readiness: z.string(),
  health: z.string(),
  registeredProviderCount: z.number(),
  operationalProviderCount: z.number(),
  lastRun: z
    .object({
      id: z.string(),
      status: z.string(),
      providerId: z.string(),
      finishedAt: z.string().optional(),
    })
    .nullable(),
  lastActiveRegionalSnapshot: z
    .object({
      id: z.string(),
      providerId: z.string(),
      activatedAt: z.string().optional(),
    })
    .nullable(),
  lastRegionalDataAt: z.string().nullable(),
  freshness: freshnessSchema.nullable(),
  availableDataTypes: z.object({
    regionalPrices: z.object({ available: z.boolean(), count: z.number() }),
    stationPrices: z.object({ available: z.boolean(), count: z.number() }),
  }),
  attributionRequired: z.boolean(),
  attribution: attributionSchema.optional(),
  knownLimitations: z.array(z.string()),
  operations: z.record(z.string(), z.unknown()).optional(),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const fuelStationPriceSchema = z.object({
  fuelType: z.string(),
  price: z.number(),
  currency: z.string(),
  unit: z.string(),
  observedAt: z.string(),
  collectedAt: z.string(),
  freshness: freshnessSchema,
  granularity: z.literal("station"),
  isCurrent: z.literal(true),
});

export const fuelStationSchema = z.object({
  /** Identifiant canonique opaque — ne jamais le reconstruire côté client. */
  id: z.string().min(1),
  publicId: z.string().min(1).optional(),
  canonicalId: z.string().min(1).optional(),
  /** @deprecated Empreinte de rapprochement (ex. req-…) — ne pas utiliser comme ID permanent. */
  stableStationCode: z.string(),
  name: z.string(),
  brand: z.string().nullable(),
  addressLine: z.string(),
  city: z.string(),
  postalCode: z.string().nullable(),
  provinceCode: z.string(),
  countryCode: z.string(),
  administrativeRegionName: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  isActive: z.boolean(),
  prices: z.array(fuelStationPriceSchema),
  lastObservedAt: z.string().nullable(),
  freshness: freshnessSchema.nullable(),
  source: z.string(),
  attribution: attributionSchema,
  granularity: z.literal("station"),
  distanceKm: z.number().optional(),
  resolvedFromLegacyId: z.string().optional(),
});

export const nearbyStationsSchema = z.object({
  data: z.array(fuelStationSchema),
  meta: z
    .object({
      distanceType: z.string(),
      notice: z.string(),
      requestId: z.string().optional(),
    })
    .optional(),
});

export const stationsListSchema = z.object({
  data: z.array(fuelStationSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export const stationHistorySchema = z.object({
  data: z.array(fuelStationPriceSchema),
});
