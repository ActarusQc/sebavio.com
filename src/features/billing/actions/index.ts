"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requirePermission } from "@/features/auth";
import { isAppError } from "@/lib/errors";
import { writeAdminAuditLog } from "@/features/admin/services/audit-write";
import { assertIdempotencyKey } from "@/features/billing/lib/idempotency";
import { amountMajorFromCents } from "@/features/billing/lib/format";
import {
  cancelLiveConfirmationPhrase,
  isLiveConfirmationValid,
  isStripeLiveMode,
  refundLiveConfirmationPhrase,
} from "@/features/billing/lib/live-confirmation";
import {
  cancelSubscriptionSchema,
  createRefundSchema,
  resumeSubscriptionSchema,
  retryWebhookSchema,
  syncBillingSchema,
} from "@/features/billing/schemas";
import type { BillingActionResult } from "@/features/billing/types";
import { prisma } from "@/lib/prisma";
import {
  cancelAtPeriodEnd,
  cancelImmediately,
  createRefund,
  resumeCancel,
  retryFailedEvent,
  syncStripeCustomer,
  syncStripeInvoice,
  syncStripePaymentIntent,
  syncStripeSubscription,
  syncUserBillingData,
} from "@/services/stripe";

async function actorIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

function revalidateBilling(userId?: string | null): void {
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/webhooks/stripe");
  if (userId) {
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath(`/admin/subscriptions`);
  }
}

function resolveFormData(
  prevOrForm: BillingActionResult | FormData | undefined,
  maybeForm?: FormData,
): FormData {
  if (prevOrForm instanceof FormData) return prevOrForm;
  if (maybeForm instanceof FormData) return maybeForm;
  throw new Error("FormData manquant");
}

export async function cancelSubscriptionAction(
  prevOrForm: BillingActionResult | FormData | undefined,
  maybeForm?: FormData,
): Promise<BillingActionResult> {
  const formData = resolveFormData(prevOrForm, maybeForm);
  try {
    const actor = await requirePermission("billing.subscriptions.cancel");
    const parsed = cancelSubscriptionSchema.safeParse({
      subscriptionId: String(formData.get("subscriptionId") ?? ""),
      mode: String(formData.get("mode") ?? ""),
      reason: String(formData.get("reason") ?? ""),
      confirmation:
        String(formData.get("confirmation") ?? "").trim() || undefined,
      idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    await assertIdempotencyKey(parsed.data.idempotencyKey, "cancel-sub");

    const sub = await prisma.stripeSubscription.findUnique({
      where: { id: parsed.data.subscriptionId },
      include: { user: { select: { email: true } } },
    });
    if (!sub) return { ok: false, message: "Abonnement introuvable" };

    const live = isStripeLiveMode();
    const expected = cancelLiveConfirmationPhrase(sub.user.email);
    if (!isLiveConfirmationValid(expected, parsed.data.confirmation, live)) {
      return {
        ok: false,
        message:
          "Confirmation invalide — tapez exactement la phrase demandée (obligatoire en mode Live)",
      };
    }

    const oldValue = {
      status: sub.status,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      stripeMode: sub.stripeMode,
    };

    if (parsed.data.mode === "immediately") {
      await cancelImmediately(sub.stripeSubscriptionId);
      await writeAdminAuditLog({
        actorUserId: actor.id,
        actorRole: actor.role,
        entity: "stripe_subscription",
        entityId: sub.id,
        action: "STRIPE_SUBSCRIPTION_CANCELED",
        reason: parsed.data.reason,
        oldValue,
        newValue: {
          mode: "immediately",
          userId: sub.userId,
          stripeSubscriptionId: sub.stripeSubscriptionId,
          stripeMode: sub.stripeMode,
        },
        ipAddress: await actorIp(),
      });
      revalidateBilling(sub.userId);
      revalidatePath(`/admin/subscriptions/${sub.id}`);
      return { ok: true, message: "Abonnement annulé immédiatement" };
    }

    await cancelAtPeriodEnd(sub.stripeSubscriptionId);
    await writeAdminAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      entity: "stripe_subscription",
      entityId: sub.id,
      action: "STRIPE_SUBSCRIPTION_CANCEL_SCHEDULED",
      reason: parsed.data.reason,
      oldValue,
      newValue: {
        mode: "at_period_end",
        userId: sub.userId,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        stripeMode: sub.stripeMode,
        currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      },
      ipAddress: await actorIp(),
    });
    revalidateBilling(sub.userId);
    revalidatePath(`/admin/subscriptions/${sub.id}`);
    return { ok: true, message: "Annulation planifiée en fin de période" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}

export async function resumeSubscriptionAction(
  prevOrForm: BillingActionResult | FormData | undefined,
  maybeForm?: FormData,
): Promise<BillingActionResult> {
  const formData = resolveFormData(prevOrForm, maybeForm);
  try {
    const actor = await requirePermission("billing.subscriptions.resume");
    const parsed = resumeSubscriptionSchema.safeParse({
      subscriptionId: String(formData.get("subscriptionId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
      idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    await assertIdempotencyKey(parsed.data.idempotencyKey, "resume-sub");

    const sub = await prisma.stripeSubscription.findUnique({
      where: { id: parsed.data.subscriptionId },
    });
    if (!sub) return { ok: false, message: "Abonnement introuvable" };

    await resumeCancel(sub.stripeSubscriptionId);
    await writeAdminAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      entity: "stripe_subscription",
      entityId: sub.id,
      action: "STRIPE_SUBSCRIPTION_RESUMED",
      reason: parsed.data.reason,
      oldValue: { cancelAtPeriodEnd: sub.cancelAtPeriodEnd },
      newValue: {
        userId: sub.userId,
        stripeSubscriptionId: sub.stripeSubscriptionId,
        stripeMode: sub.stripeMode,
      },
      ipAddress: await actorIp(),
    });
    revalidateBilling(sub.userId);
    revalidatePath(`/admin/subscriptions/${sub.id}`);
    return { ok: true, message: "Annulation retirée — abonnement repris" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}

export async function createRefundAction(
  prevOrForm: BillingActionResult | FormData | undefined,
  maybeForm?: FormData,
): Promise<BillingActionResult> {
  const formData = resolveFormData(prevOrForm, maybeForm);
  try {
    const actor = await requirePermission("billing.refunds.create");
    const fullRaw = String(formData.get("full") ?? "");
    const amountRaw = String(formData.get("amountCents") ?? "").trim();
    const parsed = createRefundSchema.safeParse({
      paymentId: String(formData.get("paymentId") ?? ""),
      amountCents: amountRaw ? Number(amountRaw) : undefined,
      full: fullRaw === "true" || fullRaw === "1",
      stripeReason: String(formData.get("stripeReason") ?? "") || undefined,
      reason: String(formData.get("reason") ?? ""),
      confirmation:
        String(formData.get("confirmation") ?? "").trim() || undefined,
      idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    await assertIdempotencyKey(parsed.data.idempotencyKey, "refund");

    const payment = await prisma.stripePayment.findUnique({
      where: { id: parsed.data.paymentId },
    });
    if (!payment) return { ok: false, message: "Paiement introuvable" };

    const refundable = Math.max(
      0,
      payment.amountReceived - payment.amountRefunded,
    );
    const amountCents = parsed.data.full
      ? refundable
      : (parsed.data.amountCents ?? refundable);

    const live = isStripeLiveMode();
    const expected = refundLiveConfirmationPhrase(
      amountMajorFromCents(amountCents),
      payment.currency,
    );
    if (!isLiveConfirmationValid(expected, parsed.data.confirmation, live)) {
      return {
        ok: false,
        message:
          "Confirmation invalide — tapez exactement la phrase demandée (obligatoire en mode Live)",
      };
    }

    try {
      await createRefund({
        stripePaymentIntentId: payment.stripePaymentIntentId,
        amountCents,
        stripeReason: parsed.data.stripeReason,
        adminReason: parsed.data.reason,
        createdByAdminId: actor.id,
        idempotencyKey: parsed.data.idempotencyKey,
      });
      await writeAdminAuditLog({
        actorUserId: actor.id,
        actorRole: actor.role,
        entity: "stripe_payment",
        entityId: payment.id,
        action: "STRIPE_REFUND_CREATED",
        reason: parsed.data.reason,
        oldValue: {
          amountRefunded: payment.amountRefunded,
          status: payment.status,
        },
        newValue: {
          amountCents,
          currency: payment.currency,
          userId: payment.userId,
          stripePaymentIntentId: payment.stripePaymentIntentId,
          stripeMode: payment.stripeMode,
          stripeReason: parsed.data.stripeReason ?? null,
        },
        ipAddress: await actorIp(),
      });
      revalidateBilling(payment.userId);
      return { ok: true, message: "Remboursement créé" };
    } catch (error) {
      await writeAdminAuditLog({
        actorUserId: actor.id,
        actorRole: actor.role,
        entity: "stripe_payment",
        entityId: payment.id,
        action: "STRIPE_REFUND_FAILED",
        reason: parsed.data.reason,
        newValue: {
          amountCents,
          currency: payment.currency,
          error: isAppError(error) ? error.message : "Erreur",
        },
        ipAddress: await actorIp(),
      });
      throw error;
    }
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}

export async function syncCustomerAction(
  prevOrForm: BillingActionResult | FormData | undefined,
  maybeForm?: FormData,
): Promise<BillingActionResult> {
  return syncBillingAction(prevOrForm, maybeForm, "customer");
}

export async function syncSubscriptionAction(
  prevOrForm: BillingActionResult | FormData | undefined,
  maybeForm?: FormData,
): Promise<BillingActionResult> {
  return syncBillingAction(prevOrForm, maybeForm, "subscription");
}

export async function syncPaymentAction(
  prevOrForm: BillingActionResult | FormData | undefined,
  maybeForm?: FormData,
): Promise<BillingActionResult> {
  return syncBillingAction(prevOrForm, maybeForm, "payment");
}

async function syncBillingAction(
  prevOrForm: BillingActionResult | FormData | undefined,
  maybeForm?: FormData,
  forcedType?: "customer" | "subscription" | "payment" | "invoice" | "user",
): Promise<BillingActionResult> {
  const formData = resolveFormData(prevOrForm, maybeForm);
  try {
    const actor = await requirePermission("billing.sync");
    const parsed = syncBillingSchema.safeParse({
      targetType: forcedType ?? String(formData.get("targetType") ?? ""),
      targetId: String(formData.get("targetId") ?? ""),
      reason: String(formData.get("reason") ?? "").trim() || undefined,
      idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    await assertIdempotencyKey(
      parsed.data.idempotencyKey,
      `sync-${parsed.data.targetType}`,
    );

    let auditAction = "STRIPE_CUSTOMER_SYNCED";
    let entity = "stripe_customer";
    let userId: string | null = null;

    switch (parsed.data.targetType) {
      case "customer": {
        const local = await prisma.stripeCustomer.findFirst({
          where: {
            OR: [
              { id: parsed.data.targetId },
              { stripeCustomerId: parsed.data.targetId },
            ],
          },
        });
        const stripeId = local?.stripeCustomerId ?? parsed.data.targetId;
        await syncStripeCustomer(stripeId);
        userId = local?.userId ?? null;
        auditAction = "STRIPE_CUSTOMER_SYNCED";
        entity = "stripe_customer";
        break;
      }
      case "subscription": {
        const local = await prisma.stripeSubscription.findFirst({
          where: {
            OR: [
              { id: parsed.data.targetId },
              { stripeSubscriptionId: parsed.data.targetId },
            ],
          },
        });
        const stripeId = local?.stripeSubscriptionId ?? parsed.data.targetId;
        await syncStripeSubscription(stripeId);
        userId = local?.userId ?? null;
        auditAction = "STRIPE_SUBSCRIPTION_SYNCED";
        entity = "stripe_subscription";
        break;
      }
      case "payment": {
        const local = await prisma.stripePayment.findFirst({
          where: {
            OR: [
              { id: parsed.data.targetId },
              { stripePaymentIntentId: parsed.data.targetId },
            ],
          },
        });
        const stripeId = local?.stripePaymentIntentId ?? parsed.data.targetId;
        await syncStripePaymentIntent(stripeId);
        userId = local?.userId ?? null;
        auditAction = "STRIPE_PAYMENT_SYNCED";
        entity = "stripe_payment";
        break;
      }
      case "invoice": {
        const local = await prisma.stripeInvoice.findFirst({
          where: {
            OR: [
              { id: parsed.data.targetId },
              { stripeInvoiceId: parsed.data.targetId },
            ],
          },
        });
        const stripeId = local?.stripeInvoiceId ?? parsed.data.targetId;
        await syncStripeInvoice(stripeId);
        userId = local?.userId ?? null;
        auditAction = "STRIPE_INVOICE_SYNCED";
        entity = "stripe_invoice";
        break;
      }
      case "user": {
        await syncUserBillingData(parsed.data.targetId);
        userId = parsed.data.targetId;
        auditAction = "STRIPE_CUSTOMER_SYNCED";
        entity = "user";
        break;
      }
    }

    await writeAdminAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      entity,
      entityId: parsed.data.targetId,
      action: auditAction,
      reason: parsed.data.reason ?? null,
      newValue: {
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        userId,
      },
      ipAddress: await actorIp(),
    });
    revalidateBilling(userId);
    return { ok: true, message: "Synchronisation terminée" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}

export async function retryWebhookAction(
  prevOrForm: BillingActionResult | FormData | undefined,
  maybeForm?: FormData,
): Promise<BillingActionResult> {
  const formData = resolveFormData(prevOrForm, maybeForm);
  try {
    const actor = await requirePermission("billing.webhooks.retry");
    const parsed = retryWebhookSchema.safeParse({
      webhookEventId: String(formData.get("webhookEventId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
      idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
      syncObject: String(formData.get("syncObject") ?? "") === "true",
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    await assertIdempotencyKey(parsed.data.idempotencyKey, "webhook-retry");

    const event = await prisma.stripeWebhookEvent.findUnique({
      where: { id: parsed.data.webhookEventId },
    });
    if (!event) return { ok: false, message: "Événement introuvable" };

    await retryFailedEvent(event.id);
    await writeAdminAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      entity: "stripe_webhook_event",
      entityId: event.id,
      action: "STRIPE_WEBHOOK_RETRIED",
      reason: parsed.data.reason,
      newValue: {
        stripeEventId: event.stripeEventId,
        type: event.type,
        objectId: event.objectId,
        stripeMode: event.stripeMode,
      },
      ipAddress: await actorIp(),
    });

    if (parsed.data.syncObject && event.objectId) {
      const oid = event.objectId;
      if (oid.startsWith("sub_")) await syncStripeSubscription(oid);
      else if (oid.startsWith("pi_")) await syncStripePaymentIntent(oid);
      else if (oid.startsWith("in_")) await syncStripeInvoice(oid);
      else if (oid.startsWith("cus_")) await syncStripeCustomer(oid);

      await writeAdminAuditLog({
        actorUserId: actor.id,
        actorRole: actor.role,
        entity: "stripe_webhook_event",
        entityId: event.id,
        action: "STRIPE_WEBHOOK_OBJECT_SYNCED",
        reason: parsed.data.reason,
        newValue: { objectId: oid },
        ipAddress: await actorIp(),
      });
    }

    revalidateBilling();
    return { ok: true, message: "Webhook relancé" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}

/** Wrappers form action (retour void) pour usage hors useActionState. */
export async function syncSubscriptionFormAction(
  formData: FormData,
): Promise<void> {
  await syncSubscriptionAction(formData);
}

export async function syncCustomerFormAction(
  formData: FormData,
): Promise<void> {
  await syncCustomerAction(formData);
}

export async function syncPaymentFormAction(formData: FormData): Promise<void> {
  await syncPaymentAction(formData);
}
