/**
 * Création d'un nouveau Price Stripe + bascule isCurrent atomique.
 */

import "server-only";

import type { z } from "zod";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { writeAdminAuditLog } from "@/features/admin/services/audit-write";
import { createPlanPriceSchema } from "@/features/plans/lib/schemas";
import type { PlanActor } from "@/features/plans/services/plan-crud";
import { getStripeMode } from "@/services/stripe/config";
import {
  createSebavioPrice,
  deactivateStripePrice,
} from "@/services/stripe/price-service";

type CreateNewPlanPriceInput = z.input<typeof createPlanPriceSchema>;

/**
 * Clé d'idempotence déterministe pour une opération tarifaire.
 * Même operationId → même clé ; nouvel operationId → clé distincte.
 */
export function planPriceOperationIdempotencyKey(input: {
  planId: string;
  interval: string;
  intervalCount: number;
  currency: string;
  operationId: string;
}): string {
  return `plan-price:${input.planId}:${input.interval}:${input.intervalCount}:${input.currency.toLowerCase()}:${input.operationId}`;
}

export async function createNewPlanPrice(
  rawInput: CreateNewPlanPriceInput,
  actor: PlanActor,
): Promise<{ planPriceId: string }> {
  const input = createPlanPriceSchema.parse(rawInput);
  const mode = getStripeMode();

  const plan = await prisma.plan.findUnique({
    where: { id: input.planId },
    include: { prices: true },
  });

  if (!plan) {
    throw new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404);
  }
  if (plan.status === "archived") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Impossible d'ajouter un prix à un forfait archivé.",
      400,
    );
  }
  if (plan.stripeMode !== mode) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Incohérence de mode Stripe : forfait=${plan.stripeMode}, serveur=${mode}.`,
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

  const previousCurrent = plan.prices.filter(
    (p) =>
      p.isCurrent &&
      p.interval === input.interval &&
      p.intervalCount === input.intervalCount &&
      p.currency === input.currency,
  );

  const idempotencyKey = planPriceOperationIdempotencyKey({
    planId: plan.id,
    interval: input.interval,
    intervalCount: input.intervalCount,
    currency: input.currency,
    operationId: input.operationId,
  });

  const stripePrice = await createSebavioPrice({
    productId: plan.stripeProductId,
    planId: plan.id,
    unitAmount: input.unitAmount,
    currency: input.currency,
    interval: input.interval,
    intervalCount: input.intervalCount,
    idempotencyKey,
  });

  try {
    const created = await prisma.$transaction(async (tx) => {
      await tx.planPrice.updateMany({
        where: {
          planId: plan.id,
          interval: input.interval,
          intervalCount: input.intervalCount,
          currency: input.currency,
          isCurrent: true,
        },
        data: { isCurrent: false },
      });

      return tx.planPrice.create({
        data: {
          planId: plan.id,
          stripePriceId: stripePrice.id,
          interval: input.interval,
          intervalCount: input.intervalCount,
          currency: input.currency,
          unitAmount: stripePrice.unit_amount ?? input.unitAmount,
          status: "active",
          isCurrent: true,
          stripeMode: mode,
        },
      });
    });

    if (input.archivePreviousForNewSubscribers) {
      for (const prev of previousCurrent) {
        await deactivateStripePrice(prev.stripePriceId);
        await prisma.planPrice.update({
          where: { id: prev.id },
          data: {
            status: "archived",
            archivedAt: new Date(),
          },
        });
      }
    }

    await writeAdminAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      entity: "plan_price",
      entityId: created.id,
      action: "PLAN_PRICE_CREATED",
      oldValue: {
        previousPriceIds: previousCurrent.map((p) => p.stripePriceId),
        stripeMode: mode,
      },
      newValue: {
        result: "success",
        stripeMode: mode,
        stripePriceId: stripePrice.id,
        unitAmount: input.unitAmount,
        operationId: input.operationId,
        idempotencyKey,
        archivePreviousForNewSubscribers:
          input.archivePreviousForNewSubscribers,
      },
      ipAddress: actor.ipAddress ?? null,
    });

    return { planPriceId: created.id };
  } catch (error) {
    await writeAdminAuditLog({
      actorUserId: actor.id,
      actorRole: actor.role,
      entity: "plan",
      entityId: plan.id,
      action: "PLAN_PRICE_CREATE_FAILED",
      newValue: {
        result: "error",
        stripeMode: mode,
        stripePriceId: stripePrice.id,
        operationId: input.operationId,
      },
      ipAddress: actor.ipAddress ?? null,
    });
    throw error;
  }
}
