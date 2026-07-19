/**
 * RBAC administratif — permissions nommées (Phase 1–3).
 * Placé sous `lib/` pour éviter les dépendances circulaires auth ↔ admin.
 */

import type { UserRole } from "@/lib/constants";

export const ADMIN_PERMISSIONS = [
  "admin.portal",
  "admin.dashboard",
  "users.read",
  "users.notes",
  "users.notes.create",
  "users.resend_verification",
  "users.suspend",
  "users.sessions.revoke",
  "users.password.reset",
  "users.roles.manage",
  "users.export",
  "analytics.read",
  "billing.read",
  "billing.read_sensitive",
  "billing.manage",
  "billing.refund",
  "billing.subscriptions.manage",
  "billing.subscriptions.cancel",
  "billing.subscriptions.resume",
  "billing.payments.read",
  "billing.invoices.read",
  "billing.refunds.create",
  "billing.refunds.read",
  "billing.sync",
  "billing.webhooks.read",
  "billing.webhooks.retry",
  "billing.export",
  "plans.read",
  "plans.manage",
  "ai.read",
  "ai.secrets.manage",
  "audit.read",
  "audit.export",
  "settings.read",
  "settings.manage",
  "content.manage",
  "webhooks.diagnose",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const STAFF_ROLES = [
  "support",
  "analyst",
  "billing_admin",
  "admin",
  "super_admin",
] as const satisfies readonly UserRole[];

export type StaffRole = (typeof STAFF_ROLES)[number];

const ALL_STAFF: readonly AdminPermission[] = [
  "admin.portal",
  "admin.dashboard",
];

const SUPPORT_PERMS: readonly AdminPermission[] = [
  ...ALL_STAFF,
  "users.read",
  "users.notes",
  "users.notes.create",
  "users.resend_verification",
  "users.suspend",
  "users.sessions.revoke",
  "users.password.reset",
  "billing.read",
];

const ANALYST_PERMS: readonly AdminPermission[] = [
  ...ALL_STAFF,
  "analytics.read",
];

const BILLING_GRANULAR: readonly AdminPermission[] = [
  "billing.read",
  "billing.read_sensitive",
  "billing.subscriptions.manage",
  "billing.subscriptions.cancel",
  "billing.subscriptions.resume",
  "billing.payments.read",
  "billing.invoices.read",
  "billing.refunds.create",
  "billing.refunds.read",
  "billing.sync",
  "billing.webhooks.read",
  "billing.webhooks.retry",
  "billing.export",
  "billing.manage",
  "billing.refund",
];

const BILLING_PERMS: readonly AdminPermission[] = [
  ...ALL_STAFF,
  "users.read",
  ...BILLING_GRANULAR,
  "plans.read",
  "webhooks.diagnose",
];

const ADMIN_PERMS: readonly AdminPermission[] = [
  ...ALL_STAFF,
  "users.read",
  "users.notes",
  "users.notes.create",
  "users.resend_verification",
  "users.suspend",
  "users.sessions.revoke",
  "users.password.reset",
  "users.export",
  "analytics.read",
  ...BILLING_GRANULAR,
  "plans.read",
  "plans.manage",
  "audit.read",
  "audit.export",
  "settings.read",
  "content.manage",
  "webhooks.diagnose",
  "ai.read",
];

const SUPER_ADMIN_PERMS: readonly AdminPermission[] = [...ADMIN_PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, readonly AdminPermission[]> = {
  user: [],
  support: SUPPORT_PERMS,
  analyst: ANALYST_PERMS,
  billing_admin: BILLING_PERMS,
  admin: ADMIN_PERMS,
  super_admin: SUPER_ADMIN_PERMS,
};

const BILLING_MANAGE_ALIASES = [
  "billing.subscriptions.manage",
  "billing.subscriptions.cancel",
  "billing.subscriptions.resume",
  "billing.sync",
] as const satisfies readonly AdminPermission[];

/**
 * `users.notes` reste un alias lecture+création.
 * `billing.manage` → subscriptions.manage | cancel | resume | sync
 * `billing.refund` → billing.refunds.create
 */
export function hasPermission(
  role: UserRole,
  permission: AdminPermission,
): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!Array.isArray(perms)) return false;
  if (perms.includes(permission)) return true;

  if (permission === "users.notes.create" && perms.includes("users.notes")) {
    return true;
  }
  if (permission === "users.notes" && perms.includes("users.notes.create")) {
    return true;
  }

  if (permission === "billing.manage") {
    return BILLING_MANAGE_ALIASES.some((p) => perms.includes(p));
  }
  if (permission === "billing.refund") {
    return perms.includes("billing.refunds.create");
  }

  if (
    (BILLING_MANAGE_ALIASES as readonly string[]).includes(permission) &&
    perms.includes("billing.manage")
  ) {
    return true;
  }
  if (
    permission === "billing.refunds.create" &&
    perms.includes("billing.refund")
  ) {
    return true;
  }

  return false;
}

export function listPermissions(role: UserRole): readonly AdminPermission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function isStaffRole(role: UserRole): boolean {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export function canAccessAdminPortal(role: UserRole): boolean {
  return hasPermission(role, "admin.portal");
}

export function isContentAdminRole(role: UserRole): boolean {
  return hasPermission(role, "content.manage");
}

/**
 * Un ADMIN ne peut pas nommer ni retirer un SUPER_ADMIN.
 * Seul un SUPER_ADMIN gère les rôles via `users.roles.manage`.
 */
export function canAssignRole(
  actorRole: UserRole,
  _targetCurrentRole: UserRole,
  nextRole: UserRole,
): boolean {
  if (actorRole !== "super_admin") {
    return false;
  }
  void _targetCurrentRole;
  void nextRole;
  return true;
}
