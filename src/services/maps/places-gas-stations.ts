/**
 * Recherche de stations-service via Google Places API (New) — serveur uniquement.
 * POST https://places.googleapis.com/v1/places:searchNearby
 */
import { createHash } from "crypto";
import { MAPS_GEOCODE_CACHE_TTL_SECONDS } from "@/lib/constants";
import { getRedis } from "@/lib/redis";
import { assertMapsRateLimit } from "@/services/maps/rate-limit";

export type NearbyGasStation = {
  placeId: string;
  name: string;
  brand: string | null;
  address: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  /** Prix Google ($/L) si disponible, sinon null. */
  pricePerLiter: number | null;
  priceUpdatedAt: string | null;
  distanceFromSearchKm: number;
};

type PlacesNearbyResponse = {
  places?: Array<{
    id?: string;
    name?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    shortFormattedAddress?: string;
    googleMapsUri?: string;
    location?: { latitude?: number; longitude?: number };
    addressComponents?: Array<{
      longText?: string;
      shortText?: string;
      types?: string[];
    }>;
    fuelOptions?: {
      fuelPrices?: Array<{
        type?: string;
        price?: {
          currencyCode?: string;
          units?: string;
          nanos?: number;
        };
        updateTime?: string;
      }>;
    };
  }>;
};

const memoryCache = new Map<
  string,
  { value: NearbyGasStation[]; exp: number }
>();
const MEMORY_TTL_MS = 1000 * 60 * 30;
const FETCH_TIMEOUT_MS = 8000;

const BRAND_PATTERNS: Array<{ re: RegExp; brand: string }> = [
  { re: /petro[\s-]?canada/i, brand: "Petro-Canada" },
  { re: /\bultramar\b/i, brand: "Ultramar" },
  { re: /\besso\b/i, brand: "Esso" },
  { re: /\bshell\b/i, brand: "Shell" },
  { re: /couche[\s-]?tard/i, brand: "Couche-Tard" },
  { re: /\bcostco\b/i, brand: "Costco" },
  { re: /\birving\b/i, brand: "Irving" },
  { re: /\bsuncor\b/i, brand: "Suncor" },
  { re: /\bmobil\b/i, brand: "Mobil" },
  { re: /\bpioneer\b/i, brand: "Pioneer" },
  { re: /\bsobeys?\b/i, brand: "Sobeys" },
  { re: /\bmaxi\b/i, brand: "Maxi" },
  { re: /\bcanadian\s*tire\b/i, brand: "Canadian Tire" },
];

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function extractGasBrand(name: string): string | null {
  for (const { re, brand } of BRAND_PATTERNS) {
    if (re.test(name)) return brand;
  }
  return null;
}

function extractCity(
  components:
    | Array<{
        longText?: string;
        shortText?: string;
        types?: string[];
      }>
    | undefined
    | null,
): string | null {
  if (!components?.length) return null;
  for (const type of [
    "locality",
    "postal_town",
    "administrative_area_level_3",
    "sublocality",
  ]) {
    const hit = components.find((c) => c.types?.includes(type));
    if (hit?.longText?.trim()) return hit.longText.trim();
  }
  return null;
}

function moneyToCadPerLiter(price: {
  units?: string;
  nanos?: number;
}): number | null {
  const units = Number(price.units ?? 0);
  const nanos = Number(price.nanos ?? 0);
  if (!Number.isFinite(units) && !Number.isFinite(nanos)) return null;
  const value = units + nanos / 1e9;
  if (!(value > 0) || value > 5) return null;
  return Math.round(value * 1000) / 1000;
}

function pickFuelPrice(
  fuelPrices: NonNullable<
    NonNullable<PlacesNearbyResponse["places"]>[number]["fuelOptions"]
  >["fuelPrices"],
  preferredFuelType?: string | null,
): { pricePerLiter: number | null; priceUpdatedAt: string | null } {
  if (!fuelPrices?.length) {
    return { pricePerLiter: null, priceUpdatedAt: null };
  }
  const pref = (preferredFuelType ?? "regular").toLowerCase();
  const order =
    pref === "diesel"
      ? ["DIESEL", "REGULAR_UNLEADED", "MIDGRADE", "PREMIUM"]
      : pref === "premium"
        ? ["PREMIUM", "MIDGRADE", "REGULAR_UNLEADED"]
        : pref === "midgrade" || pref === "midgrade"
          ? ["MIDGRADE", "REGULAR_UNLEADED", "PREMIUM"]
          : ["REGULAR_UNLEADED", "MIDGRADE", "PREMIUM", "DIESEL"];

  for (const type of order) {
    const row = fuelPrices.find((p) => p.type === type);
    if (!row?.price) continue;
    const pricePerLiter = moneyToCadPerLiter(row.price);
    if (pricePerLiter != null) {
      return {
        pricePerLiter,
        priceUpdatedAt: row.updateTime ?? null,
      };
    }
  }
  for (const row of fuelPrices) {
    if (!row.price) continue;
    const pricePerLiter = moneyToCadPerLiter(row.price);
    if (pricePerLiter != null) {
      return {
        pricePerLiter,
        priceUpdatedAt: row.updateTime ?? null,
      };
    }
  }
  return { pricePerLiter: null, priceUpdatedAt: null };
}

function cacheKey(
  lat: number,
  lng: number,
  radiusM: number,
  fuelType: string,
): string {
  const raw = `${lat.toFixed(4)},${lng.toFixed(4)},${radiusM},${fuelType}`;
  return `maps:places:gas:${createHash("sha256").update(raw).digest("hex")}`;
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

async function getCached(key: string): Promise<NearbyGasStation[] | null> {
  const mem = memoryCache.get(key);
  if (mem && mem.exp > Date.now()) return mem.value;
  const raw = await withRedis((redis) => redis.get(key));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as NearbyGasStation[];
    memoryCache.set(key, { value: parsed, exp: Date.now() + MEMORY_TTL_MS });
    return parsed;
  } catch {
    return null;
  }
}

async function setCached(
  key: string,
  value: NearbyGasStation[],
): Promise<void> {
  memoryCache.set(key, { value, exp: Date.now() + MEMORY_TTL_MS });
  await withRedis((redis) =>
    redis.set(key, JSON.stringify(value), "EX", MAPS_GEOCODE_CACHE_TTL_SECONDS),
  );
}

function mapPlace(
  place: NonNullable<PlacesNearbyResponse["places"]>[number],
  center: { lat: number; lng: number },
  preferredFuelType?: string | null,
): NearbyGasStation | null {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  const displayName = place.displayName?.text?.trim();
  if (
    lat == null ||
    lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !displayName
  ) {
    return null;
  }
  const placeId =
    place.id?.replace(/^places\//, "") ||
    place.name?.replace(/^places\//, "") ||
    "";
  if (!placeId) return null;

  const fuel = pickFuelPrice(place.fuelOptions?.fuelPrices, preferredFuelType);
  const googleMapsUrl =
    place.googleMapsUri?.trim() ||
    `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return {
    placeId,
    name: displayName,
    brand: extractGasBrand(displayName),
    address:
      place.formattedAddress?.trim() ||
      place.shortFormattedAddress?.trim() ||
      null,
    city: extractCity(place.addressComponents),
    latitude: lat,
    longitude: lng,
    googleMapsUrl,
    pricePerLiter: fuel.pricePerLiter,
    priceUpdatedAt: fuel.priceUpdatedAt,
    distanceFromSearchKm:
      Math.round(haversineKm(center, { lat, lng }) * 1000) / 1000,
  };
}

/**
 * Nearby Search (New) — type gas_station autour d'un point.
 */
export async function searchNearbyGasStations(input: {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  maxResultCount?: number;
  preferredFuelType?: string | null;
  userId?: string;
  apiKey?: string;
}): Promise<NearbyGasStation[]> {
  const { latitude, longitude, preferredFuelType, userId } = input;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

  const radiusMeters = Math.min(
    Math.max(input.radiusMeters ?? 5000, 100),
    25000,
  );
  const maxResultCount = Math.min(Math.max(input.maxResultCount ?? 10, 1), 20);
  const apiKey =
    input.apiKey ??
    process.env.GOOGLE_MAPS_PLACES_API_KEY?.trim() ??
    process.env.GOOGLE_MAPS_API_KEY?.trim() ??
    "";
  if (!apiKey) return [];

  const key = cacheKey(
    latitude,
    longitude,
    radiusMeters,
    preferredFuelType ?? "any",
  );
  const cached = await getCached(key);
  if (cached) return cached;

  if (userId) {
    try {
      await assertMapsRateLimit(userId);
    } catch {
      return [];
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.shortFormattedAddress",
            "places.location",
            "places.googleMapsUri",
            "places.addressComponents",
            "places.fuelOptions",
          ].join(","),
        },
        body: JSON.stringify({
          includedTypes: ["gas_station"],
          maxResultCount,
          rankPreference: "DISTANCE",
          languageCode: "fr",
          regionCode: "CA",
          locationRestriction: {
            circle: {
              center: { latitude, longitude },
              radius: radiusMeters,
            },
          },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (process.env.FUEL_DEBUG === "1") {
        // Ne jamais journaliser la clé API
        console.info("[fuel-debug:places_nearby]", {
          status: res.status,
          body: body.slice(0, 300).replace(/key=[^&\s]+/gi, "key=***"),
        });
      }
      return [];
    }
    const data = (await res.json()) as PlacesNearbyResponse;
    const center = { lat: latitude, lng: longitude };
    const stations = (data.places ?? [])
      .map((p) => mapPlace(p, center, preferredFuelType))
      .filter((s): s is NearbyGasStation => s != null)
      .sort((a, b) => a.distanceFromSearchKm - b.distanceFromSearchKm);

    await setCached(key, stations);
    return stations;
  } catch (err) {
    if (process.env.FUEL_DEBUG === "1") {
      console.info("[fuel-debug:places_nearby_error]", {
        message: err instanceof Error ? err.message : "unknown",
      });
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Recherche progressive : 5 km → 10 km → 15 km.
 */
export async function findBestGasStationNearPoint(input: {
  latitude: number;
  longitude: number;
  preferredFuelType?: string | null;
  userId?: string;
  maxDistanceKm?: number;
  excludePlaceIds?: Set<string>;
  /** Exclure les stations Costco (non-membres). */
  excludeCostco?: boolean;
  searchFn?: typeof searchNearbyGasStations;
}): Promise<NearbyGasStation | null> {
  const maxDistanceKm = input.maxDistanceKm ?? 15;
  const search = input.searchFn ?? searchNearbyGasStations;
  const radiiM = [5000, 10000, Math.min(15000, maxDistanceKm * 1000)];
  const costcoRe = /\bcostco\b/i;

  for (const radiusMeters of radiiM) {
    const results = await search({
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters,
      preferredFuelType: input.preferredFuelType,
      userId: input.userId,
      maxResultCount: 12,
    });
    for (const s of results) {
      if (input.excludePlaceIds?.has(s.placeId)) continue;
      if (
        input.excludeCostco &&
        (costcoRe.test(s.name) || costcoRe.test(s.brand ?? ""))
      ) {
        continue;
      }
      if (s.distanceFromSearchKm <= maxDistanceKm) return s;
    }
  }
  return null;
}

export function clearPlacesGasMemoryCache(): void {
  memoryCache.clear();
}
