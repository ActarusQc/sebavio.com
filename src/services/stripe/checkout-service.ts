import "server-only";

import { randomUUID } from "crypto";

import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/services/stripe/client";
import { getStripeMode } from "@/services/stripe/config";
import { getOrCreateStripeCustomer } from "@/services/stripe/customer-service";

function resolveSebavioEnvironment(): string {
  const explicit = process.env.SEBAVIO_ENV?.trim().toLowerCase();
  if (
    explicit === "production" ||
    explicit === "prod" ||
    explicit === "staging" ||
    explicit === "preprod" ||
    explicit === "préproduction" ||
    explicit === "development" ||
    explicit === "dev"
  ) {
    if (explicit === "prod") return "production";
    if (explicit === "dev") return "development";
    if (explicit === "preprod" || explicit === "préproduction")
      return "staging";
    return explicit;
  }
  return "development";
}

async function assertCheckoutPlan(planId: string, expectedBillingType: string) {
  const mode = getStripeMode();
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      prices: {
        where: {
          isCurrent: true,
          status: "active",
          billingType: expectedBillingType,
        },
      },
    },
  });

  if (!plan) {
    throw new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404);
  }
  if (plan.stripeMode !== mode) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Incohérence de mode Stripe : forfait=${plan.stripeMode}, serveur=${mode}.`,
      400,
    );
  }
  if (plan.status !== "active") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Ce forfait n'est pas disponible à l'achat.",
      400,
    );
  }
  if (plan.archivedAt) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Ce forfait est archivé et ne peut plus être acheté.",
      400,
    );
  }
  if (!plan.isVisibleOnSignup) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Ce forfait n'est pas visible pour de nouveaux achats.",
      400,
    );
  }
  if (!plan.stripeProductId) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Le forfait n'a pas de produit Stripe valide.",
      400,
    );
  }

  const price = plan.prices[0];
  if (!price) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Aucun prix courant valide pour ce forfait.",
      400,
    );
  }
  if (price.billingType !== expectedBillingType) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Type de facturation incompatible pour ce forfait.",
      400,
    );
  }

  return { plan, price, mode };
}

export type CreateSubscriptionCheckoutInput = {
  userId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
};

export type CreateOneTimePassCheckoutInput = {
  userId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
  returnContext?: Prisma.InputJsonValue;
};

export type CheckoutSessionResult = {
  sessionId: string;
  url: string;
  purchaseId?: string;
};

/**
 * Checkout abonnement (Sebavio Plus) — montant depuis PlanPrice DB uniquement.
 */
export async function createSubscriptionCheckoutSession(
  input: CreateSubscriptionCheckoutInput,
): Promise<CheckoutSessionResult> {
  const { plan, price, mode } = await assertCheckoutPlan(
    input.planId,
    "recurring",
  );

  const customer = await getOrCreateStripeCustomer(input.userId);
  const stripe = getStripeClient();
  const environment = resolveSebavioEnvironment();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    customer: customer.stripeCustomerId,
    line_items: [
      {
        price: price.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.userId,
    metadata: {
      userId: input.userId,
      planId: plan.id,
      planSlug: plan.internalName,
      environment,
      stripeMode: mode,
    },
    subscription_data: {
      metadata: {
        userId: input.userId,
        planId: plan.id,
        planSlug: plan.internalName,
        environment,
      },
      ...(plan.defaultTrialDays != null && plan.defaultTrialDays > 0
        ? { trial_period_days: plan.defaultTrialDays }
        : {}),
    },
  };

  const session = await stripe.checkout.sessions.create(sessionParams, {
    idempotencyKey: `checkout-sub:${input.userId}:${plan.id}:${price.id}`,
  });

  if (!session.url) {
    throw new AppError(
      "STRIPE_001",
      "Impossible de créer la session de paiement Stripe.",
      502,
    );
  }

  return { sessionId: session.id, url: session.url };
}

/**
 * Checkout paiement unique (Pass 30 jours) — crée PlanPurchase pending_payment.
 * Le montant vient exclusivement de PlanPrice.unitAmount (jamais du client).
 */
export async function createOneTimePassCheckoutSession(
  input: CreateOneTimePassCheckoutInput,
): Promise<CheckoutSessionResult> {
  const { plan, price, mode } = await assertCheckoutPlan(
    input.planId,
    "one_time",
  );

  if (price.accessDurationDays == null || price.accessDurationDays <= 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Durée d'accès manquante sur le prix Pass.",
      400,
    );
  }

  const customer = await getOrCreateStripeCustomer(input.userId);
  const purchaseId = randomUUID();
  const environment = resolveSebavioEnvironment();

  await prisma.planPurchase.create({
    data: {
      id: purchaseId,
      userId: input.userId,
      planId: plan.id,
      planPriceId: price.id,
      status: "pending_payment",
      amountCents: price.unitAmount,
      currency: price.currency,
      stripeMode: mode,
      returnContext: input.returnContext ?? undefined,
    },
  });

  const stripe = getStripeClient();

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer: customer.stripeCustomerId,
        line_items: [
          {
            price: price.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        client_reference_id: input.userId,
        metadata: {
          userId: input.userId,
          purchaseId,
          planId: plan.id,
          planSlug: plan.internalName,
          environment,
          stripeMode: mode,
          accessDurationDays: String(price.accessDurationDays),
        },
        payment_intent_data: {
          metadata: {
            userId: input.userId,
            purchaseId,
            planSlug: plan.internalName,
            environment,
          },
        },
      },
      {
        idempotencyKey: `checkout-pass:${purchaseId}`,
      },
    );

    if (!session.url) {
      throw new AppError(
        "STRIPE_001",
        "Impossible de créer la session de paiement Stripe.",
        502,
      );
    }

    await prisma.planPurchase.update({
      where: { id: purchaseId },
      data: { stripeCheckoutSessionId: session.id },
    });

    return {
      sessionId: session.id,
      url: session.url,
      purchaseId,
    };
  } catch (error) {
    await prisma.planPurchase.update({
      where: { id: purchaseId },
      data: { status: "failed" },
    });
    if (error instanceof AppError) throw error;
    throw new AppError(
      "STRIPE_001",
      "Échec de création de la session Checkout Pass.",
      502,
    );
  }
}
