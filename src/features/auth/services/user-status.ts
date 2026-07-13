import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { UserRole, UserStatus } from "@/lib/constants";
import type { AuthUser } from "@/features/auth/types";

function toAuthUser(user: {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: Date | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    status: user.status as UserStatus,
    emailVerified: user.emailVerified,
  };
}

/**
 * Re-vérifie le statut en base (révocation JWT effective).
 * À utiliser pour mutations et routes sensibles (/admin).
 */
export async function assertUserActive(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new AppError("AUTH_006", "Accès refusé", 403);
  }

  if (user.status === "suspended") {
    throw new AppError("AUTH_003", "Compte suspendu", 403);
  }

  if (user.status !== "active") {
    throw new AppError("AUTH_006", "Accès refusé", 403);
  }

  return toAuthUser(user);
}

export async function getUserStatusSnapshot(userId: string): Promise<{
  status: UserStatus;
  role: UserRole;
  email: string;
  emailVerified: Date | null;
} | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      status: true,
      role: true,
      email: true,
      emailVerified: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    status: user.status as UserStatus,
    role: user.role as UserRole,
    email: user.email,
    emailVerified: user.emailVerified,
  };
}
