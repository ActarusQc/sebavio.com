import { getRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";
import {
  LOGIN_RATE_LIMIT_MAX,
  LOGIN_RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/constants";

const GENERIC_LOGIN_ERROR =
  "Connexion temporairement indisponible. Réessayez plus tard.";

/**
 * Rate-limit connexion. Si Redis est indisponible → échec fermé (refus).
 */
export async function assertLoginRateLimit(
  ip: string,
  email: string,
): Promise<void> {
  const key = `auth:login:${ip}:${email.toLowerCase()}`;

  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, LOGIN_RATE_LIMIT_WINDOW_SECONDS);
    }

    if (count > LOGIN_RATE_LIMIT_MAX) {
      throw new AppError("AUTH_RATE_LIMIT", GENERIC_LOGIN_ERROR, 429);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("AUTH_UNAVAILABLE", GENERIC_LOGIN_ERROR, 503);
  }
}

export async function clearLoginRateLimit(
  ip: string,
  email: string,
): Promise<void> {
  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }
    await redis.del(`auth:login:${ip}:${email.toLowerCase()}`);
  } catch {
    // Ne bloque pas une connexion réussie si Redis tombe après le check.
  }
}
