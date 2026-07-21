import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "@/features/users/schemas";

describe("changePasswordSchema", () => {
  it("accepte un changement valide", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1",
      newPassword: "NewPass12",
      confirmPassword: "NewPass12",
    });
    expect(result.success).toBe(true);
  });

  it("refuse si confirmation différente", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1",
      newPassword: "NewPass12",
      confirmPassword: "NewPass99",
    });
    expect(result.success).toBe(false);
  });

  it("refuse un nouveau mot de passe trop court", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPass1",
      newPassword: "allo123",
      confirmPassword: "allo123",
    });
    expect(result.success).toBe(false);
  });
});
