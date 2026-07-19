import "server-only";

import { prisma } from "@/lib/prisma";

import { getStripeClient } from "./client";
import { getStripeMode } from "./config";
import { StripeObjectNotFoundError } from "./errors";
import { syncStripeInvoice } from "./sync-service";

export async function getLocalInvoiceById(id: string) {
  const mode = getStripeMode();
  return prisma.stripeInvoice.findFirst({
    where: { id, stripeMode: mode },
  });
}

export async function getLocalInvoiceByStripeId(stripeInvoiceId: string) {
  const mode = getStripeMode();
  return prisma.stripeInvoice.findUnique({
    where: {
      stripeInvoiceId_stripeMode: { stripeInvoiceId, stripeMode: mode },
    },
  });
}

export async function fetchAndSyncInvoice(stripeInvoiceId: string) {
  return syncStripeInvoice(stripeInvoiceId);
}

export async function retrieveStripeInvoice(stripeInvoiceId: string) {
  const stripe = getStripeClient();
  try {
    return await stripe.invoices.retrieve(stripeInvoiceId);
  } catch {
    throw new StripeObjectNotFoundError("Facture Stripe introuvable.");
  }
}

export async function listOpenInvoices(limit = 50) {
  const mode = getStripeMode();
  return prisma.stripeInvoice.findMany({
    where: {
      stripeMode: mode,
      status: { in: ["open", "draft"] },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
}
