import "server-only";

import type Stripe from "stripe";

import { getStripeClient } from "./client";
import { getStripeMode } from "./config";
import {
  StripeModeMismatchError,
  StripeObjectNotFoundError,
  StripeSebavioProductError,
} from "./errors";
import {
  META_APP,
  META_PLAN_ID,
  META_STRIPE_MODE,
  SEBAVIO_APP,
  buildSebavioMetadata,
  getSebavioPlanId,
  getSebavioStripeMode,
  isSebavioAppMetadata,
} from "./sebavio-metadata";
import { assertModeConsistency } from "./utils";

export type CreateSebavioProductInput = {
  name: string;
  description?: string | null;
  planId: string;
  idempotencyKey: string;
};

export type UpdateSebavioProductMetadataInput = {
  name?: string;
  description?: string | null;
};

function assertSebavioProductMetadata(
  product: Stripe.Product,
  mode: ReturnType<typeof getStripeMode>,
  options?: { expectedPlanId?: string },
): void {
  if (!isSebavioAppMetadata(product.metadata)) {
    throw new StripeSebavioProductError(
      "Produit non géré par Sebavio (métadonnée sebavio_app manquante ou invalide).",
    );
  }

  const metaMode = getSebavioStripeMode(product.metadata);
  if (metaMode !== mode) {
    throw new StripeModeMismatchError(
      `Incohérence de mode : métadonnée sebavio_stripe_mode=${metaMode ?? "absent"} vs STRIPE_MODE=${mode}.`,
    );
  }

  if (options?.expectedPlanId) {
    const planId = getSebavioPlanId(product.metadata);
    if (planId !== options.expectedPlanId) {
      throw new StripeSebavioProductError(
        "Produit rattaché à un autre forfait.",
      );
    }
  }
}

/**
 * Pagination manuelle Stripe (`has_more` / `starting_after`) — toutes les pages.
 */
async function listAllProducts(
  params: Stripe.ProductListParams,
): Promise<Stripe.Product[]> {
  const stripe = getStripeClient();
  const items: Stripe.Product[] = [];
  let startingAfter: string | undefined;

  for (;;) {
    const page = await stripe.products.list({
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

export async function createSebavioProduct(
  input: CreateSebavioProductInput,
): Promise<Stripe.Product> {
  const mode = getStripeMode();
  const stripe = getStripeClient();

  const createParams: Stripe.ProductCreateParams = {
    name: input.name,
    active: true,
    metadata: buildSebavioMetadata(input.planId, mode),
  };
  if (input.description !== undefined) {
    createParams.description = input.description ?? "";
  }

  const product = await stripe.products.create(createParams, {
    idempotencyKey: input.idempotencyKey,
  });

  assertModeConsistency(product.livemode, mode);
  return product;
}

export async function retrieveSebavioProduct(
  productId: string,
  options?: { expectedPlanId?: string },
): Promise<Stripe.Product> {
  const mode = getStripeMode();
  const stripe = getStripeClient();

  let product: Stripe.Product | Stripe.DeletedProduct;
  try {
    product = await stripe.products.retrieve(productId);
  } catch {
    throw new StripeObjectNotFoundError("Produit introuvable.");
  }

  if ("deleted" in product && product.deleted) {
    throw new StripeObjectNotFoundError("Produit introuvable.");
  }

  assertModeConsistency(product.livemode, mode);
  assertSebavioProductMetadata(product, mode, options);
  return product;
}

export async function updateSebavioProductMetadata(
  productId: string,
  input: UpdateSebavioProductMetadataInput,
): Promise<Stripe.Product> {
  const mode = getStripeMode();
  const existing = await retrieveSebavioProduct(productId);
  const stripe = getStripeClient();

  const mergedMetadata: Stripe.MetadataParam = {
    ...existing.metadata,
    [META_APP]: SEBAVIO_APP,
    [META_PLAN_ID]: getSebavioPlanId(existing.metadata) ?? "",
    [META_STRIPE_MODE]: mode,
  };

  const updateParams: Stripe.ProductUpdateParams = {
    metadata: mergedMetadata,
  };
  if (input.name !== undefined) {
    updateParams.name = input.name;
  }
  if (input.description !== undefined) {
    updateParams.description = input.description ?? "";
  }

  const updated = await stripe.products.update(productId, updateParams);
  assertModeConsistency(updated.livemode, mode);
  assertSebavioProductMetadata(updated, mode);
  return updated;
}

export async function archiveStripeProduct(
  productId: string,
): Promise<Stripe.Product> {
  const mode = getStripeMode();
  await retrieveSebavioProduct(productId);

  const stripe = getStripeClient();
  const updated = await stripe.products.update(productId, { active: false });
  assertModeConsistency(updated.livemode, mode);
  return updated;
}

export async function listSebavioProducts(options?: {
  includeInactive?: boolean;
}): Promise<Stripe.Product[]> {
  const mode = getStripeMode();
  const listParams: Stripe.ProductListParams = {};
  if (!options?.includeInactive) {
    listParams.active = true;
  }

  const all = await listAllProducts(listParams);

  return all.filter((product) => {
    if (!isSebavioAppMetadata(product.metadata)) return false;
    if (getSebavioStripeMode(product.metadata) !== mode) return false;
    try {
      assertModeConsistency(product.livemode, mode);
    } catch {
      return false;
    }
    return true;
  });
}
