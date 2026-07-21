import { randomUUID } from "crypto";
import { getRedis } from "@/lib/redis";
import { PlacesProviderError } from "@/features/trips/activities/places-errors";

/** Plafond d'appels Google Places (New) par génération (Nearby + Text). */
export const MAX_PLACES_CALLS_PER_GENERATION = 10;

/** Budget horaire dédié activités (indépendant de maps:rl geocode/directions). */
export const TRIP_ACTIVITY_PLACES_HOURLY_MAX = 60;
export const TRIP_ACTIVITY_PLACES_WINDOW_SECONDS = 60 * 60;

export type PlacesCallBudget = {
  generationId: string;
  tripId: string;
  userId: string;
  maxCalls: number;
  used: number;
  skipped: number;
  cacheHits: number;
};

export function createPlacesCallBudget(input: {
  tripId: string;
  userId: string;
  maxCalls?: number;
}): PlacesCallBudget {
  return {
    generationId: randomUUID(),
    tripId: input.tripId,
    userId: input.userId,
    maxCalls: input.maxCalls ?? MAX_PLACES_CALLS_PER_GENERATION,
    used: 0,
    skipped: 0,
    cacheHits: 0,
  };
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

/**
 * Réserve 1 appel dans le budget horaire activités.
 * Ne consomme PAS maps:rl (geocode / directions / fuel).
 */
export async function assertTripActivityPlacesHourlyBudget(
  userId: string,
): Promise<void> {
  const key = `trip-act:rl:${userId}`;
  const count = await withRedis(async (redis) => {
    const n = await redis.incr(key);
    if (n === 1) {
      await redis.expire(key, TRIP_ACTIVITY_PLACES_WINDOW_SECONDS);
    }
    return n;
  });

  // Redis KO → autoriser (cache mémoire côté Places reste actif)
  if (count == null) return;

  if (count > TRIP_ACTIVITY_PLACES_HOURLY_MAX) {
    throw new PlacesProviderError(
      "sebavio_rate_limited",
      `Budget horaire activités Places atteint (${TRIP_ACTIVITY_PLACES_HOURLY_MAX}/h)`,
      429,
    );
  }
}

/** Consomme 1 slot de la génération ; false si budget épuisé. */
export function consumeGenerationCall(budget: PlacesCallBudget): boolean {
  if (budget.used >= budget.maxCalls) {
    budget.skipped += 1;
    return false;
  }
  budget.used += 1;
  return true;
}

export function recordCacheHit(budget: PlacesCallBudget): void {
  budget.cacheHits += 1;
}
