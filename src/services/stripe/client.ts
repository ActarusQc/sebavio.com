/**
 * Client Stripe serveur unique.
 * Ne jamais importer ce module depuis un Client Component.
 */
import "server-only";

import Stripe from "stripe";

import { loadStripeConfig } from "./config";

const STRIPE_API_VERSION = "2025-08-27.basil" as const;

const globalForStripe = globalThis as unknown as {
  __sebavioStripe?: Stripe;
};

export function getStripeClient(): Stripe {
  if (globalForStripe.__sebavioStripe) {
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
  return client;
}

export { STRIPE_API_VERSION };
