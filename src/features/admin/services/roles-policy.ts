import { AppError } from "@/lib/errors";
import type { UserRole, UserStatus } from "@/lib/constants";

export type AdminActor = {
  id: string;
  role: UserRole;
};

export type AdminTarget = {
  id: string;
  role: UserRole;
  status: UserStatus;
};

export type AdminUserAction = "view" | "suspend" | "reactivate" | "change_role";

/**
 * Indique si la mutation retire le privilège « super_admin actif »
 * (suspension OU rétrogradation de rôle).
 */
export function removesActiveSuperAdminPrivilege(
  current: { role: UserRole; status: UserStatus },
  next: { role?: UserRole; status?: UserStatus },
): boolean {
  if (current.role !== "super_admin" || current.status !== "active") {
    return false;
  }
  const nextRole = next.role ?? current.role;
  const nextStatus = next.status ?? current.status;
  return nextRole !== "super_admin" || nextStatus !== "active";
}

/**
 * Matrice des droits admin (hors anti-verrouillage dernier super_admin).
 */
export function assertActorCanActOnTarget(
  actor: AdminActor,
  target: AdminTarget,
  action: AdminUserAction,
): void {
  if (actor.role !== "admin" && actor.role !== "super_admin") {
    throw new AppError("ADM_001", "Accès refusé", 403);
  }

  if (action === "view") {
    return;
  }

  if (actor.id === target.id) {
    throw new AppError(
      "ADM_004",
      "Action non autorisée sur votre propre compte",
      403,
    );
  }

  if (action === "change_role") {
    if (actor.role !== "super_admin") {
      throw new AppError(
        "ADM_004",
        "Seuls les super administrateurs peuvent modifier les rôles",
        403,
      );
    }
    return;
  }

  // suspend / reactivate
  if (target.role === "user") {
    return;
  }

  // cible admin ou super_admin
  if (actor.role !== "super_admin") {
    throw new AppError(
      "ADM_004",
      "Un administrateur ne peut pas agir sur un compte admin",
      403,
    );
  }
}

/**
 * Refuse si le COUNT de super_admin actifs est ≤ 1 et que la mutation
 * retirerait le privilège. À appeler APRÈS verrou FOR UPDATE dans la tx.
 */
export function assertNotLastActiveSuperAdmin(
  activeSuperAdminCount: number,
  current: { role: UserRole; status: UserStatus },
  next: { role?: UserRole; status?: UserStatus },
): void {
  if (!removesActiveSuperAdminPrivilege(current, next)) {
    return;
  }
  if (activeSuperAdminCount <= 1) {
    throw new AppError(
      "ADM_004",
      "Impossible : le système doit conserver au moins un super_admin actif",
      403,
    );
  }
}
