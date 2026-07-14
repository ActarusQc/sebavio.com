import { createHash } from "node:crypto";
import { getRedis } from "@/lib/redis";
import {
  MAPS_DIRECTIONS_CACHE_TTL_SECONDS,
  MAPS_GEOCODE_CACHE_TTL_SECONDS,
} from "@/lib/constants";
import { normalizeAddress } from "./normalize";
import type { DirectionsResult, GeocodeResult, LatLng } from "./types";

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function geocodeCacheKey(address: string): string {
  return `maps:geocode:${sha256(normalizeAddress(address))}`;
}

export function directionsCacheKey(
  origin: LatLng,
  destination: LatLng,
  waypoints: LatLng[],
): string {
  const parts = [
    `${origin.lat},${origin.lng}`,
    ...waypoints.map((w) => `${w.lat},${w.lng}`),
    `${destination.lat},${destination.lng}`,
  ];
  return `maps:directions:${sha256(parts.join("|"))}`;
}

/**
 * Hash stable des waypoints d'un voyage (origine, étapes ordonnées, destination).
 * Sert à détecter un itinéraire périmé sans flag manuel.
 */
export function computeWaypointsHash(input: {
  origin: string;
  destination: string;
  stops: Array<{
    sequence: number;
    address: string | null;
    latitude: string | number | null;
    longitude: string | number | null;
  }>;
}): string {
  const stopParts = [...input.stops]
    .sort((a, b) => a.sequence - b.sequence)
    .map((s) => {
      const lat = s.latitude == null ? "" : String(s.latitude);
      const lng = s.longitude == null ? "" : String(s.longitude);
      const addr = normalizeAddress(s.address ?? "");
      return `${s.sequence}:${lat},${lng}:${addr}`;
    });
  const raw = [
    normalizeAddress(input.origin),
    ...stopParts,
    normalizeAddress(input.destination),
  ].join("|");
  return sha256(raw);
}

async function withRedis<T>(
  fn: (redis: ReturnType<typeof getRedis>) => Promise<T>,
): Promise<T | null> {
  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }
    return await fn(redis);
  } catch {
    return null;
  }
}

export async function getCachedGeocode(
  address: string,
): Promise<GeocodeResult | null> {
  const key = geocodeCacheKey(address);
  const raw = await withRedis((redis) => redis.get(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GeocodeResult;
  } catch {
    return null;
  }
}

export async function setCachedGeocode(
  address: string,
  value: GeocodeResult,
): Promise<void> {
  const key = geocodeCacheKey(address);
  await withRedis((redis) =>
    redis.set(key, JSON.stringify(value), "EX", MAPS_GEOCODE_CACHE_TTL_SECONDS),
  );
}

export async function getCachedDirections(
  origin: LatLng,
  destination: LatLng,
  waypoints: LatLng[],
): Promise<DirectionsResult | null> {
  const key = directionsCacheKey(origin, destination, waypoints);
  const raw = await withRedis((redis) => redis.get(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DirectionsResult;
  } catch {
    return null;
  }
}

export async function setCachedDirections(
  origin: LatLng,
  destination: LatLng,
  waypoints: LatLng[],
  value: DirectionsResult,
): Promise<void> {
  const key = directionsCacheKey(origin, destination, waypoints);
  await withRedis((redis) =>
    redis.set(
      key,
      JSON.stringify(value),
      "EX",
      MAPS_DIRECTIONS_CACHE_TTL_SECONDS,
    ),
  );
}
