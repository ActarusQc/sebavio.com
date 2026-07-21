"use server";

/**
 * Server Actions — Admin Forfaits (Phase 4).
 * Permissions serveur obligatoires ; aucune logique métier ici.
 */

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePermission } from "@/features/auth";
import { isAppError } from "@/lib/errors";
import {
  createPlanSchema,
  updatePlanMetadataSchema,
  setEntitlementsSchema,
  createPlanPriceSchema,
  hidePlanSchema,
  archivePlanSchema,
  duplicatePlanSchema,
  reconcilePlanSchema,
  applyPlanSyncSchema,
  listPlansSchema,
  getPlanSchema,
  deletePlanSchema,
} from "@/features/plans/lib/schemas";
import {
  createPlan,
  updatePlanMetadata,
  hidePlan,
  archivePlan,
  duplicatePlan,
  reconcilePlan,
} from "@/features/plans/services/plan-crud";
import {
  deletePlanHard,
  getPlanDeleteImpact,
} from "@/features/plans/services/plan-delete";
import type { PlanDeleteImpact } from "@/features/plans/lib/plan-delete-types";
import { setPlanEntitlements } from "@/features/plans/services/plan-entitlements";
import { createNewPlanPrice } from "@/features/plans/services/plan-prices";
import {
  listPlans,
  getPlan,
  type PlanListItem,
  type PlanDetail,
} from "@/features/plans/services/plan-queries";
import {
  previewPlanSync,
  applyPlanSync,
  type PlanSyncReport,
  type ApplyPlanSyncResult,
} from "@/features/plans/services/plan-sync";

export type ActionOk<T> = { ok: true; data: T };
export type ActionErr = { ok: false; error: string; code?: string };
export type ActionResult<T> = ActionOk<T> | ActionErr;

async function actorIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

function redactSecrets(message: string): string {
  return message
    .replace(/\bsk_(?:test|live)_[A-Za-z0-9]+\b/g, "[REDACTED]")
    .replace(/\brk_(?:test|live)_[A-Za-z0-9]+\b/g, "[REDACTED]")
    .replace(/\bwhsec_[A-Za-z0-9]+\b/g, "[REDACTED]")
    .slice(0, 500);
}

function toActionError(error: unknown): ActionErr {
  if (isAppError(error)) {
    return {
      ok: false,
      error: redactSecrets(error.message),
      code: error.code,
    };
  }
  if (error instanceof Error) {
    return {
      ok: false,
      error: redactSecrets(error.message) || "Une erreur est survenue.",
    };
  }
  return { ok: false, error: "Une erreur est survenue." };
}

function zodError(message: string | undefined): ActionErr {
  return {
    ok: false,
    error: message ?? "Données invalides.",
    code: "VALIDATION_ERROR",
  };
}

function revalidatePlans(planId?: string): void {
  revalidatePath("/admin/plans");
  if (planId) {
    revalidatePath(`/admin/plans/${planId}`);
    revalidatePath(`/admin/plans/${planId}/edit`);
    revalidatePath(`/admin/plans/${planId}/entitlements`);
    revalidatePath(`/admin/plans/${planId}/prices`);
  }
}

export async function listPlansAction(
  input: unknown = {},
): Promise<ActionResult<PlanListItem[]>> {
  try {
    await requirePermission("plans.read");
    const parsed = listPlansSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return zodError(parsed.error.issues[0]?.message);
    }
    const data = await listPlans(parsed.data);
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getPlanAction(
  input: unknown,
): Promise<ActionResult<PlanDetail>> {
  try {
    await requirePermission("plans.read");
    const parsed = getPlanSchema.safeParse(input);
    if (!parsed.success) {
      return zodError(parsed.error.issues[0]?.message);
    }
    const data = await getPlan(parsed.data);
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function previewPlanSyncAction(): Promise<
  ActionResult<PlanSyncReport>
> {
  try {
    await requirePermission("plans.read");
    const data = await previewPlanSync();
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createPlanAction(
  input: unknown,
): Promise<ActionResult<{ planId: string }>> {
  try {
    const actor = await requirePermission("plans.manage");
    const parsed = createPlanSchema.safeParse(input);
    if (!parsed.success) {
      return zodError(parsed.error.issues[0]?.message);
    }
    const data = await createPlan(parsed.data, {
      id: actor.id,
      role: actor.role,
      ipAddress: await actorIp(),
    });
    revalidatePlans(data.planId);
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updatePlanMetadataAction(
  input: unknown,
): Promise<ActionResult<{ planId: string }>> {
  try {
    const actor = await requirePermission("plans.manage");
    const parsed = updatePlanMetadataSchema.safeParse(input);
    if (!parsed.success) {
      return zodError(parsed.error.issues[0]?.message);
    }
    await updatePlanMetadata(parsed.data, {
      id: actor.id,
      role: actor.role,
      ipAddress: await actorIp(),
    });
    revalidatePlans(parsed.data.planId);
    return { ok: true, data: { planId: parsed.data.planId } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setPlanEntitlementsAction(
  input: unknown,
): Promise<ActionResult<{ planId: string }>> {
  try {
    const actor = await requirePermission("plans.manage");
    const parsed = setEntitlementsSchema.safeParse(input);
    if (!parsed.success) {
      return zodError(parsed.error.issues[0]?.message);
    }
    await setPlanEntitlements(parsed.data, {
      id: actor.id,
      role: actor.role,
      ipAddress: await actorIp(),
    });
    revalidatePlans(parsed.data.planId);
    return { ok: true, data: { planId: parsed.data.planId } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createPlanPriceAction(
  input: unknown,
): Promise<ActionResult<{ planPriceId: string }>> {
  try {
    const actor = await requirePermission("plans.manage");
    const parsed = createPlanPriceSchema.safeParse(input);
    if (!parsed.success) {
      return zodError(parsed.error.issues[0]?.message);
    }
    const data = await createNewPlanPrice(parsed.data, {
      id: actor.id,
      role: actor.role,
      ipAddress: await actorIp(),
    });
    revalidatePlans(parsed.data.planId);
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function hidePlanAction(
  input: unknown,
): Promise<ActionResult<{ planId: string }>> {
  try {
    const actor = await requirePermission("plans.manage");
    const parsed = hidePlanSchema.safeParse(input);
    if (!parsed.success) {
      return zodError(parsed.error.issues[0]?.message);
    }
    await hidePlan(parsed.data, {
      id: actor.id,
      role: actor.role,
      ipAddress: await actorIp(),
    });
    revalidatePlans(parsed.data.planId);
    return { ok: true, data: { planId: parsed.data.planId } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function archivePlanAction(
  input: unknown,
): Promise<ActionResult<{ planId: string }>> {
  try {
    const actor = await requirePermission("plans.manage");
    const parsed = archivePlanSchema.safeParse(input);
    if (!parsed.success) {
      return zodError(parsed.error.issues[0]?.message);
    }
    await archivePlan(parsed.data, {
      id: actor.id,
      role: actor.role,
      ipAddress: await actorIp(),
    });
    revalidatePlans(parsed.data.planId);
    return { ok: true, data: { planId: parsed.data.planId } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function duplicatePlanAction(
  input: unknown,
): Promise<ActionResult<{ planId: string }>> {
  try {
    const actor = await requirePermission("plans.manage");
    const parsed = duplicatePlanSchema.safeParse(input);
    if (!parsed.success) {
      return zodError(parsed.error.issues[0]?.message);
    }
    const data = await duplicatePlan(parsed.data, {
      id: actor.id,
      role: actor.role,
      ipAddress: await actorIp(),
    });
    revalidatePlans(data.planId);
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function applyPlanSyncAction(
  input: unknown,
): Promise<ActionResult<ApplyPlanSyncResult>> {
  try {
    const actor = await requirePermission("plans.manage");
    const parsed = applyPlanSyncSchema.safeParse(input);
    if (!parsed.success) {
      return zodError(parsed.error.issues[0]?.message);
    }
    const data = await applyPlanSync(parsed.data, {
      id: actor.id,
      role: actor.role,
      ipAddress: await actorIp(),
    });
    revalidatePlans();
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reconcilePlanAction(
  input: unknown,
): Promise<ActionResult<{ planId: string }>> {
  try {
    const actor = await requirePermission("plans.manage");
    const parsed = reconcilePlanSchema.safeParse(input);
    if (!parsed.success) {
      return zodError(parsed.error.issues[0]?.message);
    }
    await reconcilePlan(
      parsed.data.planId,
      {
        id: actor.id,
        role: actor.role,
        ipAddress: await actorIp(),
      },
      parsed.data.prices ? { prices: parsed.data.prices } : undefined,
    );
    revalidatePlans(parsed.data.planId);
    return { ok: true, data: { planId: parsed.data.planId } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getPlanDeleteImpactAction(
  input: unknown,
): Promise<ActionResult<PlanDeleteImpact>> {
  try {
    await requirePermission("plans.manage");
    const parsed = getPlanSchema.safeParse(input);
    if (!parsed.success) {
      return zodError(parsed.error.issues[0]?.message);
    }
    const data = await getPlanDeleteImpact(parsed.data.planId);
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deletePlanAction(
  input: unknown,
): Promise<ActionResult<{ planId: string }>> {
  try {
    const actor = await requirePermission("plans.manage");
    const parsed = deletePlanSchema.safeParse(input);
    if (!parsed.success) {
      return zodError(parsed.error.issues[0]?.message);
    }
    await deletePlanHard(parsed.data, {
      id: actor.id,
      role: actor.role,
      ipAddress: await actorIp(),
    });
    revalidatePlans();
    return { ok: true, data: { planId: parsed.data.planId } };
  } catch (error) {
    return toActionError(error);
  }
}
