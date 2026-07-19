import "server-only";

import { prisma } from "@/lib/prisma";

import { getStripeClient } from "./client";
import { getStripeMode } from "./config";
import { StripeObjectNotFoundError, StripeSyncError } from "./errors";
import { syncStripeCustomer } from "./sync-service";

/**
 * Retourne le client Stripe local actif, ou le crée de façon idempotente.
 */
export async function getOrCreateStripeCustomer(userId: string) {
  const mode = getStripeMode();
  const existing = await prisma.stripeCustomer.findFirst({
    where: { userId, stripeMode: mode, deletedAt: null },
  });

  const stripe = getStripeClient();

  if (existing) {
    try {
      await stripe.customers.retrieve(existing.stripeCustomerId);
      return existing;
    } catch {
      await prisma.stripeCustomer.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });
    }
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: {
      profile: { select: { firstName: true, lastName: true } },
    },
  });
  if (!user) {
    throw new StripeObjectNotFoundError("Utilisateur introuvable.");
  }

  const name = [user.profile?.firstName, user.profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  let customer;
  try {
    customer = await stripe.customers.create(
      {
        email: user.email,
        name: name || undefined,
        metadata: {
          sebavioUserId: userId,
        },
      },
      {
        idempotencyKey: `sebavio-customer-${userId}-${mode}`,
      },
    );
  } catch {
    throw new StripeSyncError("Impossible de créer le client Stripe.");
  }

  try {
    return await syncStripeCustomer(customer.id, { userId });
  } catch (error) {
    // Création Stripe OK mais projection locale en échec : retenter via retrieve
    try {
      return await syncStripeCustomer(customer.id, { userId });
    } catch {
      throw error instanceof StripeSyncError
        ? error
        : new StripeSyncError(
            "Client Stripe créé, mais l'enregistrement local a échoué.",
          );
    }
  }
}

export async function findLocalStripeCustomerByStripeId(
  stripeCustomerId: string,
) {
  const mode = getStripeMode();
  return prisma.stripeCustomer.findFirst({
    where: {
      stripeCustomerId,
      stripeMode: mode,
      deletedAt: null,
    },
  });
}
