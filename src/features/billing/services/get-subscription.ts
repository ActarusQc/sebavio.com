import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  buildDashboardUrl,
  isStripeConfigured,
  loadStripeConfig,
} from "@/services/stripe";
import type { SubscriptionDetail } from "@/features/billing/types";
import { mapSubscription } from "@/features/billing/services/list-subscriptions";
import { mapPayment } from "@/features/billing/services/list-payments";
import { mapInvoice } from "@/features/billing/services/list-invoices";
import { asStripeMode, toIso } from "@/features/billing/lib/format";

export async function getSubscriptionDetail(
  id: string,
): Promise<SubscriptionDetail> {
  const row = await prisma.stripeSubscription.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });
  if (!row) notFound();

  const accountId = isStripeConfigured()
    ? loadStripeConfig().dashboardAccountId
    : null;

  const [payments, invoices] = await Promise.all([
    prisma.stripePayment.findMany({
      where: {
        userId: row.userId,
        stripeMode: row.stripeMode,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
    prisma.stripeInvoice.findMany({
      where: {
        userId: row.userId,
        stripeMode: row.stripeMode,
        OR: [
          { stripeSubscriptionId: row.stripeSubscriptionId },
          { stripeSubscriptionId: null },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
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

  const base = mapSubscription(row);
  return {
    ...base,
    canceledAt: toIso(row.canceledAt),
    trialStart: toIso(row.trialStart),
    endedAt: toIso(row.endedAt),
    latestInvoiceId: row.latestInvoiceId,
    stripeUpdatedAt: toIso(row.stripeUpdatedAt),
    dashboardUrl: buildDashboardUrl(
      asStripeMode(row.stripeMode),
      "subscription",
      row.stripeSubscriptionId,
      accountId,
    ),
    customerDashboardUrl: buildDashboardUrl(
      asStripeMode(row.stripeMode),
      "customer",
      row.stripeCustomerId,
      accountId,
    ),
    recentPayments: payments.map(mapPayment),
    recentInvoices: invoices.map(mapInvoice),
  };
}
