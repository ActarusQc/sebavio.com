import { describe, expect, it } from "vitest";
import {
  adminAuditQuerySchema,
  adminUserListQuerySchema,
  adminUserRolePatchSchema,
} from "@/features/admin/schemas";

describe("admin schemas", () => {
  it("parse une liste utilisateurs", () => {
    const parsed = adminUserListQuerySchema.parse({
      q: "sebavio",
      status: "active",
      page: "2",
    });
    expect(parsed.page).toBe(2);
    expect(parsed.q).toBe("sebavio");
  });

  it("refuse un rôle invalide", () => {
    expect(adminUserRolePatchSchema.safeParse({ role: "owner" }).success).toBe(
      false,
    );
  });

  it("parse des filtres audit", () => {
    const parsed = adminAuditQuerySchema.parse({
      entity: "users",
      action: "ADMIN_SUSPEND",
      from: "2026-01-01",
    });
    expect(parsed.entity).toBe("users");
    expect(parsed.from).toBeInstanceOf(Date);
  });
});
