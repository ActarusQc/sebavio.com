"use server";

import { requireActiveUser } from "@/features/auth";
import { OFFICIAL_PLAN_SLUGS } from "@/features/subscriptions/lib/official-plan-slugs";
import { isAppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  createOneTimePassCheckoutSession,
  createSubscriptionCheckoutSession,
  getStripeMode,
} from "@/services/stripe";

export type CheckoutActionResult =
  { ok: true; url: string } | { ok: false; message: string };

type CheckoutActionInput = {
  returnPath?: string;
  tripId?: string;
};

function appBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const base = raw && raw.length > 0 ? raw : "http://localhost:3050";
  return base.replace(/\/$/, "");
}

/** Chemins relatifs internes uniquement (anti open-redirect). */
function sanitizeReturnPath(path: string | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;
  return trimmed;
}

function sanitizeTripId(tripId: string | undefined): string | null {
  if (!tripId) return null;
  const trimmed = tripId.trim();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      trimmed,
    )
  ) {
    return null;
  }
  return trimmed;
}

function buildSuccessUrl(tripId: string | null): string {
  const base = appBaseUrl();
  if (tripId) {
    return `${base}/dashboard/trips/${tripId}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  }
  return `${base}/dashboard/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
}

function buildCancelUrl(returnPath: string | null): string {
  const base = appBaseUrl();
  return returnPath ? `${base}${returnPath}` : `${base}/pricing`;
}

async function findOfficialPlanId(slug: string): Promise<string | null> {
  const mode = getStripeMode();
  const plan = await prisma.plan.findUnique({
    where: {
      internalName_stripeMode: {
        internalName: slug,
        stripeMode: mode,
      },
    },
    select: { id: true },
  });
  return plan?.id ?? null;
}

/**
 * Démarre un Checkout Stripe Pass 30 jours (paiement unique).
 * N’accorde aucun accès — confirmation via webhook uniquement.
 */
export async function startPassCheckoutAction(
  input: CheckoutActionInput = {},
): Promise<CheckoutActionResult> {
  try {
    const user = await requireActiveUser();
    const planId = await findOfficialPlanId(OFFICIAL_PLAN_SLUGS.PASS_30_JOURS);
    if (!planId) {
      return {
        ok: false,
        message: "Le Pass 30 jours n’est pas disponible pour le moment.",
      };
    }

    const tripId = sanitizeTripId(input.tripId);
    const returnPath = sanitizeReturnPath(input.returnPath);

    const session = await createOneTimePassCheckoutSession({
      userId: user.id,
      planId,
      successUrl: buildSuccessUrl(tripId),
      cancelUrl: buildCancelUrl(
        returnPath ?? (tripId ? `/dashboard/trips/${tripId}` : null),
      ),
      returnContext: {
        ...(tripId ? { tripId } : {}),
        ...(returnPath ? { returnPath } : {}),
      },
    });

    return { ok: true, url: session.url };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return {
      ok: false,
      message: "Impossible de démarrer le paiement Pass pour le moment.",
    };
  }
}

/**
 * Démarre un Checkout Stripe Sebavio Plus (abonnement annuel).
 * N’accorde aucun accès — confirmation via webhook uniquement.
 */
export async function startPlusCheckoutAction(
  input: Omit<CheckoutActionInput, "tripId"> & { tripId?: string } = {},
): Promise<CheckoutActionResult> {
  try {
    const user = await requireActiveUser();
    const planId = await findOfficialPlanId(OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS);
    if (!planId) {
      return {
        ok: false,
        message: "Sebavio Plus n’est pas disponible pour le moment.",
      };
    }

    const tripId = sanitizeTripId(input.tripId);
    const returnPath = sanitizeReturnPath(input.returnPath);

    const session = await createSubscriptionCheckoutSession({
      userId: user.id,
      planId,
      successUrl: buildSuccessUrl(tripId),
      cancelUrl: buildCancelUrl(
        returnPath ?? (tripId ? `/dashboard/trips/${tripId}` : null),
      ),
    });

    return { ok: true, url: session.url };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return {
      ok: false,
      message: "Impossible de démarrer le paiement Plus pour le moment.",
    };
  }
}
