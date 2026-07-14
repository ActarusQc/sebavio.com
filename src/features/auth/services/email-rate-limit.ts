import { getRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";
import {
  EMAIL_AUTH_RATE_LIMIT_MAX,
  EMAIL_AUTH_RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/constants";

const GENERIC_UNAVAILABLE =
  "Service temporairement indisponible. Réessayez plus tard.";

export type EmailAuthRateAction = "forgot-password" | "resend-verification";

/**
 * Rate-limit des demandes de courriel auth.
 * Redis indisponible → échec fermé (refus générique).
 */
export async function assertEmailAuthRateLimit(
  action: EmailAuthRateAction,
  ip: string,
  email: string,
): Promise<void> {
  const key = `auth:email:${action}:${ip}:${email.toLowerCase()}`;

  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, EMAIL_AUTH_RATE_LIMIT_WINDOW_SECONDS);
    }

    if (count > EMAIL_AUTH_RATE_LIMIT_MAX) {
      throw new AppError("AUTH_RATE_LIMIT", GENERIC_UNAVAILABLE, 429);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("AUTH_UNAVAILABLE", GENERIC_UNAVAILABLE, 503);
  }
}
