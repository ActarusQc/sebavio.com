import { describe, expect, it } from "vitest";
import {
  canAccessAdminPortal,
  canAssignRole,
  hasPermission,
  isStaffRole,
  listPermissions,
  ROLE_PERMISSIONS,
} from "@/lib/rbac";
import type { UserRole } from "@/lib/constants";

describe("RBAC admin — permissions", () => {
  it("refuse le portail à un utilisateur standard", () => {
    expect(canAccessAdminPortal("user")).toBe(false);
    expect(isStaffRole("user")).toBe(false);
    expect(hasPermission("user", "admin.portal")).toBe(false);
    expect(listPermissions("user")).toEqual([]);
  });

  it("accorde le portail à tous les rôles staff", () => {
    const staff: UserRole[] = [
      "support",
      "analyst",
      "billing_admin",
      "admin",
      "super_admin",
    ];
    for (const role of staff) {
      expect(hasPermission(role, "admin.portal")).toBe(true);
    }
  });

  it("SUPPORT voit les users mais pas les secrets IA ni les remboursements", () => {
    expect(hasPermission("support", "users.read")).toBe(true);
    expect(hasPermission("support", "users.suspend")).toBe(true);
    expect(hasPermission("support", "ai.secrets.manage")).toBe(false);
    expect(hasPermission("support", "billing.refund")).toBe(false);
    expect(hasPermission("support", "plans.manage")).toBe(false);
  });

  it("ANALYST voit les stats uniquement", () => {
    expect(hasPermission("analyst", "analytics.read")).toBe(true);
    expect(hasPermission("analyst", "users.read")).toBe(false);
    expect(hasPermission("analyst", "billing.read")).toBe(false);
    expect(hasPermission("analyst", "ai.secrets.manage")).toBe(false);
  });

  it("BILLING_ADMIN gère facturation sans secrets ni rôles", () => {
    expect(hasPermission("billing_admin", "billing.refund")).toBe(true);
    expect(hasPermission("billing_admin", "billing.manage")).toBe(true);
    expect(hasPermission("billing_admin", "ai.secrets.manage")).toBe(false);
    expect(hasPermission("billing_admin", "users.roles.manage")).toBe(false);
    expect(hasPermission("billing_admin", "content.manage")).toBe(false);
  });

  it("ADMIN a support+analyse+facturation+plans, pas les secrets", () => {
    expect(hasPermission("admin", "plans.manage")).toBe(true);
    expect(hasPermission("admin", "users.read")).toBe(true);
    expect(hasPermission("admin", "billing.refund")).toBe(true);
    expect(hasPermission("admin", "analytics.read")).toBe(true);
    expect(hasPermission("admin", "audit.read")).toBe(true);
    expect(hasPermission("admin", "ai.secrets.manage")).toBe(false);
    expect(hasPermission("admin", "users.roles.manage")).toBe(false);
    expect(hasPermission("admin", "settings.manage")).toBe(false);
  });

  it("seul SUPER_ADMIN gère les clés IA et les rôles", () => {
    expect(hasPermission("super_admin", "ai.secrets.manage")).toBe(true);
    expect(hasPermission("super_admin", "users.roles.manage")).toBe(true);
    expect(hasPermission("super_admin", "settings.manage")).toBe(true);
    expect(ROLE_PERMISSIONS.super_admin.length).toBeGreaterThan(
      ROLE_PERMISSIONS.admin.length,
    );
  });

  it("ADMIN ne peut pas nommer ni retirer un SUPER_ADMIN", () => {
    expect(canAssignRole("admin", "user", "super_admin")).toBe(false);
    expect(canAssignRole("admin", "super_admin", "user")).toBe(false);
    expect(canAssignRole("admin", "user", "support")).toBe(false);
    expect(canAssignRole("super_admin", "user", "admin")).toBe(true);
    expect(canAssignRole("super_admin", "admin", "super_admin")).toBe(true);
  });
});
