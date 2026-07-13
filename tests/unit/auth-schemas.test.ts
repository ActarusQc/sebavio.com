import { describe, expect, it } from "vitest";
import {
  registerSchema,
  loginSchema,
  passwordSchema,
} from "@/features/auth/schemas";
import {
  hashToken,
  createOpaqueToken,
} from "@/features/auth/services/password";
import { isAdminRole } from "@/features/auth/services/roles";

describe("auth schemas", () => {
  it("accepte un mot de passe conforme", () => {
    expect(passwordSchema.safeParse("Secret12").success).toBe(true);
  });

  it("refuse un mot de passe trop court", () => {
    expect(passwordSchema.safeParse("Ab1").success).toBe(false);
  });

  it("valide registerSchema", () => {
    const result = registerSchema.safeParse({
      email: "User@Example.COM",
      password: "Secret12",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("refuse login sans mot de passe", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.co", password: "" }).success,
    ).toBe(false);
  });
});

describe("token hashing", () => {
  it("produit une empreinte stable", () => {
    const { token, tokenHash } = createOpaqueToken();
    expect(tokenHash).toBe(hashToken(token));
    expect(tokenHash).not.toBe(token);
  });
});

describe("roles", () => {
  it("détecte admin et super_admin", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("super_admin")).toBe(true);
    expect(isAdminRole("user")).toBe(false);
  });
});
