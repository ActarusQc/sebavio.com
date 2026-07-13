import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { createOpaqueToken, hashToken } from "./password";

const VERIFY_EMAIL_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_PASSWORD_TTL_MS = 60 * 60 * 1000;

export type TokenPurpose = "verify-email" | "reset-password";

function identifierFor(purpose: TokenPurpose, email: string): string {
  return `${purpose}:${email.toLowerCase()}`;
}

export async function issueVerificationToken(
  purpose: TokenPurpose,
  email: string,
): Promise<{ token: string; expires: Date }> {
  const normalized = email.toLowerCase();
  const identifier = identifierFor(purpose, normalized);
  const { token, tokenHash } = createOpaqueToken();
  const ttl =
    purpose === "verify-email" ? VERIFY_EMAIL_TTL_MS : RESET_PASSWORD_TTL_MS;
  const expires = new Date(Date.now() + ttl);

  await prisma.verificationToken.deleteMany({ where: { identifier } });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: tokenHash,
      expires,
    },
  });

  return { token, expires };
}

export async function consumeVerificationToken(
  purpose: TokenPurpose,
  email: string,
  token: string,
): Promise<void> {
  const identifier = identifierFor(purpose, email.toLowerCase());
  const tokenHash = hashToken(token);

  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: { identifier, token: tokenHash },
    },
  });

  if (!record || record.expires.getTime() < Date.now()) {
    if (record) {
      await prisma.verificationToken.delete({ where: { id: record.id } });
    }
    throw new AppError("AUTH_005", "Jeton expiré ou invalide", 400);
  }

  await prisma.verificationToken.delete({ where: { id: record.id } });
}
