import { getRedis } from "@/lib/redis";

const LOCK_KEY = "sebavio:vehicle-catalog:sync-lock";
const LOCK_TTL_SECONDS = 60 * 60; // 1 h max

export type SyncLockHandle = {
  token: string;
  release: () => Promise<void>;
};

/**
 * Verrou Redis pour empêcher deux sync concurrentes.
 * Si Redis indisponible → échec fermé (pas de sync parallèle hasardeuse).
 */
export async function acquireSyncLock(): Promise<SyncLockHandle | null> {
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    const redis = getRedis();
    const ok = await redis.set(LOCK_KEY, token, "EX", LOCK_TTL_SECONDS, "NX");
    if (ok !== "OK") return null;
    return {
      token,
      release: async () => {
        try {
          const current = await redis.get(LOCK_KEY);
          if (current === token) await redis.del(LOCK_KEY);
        } catch {
          /* ignore */
        }
      },
    };
  } catch {
    return null;
  }
}
