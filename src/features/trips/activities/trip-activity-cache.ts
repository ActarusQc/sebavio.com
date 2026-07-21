import { createHash } from "crypto";
import { CACHE_TTL_SEARCH_SECONDS } from "@/features/trips/activities/activity-types";
import type { ActivityCandidate } from "@/features/trips/activities/activity-types";
import { getRedis } from "@/lib/redis";

const memoryCache = new Map<string, { value: string; exp: number }>();

function hashKey(parts: Record<string, unknown>): string {
  const raw = JSON.stringify(parts);
  return createHash("sha256").update(raw).digest("hex").slice(0, 40);
}

export function buildSearchCacheKey(input: {
  lat: number;
  lng: number;
  radiusM: number;
  types: string[];
  textQuery?: string;
  language: string;
  day: string;
}): string {
  return `trip-act:search:${hashKey({
    lat: input.lat.toFixed(3),
    lng: input.lng.toFixed(3),
    r: input.radiusM,
    t: [...input.types].sort(),
    q: input.textQuery ?? "",
    lang: input.language,
    d: input.day,
  })}`;
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

export async function getCachedCandidates(
  key: string,
): Promise<ActivityCandidate[] | null> {
  const mem = memoryCache.get(key);
  if (mem && mem.exp > Date.now()) {
    try {
      return JSON.parse(mem.value) as ActivityCandidate[];
    } catch {
      /* ignore */
    }
  }
  const raw = await withRedis((redis) => redis.get(key));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ActivityCandidate[];
    memoryCache.set(key, {
      value: raw,
      exp: Date.now() + CACHE_TTL_SEARCH_SECONDS * 1000,
    });
    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedCandidates(
  key: string,
  value: ActivityCandidate[],
  ttlSeconds = CACHE_TTL_SEARCH_SECONDS,
): Promise<void> {
  const raw = JSON.stringify(value);
  memoryCache.set(key, { value: raw, exp: Date.now() + ttlSeconds * 1000 });
  await withRedis((redis) => redis.set(key, raw, "EX", ttlSeconds));
}

export async function acquireGenerationLock(
  tripId: string,
  ttlSeconds: number,
): Promise<boolean> {
  const key = `trip-act:genlock:${tripId}`;
  const result = await withRedis((redis) =>
    redis.set(key, "1", "EX", ttlSeconds, "NX"),
  );
  if (result === "OK") return true;
  // Si Redis indisponible, autoriser (évite blocage total)
  if (result === null) return true;
  return false;
}

export async function releaseGenerationLock(tripId: string): Promise<void> {
  const key = `trip-act:genlock:${tripId}`;
  await withRedis((redis) => redis.del(key));
}
