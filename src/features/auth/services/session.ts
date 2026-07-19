import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assertUserActive } from "@/features/auth/services/user-status";
import { isAdminRole } from "@/features/auth/services/roles";
import { hasPermission, type AdminPermission } from "@/lib/rbac";
import type { AuthUser } from "@/features/auth/types";

/** Session JWT + re-vérification status en base (mutations / admin). */
export async function requireActiveUser(): Promise<AuthUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("AUTH_006", "Accès refusé", 401);
  }
  return assertUserActive(session.user.id);
}

/** Tout rôle staff avec `admin.portal`. */
export async function requireStaffUser(): Promise<AuthUser> {
  const user = await requireActiveUser();
  if (!hasPermission(user.role, "admin.portal")) {
    throw new AppError("AUTH_006", "Accès refusé", 403);
  }
  return user;
}

/**
 * Permission fine — à appeler dans chaque Server Action / Route Handler sensible.
 * Ne pas se fier uniquement au layout ou au proxy.
 */
export async function requirePermission(
  permission: AdminPermission,
): Promise<AuthUser> {
  const user = await requireActiveUser();
  if (!hasPermission(user.role, permission)) {
    throw new AppError("ADM_001", "Accès refusé", 403);
  }
  return user;
}

/**
 * Admin contenu (catalogue / campings / activités) — `content.manage`.
 * Conservé pour les routes historiques `requireAdminUser`.
 */
export async function requireAdminUser(): Promise<AuthUser> {
  return requirePermission("content.manage");
}

export async function requireSuperAdminUser(): Promise<AuthUser> {
  const user = await requireActiveUser();
  if (user.role !== "super_admin") {
    throw new AppError("ADM_001", "Accès refusé", 403);
  }
  return user;
}

/** @deprecated Préférer `requireStaffUser` — alias de compatibilité. */
export async function requireAnyAdminUser(): Promise<AuthUser> {
  const user = await requireActiveUser();
  if (!isAdminRole(user.role)) {
    throw new AppError("AUTH_006", "Accès refusé", 403);
  }
  return user;
}
