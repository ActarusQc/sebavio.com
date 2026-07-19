import { describe, expect, it, vi, beforeEach } from "vitest";
import { authConfig } from "@/lib/auth.config";
import { ADMIN_PERMISSIONS, hasPermission, isStaffRole } from "@/lib/rbac";
import { adminAccessRedirectPath } from "@/features/auth/services/admin-access";
import { AppError } from "@/lib/errors";
import { getVisibleNavItems } from "@/components/layout/navigation";
import { USER_ROLES } from "@/lib/constants";

function callAuthorized(
  auth: { user?: { id?: string; role?: string; status?: string } } | null,
  pathname: string,
): boolean | Response {
  const authorized = authConfig.callbacks.authorized;
  if (!authorized) throw new Error("authorized callback missing");
  return authorized({
    auth: auth as never,
    request: {
      nextUrl: new URL(`http://localhost:3050${pathname}`),
    } as never,
  }) as boolean | Response;
}

describe("proxy authorized — accès /admin", () => {
  it("refuse sans session", () => {
    expect(callAuthorized(null, "/admin")).toBe(false);
    expect(callAuthorized({ user: {} }, "/admin")).toBe(false);
  });

  it("refuse un compte non actif", () => {
    expect(
      callAuthorized(
        { user: { id: "u1", role: "super_admin", status: "suspended" } },
        "/admin",
      ),
    ).toBe(false);
  });

  it("laisse passer un JWT encore en rôle user si session active (RBAC DB ensuite)", () => {
    expect(
      callAuthorized(
        { user: { id: "u1", role: "user", status: "active" } },
        "/admin",
      ),
    ).toBe(true);
  });

  it("laisse passer super_admin et les autres rôles staff au Proxy", () => {
    for (const role of [
      "support",
      "analyst",
      "billing_admin",
      "admin",
      "super_admin",
    ]) {
      expect(
        callAuthorized(
          { user: { id: "u1", role, status: "active" } },
          "/admin",
        ),
      ).toBe(true);
    }
  });

  it("n'autorise pas une boucle via pages auth quand déjà connecté", () => {
    const result = callAuthorized(
      { user: { id: "u1", role: "user", status: "active" } },
      "/login",
    );
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("location")).toContain(
      "/dashboard",
    );
  });
});

describe("RBAC — valeurs de rôle snake_case", () => {
  it("super_admin a toutes les permissions admin", () => {
    for (const permission of ADMIN_PERMISSIONS) {
      expect(hasPermission("super_admin", permission)).toBe(true);
    }
    expect(isStaffRole("super_admin")).toBe(true);
  });

  it("refuse la casse SCREAMING_SNAKE (incohérence Prisma/Auth)", () => {
    // @ts-expect-error — valeur invalide volontaire
    expect(hasPermission("SUPER_ADMIN", "admin.portal")).toBe(false);
    // @ts-expect-error — valeur invalide volontaire
    expect(isStaffRole("SUPER_ADMIN")).toBe(false);
    expect(USER_ROLES).toContain("super_admin");
    expect(USER_ROLES).not.toContain("SUPER_ADMIN");
  });
});

describe("adminAccessRedirectPath", () => {
  it("envoie les 401 vers /login et les 403 vers /forbidden", () => {
    expect(
      adminAccessRedirectPath(new AppError("AUTH_006", "Accès refusé", 401)),
    ).toBe("/login");
    expect(
      adminAccessRedirectPath(new AppError("ADM_001", "Accès refusé", 403)),
    ).toBe("/forbidden");
    expect(adminAccessRedirectPath(new Error("boom"))).toBe("/forbidden");
  });
});

describe("bouton / lien Administration", () => {
  it("pointe vers /admin pour les rôles staff et reste invisible pour user", () => {
    expect(
      getVisibleNavItems("user").some((item) => item.href === "/admin"),
    ).toBe(false);

    for (const role of [
      "support",
      "analyst",
      "billing_admin",
      "admin",
      "super_admin",
    ] as const) {
      const adminItem = getVisibleNavItems(role).find(
        (item) => item.href === "/admin",
      );
      expect(adminItem).toBeDefined();
      expect(adminItem?.href).toBe("/admin");
      expect(adminItem?.label).toBe("Administration");
    }
  });
});

describe("requireStaffUser — JWT périmé vs rôle DB", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("accorde l'accès quand le JWT dit user mais PostgreSQL dit super_admin", async () => {
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn(async () => ({
        user: {
          id: "11111111-1111-4111-8111-111111111111",
          email: "promo@example.com",
          role: "user",
          status: "active",
        },
      })),
    }));
    vi.doMock("@/features/auth/services/user-status", () => ({
      assertUserActive: vi.fn(async () => ({
        id: "11111111-1111-4111-8111-111111111111",
        email: "promo@example.com",
        role: "super_admin",
        status: "active",
        emailVerified: new Date(),
        sessionVersion: 0,
      })),
    }));

    const { requireStaffUser } =
      await import("@/features/auth/services/session");
    const user = await requireStaffUser();
    expect(user.role).toBe("super_admin");
  });

  it("refuse un utilisateur standard même si le JWT prétend admin", async () => {
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn(async () => ({
        user: {
          id: "22222222-2222-4222-8222-222222222222",
          email: "user@example.com",
          role: "admin",
          status: "active",
        },
      })),
    }));
    vi.doMock("@/features/auth/services/user-status", () => ({
      assertUserActive: vi.fn(async () => ({
        id: "22222222-2222-4222-8222-222222222222",
        email: "user@example.com",
        role: "user",
        status: "active",
        emailVerified: new Date(),
        sessionVersion: 0,
      })),
    }));

    const { requireStaffUser } =
      await import("@/features/auth/services/session");
    await expect(requireStaffUser()).rejects.toMatchObject({
      code: "ADM_001",
      status: 403,
    });
  });
});
