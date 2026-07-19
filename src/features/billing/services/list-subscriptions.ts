import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SubscriptionListQuery } from "@/features/billing/schemas";
import type {
  BillingListResult,
  SubscriptionListItem,
} from "@/features/billing/types";
import {
  asStripeMode,
  formatUserName,
  toIso,
} from "@/features/billing/lib/format";

export function buildSubscriptionListWhere(
  query: SubscriptionListQuery,
): Prisma.StripeSubscriptionWhereInput {
  const where: Prisma.StripeSubscriptionWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.stripeMode) where.stripeMode = query.stripeMode;
  if (query.stripePriceId) where.stripePriceId = query.stripePriceId;
  if (query.stripeProductId) where.stripeProductId = query.stripeProductId;
  if (query.cancelAtPeriodEnd !== undefined) {
    where.cancelAtPeriodEnd = query.cancelAtPeriodEnd;
  }
  if (query.pastDue) where.status = "past_due";
  if (query.trial) {
    where.trialEnd = { gt: new Date() };
  }
  if (query.renewFrom || query.renewTo) {
    where.currentPeriodEnd = {
      ...(query.renewFrom ? { gte: query.renewFrom } : {}),
      ...(query.renewTo ? { lte: query.renewTo } : {}),
    };
  }

  const q = query.q?.trim();
  if (q) {
    const or: Prisma.StripeSubscriptionWhereInput[] = [
      { stripeSubscriptionId: { contains: q, mode: "insensitive" } },
      { stripeCustomerId: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      {
        user: {
          profile: {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
    if (q.length === 36) or.push({ userId: q });
    where.OR = or;
  }

  return where;
}

function mapSubscription(row: {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string | null;
  stripeProductId: string | null;
  status: string;
  currency: string | null;
  unitAmount: number | null;
  billingInterval: string | null;
  quantity: number;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: Date | null;
  trialEnd: Date | null;
  stripeMode: string;
  lastSyncedAt: Date | null;
  createdAt: Date;
  user: {
    email: string;
    profile: { firstName: string; lastName: string } | null;
  };
}): SubscriptionListItem {
  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.user.email,
    userName: formatUserName(
      row.user.profile?.firstName,
      row.user.profile?.lastName,
    ),
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    stripePriceId: row.stripePriceId,
    stripeProductId: row.stripeProductId,
    status: row.status,
    currency: row.currency,
    unitAmount: row.unitAmount,
    billingInterval: row.billingInterval,
    quantity: row.quantity,
    currentPeriodStart: toIso(row.currentPeriodStart),
    currentPeriodEnd: toIso(row.currentPeriodEnd),
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    cancelAt: toIso(row.cancelAt),
    trialEnd: toIso(row.trialEnd),
    stripeMode: asStripeMode(row.stripeMode),
    lastSyncedAt: toIso(row.lastSyncedAt),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listSubscriptions(
  query: SubscriptionListQuery,
): Promise<BillingListResult<SubscriptionListItem>> {
  const where = buildSubscriptionListWhere(query);
  const dir = query.order;
  const secondary = { id: "asc" as const };

  let orderBy: Prisma.StripeSubscriptionOrderByWithRelationInput[];
  switch (query.sort) {
    case "currentPeriodEnd":
      orderBy = [{ currentPeriodEnd: dir }, secondary];
      break;
    case "unitAmount":
      orderBy = [{ unitAmount: dir }, secondary];
      break;
    case "lastSyncedAt":
      orderBy = [{ lastSyncedAt: dir }, secondary];
      break;
    case "status":
      orderBy = [{ status: dir }, secondary];
      break;
    case "createdAt":
    default:
      orderBy = [{ createdAt: dir }, secondary];
      break;
  }

  const [total, rows] = await Promise.all([
    prisma.stripeSubscription.count({ where }),
    prisma.stripeSubscription.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
  ]);

  return {
    items: rows.map(mapSubscription),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export { mapSubscription };
