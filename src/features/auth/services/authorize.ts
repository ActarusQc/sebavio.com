import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/features/auth/schemas";
import { EmailUnverifiedError } from "@/features/auth/errors";
import { verifyPassword } from "./password";
import { assertLoginRateLimit, clearLoginRateLimit } from "./rate-limit";
import { writeAuditLog } from "./audit";

export type CredentialsUser = {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: Date | null;
};

/**
 * Authentifie email/mot de passe pour Auth.js Credentials.
 * Retourne null en cas d'échec (Auth.js n'expose pas le détail au client).
 */
export async function authorizeCredentials(
  emailRaw: unknown,
  passwordRaw: unknown,
  ip: string,
): Promise<CredentialsUser | null> {
  const parsed = loginSchema.safeParse({
    email: emailRaw,
    password: passwordRaw,
  });

  if (!parsed.success) {
    return null;
  }

  const { email, password } = parsed.data;

  try {
    await assertLoginRateLimit(ip, email);
  } catch {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      status: true,
      emailVerified: true,
    },
  });

  if (!user?.passwordHash) {
    await writeAuditLog({
      entity: "auth",
      action: "login_failed",
      newValue: { reason: "unknown_user" },
      ipAddress: ip,
    });
    return null;
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    await writeAuditLog({
      userId: user.id,
      entity: "auth",
      entityId: user.id,
      action: "login_failed",
      newValue: { reason: "bad_password" },
      ipAddress: ip,
    });
    return null;
  }

  if (user.status === "suspended") {
    await writeAuditLog({
      userId: user.id,
      entity: "auth",
      entityId: user.id,
      action: "login_blocked",
      newValue: { reason: "suspended" },
      ipAddress: ip,
    });
    return null;
  }

  if (user.status !== "active") {
    return null;
  }

  if (!user.emailVerified) {
    await writeAuditLog({
      userId: user.id,
      entity: "auth",
      entityId: user.id,
      action: "login_blocked",
      newValue: { reason: "email_unverified" },
      ipAddress: ip,
    });
    throw new EmailUnverifiedError();
  }

  await clearLoginRateLimit(ip, email);

  await writeAuditLog({
    userId: user.id,
    entity: "auth",
    entityId: user.id,
    action: "login_success",
    ipAddress: ip,
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
  };
}
