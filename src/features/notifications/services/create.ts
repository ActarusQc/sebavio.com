import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { invalidateUnreadCache } from "@/features/notifications/services/badge";
import { isInAppTypeAllowed } from "@/features/notifications/services/preferences";
import { toNotificationDto } from "@/features/notifications/services/mappers";
import type {
  CreateInAppInput,
  NotificationDto,
} from "@/features/notifications/types";

type Tx = Prisma.TransactionClient;

export type CreateInAppResult =
  | { status: "created"; notification: NotificationDto }
  | { status: "exists"; notification: NotificationDto }
  | { status: "skipped_prefs" };

/**
 * Crée une notification in-app si absente (anti-doublon dedupe_key).
 * Ne crée jamais email/push dans cette phase.
 */
export async function createInAppNotification(
  input: CreateInAppInput,
  tx?: Tx,
): Promise<CreateInAppResult> {
  const allowed = await isInAppTypeAllowed(input.userId, input.type);
  if (!allowed) {
    return { status: "skipped_prefs" };
  }

  const client = tx ?? prisma;

  const existing = await client.notification.findFirst({
    where: {
      userId: input.userId,
      channel: "in_app",
      dedupeKey: input.dedupeKey,
      deletedAt: null,
    },
  });
  if (existing) {
    return {
      status: "exists",
      notification: toNotificationDto(existing),
    };
  }

  try {
    const created = await client.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        channel: "in_app",
        title: input.title,
        body: input.body,
        priority: input.priority ?? "normal",
        dedupeKey: input.dedupeKey,
        sourceEntity: input.sourceEntity ?? null,
        sourceId: input.sourceId ?? null,
        href: input.href ?? null,
      },
    });

    if (!tx) {
      await invalidateUnreadCache(input.userId);
    }

    return {
      status: "created",
      notification: toNotificationDto(created),
    };
  } catch (error) {
    // Course : unique partielle — relire l’existante
    const raced = await client.notification.findFirst({
      where: {
        userId: input.userId,
        channel: "in_app",
        dedupeKey: input.dedupeKey,
        deletedAt: null,
      },
    });
    if (raced) {
      return {
        status: "exists",
        notification: toNotificationDto(raced),
      };
    }
    throw error;
  }
}

/**
 * Soft-delete des notifications actives correspondant à un dedupe_key.
 */
export async function softDeleteByDedupeKey(
  userId: string,
  dedupeKey: string,
  channel: "in_app" = "in_app",
): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      channel,
      dedupeKey,
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  });
  if (result.count > 0) {
    await invalidateUnreadCache(userId);
  }
  return result.count;
}
