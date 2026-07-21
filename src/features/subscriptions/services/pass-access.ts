import "server-only";

import { randomUUID } from "crypto";

import type { PlanAccessGrant, Prisma } from "@prisma/client";

import { writeAdminAuditLog } from "@/features/admin/services/audit-write";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/constants";
import type { StripeMode } from "@/services/stripe/config";

export type PassWindow = {
  startsAt: Date;
  endsAt: Date;
};

export type ActivateOrExtendPassResult = {
  grantId: string;
  extended: boolean;
};

export type PassActor = {
  userId: string | null;
  role: UserRole | "system";
};

/** Ajoute exactement `days` jours civils en UTC. */
export function addDaysUtc(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function computePassWindow(
  confirmedAt: Date,
  durationDays = 30,
): PassWindow {
  const startsAt = new Date(confirmedAt.getTime());
  return {
    startsAt,
    endsAt: addDaysUtc(startsAt, durationDays),
  };
}

/**
 * Prolongation sans perdre les jours restants :
 * si le pass est encore valide, on empile sur endsAt ; sinon on repart de now.
 */
export function computeExtendedEndsAt(
  currentEndsAt: Date,
  now: Date,
  durationDays: number,
): Date {
  const base = currentEndsAt.getTime() > now.getTime() ? currentEndsAt : now;
  return addDaysUtc(base, durationDays);
}

async function findGrantLinkedToPurchase(
  tx: Prisma.TransactionClient | typeof prisma,
  purchaseId: string,
): Promise<PlanAccessGrant | null> {
  return tx.planAccessGrant.findFirst({
    where: { sourcePurchaseId: purchaseId },
  });
}

export async function activateOrExtendPassFromPurchase(opts: {
  purchaseId: string;
  stripeEventId: string;
  paidAt: Date;
  userId: string;
  planId: string;
  durationDays: number;
  stripeMode: StripeMode;
  stripePaymentIntentId?: string | null;
}): Promise<ActivateOrExtendPassResult> {
  const {
    purchaseId,
    stripeEventId,
    paidAt,
    userId,
    planId,
    durationDays,
    stripeMode,
    stripePaymentIntentId,
  } = opts;

  if (durationDays <= 0 || !Number.isInteger(durationDays)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Durée d'accès invalide pour le Pass.",
      400,
    );
  }

  const existingPurchase = await prisma.planPurchase.findUnique({
    where: { id: purchaseId },
  });
  if (!existingPurchase) {
    throw new AppError("VALIDATION_ERROR", "Achat introuvable.", 404);
  }
  if (
    existingPurchase.userId !== userId ||
    existingPurchase.planId !== planId
  ) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Incohérence entre l'achat et l'activation demandée.",
      400,
    );
  }
  if (existingPurchase.stripeMode !== stripeMode) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Incohérence de mode Stripe pour l'achat.",
      400,
    );
  }

  if (existingPurchase.activationStripeEventId === stripeEventId) {
    const linked = await findGrantLinkedToPurchase(prisma, purchaseId);
    if (linked) {
      return { grantId: linked.id, extended: false };
    }
    const byEvent = await prisma.planAccessGrant.findFirst({
      where: { lastExtensionEventId: stripeEventId, userId, planId },
      orderBy: { endsAt: "desc" },
    });
    if (byEvent) {
      return { grantId: byEvent.id, extended: true };
    }
  }

  if (existingPurchase.status === "paid") {
    const linked = await findGrantLinkedToPurchase(prisma, purchaseId);
    if (linked) {
      return { grantId: linked.id, extended: false };
    }
  }

  const alreadyExtended = await prisma.planAccessGrant.findFirst({
    where: { lastExtensionEventId: stripeEventId, userId, planId },
  });
  if (alreadyExtended) {
    return { grantId: alreadyExtended.id, extended: true };
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.planPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) {
      throw new AppError("VALIDATION_ERROR", "Achat introuvable.", 404);
    }

    if (purchase.activationStripeEventId === stripeEventId) {
      const linked = await findGrantLinkedToPurchase(tx, purchaseId);
      if (linked) return { grantId: linked.id, extended: false };
    }

    const noopGrant = await tx.planAccessGrant.findFirst({
      where: { lastExtensionEventId: stripeEventId, userId, planId },
    });
    if (noopGrant) {
      return { grantId: noopGrant.id, extended: true };
    }

    if (purchase.status === "paid") {
      const linked = await findGrantLinkedToPurchase(tx, purchaseId);
      if (linked) return { grantId: linked.id, extended: false };
    }

    await tx.planPurchase.update({
      where: { id: purchaseId },
      data: {
        status: "paid",
        paidAt: purchase.paidAt ?? paidAt,
        activationStripeEventId: stripeEventId,
        ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
      },
    });

    const activeGrant = await tx.planAccessGrant.findFirst({
      where: {
        userId,
        planId,
        status: "active",
        endsAt: { gt: now },
      },
      orderBy: { endsAt: "desc" },
    });

    if (activeGrant) {
      const newEndsAt = computeExtendedEndsAt(
        activeGrant.endsAt,
        now,
        durationDays,
      );
      const updated = await tx.planAccessGrant.update({
        where: { id: activeGrant.id },
        data: {
          endsAt: newEndsAt,
          lastExtensionEventId: stripeEventId,
        },
      });

      await writeAdminAuditLog(
        {
          actorUserId: null,
          actorRole: "system",
          entity: "plan_access_grant",
          entityId: updated.id,
          action: "PASS_EXTENDED",
          reason: "Prolongation suite à un achat Pass confirmé.",
          oldValue: {
            endsAt: activeGrant.endsAt.toISOString(),
            lastExtensionEventId: activeGrant.lastExtensionEventId,
          },
          newValue: {
            endsAt: newEndsAt.toISOString(),
            lastExtensionEventId: stripeEventId,
            purchaseId,
            stripeMode,
            durationDays,
          },
        },
        tx,
      );

      return { grantId: updated.id, extended: true };
    }

    const window = computePassWindow(paidAt, durationDays);
    const grantId = randomUUID();
    const created = await tx.planAccessGrant.create({
      data: {
        id: grantId,
        userId,
        planId,
        sourcePurchaseId: purchaseId,
        status: "active",
        startsAt: window.startsAt,
        endsAt: window.endsAt,
        lastExtensionEventId: stripeEventId,
        stripeMode,
      },
    });

    await writeAdminAuditLog(
      {
        actorUserId: null,
        actorRole: "system",
        entity: "plan_access_grant",
        entityId: created.id,
        action: "PASS_ACTIVATED",
        reason: "Activation suite à un achat Pass confirmé.",
        newValue: {
          purchaseId,
          startsAt: window.startsAt.toISOString(),
          endsAt: window.endsAt.toISOString(),
          stripeMode,
          durationDays,
          stripeEventId,
        },
      },
      tx,
    );

    return { grantId: created.id, extended: false };
  });
}

export async function expirePassIfNeeded(
  grantOrId: string | PlanAccessGrant,
  now: Date = new Date(),
): Promise<PlanAccessGrant> {
  const grant =
    typeof grantOrId === "string"
      ? await prisma.planAccessGrant.findUnique({ where: { id: grantOrId } })
      : grantOrId;

  if (!grant) {
    throw new AppError("VALIDATION_ERROR", "Droit d'accès introuvable.", 404);
  }

  if (grant.status !== "active" || grant.endsAt.getTime() > now.getTime()) {
    return grant;
  }

  const expired = await prisma.planAccessGrant.update({
    where: { id: grant.id },
    data: { status: "expired" },
  });

  await writeAdminAuditLog({
    actorUserId: null,
    actorRole: "system",
    entity: "plan_access_grant",
    entityId: expired.id,
    action: "PASS_EXPIRED",
    reason: "Expiration automatique du Pass.",
    oldValue: { status: "active", endsAt: grant.endsAt.toISOString() },
    newValue: { status: "expired", endsAt: expired.endsAt.toISOString() },
  });

  return expired;
}

export async function revokePassGrant(
  grantId: string,
  actor: PassActor,
  reason: string,
): Promise<PlanAccessGrant> {
  const grant = await prisma.planAccessGrant.findUnique({
    where: { id: grantId },
  });
  if (!grant) {
    throw new AppError("VALIDATION_ERROR", "Droit d'accès introuvable.", 404);
  }

  if (grant.status === "revoked") {
    return grant;
  }

  const revoked = await prisma.planAccessGrant.update({
    where: { id: grantId },
    data: {
      status: "revoked",
      revokedAt: new Date(),
      revokedReason: reason,
      revokedByAdminId: actor.role === "system" ? null : (actor.userId ?? null),
    },
  });

  await writeAdminAuditLog({
    actorUserId: actor.userId,
    actorRole: actor.role,
    entity: "plan_access_grant",
    entityId: revoked.id,
    action: "PASS_REVOKED",
    reason,
    oldValue: { status: grant.status },
    newValue: { status: "revoked", revokedReason: reason },
  });

  return revoked;
}

export async function adminExtendPass(
  grantId: string,
  days: number,
  reason: string,
  actor: PassActor,
): Promise<PlanAccessGrant> {
  if (!Number.isInteger(days) || days <= 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Le nombre de jours de prolongation doit être un entier positif.",
      400,
    );
  }

  const grant = await prisma.planAccessGrant.findUnique({
    where: { id: grantId },
  });
  if (!grant) {
    throw new AppError("VALIDATION_ERROR", "Droit d'accès introuvable.", 404);
  }

  const now = new Date();
  const newEndsAt = computeExtendedEndsAt(grant.endsAt, now, days);
  const wasExpired = grant.status === "expired" || grant.endsAt <= now;

  const updated = await prisma.planAccessGrant.update({
    where: { id: grantId },
    data: {
      endsAt: newEndsAt,
      status: grant.status === "revoked" ? grant.status : "active",
      lastAdminExtendAt: now,
      lastAdminExtendById: actor.userId,
      lastAdminExtendDays: days,
      lastAdminExtendReason: reason,
      ...(wasExpired && grant.status !== "revoked"
        ? { startsAt: grant.startsAt }
        : {}),
    },
  });

  await writeAdminAuditLog({
    actorUserId: actor.userId,
    actorRole: actor.role,
    entity: "plan_access_grant",
    entityId: updated.id,
    action: "PASS_ADMIN_EXTENDED",
    reason,
    oldValue: {
      endsAt: grant.endsAt.toISOString(),
      status: grant.status,
    },
    newValue: {
      endsAt: newEndsAt.toISOString(),
      status: updated.status,
      days,
    },
  });

  return updated;
}

export async function markPurchaseFailed(
  purchaseId: string,
  stripeEventId?: string,
): Promise<void> {
  const purchase = await prisma.planPurchase.findUnique({
    where: { id: purchaseId },
  });
  if (!purchase) {
    throw new AppError("VALIDATION_ERROR", "Achat introuvable.", 404);
  }

  if (
    purchase.status === "failed" ||
    purchase.status === "paid" ||
    purchase.status === "refunded"
  ) {
    return;
  }

  await prisma.planPurchase.update({
    where: { id: purchaseId },
    data: { status: "failed" },
  });

  await writeAdminAuditLog({
    actorUserId: null,
    actorRole: "system",
    entity: "plan_purchase",
    entityId: purchaseId,
    action: "PASS_PURCHASE_FAILED",
    reason: "Paiement asynchrone échoué.",
    newValue: {
      status: "failed",
      stripeEventId: stripeEventId ?? null,
    },
  });
}

export async function markPurchaseRefundedAndRevoke(
  purchaseId: string,
  opts?: { stripeEventId?: string; reason?: string },
): Promise<void> {
  const purchase = await prisma.planPurchase.findUnique({
    where: { id: purchaseId },
    include: { accessGrant: true },
  });
  if (!purchase) {
    throw new AppError("VALIDATION_ERROR", "Achat introuvable.", 404);
  }

  if (purchase.status === "refunded") {
    const alreadyRevoked = await prisma.planAccessGrant.findMany({
      where: {
        OR: [
          { sourcePurchaseId: purchaseId },
          ...(purchase.activationStripeEventId
            ? [{ lastExtensionEventId: purchase.activationStripeEventId }]
            : []),
        ],
        status: { in: ["refunded", "revoked"] },
      },
    });
    if (
      alreadyRevoked.length > 0 ||
      purchase.accessGrant?.status === "refunded"
    ) {
      return;
    }
  }

  await prisma.$transaction(async (tx) => {
    if (purchase.status !== "refunded") {
      await tx.planPurchase.update({
        where: { id: purchaseId },
        data: {
          status: "refunded",
          refundedAt: purchase.refundedAt ?? new Date(),
        },
      });
    }

    const grants = await tx.planAccessGrant.findMany({
      where: {
        userId: purchase.userId,
        planId: purchase.planId,
        status: { in: ["active", "pending_payment"] },
        OR: [
          { sourcePurchaseId: purchaseId },
          ...(purchase.activationStripeEventId
            ? [{ lastExtensionEventId: purchase.activationStripeEventId }]
            : []),
          ...(purchase.accessGrant ? [{ id: purchase.accessGrant.id }] : []),
        ],
      },
    });

    for (const grant of grants) {
      if (grant.status === "revoked" || grant.status === "refunded") continue;
      await tx.planAccessGrant.update({
        where: { id: grant.id },
        data: {
          status: "refunded",
          revokedAt: new Date(),
          revokedReason:
            opts?.reason ?? "Remboursement Stripe — révocation du Pass.",
        },
      });
    }

    await writeAdminAuditLog(
      {
        actorUserId: null,
        actorRole: "system",
        entity: "plan_purchase",
        entityId: purchaseId,
        action: "PASS_PURCHASE_REFUNDED",
        reason: opts?.reason ?? "Remboursement Stripe.",
        newValue: {
          status: "refunded",
          stripeEventId: opts?.stripeEventId ?? null,
          revokedGrantIds: grants.map((g) => g.id),
        },
      },
      tx,
    );
  });
}
