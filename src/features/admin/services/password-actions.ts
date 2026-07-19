import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { UserRole, UserStatus } from "@/lib/constants";
import type { AuthUser } from "@/features/auth/types";
import { issueVerificationToken } from "@/features/auth/services/tokens";
import { assertEmailAuthRateLimit } from "@/features/auth/services/email-rate-limit";
import { sendAuthEmail } from "@/services/email";
import { assertActorCanActOnTarget } from "@/features/admin/services/roles-policy";
import { writeAdminAuditLog } from "@/features/admin/services/audit-write";

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3050"
  );
}

export type AdminPasswordActionOptions = {
  reason: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

function requireReason(reason: string | undefined): string {
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 3) {
    throw new AppError("ADM_002", "Motif requis (minimum 3 caractères)", 400);
  }
  return trimmed;
}

/**
 * Envoie un lien de réinitialisation de mot de passe à la cible.
 * Ne retourne jamais le jeton.
 */
export async function adminSendPasswordReset(
  targetId: string,
  actor: AuthUser,
  options: AdminPasswordActionOptions,
): Promise<{ sent: true }> {
  const reason = requireReason(options.reason);
  const ip = options.ipAddress ?? "unknown";

  const target = await prisma.user.findFirst({
    where: { id: targetId, deletedAt: null },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
    },
  });

  if (!target) {
    throw new AppError("ADM_003", "Utilisateur introuvable", 404);
  }

  assertActorCanActOnTarget(
    { id: actor.id, role: actor.role },
    {
      id: target.id,
      role: target.role as UserRole,
      status: target.status as UserStatus,
    },
    "password_reset",
  );

  if (target.status !== "active") {
    throw new AppError(
      "ADM_002",
      "Réinitialisation possible uniquement pour un compte actif",
      400,
    );
  }

  await assertEmailAuthRateLimit("forgot-password", ip, target.email);

  const { token } = await issueVerificationToken(
    "reset-password",
    target.email,
  );
  const link = `${appBaseUrl()}/reset-password?email=${encodeURIComponent(target.email)}&token=${encodeURIComponent(token)}`;

  await sendAuthEmail({
    to: target.email,
    kind: "reset-password",
    link,
  });

  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "users",
    entityId: targetId,
    action: "USER_PASSWORD_RESET_REQUESTED",
    reason,
    newValue: { email: target.email },
    ipAddress: options.ipAddress ?? null,
    userAgent: options.userAgent ?? null,
    requestId: options.requestId ?? null,
  });

  return { sent: true };
}

/**
 * Renvoie le courriel de vérification d'adresse.
 * Ne retourne jamais le jeton.
 */
export async function adminResendVerification(
  targetId: string,
  actor: AuthUser,
  options: AdminPasswordActionOptions,
): Promise<{ sent: true }> {
  const reason = requireReason(options.reason);
  const ip = options.ipAddress ?? "unknown";

  const target = await prisma.user.findFirst({
    where: { id: targetId, deletedAt: null },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
    },
  });

  if (!target) {
    throw new AppError("ADM_003", "Utilisateur introuvable", 404);
  }

  assertActorCanActOnTarget(
    { id: actor.id, role: actor.role },
    {
      id: target.id,
      role: target.role as UserRole,
      status: target.status as UserStatus,
    },
    "resend_verification",
  );

  if (target.emailVerified != null) {
    throw new AppError("ADM_002", "Courriel déjà vérifié", 400);
  }

  if (target.status !== "active") {
    throw new AppError(
      "ADM_002",
      "Renvoi possible uniquement pour un compte actif",
      400,
    );
  }

  await assertEmailAuthRateLimit("resend-verification", ip, target.email);

  const { token } = await issueVerificationToken("verify-email", target.email);
  const link = `${appBaseUrl()}/verify-email?email=${encodeURIComponent(target.email)}&token=${encodeURIComponent(token)}`;

  await sendAuthEmail({
    to: target.email,
    kind: "verify-email",
    link,
  });

  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "users",
    entityId: targetId,
    action: "USER_VERIFICATION_RESENT",
    reason,
    newValue: { email: target.email },
    ipAddress: options.ipAddress ?? null,
    userAgent: options.userAgent ?? null,
    requestId: options.requestId ?? null,
  });

  return { sent: true };
}
