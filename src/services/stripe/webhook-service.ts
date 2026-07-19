import "server-only";

import { createHash, randomUUID } from "crypto";

import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";

import { getStripeClient } from "./client";
import { getStripeMode, loadStripeConfig } from "./config";
import {
  StripeWebhookAlreadyProcessingError,
  StripeWebhookSignatureError,
} from "./errors";
import { sanitizeStripeMessage } from "./mask";
import {
  syncStripeCustomer,
  syncStripeInvoice,
  syncStripePaymentIntent,
  syncStripeRefund,
  syncStripeSubscription,
} from "./sync-service";
import { expandId } from "./utils";

export type WebhookProcessResult = {
  status: "processed" | "ignored" | "duplicate" | "failed";
  eventId: string;
  type: string;
};

function hashPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody, "utf8").digest("hex");
}

function extractObjectId(event: Stripe.Event): string | null {
  const obj = event.data?.object as { id?: string } | undefined;
  return obj?.id ?? null;
}

/**
 * Vérifie la signature et retourne l'événement Stripe.
 */
export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): Stripe.Event {
  if (!signatureHeader) {
    throw new StripeWebhookSignatureError("En-tête Stripe-Signature manquant.");
  }
  const { webhookSecret } = loadStripeConfig();
  const stripe = getStripeClient();
  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      webhookSecret,
    );
  } catch {
    throw new StripeWebhookSignatureError();
  }
}

type ClaimResult =
  | { kind: "claim"; recordId: string }
  | { kind: "duplicate"; status: string }
  | { kind: "busy" };

/**
 * Insert ou revendique l'événement (received → processing).
 */
async function claimWebhookEvent(
  event: Stripe.Event,
  payloadHash: string,
): Promise<ClaimResult> {
  const mode = getStripeMode();
  const stripeEventId = event.id;

  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: {
      stripeEventId_stripeMode: { stripeEventId, stripeMode: mode },
    },
  });

  if (existing) {
    if (existing.status === "processed" || existing.status === "ignored") {
      return { kind: "duplicate", status: existing.status };
    }
    if (existing.status === "processing") {
      return { kind: "busy" };
    }
    // received ou failed → reprendre
    const updated = await prisma.stripeWebhookEvent.updateMany({
      where: {
        id: existing.id,
        status: { in: ["received", "failed"] },
      },
      data: {
        status: "processing",
        processingStartedAt: new Date(),
        attemptCount: { increment: 1 },
        payloadHash,
        type: event.type,
        apiVersion: event.api_version,
        objectId: extractObjectId(event),
      },
    });
    if (updated.count === 0) {
      return { kind: "busy" };
    }
    return { kind: "claim", recordId: existing.id };
  }

  try {
    const created = await prisma.stripeWebhookEvent.create({
      data: {
        id: randomUUID(),
        stripeEventId,
        stripeMode: mode,
        type: event.type,
        apiVersion: event.api_version,
        objectId: extractObjectId(event),
        status: "processing",
        attemptCount: 1,
        receivedAt: new Date(),
        processingStartedAt: new Date(),
        payloadHash,
      },
    });
    return { kind: "claim", recordId: created.id };
  } catch {
    // Course : un autre worker a créé la ligne
    const again = await prisma.stripeWebhookEvent.findUnique({
      where: {
        stripeEventId_stripeMode: { stripeEventId, stripeMode: mode },
      },
    });
    if (again && (again.status === "processed" || again.status === "ignored")) {
      return { kind: "duplicate", status: again.status };
    }
    return { kind: "busy" };
  }
}

async function markWebhookResult(
  recordId: string,
  status: "processed" | "ignored" | "failed",
  error?: { code?: string; message?: string },
) {
  await prisma.stripeWebhookEvent.update({
    where: { id: recordId },
    data: {
      status,
      processedAt: status === "failed" ? null : new Date(),
      lastErrorCode: error?.code ?? null,
      lastErrorSafe: error?.message
        ? sanitizeStripeMessage(error.message).slice(0, 1000)
        : null,
      nextRetryAt:
        status === "failed" ? new Date(Date.now() + 5 * 60 * 1000) : null,
    },
  });
}

async function handleEvent(
  event: Stripe.Event,
): Promise<"processed" | "ignored"> {
  const opts = { eventCreated: event.created };
  const obj = event.data.object as { id?: string };
  const id = obj?.id;

  switch (event.type) {
    case "customer.created":
    case "customer.updated":
      if (id) await syncStripeCustomer(id, opts);
      return "processed";
    case "customer.deleted":
      if (id) await syncStripeCustomer(id, opts);
      return "processed";

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      if (id) await syncStripeSubscription(id, opts);
      return "processed";

    case "invoice.created":
    case "invoice.finalized":
    case "invoice.paid":
    case "invoice.payment_failed":
    case "invoice.payment_action_required":
    case "invoice.voided":
    case "invoice.marked_uncollectible":
      if (id) await syncStripeInvoice(id, opts);
      return "processed";

    case "payment_intent.created":
    case "payment_intent.processing":
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
    case "payment_intent.canceled":
      if (id) await syncStripePaymentIntent(id, opts);
      return "processed";

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const piId = expandId(charge.payment_intent);
      if (piId) await syncStripePaymentIntent(piId, opts);
      const refunds = charge.refunds?.data ?? [];
      for (const r of refunds) {
        await syncStripeRefund(r.id, opts);
      }
      return "processed";
    }

    case "refund.created":
    case "refund.updated":
    case "refund.failed":
      if (id) await syncStripeRefund(id, opts);
      return "processed";

    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = expandId(session.customer);
      if (customerId) await syncStripeCustomer(customerId, opts);
      const subId = expandId(session.subscription);
      if (subId) await syncStripeSubscription(subId, opts);
      const piId = expandId(session.payment_intent);
      if (piId) await syncStripePaymentIntent(piId, opts);
      const invId = expandId(session.invoice);
      if (invId) await syncStripeInvoice(invId, opts);
      return "processed";
    }

    default:
      return "ignored";
  }
}

/**
 * Point d'entrée principal : vérifier, claim, traiter, finaliser.
 */
export async function processStripeWebhook(
  rawBody: string,
  signatureHeader: string | null,
): Promise<WebhookProcessResult> {
  const event = verifyStripeWebhookSignature(rawBody, signatureHeader);
  const payloadHash = hashPayload(rawBody);
  const claim = await claimWebhookEvent(event, payloadHash);

  if (claim.kind === "duplicate") {
    return {
      status: "duplicate",
      eventId: event.id,
      type: event.type,
    };
  }
  if (claim.kind === "busy") {
    throw new StripeWebhookAlreadyProcessingError();
  }

  try {
    const outcome = await handleEvent(event);
    await markWebhookResult(claim.recordId, outcome);
    return {
      status: outcome,
      eventId: event.id,
      type: event.type,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur de traitement webhook";
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: unknown }).code)
        : "STRIPE_WEBHOOK";
    await markWebhookResult(claim.recordId, "failed", {
      code,
      message,
    });
    throw error;
  }
}

/**
 * Relance un événement en échec (re-fetch objet via handlers).
 */
export async function retryFailedEvent(localEventId: string) {
  const mode = getStripeMode();
  const record = await prisma.stripeWebhookEvent.findFirst({
    where: { id: localEventId, stripeMode: mode },
  });
  if (!record) {
    throw new StripeWebhookSignatureError(
      "Événement webhook local introuvable.",
    );
  }
  if (record.status === "processing") {
    throw new StripeWebhookAlreadyProcessingError();
  }
  if (record.status === "processed" || record.status === "ignored") {
    return {
      status: "duplicate" as const,
      eventId: record.stripeEventId,
      type: record.type,
    };
  }

  const stripe = getStripeClient();
  const event = await stripe.events.retrieve(record.stripeEventId);

  const claimed = await prisma.stripeWebhookEvent.updateMany({
    where: {
      id: record.id,
      status: { in: ["failed", "received"] },
    },
    data: {
      status: "processing",
      processingStartedAt: new Date(),
      attemptCount: { increment: 1 },
    },
  });
  if (claimed.count === 0) {
    throw new StripeWebhookAlreadyProcessingError();
  }

  try {
    const outcome = await handleEvent(event);
    await markWebhookResult(record.id, outcome);
    return {
      status: outcome,
      eventId: event.id,
      type: event.type,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur de relance webhook";
    await markWebhookResult(record.id, "failed", {
      code: "STRIPE_WEBHOOK_RETRY",
      message,
    });
    throw error;
  }
}
