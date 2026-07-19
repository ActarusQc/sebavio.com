import "server-only";

import type Stripe from "stripe";

import { getStripeClient } from "./client";
import { StripeSubscriptionActionNotAllowedError } from "./errors";
import { syncStripeSubscription } from "./sync-service";

const CANCELABLE_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
]);

async function retrieveSubscription(
  stripeSubscriptionId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();
  return stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ["items.data.price"],
  });
}

export async function fetchStripeSubscription(stripeSubscriptionId: string) {
  return retrieveSubscription(stripeSubscriptionId);
}

/**
 * Annule à la fin de la période courante (cancel_at_period_end).
 */
export async function cancelAtPeriodEnd(stripeSubscriptionId: string) {
  const current = await retrieveSubscription(stripeSubscriptionId);
  if (!CANCELABLE_STATUSES.has(current.status)) {
    throw new StripeSubscriptionActionNotAllowedError(
      `Impossible de planifier l'annulation pour le statut « ${current.status} ».`,
    );
  }
  if (current.cancel_at_period_end) {
    return syncStripeSubscription(stripeSubscriptionId);
  }

  const stripe = getStripeClient();
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
  return syncStripeSubscription(stripeSubscriptionId);
}

/**
 * Annulation immédiate — ne rembourse pas automatiquement.
 */
export async function cancelImmediately(stripeSubscriptionId: string) {
  const current = await retrieveSubscription(stripeSubscriptionId);
  if (current.status === "canceled") {
    throw new StripeSubscriptionActionNotAllowedError(
      "Cet abonnement est déjà annulé.",
    );
  }
  if (
    !CANCELABLE_STATUSES.has(current.status) &&
    current.status !== "incomplete"
  ) {
    throw new StripeSubscriptionActionNotAllowedError(
      `Impossible d'annuler immédiatement un abonnement « ${current.status} ».`,
    );
  }

  const stripe = getStripeClient();
  await stripe.subscriptions.cancel(stripeSubscriptionId, {
    invoice_now: false,
    prorate: false,
  });
  return syncStripeSubscription(stripeSubscriptionId);
}

/**
 * Retire cancel_at_period_end si l'abonnement n'est pas définitivement annulé.
 */
export async function resumeCancel(stripeSubscriptionId: string) {
  const current = await retrieveSubscription(stripeSubscriptionId);
  if (current.status === "canceled") {
    throw new StripeSubscriptionActionNotAllowedError(
      "Un abonnement déjà annulé ne peut pas être repris ; créez-en un nouveau.",
    );
  }
  if (!current.cancel_at_period_end) {
    return syncStripeSubscription(stripeSubscriptionId);
  }

  const stripe = getStripeClient();
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
  return syncStripeSubscription(stripeSubscriptionId);
}
