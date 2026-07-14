import { getRedis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { unreadCacheKey } from "@/features/notifications/constants";

async function countUnreadDb(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      deletedAt: null,
      readAt: null,
      channel: "in_app",
    },
  });
}

/** Compte non-lues : Redis si dispo, sinon COUNT DB. */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect().catch(() => undefined);
    }
    const cached = await redis.get(unreadCacheKey(userId));
    if (cached != null && /^\d+$/.test(cached)) {
      return Number(cached);
    }
    const count = await countUnreadDb(userId);
    await redis.set(unreadCacheKey(userId), String(count));
    return count;
  } catch {
    return countUnreadDb(userId);
  }
}

export async function invalidateUnreadCache(userId: string): Promise<void> {
  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect().catch(() => undefined);
    }
    await redis.del(unreadCacheKey(userId));
  } catch {
    // dégradé silencieux
  }
}

export async function setUnreadCache(
  userId: string,
  count: number,
): Promise<void> {
  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect().catch(() => undefined);
    }
    await redis.set(unreadCacheKey(userId), String(Math.max(0, count)));
  } catch {
    // dégradé silencieux
  }
}

export async function refreshUnreadCache(userId: string): Promise<number> {
  const count = await countUnreadDb(userId);
  await setUnreadCache(userId, count);
  return count;
}
