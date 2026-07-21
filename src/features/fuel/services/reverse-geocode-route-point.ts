import { createHash } from "crypto";
import { AppError } from "@/lib/errors";
import { MAPS_GEOCODE_CACHE_TTL_SECONDS } from "@/lib/constants";
import { getRedis } from "@/lib/redis";
import { assertMapsRateLimit } from "@/services/maps/rate-limit";
import { getMapsService, createMapsProviderFromEnv } from "@/services/maps";
import type { MapsProvider } from "@/services/maps/types";

export type ReverseGeocodeResult = {
  locality: string | null;
  formattedAddress: string | null;
};

type GoogleReverseResponse = {
  status: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
};

const memoryCache = new Map<
  string,
  { value: ReverseGeocodeResult; exp: number }
>();
const MEMORY_TTL_MS = 1000 * 60 * 60 * 24;
const FETCH_TIMEOUT_MS = 8000;

const LOCALITY_TYPES = [
  "locality",
  "postal_town",
  "administrative_area_level_3",
  "administrative_area_level_2",
  "sublocality",
  "neighborhood",
] as const;

function cacheKey(lat: number, lng: number): string {
  const rounded = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  return `maps:revgeo:${createHash("sha256").update(rounded).digest("hex")}`;
}

function extractLocality(data: GoogleReverseResponse): ReverseGeocodeResult {
  const results = data.results ?? [];
  for (const type of LOCALITY_TYPES) {
    for (const result of results) {
      const comp = result.address_components?.find((c) =>
        c.types.includes(type),
      );
      if (comp?.long_name?.trim()) {
        return {
          locality: comp.long_name.trim(),
          formattedAddress: result.formatted_address?.trim() ?? null,
        };
      }
    }
  }
  const first = results[0];
  if (first?.formatted_address) {
    const cityPart = first.formatted_address.split(",")[0]?.trim() ?? null;
    return {
      locality: cityPart,
      formattedAddress: first.formatted_address,
    };
  }
  return { locality: null, formattedAddress: null };
}

async function withRedis<T>(
  fn: (redis: ReturnType<typeof getRedis>) => Promise<T>,
): Promise<T | null> {
  try {
    const redis = getRedis();
    if (redis.status !== "ready") await redis.connect();
    return await fn(redis);
  } catch {
    return null;
  }
}

async function getCached(key: string): Promise<ReverseGeocodeResult | null> {
  const mem = memoryCache.get(key);
  if (mem && mem.exp > Date.now()) return mem.value;

  const raw = await withRedis((redis) => redis.get(key));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ReverseGeocodeResult;
    memoryCache.set(key, { value: parsed, exp: Date.now() + MEMORY_TTL_MS });
    return parsed;
  } catch {
    return null;
  }
}

async function setCached(
  key: string,
  value: ReverseGeocodeResult,
): Promise<void> {
  memoryCache.set(key, { value, exp: Date.now() + MEMORY_TTL_MS });
  await withRedis((redis) =>
    redis.set(key, JSON.stringify(value), "EX", MAPS_GEOCODE_CACHE_TTL_SECONDS),
  );
}

/**
 * Reverse geocoding serveur (Google) — jamais côté navigateur.
 * Timeout, cache mémoire+Redis, fallback silencieux (null).
 */
export async function reverseGeocodeRoutePoint(input: {
  latitude: number;
  longitude: number;
  userId?: string;
  provider?: MapsProvider;
  apiKey?: string;
}): Promise<ReverseGeocodeResult> {
  const { latitude, longitude } = input;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { locality: null, formattedAddress: null };
  }

  const key = cacheKey(latitude, longitude);
  const cached = await getCached(key);
  if (cached) return cached;

  const apiKey = input.apiKey ?? process.env.GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const availability = (
    input.provider ?? createMapsProviderFromEnv()
  ).isAvailable();
  if (!apiKey || !availability.available) {
    return { locality: null, formattedAddress: null };
  }

  try {
    if (input.userId) {
      await assertMapsRateLimit(input.userId);
    }
  } catch {
    return { locality: null, formattedAddress: null };
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${latitude},${longitude}`);
  url.searchParams.set("language", "fr");
  url.searchParams.set(
    "result_type",
    "locality|postal_town|administrative_area_level_3",
  );
  url.searchParams.set("key", apiKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
    });
    if (!res.ok) {
      return { locality: null, formattedAddress: null };
    }
    const data = (await res.json()) as GoogleReverseResponse;
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return { locality: null, formattedAddress: null };
    }
    const result = extractLocality(data);
    if (result.locality) {
      await setCached(key, result);
    }
    return result;
  } catch (error) {
    if (error instanceof AppError) {
      return { locality: null, formattedAddress: null };
    }
    return { locality: null, formattedAddress: null };
  } finally {
    clearTimeout(timer);
  }
}

/** Pour tests — vide le cache mémoire. */
export function clearReverseGeocodeMemoryCache(): void {
  memoryCache.clear();
}

/** Garantit que le service Maps est joignable (utilisé pour health). */
export function mapsAvailableForReverseGeocode(): boolean {
  return getMapsService().availability().available;
}
