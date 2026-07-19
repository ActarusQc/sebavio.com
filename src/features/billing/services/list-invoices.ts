import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { InvoiceListQuery } from "@/features/billing/schemas";
import type {
  BillingListResult,
  InvoiceListItem,
} from "@/features/billing/types";
import {
  asStripeMode,
  formatUserName,
  isSafeHttpUrl,
  toIso,
} from "@/features/billing/lib/format";

export function buildInvoiceListWhere(
  query: InvoiceListQuery,
): Prisma.StripeInvoiceWhereInput {
  const where: Prisma.StripeInvoiceWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.stripeMode) where.stripeMode = query.stripeMode;
  if (query.createdFrom || query.createdTo) {
    where.createdAt = {
      ...(query.createdFrom ? { gte: query.createdFrom } : {}),
      ...(query.createdTo ? { lte: query.createdTo } : {}),
    };
  }

  const q = query.q?.trim();
  if (q) {
    const or: Prisma.StripeInvoiceWhereInput[] = [
      { stripeInvoiceId: { contains: q, mode: "insensitive" } },
      { number: { contains: q, mode: "insensitive" } },
      { stripeSubscriptionId: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
    if (q.length === 36) or.push({ userId: q });
    where.OR = or;
  }

  return where;
}

export function mapInvoice(row: {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  stripeSubscriptionId: string | null;
  number: string | null;
  status: string | null;
  currency: string | null;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  amountRemaining: number;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  dueDate: Date | null;
  paidAt: Date | null;
  stripeMode: string;
  lastSyncedAt: Date | null;
  createdAt: Date;
  user: {
    email: string;
    profile: { firstName: string; lastName: string } | null;
  };
}): InvoiceListItem {
  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.user.email,
    userName: formatUserName(
      row.user.profile?.firstName,
      row.user.profile?.lastName,
    ),
    stripeInvoiceId: row.stripeInvoiceId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    number: row.number,
    status: row.status,
    currency: row.currency,
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    amountPaid: row.amountPaid,
    amountDue: row.amountDue,
    amountRemaining: row.amountRemaining,
    hostedInvoiceUrl: isSafeHttpUrl(row.hostedInvoiceUrl),
    invoicePdfUrl: isSafeHttpUrl(row.invoicePdfUrl),
    dueDate: toIso(row.dueDate),
    paidAt: toIso(row.paidAt),
    stripeMode: asStripeMode(row.stripeMode),
    lastSyncedAt: toIso(row.lastSyncedAt),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listInvoices(
  query: InvoiceListQuery,
): Promise<BillingListResult<InvoiceListItem>> {
  const where = buildInvoiceListWhere(query);
  const dir = query.order;
  const secondary = { id: "asc" as const };

  let orderBy: Prisma.StripeInvoiceOrderByWithRelationInput[];
  switch (query.sort) {
    case "total":
      orderBy = [{ total: dir }, secondary];
      break;
    case "dueDate":
      orderBy = [{ dueDate: dir }, secondary];
      break;
    case "paidAt":
      orderBy = [{ paidAt: dir }, secondary];
      break;
    case "lastSyncedAt":
      orderBy = [{ lastSyncedAt: dir }, secondary];
      break;
    case "createdAt":
    default:
      orderBy = [{ createdAt: dir }, secondary];
      break;
  }

  const [total, rows] = await Promise.all([
    prisma.stripeInvoice.count({ where }),
    prisma.stripeInvoice.findMany({
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
    items: rows.map(mapInvoice),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}
