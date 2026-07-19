"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requirePermission, requireSuperAdminUser } from "@/features/auth";
import { isAppError } from "@/lib/errors";
import { USER_ROLES } from "@/lib/constants";
import { isSuspendConfirmationValid } from "@/features/admin/lib/suspend-confirmation";
import {
  adminSendPasswordReset,
  adminResendVerification,
  changeAdminUserRole,
  createAdminUserNote,
  deleteAdminUserNote,
  reactivateAdminUser,
  revokeUserSessions,
  suspendAdminUser,
  updateAdminUserNote,
} from "@/features/admin/services";
import {
  adminUserNoteCreateSchema,
  adminUserNoteUpdateSchema,
  adminUserPasswordResetSchema,
  adminUserReactivateSchema,
  adminUserResendVerificationSchema,
  adminUserRevokeSessionsSchema,
  adminUserRolePatchSchema,
  adminUserSuspendSchema,
} from "@/features/admin/schemas";

export type AdminActionResult = {
  ok: boolean;
  message: string;
};

async function actorIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

function revalidateUserPaths(userId: string): void {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function suspendUserAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    const actor = await requirePermission("users.suspend");
    const userId = String(formData.get("userId") ?? "");
    if (!userId) return { ok: false, message: "Identifiant manquant" };

    const email = String(formData.get("email") ?? "").trim();
    const endsRaw = String(formData.get("suspensionEndsAt") ?? "").trim();
    const confirmation =
      String(formData.get("confirmation") ?? "").trim() || undefined;

    const parsed = adminUserSuspendSchema.safeParse({
      reason: String(formData.get("reason") ?? ""),
      confirmation,
      suspensionEndsAt: endsRaw || undefined,
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    if (!isSuspendConfirmationValid(email || "?", parsed.data.confirmation)) {
      return {
        ok: false,
        message:
          "Confirmation invalide — tapez exactement la phrase demandée (obligatoire en production)",
      };
    }

    await suspendAdminUser(userId, actor, {
      reason: parsed.data.reason,
      suspensionEndsAt: parsed.data.suspensionEndsAt,
      ipAddress: await actorIp(),
    });
    revalidateUserPaths(userId);
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

    const parsed = adminUserReactivateSchema.safeParse({
      reason: String(formData.get("reason") ?? ""),
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    await reactivateAdminUser(userId, actor, {
      reason: parsed.data.reason,
      ipAddress: await actorIp(),
    });
    revalidateUserPaths(userId);
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
    if (!userId) return { ok: false, message: "Identifiant manquant" };

    const parsed = adminUserRolePatchSchema.safeParse({
      role: String(formData.get("role") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }
    if (!(USER_ROLES as readonly string[]).includes(parsed.data.role)) {
      return { ok: false, message: "Rôle invalide" };
    }

    await changeAdminUserRole(userId, parsed.data.role, actor, {
      reason: parsed.data.reason,
      ipAddress: await actorIp(),
    });
    revalidateUserPaths(userId);
    return { ok: true, message: "Rôle mis à jour" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}

export async function revokeSessionsAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    const actor = await requirePermission("users.sessions.revoke");
    const userId = String(formData.get("userId") ?? "");
    if (!userId) return { ok: false, message: "Identifiant manquant" };

    const allowSelfRaw = String(formData.get("allowSelf") ?? "");
    const allowSelf =
      allowSelfRaw === "on" || allowSelfRaw === "true" || allowSelfRaw === "1";

    const parsed = adminUserRevokeSessionsSchema.safeParse({
      reason: String(formData.get("reason") ?? ""),
      allowSelf: allowSelf || undefined,
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    await revokeUserSessions(userId, actor, {
      reason: parsed.data.reason,
      allowSelf: parsed.data.allowSelf,
      ipAddress: await actorIp(),
    });
    revalidateUserPaths(userId);
    return { ok: true, message: "Sessions révoquées" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}

export async function sendPasswordResetAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    const actor = await requirePermission("users.password.reset");
    const userId = String(formData.get("userId") ?? "");
    if (!userId) return { ok: false, message: "Identifiant manquant" };

    const parsed = adminUserPasswordResetSchema.safeParse({
      reason: String(formData.get("reason") ?? ""),
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    await adminSendPasswordReset(userId, actor, {
      reason: parsed.data.reason,
      ipAddress: await actorIp(),
    });
    revalidateUserPaths(userId);
    return { ok: true, message: "Lien de réinitialisation envoyé" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}

export async function resendVerificationAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    const actor = await requirePermission("users.resend_verification");
    const userId = String(formData.get("userId") ?? "");
    if (!userId) return { ok: false, message: "Identifiant manquant" };

    const parsed = adminUserResendVerificationSchema.safeParse({
      reason: String(formData.get("reason") ?? ""),
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    await adminResendVerification(userId, actor, {
      reason: parsed.data.reason,
      ipAddress: await actorIp(),
    });
    revalidateUserPaths(userId);
    return { ok: true, message: "Courriel de vérification renvoyé" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}

export async function createNoteAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    const actor = await requirePermission("users.notes.create");
    const userId = String(formData.get("userId") ?? "");
    if (!userId) return { ok: false, message: "Identifiant manquant" };

    const parsed = adminUserNoteCreateSchema.safeParse({
      content: String(formData.get("content") ?? ""),
      category: String(formData.get("category") ?? "general"),
      importance: String(formData.get("importance") ?? "normal"),
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    await createAdminUserNote(userId, actor, {
      content: parsed.data.content,
      category: parsed.data.category,
      importance: parsed.data.importance,
      ipAddress: await actorIp(),
    });
    revalidateUserPaths(userId);
    return { ok: true, message: "Note ajoutée" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}

export async function updateNoteAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    const actor = await requirePermission("users.notes");
    const noteId = String(formData.get("noteId") ?? "");
    const userId = String(formData.get("userId") ?? "");
    if (!noteId) return { ok: false, message: "Identifiant de note manquant" };

    const contentRaw = String(formData.get("content") ?? "").trim();
    const categoryRaw = String(formData.get("category") ?? "").trim();
    const importanceRaw = String(formData.get("importance") ?? "").trim();

    const parsed = adminUserNoteUpdateSchema.safeParse({
      content: contentRaw || undefined,
      category: categoryRaw || undefined,
      importance: importanceRaw || undefined,
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    const note = await updateAdminUserNote(noteId, actor, {
      content: parsed.data.content,
      category: parsed.data.category,
      importance: parsed.data.importance,
      ipAddress: await actorIp(),
    });
    revalidateUserPaths(userId || note.userId);
    return { ok: true, message: "Note mise à jour" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}

export async function deleteNoteAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    const actor = await requirePermission("users.notes");
    const noteId = String(formData.get("noteId") ?? "");
    const userId = String(formData.get("userId") ?? "");
    if (!noteId) return { ok: false, message: "Identifiant de note manquant" };
    if (!userId)
      return { ok: false, message: "Identifiant utilisateur manquant" };

    await deleteAdminUserNote(noteId, actor, {
      ipAddress: await actorIp(),
    });
    revalidateUserPaths(userId);
    return { ok: true, message: "Note supprimée" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur interne" };
  }
}
