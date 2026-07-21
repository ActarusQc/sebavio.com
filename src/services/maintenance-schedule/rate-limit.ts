import { getRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 20;

/** Rate-limit des appels fournisseurs d’entretien / VIN / rappels. */
export async function assertMaintenanceExternalRateLimit(
  userId: string,
  scope: "maintenance" | "vin" | "recalls" = "maintenance",
): Promise<void> {
  const key = `mnt:rl:${scope}:${userId}`;

  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    if (count > MAX_REQUESTS) {
      throw new AppError(
        "EXT_RATE_LIMIT",
        "Trop de requêtes. Réessayez dans une minute.",
        429,
      );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "MNT_008",
      "Service d’entretien temporairement indisponible.",
      503,
    );
  }
}
