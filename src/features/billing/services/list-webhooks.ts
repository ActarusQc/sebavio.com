import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { WebhookListQuery } from "@/features/billing/schemas";
import type {
  BillingListResult,
  WebhookListItem,
} from "@/features/billing/types";
import { asStripeMode, toIso } from "@/features/billing/lib/format";

export function buildWebhookListWhere(
  query: WebhookListQuery,
): Prisma.StripeWebhookEventWhereInput {
  const where: Prisma.StripeWebhookEventWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.type) where.type = { contains: query.type, mode: "insensitive" };
  if (query.stripeMode) where.stripeMode = query.stripeMode;
  if (query.objectId) where.objectId = query.objectId;
  if (query.receivedFrom || query.receivedTo) {
    where.receivedAt = {
      ...(query.receivedFrom ? { gte: query.receivedFrom } : {}),
      ...(query.receivedTo ? { lte: query.receivedTo } : {}),
    };
  }

  const q = query.q?.trim();
  if (q) {
    where.OR = [
      { stripeEventId: { contains: q, mode: "insensitive" } },
      { objectId: { contains: q, mode: "insensitive" } },
      { type: { contains: q, mode: "insensitive" } },
      { lastErrorSafe: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

function mapWebhook(row: {
  id: string;
  stripeEventId: string;
  stripeMode: string;
  type: string;
  objectId: string | null;
  status: string;
  attemptCount: number;
  receivedAt: Date;
  processingStartedAt: Date | null;
  processedAt: Date | null;
  lastErrorCode: string | null;
  lastErrorSafe: string | null;
  nextRetryAt: Date | null;
}): WebhookListItem {
  return {
    id: row.id,
    stripeEventId: row.stripeEventId,
    stripeMode: asStripeMode(row.stripeMode),
    type: row.type,
    objectId: row.objectId,
    status: row.status,
    attemptCount: row.attemptCount,
    receivedAt: row.receivedAt.toISOString(),
    processingStartedAt: toIso(row.processingStartedAt),
    processedAt: toIso(row.processedAt),
    lastErrorCode: row.lastErrorCode,
    lastErrorSafe: row.lastErrorSafe,
    nextRetryAt: toIso(row.nextRetryAt),
  };
}

export async function listWebhooks(
  query: WebhookListQuery,
): Promise<BillingListResult<WebhookListItem>> {
  const where = buildWebhookListWhere(query);
  const dir = query.order;
  const secondary = { id: "asc" as const };

  let orderBy: Prisma.StripeWebhookEventOrderByWithRelationInput[];
  switch (query.sort) {
    case "processedAt":
      orderBy = [{ processedAt: dir }, secondary];
      break;
    case "attemptCount":
      orderBy = [{ attemptCount: dir }, secondary];
      break;
    case "type":
      orderBy = [{ type: dir }, secondary];
      break;
    case "receivedAt":
    default:
      orderBy = [{ receivedAt: dir }, secondary];
      break;
  }

  const [total, rows] = await Promise.all([
    prisma.stripeWebhookEvent.count({ where }),
    prisma.stripeWebhookEvent.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    items: rows.map(mapWebhook),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}
