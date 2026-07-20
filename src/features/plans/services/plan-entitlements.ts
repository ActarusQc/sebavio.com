/**
 * Upsert ciblé des entitlements (ne supprime pas les clés absentes du payload).
 */

import "server-only";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { writeAdminAuditLog } from "@/features/admin/services/audit-write";
import {
  setEntitlementsSchema,
  type SetEntitlementsInput,
} from "@/features/plans/lib/schemas";
import type { PlanActor } from "@/features/plans/services/plan-crud";
import { getStripeMode } from "@/services/stripe/config";

export async function setPlanEntitlements(
  rawInput: SetEntitlementsInput,
  actor: PlanActor,
): Promise<void> {
  const input = setEntitlementsSchema.parse(rawInput);
  const mode = getStripeMode();

  const plan = await prisma.plan.findUnique({
    where: { id: input.planId },
    select: { id: true, status: true, stripeMode: true },
  });

  if (!plan) {
    throw new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404);
  }
  if (plan.status === "archived") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Impossible de modifier les entitlements d'un forfait archivé.",
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

  const before = await prisma.planEntitlement.findMany({
    where: { planId: plan.id },
    select: { key: true, enabled: true, limit: true, value: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const e of input.entitlements) {
      await tx.planEntitlement.upsert({
        where: {
          planId_key: { planId: plan.id, key: e.key },
        },
        create: {
          planId: plan.id,
          key: e.key,
          enabled: e.enabled,
          limit: e.limit,
          value: e.value,
        },
        update: {
          enabled: e.enabled,
          limit: e.limit,
          value: e.value,
        },
      });
    }
  });

  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "plan_entitlement",
    entityId: plan.id,
    action: "PLAN_ENTITLEMENTS_UPDATE",
    oldValue: { entitlements: before, stripeMode: mode },
    newValue: {
      result: "success",
      stripeMode: mode,
      upserted: input.entitlements,
    },
    ipAddress: actor.ipAddress ?? null,
  });
}
