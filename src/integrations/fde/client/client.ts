import {
  FdeFuelPricesError,
  FdeFuelPricesForbiddenError,
  FdeFuelPricesNotFoundError,
  FdeFuelPricesRateLimitError,
  FdeFuelPricesResponseValidationError,
  FdeFuelPricesUnauthorizedError,
  type FdeFuelPricesErrorBody,
} from "./errors";
import {
  apiErrorSchema,
  fuelTypesListSchema,
  latestRegionalPricesSchema,
  regionalPriceListSchema,
  regionsListSchema,
  sourcesListSchema,
  statusSchema,
  nearbyStationsSchema,
  fuelStationSchema,
  stationHistorySchema,
  stationsListSchema,
} from "./schemas";
import type {
  FdeFuelPricesClientOptions,
  FuelFuelTypesList,
  FuelLatestRegionalPrices,
  FuelRegionalPriceList,
  FuelRegionsList,
  FuelSourcesList,
  FuelStatus,
  LatestRegionalPricesParams,
  ListRegionsParams,
  RegionalPriceHistoryParams,
  RequestOptions,
} from "./types";

const DEFAULT_TIMEOUT_MS = 15_000;
const PLUGIN_BASE = "/api/v1/plugins/fuel-sync";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query.length > 0 ? `?${query}` : "";
}

function parseRetryAfter(header: string | null): number | undefined {
  if (header === null || header.trim().length === 0) {
    return undefined;
  }
  const seconds = Number(header);
  if (Number.isFinite(seconds)) {
    return seconds;
  }
  const date = Date.parse(header);
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }
  return undefined;
}

function parseApiErrorBody(
  payload: unknown,
): FdeFuelPricesErrorBody | undefined {
  const parsed = apiErrorSchema.safeParse(payload);
  if (!parsed.success) {
    return undefined;
  }
  return Object.freeze({
    code: parsed.data.error.code,
    message: parsed.data.error.message,
    ...(parsed.data.error.requestId !== undefined
      ? { requestId: parsed.data.error.requestId }
      : {}),
    ...(parsed.data.error.details !== undefined
      ? { details: parsed.data.error.details }
      : {}),
  });
}

function mapHttpError(
  status: number,
  body: FdeFuelPricesErrorBody | undefined,
  retryAfter?: number,
): FdeFuelPricesError {
  const requestId = body?.requestId;
  const message = body?.message ?? `HTTP ${String(status)}`;
  switch (status) {
    case 401:
      return new FdeFuelPricesUnauthorizedError({
        message,
        ...(requestId !== undefined ? { requestId } : {}),
        ...(body !== undefined ? { body } : {}),
      });
    case 403:
      return new FdeFuelPricesForbiddenError({
        message,
        ...(requestId !== undefined ? { requestId } : {}),
        ...(body !== undefined ? { body } : {}),
      });
    case 404:
      return new FdeFuelPricesNotFoundError({
        message,
        ...(requestId !== undefined ? { requestId } : {}),
        ...(body !== undefined ? { body } : {}),
      });
    case 429:
      return new FdeFuelPricesRateLimitError({
        message,
        ...(requestId !== undefined ? { requestId } : {}),
        ...(retryAfter !== undefined ? { retryAfterSeconds: retryAfter } : {}),
        ...(body !== undefined ? { body } : {}),
      });
    default:
      if (status >= 500) {
        return new FdeFuelPricesError({
          code: "SERVER_ERROR",
          message,
          status,
          ...(requestId !== undefined ? { requestId } : {}),
          ...(body !== undefined ? { body } : {}),
          retryable: true,
        });
      }
      return new FdeFuelPricesError({
        code: "UNKNOWN",
        message,
        status,
        ...(requestId !== undefined ? { requestId } : {}),
        ...(body !== undefined ? { body } : {}),
        retryable: false,
      });
  }
}

function validateResponse<T>(
  schema: {
    safeParse: (
      value: unknown,
    ) => { success: true; data: T } | { success: false; error: unknown };
  },
  payload: unknown,
  requestId?: string,
): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new FdeFuelPricesResponseValidationError({
      message: "Invalid FDE FuelSync response shape",
      ...(requestId !== undefined ? { requestId } : {}),
      cause: parsed.error,
    });
  }
  return parsed.data;
}

export type FdeFuelPricesClient = ReturnType<typeof createClient>;

export function createClient(options: FdeFuelPricesClientOptions) {
  const baseUrl = trimTrailingSlash(options.baseUrl);
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const userAgent = options.userAgent ?? "sebavio-fde-client/1.0";

  async function request<T>(
    path: string,
    schema: {
      safeParse: (
        value: unknown,
      ) => { success: true; data: T } | { success: false; error: unknown };
    },
    params?: { readonly signal?: AbortSignal },
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort(new Error("timeout"));
    }, timeoutMs);

    const onExternalAbort = (): void => {
      controller.abort(params?.signal?.reason);
    };
    params?.signal?.addEventListener("abort", onExternalAbort, { once: true });

    try {
      const response = await fetchImpl(`${baseUrl}${path}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${options.apiKey}`,
          "User-Agent": userAgent,
          "X-Request-ID": crypto.randomUUID(),
        },
        signal: controller.signal,
      });

      const requestId = response.headers.get("x-request-id") ?? undefined;
      let payload: unknown;
      try {
        payload = await response.json();
      } catch (cause) {
        throw new FdeFuelPricesError({
          code: "VALIDATION_ERROR",
          message: "Response body is not valid JSON",
          status: response.status,
          ...(requestId !== undefined ? { requestId } : {}),
          cause,
          retryable: false,
        });
      }

      if (!response.ok) {
        const body = parseApiErrorBody(payload);
        const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
        throw mapHttpError(response.status, body, retryAfter);
      }

      return validateResponse(schema, payload, requestId);
    } catch (error) {
      if (error instanceof FdeFuelPricesError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        const isTimeout =
          error.message.includes("timeout") || params?.signal?.aborted !== true;
        throw new FdeFuelPricesError({
          code: isTimeout ? "TIMEOUT" : "ABORTED",
          message: isTimeout ? "Request timed out" : "Request aborted",
          status: 0,
          cause: error,
          retryable: isTimeout,
        });
      }
      throw new FdeFuelPricesError({
        code: "NETWORK_ERROR",
        message:
          error instanceof Error ? error.message : "Network request failed",
        status: 0,
        cause: error,
        retryable: true,
      });
    } finally {
      clearTimeout(timeout);
      params?.signal?.removeEventListener("abort", onExternalAbort);
    }
  }

  return Object.freeze({
    getStatus(options?: RequestOptions): Promise<FuelStatus> {
      return request(`${PLUGIN_BASE}/status`, statusSchema, options);
    },

    listRegions(params: ListRegionsParams = {}): Promise<FuelRegionsList> {
      const { signal, ...query } = params;
      const path = `${PLUGIN_BASE}/regions${buildQuery({
        country: query.country,
        subdivision: query.subdivision,
        provider: query.provider,
        source: query.source,
        fuelType: query.fuelType,
      })}`;
      return request(
        path,
        regionsListSchema,
        signal !== undefined ? { signal } : {},
      );
    },

    listFuelTypes(options?: RequestOptions): Promise<FuelFuelTypesList> {
      return request(`${PLUGIN_BASE}/fuel-types`, fuelTypesListSchema, options);
    },

    getLatestRegionalPrices(
      params: LatestRegionalPricesParams = {},
    ): Promise<FuelLatestRegionalPrices> {
      const { signal, ...query } = params;
      const path = `${PLUGIN_BASE}/regional-prices/latest${buildQuery({
        country: query.country,
        subdivision: query.subdivision,
        region: query.region,
        fuelType: query.fuelType,
        provider: query.provider,
        source: query.source,
      })}`;
      return request(
        path,
        latestRegionalPricesSchema,
        signal !== undefined ? { signal } : {},
      );
    },

    getRegionalPriceHistory(
      params: RegionalPriceHistoryParams,
    ): Promise<FuelRegionalPriceList> {
      const { signal, ...query } = params;
      const path = `${PLUGIN_BASE}/regional-prices/history${buildQuery({
        country: query.country,
        subdivision: query.subdivision,
        region: query.region,
        fuelType: query.fuelType,
        provider: query.provider,
        source: query.source,
        observedFrom: query.observedFrom,
        observedTo: query.observedTo,
        page: query.page,
        pageSize: query.pageSize,
        sort: query.sort,
        order: query.order,
      })}`;
      return request(
        path,
        regionalPriceListSchema,
        signal !== undefined ? { signal } : {},
      );
    },

    getSources(options?: RequestOptions): Promise<FuelSourcesList> {
      return request(`${PLUGIN_BASE}/sources`, sourcesListSchema, options);
    },

    findNearbyStations(params: {
      readonly latitude: number;
      readonly longitude: number;
      readonly radiusKm?: number;
      readonly fuelType?: string;
      readonly limit?: number;
      readonly maxAgeMinutes?: number;
      readonly signal?: AbortSignal;
    }) {
      const { signal, ...query } = params;
      const path = `${PLUGIN_BASE}/stations/nearby${buildQuery({
        latitude: query.latitude,
        longitude: query.longitude,
        radiusKm: query.radiusKm,
        fuelType: query.fuelType,
        limit: query.limit,
        maxAgeMinutes: query.maxAgeMinutes,
      })}`;
      return request(
        path,
        nearbyStationsSchema,
        signal !== undefined ? { signal } : {},
      );
    },

    getStation(stationId: string, options?: RequestOptions) {
      return request(
        `${PLUGIN_BASE}/stations/${encodeURIComponent(stationId)}`,
        fuelStationSchema,
        options,
      );
    },

    getStationPriceHistory(
      stationId: string,
      params: {
        readonly fuelType?: string;
        readonly from?: string;
        readonly to?: string;
        readonly limit?: number;
        readonly signal?: AbortSignal;
      } = {},
    ) {
      const { signal, ...query } = params;
      const path = `${PLUGIN_BASE}/stations/${encodeURIComponent(stationId)}/prices/history${buildQuery(
        {
          fuelType: query.fuelType,
          from: query.from,
          to: query.to,
          limit: query.limit,
        },
      )}`;
      return request(
        path,
        stationHistorySchema,
        signal !== undefined ? { signal } : {},
      );
    },

    listStations(
      params: {
        readonly city?: string;
        readonly brand?: string;
        readonly fuelType?: string;
        readonly active?: boolean;
        readonly page?: number;
        readonly pageSize?: number;
        readonly signal?: AbortSignal;
      } = {},
    ) {
      const { signal, ...query } = params;
      const path = `${PLUGIN_BASE}/stations${buildQuery({
        city: query.city,
        brand: query.brand,
        fuelType: query.fuelType,
        active:
          query.active === undefined
            ? undefined
            : query.active
              ? "true"
              : "false",
        page: query.page,
        pageSize: query.pageSize,
      })}`;
      return request(
        path,
        stationsListSchema,
        signal !== undefined ? { signal } : {},
      );
    },
  });
}
