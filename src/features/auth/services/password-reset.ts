import { prisma } from "@/lib/prisma";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  verifyEmailSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ResendVerificationInput,
  type VerifyEmailInput,
} from "@/features/auth/schemas";
import { hashPassword } from "./password";
import { consumeVerificationToken, issueVerificationToken } from "./tokens";
import { writeAuditLog } from "./audit";
import { assertEmailAuthRateLimit } from "./email-rate-limit";
import { sendAuthEmail } from "@/services/email";

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3050"
  );
}

const GENERIC_RESET_MESSAGE =
  "Si un compte existe pour ce courriel, un lien de réinitialisation a été envoyé.";

const GENERIC_RESEND_MESSAGE =
  "Si un compte non vérifié existe pour ce courriel, un nouveau lien a été envoyé.";

/** Toujours succès générique (pas d'énumération de comptes). */
export async function requestPasswordReset(
  raw: ForgotPasswordInput,
  ipAddress?: string | null,
): Promise<void> {
  const input = forgotPasswordSchema.parse(raw);
  const ip = ipAddress ?? "unknown";

  await assertEmailAuthRateLimit("forgot-password", ip, input.email);

  const user = await prisma.user.findFirst({
    where: { email: input.email, deletedAt: null },
    select: { id: true, email: true, status: true },
  });

  if (user && user.status === "active") {
    const { token } = await issueVerificationToken(
      "reset-password",
      user.email,
    );
    const link = `${appBaseUrl()}/reset-password?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;

    await sendAuthEmail({
      to: user.email,
      kind: "reset-password",
      link,
    });

    await writeAuditLog({
      userId: user.id,
      entity: "user",
      entityId: user.id,
      action: "forgot_password",
      ipAddress,
    });
  }
}

export { GENERIC_RESET_MESSAGE, GENERIC_RESEND_MESSAGE };

/**
 * Re-demande du courriel de vérification.
 * Réponse toujours générique ; rate-limit 3/15 min ; soft-fail envoi.
 */
export async function resendVerificationEmail(
  raw: ResendVerificationInput,
  ipAddress?: string | null,
): Promise<void> {
  const input = resendVerificationSchema.parse(raw);
  const ip = ipAddress ?? "unknown";

  await assertEmailAuthRateLimit("resend-verification", ip, input.email);

  const user = await prisma.user.findFirst({
    where: { email: input.email, deletedAt: null },
    select: {
      id: true,
      email: true,
      status: true,
      emailVerified: true,
    },
  });

  if (user && user.status === "active" && user.emailVerified == null) {
    const { token } = await issueVerificationToken("verify-email", user.email);
    const link = `${appBaseUrl()}/verify-email?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;

    await sendAuthEmail({
      to: user.email,
      kind: "verify-email",
      link,
    });

    await writeAuditLog({
      userId: user.id,
      entity: "user",
      entityId: user.id,
      action: "resend_verification",
      ipAddress,
    });
  }
}

export async function resetPassword(
  raw: ResetPasswordInput,
  ipAddress?: string | null,
): Promise<void> {
  const input = resetPasswordSchema.parse(raw);

  await consumeVerificationToken("reset-password", input.email, input.token);

  const user = await prisma.user.findFirst({
    where: { email: input.email, deletedAt: null },
    select: { id: true },
  });

  if (!user) {
    return;
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        sessionVersion: { increment: 1 },
      },
    });
    await tx.session.updateMany({
      where: { userId: user.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  });

  await writeAuditLog({
    userId: user.id,
    entity: "user",
    entityId: user.id,
    action: "reset_password",
    ipAddress,
  });
}

export async function verifyEmail(
  raw: VerifyEmailInput,
  ipAddress?: string | null,
): Promise<void> {
  const input = verifyEmailSchema.parse(raw);

  await consumeVerificationToken("verify-email", input.email, input.token);

  const user = await prisma.user.findFirst({
    where: { email: input.email, deletedAt: null },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    return;
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  await writeAuditLog({
    userId: user.id,
    entity: "user",
    entityId: user.id,
    action: "verify_email",
    ipAddress,
  });
}
