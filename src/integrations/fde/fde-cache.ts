import { getRedis } from "@/lib/redis";
import { getFdeConfig } from "./fde-config";
import { fdeMetricInc } from "./fde-metrics";

type MemoryEntry = { value: string; expiresAt: number };

const memory = new Map<string, MemoryEntry>();
const MEMORY_MAX = 200;

export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

export function nearbyCacheKey(input: {
  latitude: number;
  longitude: number;
  fuelType: string;
  radiusKm: number;
  maxAgeMinutes?: number;
}): string {
  return [
    "fde:nearby",
    roundCoord(input.latitude).toFixed(3),
    roundCoord(input.longitude).toFixed(3),
    input.fuelType,
    String(input.radiusKm),
    String(input.maxAgeMinutes ?? "default"),
  ].join(":");
}

export function regionalCacheKey(input: {
  subdivision: string;
  region: string;
  fuelType: string;
}): string {
  return [
    "fde:regional",
    input.subdivision,
    input.region.toLowerCase().replace(/\s+/g, "-"),
    input.fuelType,
  ].join(":");
}

function memoryGet(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string, ttlSeconds: number): void {
  if (ttlSeconds <= 0) return;
  if (memory.size >= MEMORY_MAX) {
    const first = memory.keys().next().value;
    if (first !== undefined) memory.delete(first);
  }
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
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

export async function getFdeCachedJson<T>(key: string): Promise<T | null> {
  const ttl = getFdeConfig().cacheTtlSeconds;
  if (ttl <= 0) return null;

  const fromRedis = await withRedis((redis) => redis.get(key));
  if (fromRedis) {
    fdeMetricInc("cacheHits");
    try {
      return JSON.parse(fromRedis) as T;
    } catch {
      return null;
    }
  }

  const fromMem = memoryGet(key);
  if (fromMem) {
    fdeMetricInc("cacheHits");
    try {
      return JSON.parse(fromMem) as T;
    } catch {
      return null;
    }
  }

  fdeMetricInc("cacheMisses");
  return null;
}

export async function setFdeCachedJson(
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<void> {
  const ttl = ttlSeconds ?? getFdeConfig().cacheTtlSeconds;
  if (ttl <= 0) return;
  const raw = JSON.stringify(value);
  memorySet(key, raw, ttl);
  await withRedis((redis) => redis.set(key, raw, "EX", ttl));
}

/** Tests uniquement. */
export function clearFdeMemoryCache(): void {
  memory.clear();
}
