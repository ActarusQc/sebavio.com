import "server-only";

import { prisma } from "@/lib/prisma";

import { getStripeClient } from "./client";
import { getStripeMode } from "./config";
import {
  StripeObjectNotFoundError,
  StripeRefundNotAllowedError,
} from "./errors";
import { syncStripePaymentIntent, syncStripeRefund } from "./sync-service";

export type CreateRefundInput = {
  stripePaymentIntentId: string;
  amountCents?: number;
  /** Raison Stripe : duplicate | fraudulent | requested_by_customer */
  stripeReason?: "duplicate" | "fraudulent" | "requested_by_customer";
  adminReason: string;
  createdByAdminId: string;
  idempotencyKey: string;
};

const REFUNDABLE_STATUSES = new Set(["succeeded"]);

export async function createRefund(input: CreateRefundInput) {
  const reason = input.adminReason?.trim();
  if (!reason || reason.length < 3) {
    throw new StripeRefundNotAllowedError(
      "Une justification administrative est obligatoire.",
    );
  }

  const payment = await syncStripePaymentIntent(input.stripePaymentIntentId);
  if (!REFUNDABLE_STATUSES.has(payment.status)) {
    throw new StripeRefundNotAllowedError(
      `Paiement non remboursable (statut « ${payment.status} »).`,
    );
  }

  const refundable = payment.amountReceived - payment.amountRefunded;
  if (refundable <= 0) {
    throw new StripeRefundNotAllowedError(
      "Ce paiement est déjà entièrement remboursé.",
    );
  }

  const amount = input.amountCents ?? refundable;
  if (!Number.isInteger(amount) || amount <= 0 || amount > refundable) {
    throw new StripeRefundNotAllowedError(
      `Montant invalide (max ${refundable} cents).`,
    );
  }

  const stripe = getStripeClient();
  let refund;
  try {
    refund = await stripe.refunds.create(
      {
        payment_intent: input.stripePaymentIntentId,
        amount,
        reason: input.stripeReason,
        metadata: {
          sebavioAdminUserId: input.createdByAdminId,
        },
      },
      { idempotencyKey: input.idempotencyKey },
    );
  } catch {
    throw new StripeRefundNotAllowedError(
      "Le remboursement a été refusé par Stripe.",
    );
  }

  const synced = await syncStripeRefund(refund.id, {
    adminReason: reason,
    createdByAdminId: input.createdByAdminId,
  });
  await syncStripePaymentIntent(input.stripePaymentIntentId);
  return synced;
}

export async function getLocalRefundById(id: string) {
  const mode = getStripeMode();
  return prisma.stripeRefund.findFirst({
    where: { id, stripeMode: mode },
  });
}

export async function fetchAndSyncRefund(stripeRefundId: string) {
  return syncStripeRefund(stripeRefundId);
}

export async function retrieveStripeRefund(stripeRefundId: string) {
  const stripe = getStripeClient();
  try {
    return await stripe.refunds.retrieve(stripeRefundId);
  } catch {
    throw new StripeObjectNotFoundError("Remboursement Stripe introuvable.");
  }
}
