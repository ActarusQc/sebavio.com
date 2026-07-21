import { getRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";
import {
  FDE_RATE_LIMIT_MAX,
  FDE_RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/constants";

/**
 * Rate-limit des estimations carburant (appels FDE) par utilisateur.
 * Redis indisponible → refus (pas d'appel FDE sans compteur).
 */
export async function assertFdeRateLimit(userId: string): Promise<void> {
  const key = `fde:rl:${userId}`;

  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, FDE_RATE_LIMIT_WINDOW_SECONDS);
    }

    if (count > FDE_RATE_LIMIT_MAX) {
      throw new AppError(
        "EXT_RATE_LIMIT",
        "Trop de requêtes d'estimation carburant. Réessayez plus tard.",
        429,
      );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "FDE_003",
      "Estimation carburant temporairement indisponible",
      503,
    );
  }
}
