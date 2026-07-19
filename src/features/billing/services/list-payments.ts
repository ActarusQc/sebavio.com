import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PaymentListQuery } from "@/features/billing/schemas";
import type {
  BillingListResult,
  PaymentListItem,
} from "@/features/billing/types";
import {
  asStripeMode,
  displayStatusForPayment,
  formatUserName,
  toIso,
} from "@/features/billing/lib/format";

export function buildPaymentListWhere(
  query: PaymentListQuery,
): Prisma.StripePaymentWhereInput {
  const where: Prisma.StripePaymentWhereInput = {};

  if (query.stripeMode) where.stripeMode = query.stripeMode;
  if (query.status === "refunded" || query.status === "partially_refunded") {
    where.amountRefunded = { gt: 0 };
  } else if (query.status === "failed") {
    where.status = { in: ["failed", "requires_payment_method"] };
  } else if (query.status) {
    where.status = query.status;
  }

  if (query.amountMin != null || query.amountMax != null) {
    where.amount = {
      ...(query.amountMin != null ? { gte: query.amountMin } : {}),
      ...(query.amountMax != null ? { lte: query.amountMax } : {}),
    };
  }
  if (query.paidFrom || query.paidTo) {
    where.paidAt = {
      ...(query.paidFrom ? { gte: query.paidFrom } : {}),
      ...(query.paidTo ? { lte: query.paidTo } : {}),
    };
  }
  if (query.createdFrom || query.createdTo) {
    where.createdAt = {
      ...(query.createdFrom ? { gte: query.createdFrom } : {}),
      ...(query.createdTo ? { lte: query.createdTo } : {}),
    };
  }

  const q = query.q?.trim();
  if (q) {
    const or: Prisma.StripePaymentWhereInput[] = [
      { stripePaymentIntentId: { contains: q, mode: "insensitive" } },
      { stripeChargeId: { contains: q, mode: "insensitive" } },
      { stripeInvoiceId: { contains: q, mode: "insensitive" } },
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

export function mapPayment(row: {
  id: string;
  userId: string;
  stripeCustomerId: string | null;
  stripePaymentIntentId: string;
  stripeChargeId: string | null;
  stripeInvoiceId: string | null;
  amount: number;
  amountReceived: number;
  amountRefunded: number;
  currency: string;
  status: string;
  failureMessageSafe: string | null;
  paymentMethodType: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  stripeMode: string;
  paidAt: Date | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  user: {
    email: string;
    profile: { firstName: string; lastName: string } | null;
  };
}): PaymentListItem {
  const displayStatus = displayStatusForPayment(row);
  const refundable = Math.max(0, row.amountReceived - row.amountRefunded);
  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.user.email,
    userName: formatUserName(
      row.user.profile?.firstName,
      row.user.profile?.lastName,
    ),
    stripeCustomerId: row.stripeCustomerId,
    stripePaymentIntentId: row.stripePaymentIntentId,
    stripeChargeId: row.stripeChargeId,
    stripeInvoiceId: row.stripeInvoiceId,
    amount: row.amount,
    amountReceived: row.amountReceived,
    amountRefunded: row.amountRefunded,
    currency: row.currency,
    status: displayStatus,
    failureMessageSafe: row.failureMessageSafe,
    paymentMethodType: row.paymentMethodType,
    cardBrand: row.cardBrand,
    cardLast4: row.cardLast4,
    stripeMode: asStripeMode(row.stripeMode),
    paidAt: toIso(row.paidAt),
    lastSyncedAt: toIso(row.lastSyncedAt),
    createdAt: row.createdAt.toISOString(),
    refundableAmount: refundable,
  };
}

export async function listPayments(
  query: PaymentListQuery,
): Promise<BillingListResult<PaymentListItem>> {
  const where = buildPaymentListWhere(query);

  // Affinage refunded / partially_refunded après lecture si nécessaire
  if (query.status === "refunded") {
    where.amountRefunded = { gt: 0 };
  }

  const dir = query.order;
  const secondary = { id: "asc" as const };
  let orderBy: Prisma.StripePaymentOrderByWithRelationInput[];
  switch (query.sort) {
    case "amount":
      orderBy = [{ amount: dir }, secondary];
      break;
    case "paidAt":
      orderBy = [{ paidAt: dir }, secondary];
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
    prisma.stripePayment.count({ where }),
    prisma.stripePayment.findMany({
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

  let items = rows.map(mapPayment);
  if (query.status === "refunded") {
    items = items.filter((i) => i.status === "refunded");
  } else if (query.status === "partially_refunded") {
    items = items.filter((i) => i.status === "partially_refunded");
  }

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}
