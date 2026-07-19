import "server-only";

import { prisma } from "@/lib/prisma";

import { getStripeClient } from "./client";
import { getStripeMode } from "./config";
import { StripeObjectNotFoundError } from "./errors";
import { syncStripePaymentIntent } from "./sync-service";

export async function getLocalPaymentById(id: string) {
  const mode = getStripeMode();
  return prisma.stripePayment.findFirst({
    where: { id, stripeMode: mode },
  });
}

export async function getLocalPaymentByStripeId(stripePaymentIntentId: string) {
  const mode = getStripeMode();
  return prisma.stripePayment.findUnique({
    where: {
      stripePaymentIntentId_stripeMode: {
        stripePaymentIntentId,
        stripeMode: mode,
      },
    },
  });
}

export async function fetchAndSyncPaymentIntent(stripePaymentIntentId: string) {
  return syncStripePaymentIntent(stripePaymentIntentId);
}

export async function listFailedPayments(limit = 50) {
  const mode = getStripeMode();
  return prisma.stripePayment.findMany({
    where: {
      stripeMode: mode,
      status: { in: ["requires_payment_method", "canceled"] },
      OR: [
        { failureCode: { not: null } },
        { status: "requires_payment_method" },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
}

export async function retrieveStripePaymentIntent(
  stripePaymentIntentId: string,
) {
  const stripe = getStripeClient();
  try {
    return await stripe.paymentIntents.retrieve(stripePaymentIntentId, {
      expand: ["latest_charge", "payment_method"],
    });
  } catch {
    throw new StripeObjectNotFoundError("PaymentIntent Stripe introuvable.");
  }
}
