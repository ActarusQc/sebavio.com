import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";
import { hashPassword } from "./password";
import { issueVerificationToken } from "./tokens";
import { writeAuditLog } from "./audit";
import { sendAuthEmail } from "@/services/email";
import {
  defaultProfileData,
  defaultPreferencesData,
} from "@/features/users/services/defaults";

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3050"
  );
}

export async function registerUser(
  raw: RegisterInput,
  ipAddress?: string | null,
): Promise<{ id: string; email: string }> {
  const input = registerSchema.parse(raw);

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError("AUTH_001", "Courriel invalide ou déjà utilisé", 409);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        status: "active",
        role: "user",
      },
      select: { id: true, email: true },
    });

    await tx.userProfile.create({
      data: defaultProfileData(created.id),
    });

    await tx.userPreference.create({
      data: defaultPreferencesData(created.id),
    });

    return created;
  });

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
    action: "register",
    newValue: { email: user.email },
    ipAddress,
  });

  return user;
}
