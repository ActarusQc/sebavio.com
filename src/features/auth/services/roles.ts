import type { UserRole } from "@/lib/constants";
import { isStaffRole, isContentAdminRole } from "@/lib/rbac";

/** Accès au portail `/admin` (tous les rôles staff). */
export function isAdminRole(role: UserRole): boolean {
  return isStaffRole(role);
}

/** Admin contenu (catalogue, campings, activités) : admin | super_admin. */
export function isContentAdmin(role: UserRole): boolean {
  return isContentAdminRole(role);
}
