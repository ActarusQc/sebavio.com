import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  invalidateUnreadCache,
  refreshUnreadCache,
} from "@/features/notifications/services/badge";
import { toNotificationDto } from "@/features/notifications/services/mappers";
import type { NotificationDto } from "@/features/notifications/types";

export async function markNotificationRead(
  userId: string,
  id: string,
  ipAddress?: string | null,
): Promise<NotificationDto> {
  const existing = await prisma.notification.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("NOTIF_001", "Notification introuvable", 404);
  }

  if (existing.readAt) {
    return toNotificationDto(existing);
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  await invalidateUnreadCache(userId);

  await writeAuditLog({
    userId,
    entity: "notifications",
    entityId: id,
    action: "mark_read",
    ipAddress,
  });

  return toNotificationDto(updated);
}

export async function markAllNotificationsRead(
  userId: string,
  ipAddress?: string | null,
): Promise<{ updated: number }> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      deletedAt: null,
      readAt: null,
      channel: "in_app",
    },
    data: { readAt: new Date() },
  });

  await refreshUnreadCache(userId);

  if (result.count > 0) {
    await writeAuditLog({
      userId,
      entity: "notifications",
      entityId: userId,
      action: "mark_read_all",
      newValue: { updated: result.count },
      ipAddress,
    });
  }

  return { updated: result.count };
}

export async function deleteNotification(
  userId: string,
  id: string,
  ipAddress?: string | null,
): Promise<void> {
  const existing = await prisma.notification.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("NOTIF_001", "Notification introuvable", 404);
  }

  await prisma.notification.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await invalidateUnreadCache(userId);

  await writeAuditLog({
    userId,
    entity: "notifications",
    entityId: id,
    action: "delete",
    oldValue: {
      type: existing.type,
      dedupeKey: existing.dedupeKey,
      readAt: existing.readAt?.toISOString() ?? null,
    },
    ipAddress,
  });
}
