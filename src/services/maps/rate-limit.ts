import { getRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";
import {
  MAPS_RATE_LIMIT_MAX,
  MAPS_RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/constants";

/**
 * Rate-limit des appels cartographiques externes par utilisateur.
 * Redis indisponible → refus (maîtrise des coûts : pas d'appel Google sans compteur).
 */
export async function assertMapsRateLimit(userId: string): Promise<void> {
  const key = `maps:rl:${userId}`;

  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, MAPS_RATE_LIMIT_WINDOW_SECONDS);
    }

    if (count > MAPS_RATE_LIMIT_MAX) {
      throw new AppError(
        "EXT_RATE_LIMIT",
        "Trop de requêtes cartographiques. Réessayez plus tard.",
        429,
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "EXT_001",
      "Service cartographique temporairement indisponible",
      503,
    );
  }
}
