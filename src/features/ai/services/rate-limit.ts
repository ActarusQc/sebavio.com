import "server-only";

import { getRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";
import { AI_LOCK_TTL_SECONDS } from "@/lib/constants";
import { getAiRuntimeConfig } from "@/services/ai/config";
import { prisma } from "@/lib/prisma";

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
 * Limite quotidienne recherches Web + max par conversation.
 */
export async function assertAiWebSearchLimits(input: {
  userId: string;
  conversationId: string | null;
  tripId: string;
}): Promise<void> {
  const config = getAiRuntimeConfig();
  if (!config.webSearchEnabled) {
    throw new AppError(
      "AI_WEB_SEARCH_DISABLED",
      "Je ne peux pas rechercher des établissements en ligne pour le moment.",
      503,
    );
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const dailyCount = await prisma.aiUsage.count({
    where: {
      userId: input.userId,
      webSearchUsed: true,
      createdAt: { gte: startOfDay },
    },
  });

  if (dailyCount >= config.webSearchDailyLimit) {
    throw new AppError(
      "AI_RATE_LIMIT",
      "Limite quotidienne de recherches en ligne atteinte. Réessayez demain.",
      429,
    );
  }

  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }
    const key = `ai:web:conv:${input.conversationId ?? input.tripId}`;
    const current = Number((await redis.get(key)) ?? "0");
    if (current >= config.webSearchMaxPerConversation) {
      throw new AppError(
        "AI_RATE_LIMIT",
        "Limite de recherches en ligne pour cette conversation atteinte.",
        429,
      );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    // Redis indisponible : limite quotidienne Prisma seulement
  }
}

/** Incrémente le compteur conversation après une recherche Web réussie. */
export async function recordAiWebSearchConversationUse(
  conversationId: string | null,
  tripId: string,
): Promise<void> {
  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }
    const key = `ai:web:conv:${conversationId ?? tripId}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 60 * 60 * 24 * 7);
    }
  } catch {
    /* best-effort */
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
