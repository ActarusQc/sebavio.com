import { prisma } from "@/lib/prisma";
import {
  buildDashboardUrl,
  getStripeMode,
  isStripeConfigured,
  loadStripeConfig,
} from "@/services/stripe";
import type { UserBillingSummary } from "@/features/billing/types";
import { mapSubscription } from "@/features/billing/services/list-subscriptions";
import { mapPayment } from "@/features/billing/services/list-payments";
import { mapInvoice } from "@/features/billing/services/list-invoices";
import { asStripeMode, toIso } from "@/features/billing/lib/format";

const ACTIVEISH = ["active", "trialing", "past_due", "unpaid", "paused"];

export async function getUserBillingSummary(
  userId: string,
): Promise<UserBillingSummary> {
  const mode = isStripeConfigured() ? getStripeMode() : null;
  const accountId = isStripeConfigured()
    ? loadStripeConfig().dashboardAccountId
    : null;

  const customer = await prisma.stripeCustomer.findFirst({
    where: {
      userId,
      deletedAt: null,
      ...(mode ? { stripeMode: mode } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  const subscriptionRow = await prisma.stripeSubscription.findFirst({
    where: {
      userId,
      ...(mode ? { stripeMode: mode } : {}),
      status: { in: ACTIVEISH },
    },
    orderBy: [{ currentPeriodEnd: "desc" }, { createdAt: "desc" }],
    include: {
      user: {
        select: {
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  const paymentRows = await prisma.stripePayment.findMany({
    where: {
      userId,
      ...(mode ? { stripeMode: mode } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: {
        select: {
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  const invoiceRows = await prisma.stripeInvoice.findMany({
    where: {
      userId,
      ...(mode ? { stripeMode: mode } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: {
        select: {
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  const recentRefund = await prisma.stripeRefund.findFirst({
    where: {
      userId,
      ...(mode ? { stripeMode: mode } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const hasPaymentIssue =
    subscriptionRow?.status === "past_due" ||
    subscriptionRow?.status === "unpaid" ||
    paymentRows.some(
      (p) => p.status === "failed" || p.status === "requires_payment_method",
    );

  const syncCandidates = [
    customer?.lastSyncedAt?.getTime() ?? 0,
    subscriptionRow?.lastSyncedAt?.getTime() ?? 0,
    paymentRows[0]?.lastSyncedAt?.getTime() ?? 0,
  ];
  const maxSync = Math.max(0, ...syncCandidates);

  return {
    customer: customer
      ? {
          id: customer.id,
          stripeCustomerId: customer.stripeCustomerId,
          stripeMode: asStripeMode(customer.stripeMode),
          emailSnapshot: customer.emailSnapshot,
          lastSyncedAt: toIso(customer.lastSyncedAt),
          dashboardUrl: buildDashboardUrl(
            asStripeMode(customer.stripeMode),
            "customer",
            customer.stripeCustomerId,
            accountId,
          ),
        }
      : null,
    subscription: subscriptionRow ? mapSubscription(subscriptionRow) : null,
    recentPayments: paymentRows.map(mapPayment),
    recentInvoices: invoiceRows.map(mapInvoice),
    recentRefund: recentRefund
      ? {
          id: recentRefund.id,
          amount: recentRefund.amount,
          currency: recentRefund.currency,
          status: recentRefund.status,
          createdAt: recentRefund.createdAt.toISOString(),
        }
      : null,
    hasPaymentIssue,
    lastSyncedAt: maxSync > 0 ? new Date(maxSync).toISOString() : null,
  };
}
