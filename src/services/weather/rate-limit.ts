import { getRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";
import {
  WEATHER_RATE_LIMIT_MAX,
  WEATHER_RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/constants";

/**
 * Rate-limit des appels météo externes par utilisateur.
 * Redis indisponible → refus (pas d'appel fournisseur sans compteur).
 */
export async function assertWeatherRateLimit(userId: string): Promise<void> {
  const key = `weather:rl:${userId}`;

  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WEATHER_RATE_LIMIT_WINDOW_SECONDS);
    }

    if (count > WEATHER_RATE_LIMIT_MAX) {
      throw new AppError(
        "EXT_RATE_LIMIT",
        "Trop de requêtes météo. Réessayez plus tard.",
        429,
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("EXT_003", "Données météo indisponibles", 503);
  }
}
