"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/features/auth";
import {
  adminExtendPassSchema,
  getPassGrantSchema,
  listPassGrantsSchema,
  revokePassGrantSchema,
} from "@/features/subscriptions/schemas";
import {
  adminExtendPass,
  revokePassGrant,
} from "@/features/subscriptions/services/pass-access";
import {
  getPassGrantDetail,
  listPassGrants,
  type PassGrantDetail,
  type PassGrantListResult,
} from "@/features/subscriptions/services/pass-admin";
import { isAppError } from "@/lib/errors";

export type PassAdminActionResult<T = undefined> =
  { ok: true; data?: T } | { ok: false; error: string };

function toError(error: unknown): PassAdminActionResult {
  if (isAppError(error)) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Une erreur est survenue." };
}

function revalidatePassPaths(grantId?: string): void {
  revalidatePath("/admin/passes");
  if (grantId) {
    revalidatePath(`/admin/passes/${grantId}`);
  }
}

export async function listPassGrantsAction(
  input: unknown = {},
): Promise<PassAdminActionResult<PassGrantListResult>> {
  try {
    await requirePermission("plans.read");
    const parsed = listPassGrantsSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Paramètres invalides.",
      };
    }
    const data = await listPassGrants(parsed.data);
    return { ok: true, data };
  } catch (error) {
    return toError(error);
  }
}

export async function getPassGrantAction(
  input: unknown,
): Promise<PassAdminActionResult<PassGrantDetail>> {
  try {
    await requirePermission("plans.read");
    const parsed = getPassGrantSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Identifiant invalide.",
      };
    }
    const data = await getPassGrantDetail(parsed.data.id);
    return { ok: true, data };
  } catch (error) {
    return toError(error);
  }
}

export async function revokePassGrantAction(
  input: unknown,
): Promise<PassAdminActionResult> {
  try {
    const actor = await requirePermission("plans.manage");
    const parsed = revokePassGrantSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Données invalides.",
      };
    }
    await revokePassGrant(
      parsed.data.grantId,
      {
        userId: actor.id,
        role: actor.role,
      },
      parsed.data.reason,
    );
    revalidatePassPaths(parsed.data.grantId);
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}

export async function adminExtendPassAction(
  input: unknown,
): Promise<PassAdminActionResult> {
  try {
    const actor = await requirePermission("plans.manage");
    const parsed = adminExtendPassSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Données invalides.",
      };
    }
    await adminExtendPass(
      parsed.data.grantId,
      parsed.data.days,
      parsed.data.reason,
      {
        userId: actor.id,
        role: actor.role,
      },
    );
    revalidatePassPaths(parsed.data.grantId);
    return { ok: true };
  } catch (error) {
    return toError(error);
  }
}
