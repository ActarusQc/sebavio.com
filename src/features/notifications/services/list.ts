import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import {
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
} from "@/features/notifications/constants";
import { notificationsListSchema } from "@/features/notifications/schemas";
import {
  getUnreadCount,
  refreshUnreadCache,
} from "@/features/notifications/services/badge";
import {
  clampPageSize,
  toNotificationDto,
} from "@/features/notifications/services/mappers";
import type {
  NotificationDto,
  PaginatedNotifications,
} from "@/features/notifications/types";

function parseZod<T>(parse: () => T, fallbackMessage: string): T {
  try {
    return parse();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? fallbackMessage,
        400,
      );
    }
    throw error;
  }
}

export async function listNotifications(
  userId: string,
  rawQuery: Record<string, string | string[] | undefined>,
): Promise<PaginatedNotifications> {
  const query = Object.fromEntries(
    Object.entries(rawQuery).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = parseZod(
    () => notificationsListSchema.parse(query),
    "Paramètres de liste invalides",
  );
  const pageSize = clampPageSize(
    parsed.pageSize ?? DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );
  const page = parsed.page;

  const where = {
    userId,
    deletedAt: null,
    channel: "in_app" as const,
    ...(parsed.unreadOnly ? { readAt: null } : {}),
  };

  const [total, rows, unreadCount] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    getUnreadCount(userId),
  ]);

  return {
    items: rows.map(toNotificationDto),
    page,
    pageSize,
    total,
    unreadCount,
  };
}

export async function getNotificationById(
  userId: string,
  id: string,
): Promise<NotificationDto> {
  const row = await prisma.notification.findFirst({
    where: {
      id,
      userId,
      deletedAt: null,
    },
  });
  if (!row) {
    throw new AppError("NOTIF_001", "Notification introuvable", 404);
  }
  return toNotificationDto(row);
}

export { refreshUnreadCache, getUnreadCount };
