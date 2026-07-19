import { describe, expect, it } from "vitest";
import {
  adminAuditQuerySchema,
  adminUserListQuerySchema,
  adminUserRolePatchSchema,
  adminUserSuspendSchema,
  adminUserNoteCreateSchema,
  adminUserNoteUpdateSchema,
  adminUserRevokeSessionsSchema,
  adminUserPasswordResetSchema,
  adminUserResendVerificationSchema,
  adminUserReactivateSchema,
} from "@/features/admin/schemas";

describe("admin schemas", () => {
  it("parse une liste utilisateurs", () => {
    const parsed = adminUserListQuerySchema.parse({
      q: "sebavio",
      status: "active",
      page: "2",
      hasTrips: "true",
      sort: "email",
      order: "asc",
    });
    expect(parsed.page).toBe(2);
    expect(parsed.q).toBe("sebavio");
    expect(parsed.hasTrips).toBe(true);
    expect(parsed.sort).toBe("email");
    expect(parsed.order).toBe("asc");
    expect(parsed.pageSize).toBe(20);
  });

  it("refuse un pageSize hors 20|50|100", () => {
    expect(adminUserListQuerySchema.safeParse({ pageSize: "25" }).success).toBe(
      false,
    );
  });

  it("accepte pageSize 50 et 100", () => {
    expect(adminUserListQuerySchema.parse({ pageSize: "50" }).pageSize).toBe(
      50,
    );
    expect(adminUserListQuerySchema.parse({ pageSize: "100" }).pageSize).toBe(
      100,
    );
  });

  it("parse emailVerified / hasVehicles", () => {
    const parsed = adminUserListQuerySchema.parse({
      emailVerified: "false",
      hasVehicles: "1",
    });
    expect(parsed.emailVerified).toBe(false);
    expect(parsed.hasVehicles).toBe(true);
  });

  it("refuse un rôle invalide", () => {
    expect(
      adminUserRolePatchSchema.safeParse({
        role: "owner",
        reason: "test motif",
      }).success,
    ).toBe(false);
  });

  it("exige un motif pour le changement de rôle", () => {
    expect(adminUserRolePatchSchema.safeParse({ role: "admin" }).success).toBe(
      false,
    );
  });

  it("exige un motif de suspension (≥ 3 car.)", () => {
    expect(adminUserSuspendSchema.safeParse({ reason: "ab" }).success).toBe(
      false,
    );
    expect(adminUserSuspendSchema.safeParse({ reason: "abus" }).success).toBe(
      true,
    );
  });

  it("parse réactivation / révocation / reset / vérification", () => {
    expect(
      adminUserReactivateSchema.parse({ reason: "fin suspension" }).reason,
    ).toBe("fin suspension");
    expect(
      adminUserRevokeSessionsSchema.parse({
        reason: "compromission",
        allowSelf: true,
      }).allowSelf,
    ).toBe(true);
    expect(
      adminUserPasswordResetSchema.parse({ reason: "oubli client" }).reason,
    ).toBe("oubli client");
    expect(
      adminUserResendVerificationSchema.parse({ reason: "spam filtre" }).reason,
    ).toBe("spam filtre");
  });

  it("parse une note admin", () => {
    const parsed = adminUserNoteCreateSchema.parse({
      content: "Contacté le client",
      category: "support",
    });
    expect(parsed.importance).toBe("normal");
  });

  it("exige au moins un champ pour update note", () => {
    expect(adminUserNoteUpdateSchema.safeParse({}).success).toBe(false);
    expect(
      adminUserNoteUpdateSchema.safeParse({ content: "mise à jour" }).success,
    ).toBe(true);
  });

  it("parse des filtres audit", () => {
    const parsed = adminAuditQuerySchema.parse({
      entity: "users",
      action: "USER_SUSPENDED",
      from: "2026-01-01",
    });
    expect(parsed.entity).toBe("users");
    expect(parsed.from).toBeInstanceOf(Date);
  });
});
