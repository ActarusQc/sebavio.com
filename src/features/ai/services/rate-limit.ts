import "server-only";

import { getRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";
import { AI_LOCK_TTL_SECONDS } from "@/lib/constants";
import { getAiRuntimeConfig } from "@/services/ai/config";

/**
 * Rate-limit anti-abus par utilisateur (limite configurable, message générique).
 */
export async function assertAiRateLimit(userId: string): Promise<void> {
  const config = getAiRuntimeConfig();
  const key = `ai:rl:${userId}`;

  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, config.rateLimitWindowSeconds);
    }

    if (count > config.rateLimitMax) {
      throw new AppError(
        "AI_RATE_LIMIT",
        "Trop de demandes à l’assistant. Réessayez un peu plus tard.",
        429,
      );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "AI_006",
      "L’assistant est temporairement indisponible.",
      503,
    );
  }
}

/**
 * Empêche les requêtes simultanées répétées sur le même voyage.
 */
export async function acquireAiRequestLock(
  userId: string,
  tripId: string,
): Promise<() => Promise<void>> {
  const key = `ai:lock:${userId}:${tripId}`;
  const token = `${Date.now()}:${Math.random().toString(36).slice(2)}`;

  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }

    const ok = await redis.set(key, token, "EX", AI_LOCK_TTL_SECONDS, "NX");
    if (ok !== "OK") {
      throw new AppError(
        "AI_007",
        "Une analyse est déjà en cours pour ce voyage.",
        409,
      );
    }

    return async () => {
      try {
        const current = await redis.get(key);
        if (current === token) {
          await redis.del(key);
        }
      } catch {
        // best-effort
      }
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "AI_006",
      "L’assistant est temporairement indisponible.",
      503,
    );
  }
}
