/**
 * Métadonnées Stripe réservées aux produits / prix Sebavio.
 * Module interne — non exporté du barrel stripe.
 */
import type Stripe from "stripe";

import type { StripeMode } from "./config";

export const SEBAVIO_APP = "sebavio" as const;

export const META_APP = "sebavio_app" as const;
export const META_PLAN_ID = "sebavio_plan_id" as const;
export const META_STRIPE_MODE = "sebavio_stripe_mode" as const;

export type SebavioStripeMetadata = {
  [META_APP]: typeof SEBAVIO_APP;
  [META_PLAN_ID]: string;
  [META_STRIPE_MODE]: StripeMode;
};

export function buildSebavioMetadata(
  planId: string,
  mode: StripeMode,
): SebavioStripeMetadata {
  return {
    [META_APP]: SEBAVIO_APP,
    [META_PLAN_ID]: planId,
    [META_STRIPE_MODE]: mode,
  };
}

export function isSebavioAppMetadata(
  metadata: Stripe.Metadata | null | undefined,
): boolean {
  return metadata?.[META_APP] === SEBAVIO_APP;
}

export function getSebavioPlanId(
  metadata: Stripe.Metadata | null | undefined,
): string | undefined {
  const value = metadata?.[META_PLAN_ID];
  return value && value.length > 0 ? value : undefined;
}

export function getSebavioStripeMode(
  metadata: Stripe.Metadata | null | undefined,
): string | undefined {
  const value = metadata?.[META_STRIPE_MODE];
  return value && value.length > 0 ? value : undefined;
}
