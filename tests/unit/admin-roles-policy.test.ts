import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import {
  assertActorCanActOnTarget,
  assertNotLastActiveSuperAdmin,
  removesActiveSuperAdminPrivilege,
} from "@/features/admin/services/roles-policy";

const sa = {
  id: "11111111-1111-4111-8111-111111111111",
  role: "super_admin" as const,
};
const admin = {
  id: "22222222-2222-4222-8222-222222222222",
  role: "admin" as const,
};
const user = {
  id: "33333333-3333-4333-8333-333333333333",
  role: "user" as const,
  status: "active" as const,
};
const otherAdmin = {
  id: "44444444-4444-4444-8444-444444444444",
  role: "admin" as const,
  status: "active" as const,
};
const otherSa = {
  id: "55555555-5555-4555-8555-555555555555",
  role: "super_admin" as const,
  status: "active" as const,
};

describe("removesActiveSuperAdminPrivilege", () => {
  it("détecte une suspension de super_admin actif", () => {
    expect(
      removesActiveSuperAdminPrivilege(
        { role: "super_admin", status: "active" },
        { status: "suspended" },
      ),
    ).toBe(true);
  });

  it("détecte une rétrogradation super_admin → user", () => {
    expect(
      removesActiveSuperAdminPrivilege(
        { role: "super_admin", status: "active" },
        { role: "user" },
      ),
    ).toBe(true);
  });

  it("ignore une rétrogradation si déjà suspendu", () => {
    expect(
      removesActiveSuperAdminPrivilege(
        { role: "super_admin", status: "suspended" },
        { role: "user" },
      ),
    ).toBe(false);
  });

  it("ignore un changement admin → user", () => {
    expect(
      removesActiveSuperAdminPrivilege(
        { role: "admin", status: "active" },
        { role: "user" },
      ),
    ).toBe(false);
  });
});

describe("assertNotLastActiveSuperAdmin", () => {
  it("refuse suspension du dernier super_admin", () => {
    expect(() =>
      assertNotLastActiveSuperAdmin(
        1,
        { role: "super_admin", status: "active" },
        { status: "suspended" },
      ),
    ).toThrow(AppError);
  });

  it("refuse rétrogradation du dernier super_admin", () => {
    expect(() =>
      assertNotLastActiveSuperAdmin(
        1,
        { role: "super_admin", status: "active" },
        { role: "admin" },
      ),
    ).toThrow(AppError);
  });

  it("autorise si plusieurs super_admins actifs", () => {
    expect(() =>
      assertNotLastActiveSuperAdmin(
        2,
        { role: "super_admin", status: "active" },
        { status: "suspended" },
      ),
    ).not.toThrow();
  });
});

describe("assertActorCanActOnTarget — matrice", () => {
  it("admin peut suspendre un user", () => {
    expect(() =>
      assertActorCanActOnTarget(admin, user, "suspend"),
    ).not.toThrow();
  });

  it("admin ne peut pas suspendre un autre admin", () => {
    expect(() =>
      assertActorCanActOnTarget(admin, otherAdmin, "suspend"),
    ).toThrow(AppError);
  });

  it("admin ne peut pas suspendre un super_admin", () => {
    expect(() => assertActorCanActOnTarget(admin, otherSa, "suspend")).toThrow(
      AppError,
    );
  });

  it("admin ne peut pas changer de rôle", () => {
    expect(() => assertActorCanActOnTarget(admin, user, "change_role")).toThrow(
      AppError,
    );
  });

  it("super_admin peut changer un rôle", () => {
    expect(() =>
      assertActorCanActOnTarget(sa, user, "change_role"),
    ).not.toThrow();
  });

  it("super_admin peut suspendre un admin", () => {
    expect(() =>
      assertActorCanActOnTarget(sa, otherAdmin, "suspend"),
    ).not.toThrow();
  });

  it("personne ne peut agir sur soi-même", () => {
    expect(() =>
      assertActorCanActOnTarget(sa, { ...otherSa, id: sa.id }, "suspend"),
    ).toThrow(AppError);
    expect(() =>
      assertActorCanActOnTarget(sa, { ...otherSa, id: sa.id }, "change_role"),
    ).toThrow(AppError);
  });
});
