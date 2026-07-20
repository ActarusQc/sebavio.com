/**
 * Liste brute des produits Stripe (toutes pages) pour classification sync.
 */

import "server-only";

import type Stripe from "stripe";

import { getStripeClient } from "@/services/stripe/client";

export async function listAllStripeProductsForSync(): Promise<
  Stripe.Product[]
> {
  const stripe = getStripeClient();
  const items: Stripe.Product[] = [];
  let startingAfter: string | undefined;

  for (;;) {
    const page = await stripe.products.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    items.push(...page.data);
    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1]!.id;
  }

  return items;
}
