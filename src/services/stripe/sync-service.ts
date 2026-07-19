import "server-only";

import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";

import { getStripeClient } from "./client";
import { getStripeMode } from "./config";
import { StripeObjectNotFoundError, StripeSyncError } from "./errors";
import {
  assertModeConsistency,
  expandId,
  fromUnixSeconds,
  getSubscriptionPeriod,
  getSubscriptionPriceFields,
  isStaleStripeUpdate,
  stripeObjectUpdatedAt,
} from "./utils";

export type SyncOptions = {
  /** Horodatage événement webhook pour protection hors-ordre */
  eventCreated?: number | null;
  /** Forcer l'association utilisateur (création client) */
  userId?: string;
};

async function resolveUserIdFromCustomer(
  stripeCustomerId: string | null,
  preferredUserId?: string,
): Promise<string> {
  if (preferredUserId) return preferredUserId;
  if (!stripeCustomerId) {
    throw new StripeSyncError(
      "Impossible d'associer l'objet Stripe : client manquant.",
    );
  }

  const mode = getStripeMode();
  const local = await prisma.stripeCustomer.findFirst({
    where: {
      stripeCustomerId,
      stripeMode: mode,
      deletedAt: null,
    },
  });
  if (local) return local.userId;

  const stripe = getStripeClient();
  const customer = await stripe.customers.retrieve(stripeCustomerId);
  if (customer.deleted) {
    throw new StripeObjectNotFoundError("Client Stripe supprimé.");
  }
  const metaUserId = customer.metadata?.sebavioUserId?.trim();
  if (metaUserId) {
    const user = await prisma.user.findFirst({
      where: { id: metaUserId, deletedAt: null },
      select: { id: true },
    });
    if (user) return user.id;
  }

  throw new StripeSyncError(
    "Objet Stripe non associé à un utilisateur Sebavio.",
  );
}

export async function syncStripeCustomer(
  stripeCustomerId: string,
  options: SyncOptions = {},
) {
  const mode = getStripeMode();
  const stripe = getStripeClient();

  let customer: Stripe.Customer | Stripe.DeletedCustomer;
  try {
    customer = await stripe.customers.retrieve(stripeCustomerId);
  } catch {
    throw new StripeObjectNotFoundError("Client Stripe introuvable.");
  }

  if (customer.deleted) {
    const existing = await prisma.stripeCustomer.findUnique({
      where: {
        stripeCustomerId_stripeMode: { stripeCustomerId, stripeMode: mode },
      },
    });
    if (existing && !existing.deletedAt) {
      return prisma.stripeCustomer.update({
        where: { id: existing.id },
        data: { deletedAt: new Date(), lastSyncedAt: new Date() },
      });
    }
    throw new StripeObjectNotFoundError("Client Stripe supprimé.");
  }

  assertModeConsistency(customer.livemode, mode);
  const userId = await resolveUserIdFromCustomer(
    stripeCustomerId,
    options.userId ?? customer.metadata?.sebavioUserId?.trim(),
  );
  const incomingUpdatedAt = stripeObjectUpdatedAt(
    customer.created,
    options.eventCreated,
  );

  const existing = await prisma.stripeCustomer.findUnique({
    where: {
      stripeCustomerId_stripeMode: { stripeCustomerId, stripeMode: mode },
    },
  });

  if (
    existing &&
    isStaleStripeUpdate(existing.stripeUpdatedAt, incomingUpdatedAt)
  ) {
    return existing;
  }

  const data = {
    userId,
    emailSnapshot: customer.email,
    nameSnapshot: customer.name,
    lastSyncedAt: new Date(),
    stripeUpdatedAt: incomingUpdatedAt,
    deletedAt: null as Date | null,
  };

  if (existing) {
    return prisma.stripeCustomer.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.stripeCustomer.create({
    data: {
      stripeCustomerId,
      stripeMode: mode,
      ...data,
    },
  });
}

export async function syncStripeSubscription(
  stripeSubscriptionId: string,
  options: SyncOptions = {},
) {
  const mode = getStripeMode();
  const stripe = getStripeClient();

  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
      expand: ["items.data.price"],
    });
  } catch {
    throw new StripeObjectNotFoundError("Abonnement Stripe introuvable.");
  }

  assertModeConsistency(subscription.livemode, mode);
  const stripeCustomerId = expandId(subscription.customer);
  if (!stripeCustomerId) {
    throw new StripeSyncError("Abonnement sans client Stripe.");
  }

  // Assure la projection client avant l'abonnement
  await syncStripeCustomer(stripeCustomerId, options);
  const userId = await resolveUserIdFromCustomer(
    stripeCustomerId,
    options.userId,
  );

  const period = getSubscriptionPeriod(subscription);
  const priceFields = getSubscriptionPriceFields(subscription);
  const incomingUpdatedAt = stripeObjectUpdatedAt(
    subscription.created,
    options.eventCreated,
  );

  const existing = await prisma.stripeSubscription.findUnique({
    where: {
      stripeSubscriptionId_stripeMode: {
        stripeSubscriptionId,
        stripeMode: mode,
      },
    },
  });

  if (
    existing &&
    isStaleStripeUpdate(existing.stripeUpdatedAt, incomingUpdatedAt)
  ) {
    return existing;
  }

  const data = {
    userId,
    stripeCustomerId,
    status: subscription.status,
    ...priceFields,
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    cancelAt: fromUnixSeconds(subscription.cancel_at),
    canceledAt: fromUnixSeconds(subscription.canceled_at),
    trialStart: fromUnixSeconds(subscription.trial_start),
    trialEnd: fromUnixSeconds(subscription.trial_end),
    endedAt: fromUnixSeconds(subscription.ended_at),
    latestInvoiceId: expandId(subscription.latest_invoice),
    lastSyncedAt: new Date(),
    stripeUpdatedAt: incomingUpdatedAt,
  };

  if (existing) {
    return prisma.stripeSubscription.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.stripeSubscription.create({
    data: {
      stripeSubscriptionId,
      stripeMode: mode,
      ...data,
    },
  });
}

function extractCardDetails(pi: Stripe.PaymentIntent): {
  paymentMethodType: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  cardExpMonth: number | null;
  cardExpYear: number | null;
  stripeChargeId: string | null;
  amountRefunded: number;
} {
  const charge =
    typeof pi.latest_charge === "object" && pi.latest_charge
      ? pi.latest_charge
      : null;
  const pm =
    typeof pi.payment_method === "object" && pi.payment_method
      ? pi.payment_method
      : null;
  const card =
    pm && "card" in pm && pm.card
      ? pm.card
      : charge && "payment_method_details" in charge
        ? charge.payment_method_details?.card
        : null;

  return {
    paymentMethodType: pm?.type ?? charge?.payment_method_details?.type ?? null,
    cardBrand: card?.brand ?? null,
    cardLast4: card?.last4 ?? null,
    cardExpMonth: card?.exp_month ?? null,
    cardExpYear: card?.exp_year ?? null,
    stripeChargeId: charge?.id ?? expandId(pi.latest_charge),
    amountRefunded:
      charge && "amount_refunded" in charge ? (charge.amount_refunded ?? 0) : 0,
  };
}

export async function syncStripePaymentIntent(
  stripePaymentIntentId: string,
  options: SyncOptions = {},
) {
  const mode = getStripeMode();
  const stripe = getStripeClient();

  let pi: Stripe.PaymentIntent;
  try {
    pi = await stripe.paymentIntents.retrieve(stripePaymentIntentId, {
      expand: ["latest_charge", "payment_method"],
    });
  } catch {
    throw new StripeObjectNotFoundError("PaymentIntent Stripe introuvable.");
  }

  assertModeConsistency(pi.livemode, mode);
  const stripeCustomerId = expandId(pi.customer);
  if (stripeCustomerId) {
    await syncStripeCustomer(stripeCustomerId, options).catch(() => undefined);
  }
  const userId = await resolveUserIdFromCustomer(
    stripeCustomerId,
    options.userId ?? pi.metadata?.sebavioUserId?.trim(),
  );

  const card = extractCardDetails(pi);
  const incomingUpdatedAt = stripeObjectUpdatedAt(
    pi.created,
    options.eventCreated,
  );

  const existing = await prisma.stripePayment.findUnique({
    where: {
      stripePaymentIntentId_stripeMode: {
        stripePaymentIntentId,
        stripeMode: mode,
      },
    },
  });

  if (
    existing &&
    isStaleStripeUpdate(existing.stripeUpdatedAt, incomingUpdatedAt)
  ) {
    return existing;
  }

  const invoiceId =
    typeof pi.metadata?.stripeInvoiceId === "string"
      ? pi.metadata.stripeInvoiceId
      : typeof pi.metadata?.invoice_id === "string"
        ? pi.metadata.invoice_id
        : null;

  const data = {
    userId,
    stripeCustomerId,
    stripeChargeId: card.stripeChargeId,
    stripeInvoiceId: invoiceId,
    amount: pi.amount,
    amountReceived: pi.amount_received ?? 0,
    amountRefunded: card.amountRefunded,
    currency: pi.currency,
    status: pi.status,
    failureCode: pi.last_payment_error?.code ?? null,
    failureMessageSafe: pi.last_payment_error?.message
      ? pi.last_payment_error.message.slice(0, 500)
      : null,
    paymentMethodType: card.paymentMethodType,
    cardBrand: card.cardBrand,
    cardLast4: card.cardLast4,
    cardExpMonth: card.cardExpMonth,
    cardExpYear: card.cardExpYear,
    paidAt: pi.status === "succeeded" ? fromUnixSeconds(pi.created) : null,
    lastSyncedAt: new Date(),
    stripeUpdatedAt: incomingUpdatedAt,
  };

  if (existing) {
    return prisma.stripePayment.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.stripePayment.create({
    data: {
      stripePaymentIntentId,
      stripeMode: mode,
      ...data,
    },
  });
}

export async function syncStripeInvoice(
  stripeInvoiceId: string,
  options: SyncOptions = {},
) {
  const mode = getStripeMode();
  const stripe = getStripeClient();

  let invoice: Stripe.Invoice;
  try {
    invoice = await stripe.invoices.retrieve(stripeInvoiceId);
  } catch {
    throw new StripeObjectNotFoundError("Facture Stripe introuvable.");
  }

  assertModeConsistency(invoice.livemode, mode);
  const stripeCustomerId = expandId(invoice.customer);
  if (stripeCustomerId) {
    await syncStripeCustomer(stripeCustomerId, options);
  }
  const userId = await resolveUserIdFromCustomer(
    stripeCustomerId,
    options.userId,
  );

  const incomingUpdatedAt = stripeObjectUpdatedAt(
    invoice.created,
    options.eventCreated,
  );

  const existing = await prisma.stripeInvoice.findUnique({
    where: {
      stripeInvoiceId_stripeMode: { stripeInvoiceId, stripeMode: mode },
    },
  });

  if (
    existing &&
    isStaleStripeUpdate(existing.stripeUpdatedAt, incomingUpdatedAt)
  ) {
    return existing;
  }

  const subscriptionId = expandId(
    invoice.parent?.subscription_details?.subscription ?? null,
  );

  const taxAmount =
    invoice.total_taxes?.reduce((sum, t) => sum + (t.amount ?? 0), 0) ?? 0;

  const data = {
    userId,
    stripeCustomerId,
    stripeSubscriptionId: subscriptionId,
    number: invoice.number,
    status: invoice.status,
    currency: invoice.currency,
    subtotal: invoice.subtotal ?? 0,
    tax: taxAmount,
    total: invoice.total ?? 0,
    amountPaid: invoice.amount_paid ?? 0,
    amountDue: invoice.amount_due ?? 0,
    amountRemaining: invoice.amount_remaining ?? 0,
    hostedInvoiceUrl: invoice.hosted_invoice_url,
    invoicePdfUrl: invoice.invoice_pdf,
    periodStart: fromUnixSeconds(invoice.period_start),
    periodEnd: fromUnixSeconds(invoice.period_end),
    dueDate: fromUnixSeconds(invoice.due_date),
    paidAt: fromUnixSeconds(invoice.status_transitions?.paid_at),
    voidedAt: fromUnixSeconds(invoice.status_transitions?.voided_at),
    lastSyncedAt: new Date(),
    stripeUpdatedAt: incomingUpdatedAt,
  };

  if (existing) {
    return prisma.stripeInvoice.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.stripeInvoice.create({
    data: {
      stripeInvoiceId,
      stripeMode: mode,
      ...data,
    },
  });
}

export async function syncStripeRefund(
  stripeRefundId: string,
  options: SyncOptions & {
    adminReason?: string | null;
    createdByAdminId?: string | null;
  } = {},
) {
  const mode = getStripeMode();
  const stripe = getStripeClient();

  let refund: Stripe.Refund;
  try {
    refund = await stripe.refunds.retrieve(stripeRefundId);
  } catch {
    throw new StripeObjectNotFoundError("Remboursement Stripe introuvable.");
  }

  assertModeConsistency(
    Boolean((refund as Stripe.Refund & { livemode?: boolean }).livemode),
    mode,
  );

  const paymentIntentId = expandId(refund.payment_intent);
  if (!paymentIntentId) {
    throw new StripeSyncError("Remboursement sans PaymentIntent associé.");
  }

  const payment = await syncStripePaymentIntent(paymentIntentId, options);
  const incomingUpdatedAt = stripeObjectUpdatedAt(
    refund.created,
    options.eventCreated,
  );

  const existing = await prisma.stripeRefund.findUnique({
    where: {
      stripeRefundId_stripeMode: { stripeRefundId, stripeMode: mode },
    },
  });

  if (
    existing &&
    isStaleStripeUpdate(existing.stripeUpdatedAt, incomingUpdatedAt)
  ) {
    return existing;
  }

  const data = {
    paymentId: payment.id,
    userId: payment.userId,
    stripePaymentIntentId: paymentIntentId,
    stripeChargeId: expandId(refund.charge),
    amount: refund.amount,
    currency: refund.currency,
    status: refund.status ?? "unknown",
    stripeReason: refund.reason,
    adminReason: options.adminReason ?? existing?.adminReason ?? null,
    createdByAdminId:
      options.createdByAdminId ?? existing?.createdByAdminId ?? null,
    lastSyncedAt: new Date(),
    stripeUpdatedAt: incomingUpdatedAt,
  };

  if (existing) {
    return prisma.stripeRefund.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.stripeRefund.create({
    data: {
      stripeRefundId,
      stripeMode: mode,
      ...data,
    },
  });
}

/**
 * Resynchronise toutes les projections facturation d'un utilisateur.
 */
export async function syncUserBillingData(userId: string) {
  const mode = getStripeMode();
  const customer = await prisma.stripeCustomer.findFirst({
    where: { userId, stripeMode: mode, deletedAt: null },
  });
  if (!customer) {
    throw new StripeObjectNotFoundError(
      "Aucun client Stripe local pour cet utilisateur.",
    );
  }

  await syncStripeCustomer(customer.stripeCustomerId, { userId });

  const stripe = getStripeClient();
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.stripeCustomerId,
    status: "all",
    limit: 100,
  });
  for (const sub of subscriptions.data) {
    await syncStripeSubscription(sub.id, { userId });
  }

  const invoices = await stripe.invoices.list({
    customer: customer.stripeCustomerId,
    limit: 100,
  });
  for (const inv of invoices.data) {
    if (inv.id) await syncStripeInvoice(inv.id, { userId });
  }

  const paymentIntents = await stripe.paymentIntents.list({
    customer: customer.stripeCustomerId,
    limit: 100,
  });
  for (const pi of paymentIntents.data) {
    await syncStripePaymentIntent(pi.id, { userId });
  }

  return {
    userId,
    stripeCustomerId: customer.stripeCustomerId,
    subscriptions: subscriptions.data.length,
    invoices: invoices.data.length,
    payments: paymentIntents.data.length,
  };
}
