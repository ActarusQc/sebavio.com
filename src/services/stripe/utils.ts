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
 * Période de facturation — depuis Basil/Dahlia sur SubscriptionItem
 * (plus sur Subscription). Mono-item : item[0]. Multi-item : min start / max end.
 */
export function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: Date | null;
  end: Date | null;
} {
  const items = subscription.items?.data ?? [];
  if (items.length === 0) {
    return { start: null, end: null };
  }

  let startSec = items[0].current_period_start;
  let endSec = items[0].current_period_end;
  for (const item of items) {
    if (item.current_period_start < startSec) {
      startSec = item.current_period_start;
    }
    if (item.current_period_end > endSec) {
      endSec = item.current_period_end;
    }
  }

  return {
    start: fromUnixSeconds(startSec),
    end: fromUnixSeconds(endSec),
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
  let productId: string | null = null;
  if (price) {
    if (typeof price.product === "string") {
      productId = price.product;
    } else if (
      price.product &&
      typeof price.product === "object" &&
      !("deleted" in price.product && price.product.deleted)
    ) {
      productId = price.product.id;
    }
  }

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
