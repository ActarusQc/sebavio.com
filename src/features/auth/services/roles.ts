import type { UserRole } from "@/lib/constants";

export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}
