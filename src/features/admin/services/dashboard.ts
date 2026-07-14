import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import {
  ADMIN_DASHBOARD_CACHE_KEY,
  ADMIN_DASHBOARD_CACHE_TTL_SECONDS,
} from "@/lib/constants";
import type { AdminDashboardStats } from "@/features/admin/types";

async function withRedis<T>(
  fn: (redis: ReturnType<typeof getRedis>) => Promise<T>,
): Promise<T | null> {
  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect().catch(() => undefined);
    }
    return await fn(redis);
  } catch {
    return null;
  }
}

export async function invalidateAdminDashboardCache(): Promise<void> {
  await withRedis((redis) => redis.del(ADMIN_DASHBOARD_CACHE_KEY));
}

async function computeDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    usersTotal,
    usersActive,
    usersSuspended,
    registrationsLast7Days,
    registrationsLast30Days,
    vehiclesTotal,
    tripsTotal,
    campgroundsTotal,
    activitiesTotal,
    auditLogsLast24h,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, status: "active" } }),
    prisma.user.count({ where: { deletedAt: null, status: "suspended" } }),
    prisma.user.count({
      where: { deletedAt: null, createdAt: { gte: d7 } },
    }),
    prisma.user.count({
      where: { deletedAt: null, createdAt: { gte: d30 } },
    }),
    prisma.userVehicle.count({ where: { deletedAt: null } }),
    prisma.trip.count({ where: { deletedAt: null } }),
    prisma.campground.count({ where: { deletedAt: null } }),
    prisma.activity.count({ where: { deletedAt: null } }),
    prisma.auditLog.count({ where: { createdAt: { gte: d1 } } }),
  ]);

  return {
    usersTotal,
    usersActive,
    usersSuspended,
    registrationsLast7Days,
    registrationsLast30Days,
    vehiclesTotal,
    tripsTotal,
    campgroundsTotal,
    activitiesTotal,
    auditLogsLast24h,
    cachedAt: now.toISOString(),
  };
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const cached = await withRedis(async (redis) => {
    const raw = await redis.get(ADMIN_DASHBOARD_CACHE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AdminDashboardStats;
    } catch {
      return null;
    }
  });

  if (cached) return cached;

  const stats = await computeDashboardStats();

  await withRedis((redis) =>
    redis.set(
      ADMIN_DASHBOARD_CACHE_KEY,
      JSON.stringify(stats),
      "EX",
      ADMIN_DASHBOARD_CACHE_TTL_SECONDS,
    ),
  );

  return stats;
}
