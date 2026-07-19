import { getRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";

const IDEMPOTENCY_TTL_SECONDS = 60 * 60; // 1 h

/**
 * Protection double-soumission via Redis SET NX.
 * Retourne true si la clé est nouvelle (action autorisée).
 */
export async function claimIdempotencyKey(
  key: string,
  scope: string,
): Promise<boolean> {
  const redis = getRedis();
  const redisKey = `billing:idempotency:${scope}:${key}`;
  const result = await redis.set(
    redisKey,
    "1",
    "EX",
    IDEMPOTENCY_TTL_SECONDS,
    "NX",
  );
  return result === "OK";
}

export async function assertIdempotencyKey(
  key: string,
  scope: string,
): Promise<void> {
  const claimed = await claimIdempotencyKey(key, scope);
  if (!claimed) {
    throw new AppError(
      "ADM_002",
      "Action déjà en cours ou déjà traitée (clé d'idempotence)",
      409,
    );
  }
}
