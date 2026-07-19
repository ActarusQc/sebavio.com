import type Stripe from "stripe";

import type { StripeMode } from "./config";
import { StripeModeMismatchError } from "./errors";

export function fromUnixSeconds(value: number | null | undefined): Date | null {
  if (value == null || !Number.isFinite(value)) return null;
  return new Date(Math.trunc(value) * 1000);
}

export function expandId(
  value: string | { id?: string } | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}

/**
 * Basil API : current_period_* peut vivre sur items[0].
 */
export function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: Date | null;
  end: Date | null;
} {
  const sub = subscription as Stripe.Subscription & {
    current_period_start?: number | null;
    current_period_end?: number | null;
  };
  const item = subscription.items?.data?.[0];
  const start = sub.current_period_start ?? item?.current_period_start ?? null;
  const end = sub.current_period_end ?? item?.current_period_end ?? null;
  return {
    start: fromUnixSeconds(start),
    end: fromUnixSeconds(end),
  };
}

export function getSubscriptionPriceFields(subscription: Stripe.Subscription): {
  stripePriceId: string | null;
  stripeProductId: string | null;
  currency: string | null;
  unitAmount: number | null;
  billingInterval: string | null;
  quantity: number;
} {
  const item = subscription.items?.data?.[0];
  const price = item?.price;
  const productId =
    price && typeof price.product === "string"
      ? price.product
      : price &&
          typeof price.product === "object" &&
          price.product &&
          "id" in price.product
        ? (price.product as { id: string }).id
        : null;

  return {
    stripePriceId: price?.id ?? null,
    stripeProductId: productId,
    currency: price?.currency ?? subscription.currency ?? null,
    unitAmount: price?.unit_amount ?? null,
    billingInterval: price?.recurring?.interval ?? null,
    quantity: item?.quantity ?? 1,
  };
}

/**
 * Évite d'écraser une projection plus récente (événements hors ordre).
 * Retourne true si l'écriture doit être ignorée.
 */
export function isStaleStripeUpdate(
  existingUpdatedAt: Date | null | undefined,
  incomingUpdatedAt: Date,
): boolean {
  if (!existingUpdatedAt) return false;
  return existingUpdatedAt.getTime() > incomingUpdatedAt.getTime();
}

export function stripeObjectUpdatedAt(
  created: number,
  eventCreated?: number | null,
): Date {
  if (eventCreated != null && Number.isFinite(eventCreated)) {
    return fromUnixSeconds(Math.max(created, eventCreated)) ?? new Date();
  }
  // Synchronisation manuelle : toujours traiter comme à jour
  return new Date();
}

export function assertModeConsistency(
  objectLivemode: boolean,
  mode: StripeMode,
): void {
  const expectedLive = mode === "live";
  if (objectLivemode !== expectedLive) {
    throw new StripeModeMismatchError(
      `Objet Stripe livemode=${String(objectLivemode)} incompatible avec STRIPE_MODE=${mode}.`,
    );
  }
}
