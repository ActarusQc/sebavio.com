import "server-only";

import type Stripe from "stripe";
import { z } from "zod";

import { AppError } from "@/lib/errors";

import { getStripeClient } from "./client";
import { getStripeMode } from "./config";
import {
  StripeModeMismatchError,
  StripeObjectNotFoundError,
  StripeSebavioProductError,
} from "./errors";
import { retrieveSebavioProduct } from "./product-service";
import {
  buildSebavioMetadata,
  buildSebavioOneTimeMetadata,
  getSebavioPlanId,
  getSebavioStripeMode,
  isSebavioAppMetadata,
} from "./sebavio-metadata";
import { assertModeConsistency, expandId } from "./utils";

export type CreateSebavioPriceInput = {
  productId: string;
  planId: string;
  unitAmount: number;
  currency: string;
  interval: "day" | "week" | "month" | "year";
  intervalCount: number;
  idempotencyKey: string;
};

export type CreateSebavioOneTimePriceInput = {
  productId: string;
  planId: string;
  planSlug: string;
  unitAmount: number;
  currency: string;
  accessDurationDays: number;
  idempotencyKey: string;
};

const planIdSchema = z.string().uuid();

function assertValidCreatePriceInput(input: CreateSebavioPriceInput): void {
  if (!input.productId || input.productId.trim() === "") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Identifiant produit invalide.",
      400,
    );
  }

  const planParsed = planIdSchema.safeParse(input.planId);
  if (!planParsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Identifiant de forfait invalide.",
      400,
    );
  }

  if (
    typeof input.unitAmount !== "number" ||
    !Number.isInteger(input.unitAmount) ||
    input.unitAmount < 0
  ) {
    throw new AppError("VALIDATION_ERROR", "Montant invalide.", 400);
  }

  if (
    typeof input.currency !== "string" ||
    input.currency.length === 0 ||
    input.currency !== input.currency.toLowerCase()
  ) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Devise invalide (minuscules non vides requis).",
      400,
    );
  }

  if (
    typeof input.intervalCount !== "number" ||
    !Number.isInteger(input.intervalCount) ||
    input.intervalCount <= 0
  ) {
    throw new AppError(
      "VALIDATION_ERROR",
      "interval_count invalide (entier > 0 requis).",
      400,
    );
  }
}

function assertValidCreateOneTimePriceInput(
  input: CreateSebavioOneTimePriceInput,
): void {
  if (!input.productId || input.productId.trim() === "") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Identifiant produit invalide.",
      400,
    );
  }

  const planParsed = planIdSchema.safeParse(input.planId);
  if (!planParsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Identifiant de forfait invalide.",
      400,
    );
  }

  if (!input.planSlug || input.planSlug.trim() === "") {
    throw new AppError("VALIDATION_ERROR", "Slug de forfait invalide.", 400);
  }

  if (
    typeof input.unitAmount !== "number" ||
    !Number.isInteger(input.unitAmount) ||
    input.unitAmount < 0
  ) {
    throw new AppError("VALIDATION_ERROR", "Montant invalide.", 400);
  }

  if (
    typeof input.currency !== "string" ||
    input.currency.length === 0 ||
    input.currency !== input.currency.toLowerCase()
  ) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Devise invalide (minuscules non vides requis).",
      400,
    );
  }

  if (
    typeof input.accessDurationDays !== "number" ||
    !Number.isInteger(input.accessDurationDays) ||
    input.accessDurationDays <= 0
  ) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Durée d'accès invalide (entier > 0 requis).",
      400,
    );
  }
}

function assertSebavioPriceMetadata(
  price: Stripe.Price,
  mode: ReturnType<typeof getStripeMode>,
  options?: { expectedPlanId?: string },
): void {
  if (!isSebavioAppMetadata(price.metadata)) {
    throw new StripeSebavioProductError(
      "Price non géré par Sebavio (métadonnée sebavio_app manquante ou invalide).",
    );
  }

  const metaMode = getSebavioStripeMode(price.metadata);
  if (metaMode !== mode) {
    throw new StripeModeMismatchError(
      `Incohérence de mode : métadonnée sebavio_stripe_mode=${metaMode ?? "absent"} vs STRIPE_MODE=${mode}.`,
    );
  }

  if (options?.expectedPlanId) {
    const planId = getSebavioPlanId(price.metadata);
    if (planId !== options.expectedPlanId) {
      throw new StripeSebavioProductError("Price rattaché à un autre forfait.");
    }
  }
}

/**
 * Pagination manuelle Stripe (`has_more` / `starting_after`) — toutes les pages.
 */
async function listAllPrices(
  params: Stripe.PriceListParams,
): Promise<Stripe.Price[]> {
  const stripe = getStripeClient();
  const items: Stripe.Price[] = [];
  let startingAfter: string | undefined;

  for (;;) {
    const page = await stripe.prices.list({
      ...params,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    items.push(...page.data);
    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1]!.id;
  }

  return items;
}

export async function createSebavioPrice(
  input: CreateSebavioPriceInput,
): Promise<Stripe.Price> {
  assertValidCreatePriceInput(input);

  const mode = getStripeMode();
  await retrieveSebavioProduct(input.productId, {
    expectedPlanId: input.planId,
  });

  const stripe = getStripeClient();
  const price = await stripe.prices.create(
    {
      product: input.productId,
      unit_amount: input.unitAmount,
      currency: input.currency,
      recurring: {
        interval: input.interval,
        interval_count: input.intervalCount,
      },
      metadata: buildSebavioMetadata(input.planId, mode),
    },
    { idempotencyKey: input.idempotencyKey },
  );

  assertModeConsistency(price.livemode, mode);
  return price;
}

/**
 * Crée un Price Stripe one-time (sans `recurring`) pour le Pass temporaire.
 */
export async function createSebavioOneTimePrice(
  input: CreateSebavioOneTimePriceInput,
): Promise<Stripe.Price> {
  assertValidCreateOneTimePriceInput(input);

  const mode = getStripeMode();
  await retrieveSebavioProduct(input.productId, {
    expectedPlanId: input.planId,
  });

  const stripe = getStripeClient();
  const price = await stripe.prices.create(
    {
      product: input.productId,
      unit_amount: input.unitAmount,
      currency: input.currency,
      metadata: buildSebavioOneTimeMetadata(input.planId, mode, {
        planSlug: input.planSlug,
        accessDurationDays: input.accessDurationDays,
        durationDays: input.accessDurationDays,
      }),
    },
    { idempotencyKey: input.idempotencyKey },
  );

  assertModeConsistency(price.livemode, mode);
  return price;
}

export async function retrieveSebavioPrice(
  priceId: string,
  options?: { expectedPlanId?: string },
): Promise<Stripe.Price> {
  const mode = getStripeMode();
  const stripe = getStripeClient();

  let price: Stripe.Price;
  try {
    price = await stripe.prices.retrieve(priceId);
  } catch {
    throw new StripeObjectNotFoundError("Price introuvable.");
  }

  assertModeConsistency(price.livemode, mode);
  assertSebavioPriceMetadata(price, mode, options);

  const productId = expandId(price.product);
  if (!productId) {
    throw new StripeObjectNotFoundError(
      "Price introuvable (produit manquant).",
    );
  }

  return price;
}

export async function deactivateStripePrice(
  priceId: string,
): Promise<Stripe.Price> {
  const mode = getStripeMode();
  await retrieveSebavioPrice(priceId);

  const stripe = getStripeClient();
  const updated = await stripe.prices.update(priceId, { active: false });
  assertModeConsistency(updated.livemode, mode);
  return updated;
}

export async function listPricesForProduct(
  productId: string,
  options?: { includeInactive?: boolean },
): Promise<Stripe.Price[]> {
  // Spec : toujours actifs + inactifs pour sync. `options` réservé pour cohérence d'API.
  void options;

  const mode = getStripeMode();
  await retrieveSebavioProduct(productId);

  // Toujours lister actifs + inactifs (sync) — pas de filtre `active`.
  const all = await listAllPrices({ product: productId });

  const verified = all.filter((price) => {
    try {
      assertModeConsistency(price.livemode, mode);
      return true;
    } catch {
      return false;
    }
  });

  return verified.sort((a, b) => {
    if (a.created !== b.created) return a.created - b.created;
    return a.id.localeCompare(b.id);
  });
}
