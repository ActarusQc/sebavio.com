import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  hashPassword,
  verifyPassword,
} from "@/features/auth/services/password";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/features/users/schemas";

/**
 * Change le mot de passe du compte connecté (mot de passe actuel requis).
 */
export async function changePassword(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<void> {
  let input: ChangePasswordInput;
  try {
    input = changePasswordSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "AUTH_002",
        error.issues[0]?.message ?? "Mot de passe invalide",
        400,
      );
    }
    throw error;
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    throw new AppError("USR_001", "Utilisateur introuvable", 404);
  }

  const currentValid = await verifyPassword(
    user.passwordHash,
    input.currentPassword,
  );
  if (!currentValid) {
    throw new AppError("AUTH_002", "Mot de passe actuel incorrect", 400);
  }

  if (input.currentPassword === input.newPassword) {
    throw new AppError(
      "AUTH_002",
      "Le nouveau mot de passe doit être différent de l’actuel",
      400,
    );
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await writeAuditLog({
    userId: user.id,
    entity: "user",
    entityId: user.id,
    action: "change_password",
    ipAddress,
  });
}
