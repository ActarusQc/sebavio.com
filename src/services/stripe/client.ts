/**
 * Client Stripe serveur unique.
 * Ne jamais importer ce module depuis un Client Component.
 */
import "server-only";

import Stripe from "stripe";

import { loadStripeConfig } from "./config";

const STRIPE_API_VERSION = "2026-06-24.dahlia" as const;

const globalForStripe = globalThis as unknown as {
  __sebavioStripe?: Stripe;
  __sebavioStripeApiVersion?: string;
};

export function getStripeClient(): Stripe {
  if (
    globalForStripe.__sebavioStripe &&
    globalForStripe.__sebavioStripeApiVersion === STRIPE_API_VERSION
  ) {
    return globalForStripe.__sebavioStripe;
  }

  const config = loadStripeConfig();
  const client = new Stripe(config.secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    timeout: 20_000,
    maxNetworkRetries: 2,
    appInfo: {
      name: "Sebavio",
      version: "0.1.0",
    },
  });

  globalForStripe.__sebavioStripe = client;
  globalForStripe.__sebavioStripeApiVersion = STRIPE_API_VERSION;
  return client;
}

export { STRIPE_API_VERSION };
