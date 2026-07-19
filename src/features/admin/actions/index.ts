"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requirePermission, requireSuperAdminUser } from "@/features/auth";
import { isAppError } from "@/lib/errors";
import { USER_ROLES } from "@/lib/constants";
import {
  changeAdminUserRole,
  reactivateAdminUser,
  suspendAdminUser,
} from "@/features/admin/services";

export type AdminActionResult = {
  ok: boolean;
  message: string;
};

async function actorIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

export async function suspendUserAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    const actor = await requirePermission("users.suspend");
    const userId = String(formData.get("userId") ?? "");
    const reason = String(formData.get("reason") ?? "").trim() || undefined;
    if (!userId) return { ok: false, message: "Identifiant manquant" };

    await suspendAdminUser(userId, actor, {
      reason,
      ipAddress: await actorIp(),
    });
    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { ok: true, message: "Compte suspendu" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}

export async function reactivateUserAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    const actor = await requirePermission("users.suspend");
    const userId = String(formData.get("userId") ?? "");
    if (!userId) return { ok: false, message: "Identifiant manquant" };

    await reactivateAdminUser(userId, actor, {
      ipAddress: await actorIp(),
    });
    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { ok: true, message: "Compte réactivé" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}

export async function changeUserRoleAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    const actor = await requireSuperAdminUser();
    const userId = String(formData.get("userId") ?? "");
    const role = String(formData.get("role") ?? "");
    if (!userId) return { ok: false, message: "Identifiant manquant" };
    if (!(USER_ROLES as readonly string[]).includes(role)) {
      return { ok: false, message: "Rôle invalide" };
    }

    await changeAdminUserRole(
      userId,
      role as (typeof USER_ROLES)[number],
      actor,
      { ipAddress: await actorIp() },
    );
    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { ok: true, message: "Rôle mis à jour" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}
