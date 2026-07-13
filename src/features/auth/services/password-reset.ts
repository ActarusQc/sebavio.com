import { prisma } from "@/lib/prisma";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from "@/features/auth/schemas";
import { hashPassword } from "./password";
import { consumeVerificationToken, issueVerificationToken } from "./tokens";
import { writeAuditLog } from "./audit";
import { sendAuthEmail } from "@/services/email";

function appBaseUrl(): string {
  return (
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

/** Toujours succès générique (pas d'énumération de comptes). */
export async function requestPasswordReset(
  raw: ForgotPasswordInput,
  ipAddress?: string | null,
): Promise<void> {
  const input = forgotPasswordSchema.parse(raw);

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

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
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
