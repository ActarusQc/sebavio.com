import { describe, expect, it } from "vitest";
import {
  adminEnvironmentLabel,
  resolveAdminEnvironment,
} from "@/features/admin/lib/environment";
import { ADMIN_NAV_ITEMS } from "@/features/admin/constants";
import { hasPermission } from "@/lib/rbac";
import type { UserRole } from "@/lib/constants";

describe("admin environment banner", () => {
  it("mappe SEBAVIO_ENV production", () => {
    const prev = process.env.SEBAVIO_ENV;
    process.env.SEBAVIO_ENV = "production";
    expect(resolveAdminEnvironment()).toBe("production");
    expect(adminEnvironmentLabel("production")).toBe("Production");
    process.env.SEBAVIO_ENV = prev;
  });

  it("respecte SEBAVIO_ENV=staging comme Test", () => {
    const prev = process.env.SEBAVIO_ENV;
    process.env.SEBAVIO_ENV = "staging";
    expect(resolveAdminEnvironment()).toBe("test");
    expect(adminEnvironmentLabel("test")).toBe("Test");
    process.env.SEBAVIO_ENV = prev;
  });

  it("libellé développement", () => {
    expect(adminEnvironmentLabel("development")).toBe("Développement");
  });
});

describe("admin nav visibility by role", () => {
  function visibleHrefs(role: UserRole): string[] {
    return ADMIN_NAV_ITEMS.filter((item) =>
      hasPermission(role, item.permission),
    ).map((item) => item.href);
  }

  it("USER ne voit aucune section admin", () => {
    expect(visibleHrefs("user")).toEqual([]);
  });

  it("ANALYST ne voit pas users ni ai secrets", () => {
    const hrefs = visibleHrefs("analyst");
    expect(hrefs).toContain("/admin");
    expect(hrefs).toContain("/admin/analytics");
    expect(hrefs).not.toContain("/admin/users");
    expect(hrefs).not.toContain("/admin/ai");
    expect(hrefs).not.toContain("/admin/payments");
  });

  it("SUPPORT voit users + résumé abonnements, pas paiements/webhooks/audit", () => {
    const hrefs = visibleHrefs("support");
    expect(hrefs).toContain("/admin/users");
    expect(hrefs).toContain("/admin/subscriptions");
    expect(hrefs).not.toContain("/admin/payments");
    expect(hrefs).not.toContain("/admin/invoices");
    expect(hrefs).not.toContain("/admin/webhooks/stripe");
    expect(hrefs).not.toContain("/admin/audit");
    expect(hrefs).not.toContain("/admin/ai");
  });

  it("SUPER_ADMIN voit toutes les sections", () => {
    const hrefs = visibleHrefs("super_admin");
    for (const item of ADMIN_NAV_ITEMS) {
      expect(hrefs).toContain(item.href);
    }
  });
});
