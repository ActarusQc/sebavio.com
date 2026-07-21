import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/features/users/schemas";
import { defaultProfileData } from "@/features/users/services/defaults";
import { getHomeAddress } from "@/features/users/services/home-address";
import type { CurrentUserDto, UserProfileDto } from "@/features/users/types";

async function toProfileDto(userId: string): Promise<UserProfileDto> {
  const row = await prisma.userProfile.findUniqueOrThrow({ where: { userId } });
  const homeAddress = await getHomeAddress(userId);
  return {
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    language: row.language,
    country: row.country,
    currency: row.currency,
    timezone: row.timezone,
    travelStyle: row.travelStyle,
    budgetLevel: row.budgetLevel,
    homeAddress,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Crée le profil s'il n'existe pas (comptes pré-migration). */
export async function ensureProfile(userId: string) {
  const existing = await prisma.userProfile.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  return prisma.userProfile.create({
    data: defaultProfileData(userId),
  });
}

export async function getCurrentUserWithProfile(
  userId: string,
): Promise<CurrentUserDto> {
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
    throw new AppError("USR_001", "Utilisateur introuvable", 404);
  }

  await ensureProfile(userId);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified?.toISOString() ?? null,
    profile: await toProfileDto(userId),
  };
}

export async function updateProfile(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<UserProfileDto> {
  let input: UpdateProfileInput;
  try {
    input = updateProfileSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "USR_002",
        error.issues[0]?.message ?? "Profil invalide",
        400,
      );
    }
    throw error;
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true },
  });
  if (!user) {
    throw new AppError("USR_001", "Utilisateur introuvable", 404);
  }

  const before = await ensureProfile(userId);

  const updated = await prisma.userProfile.update({
    where: { userId },
    data: {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.travelStyle !== undefined
        ? { travelStyle: input.travelStyle }
        : {}),
      ...(input.budgetLevel !== undefined
        ? { budgetLevel: input.budgetLevel }
        : {}),
    },
  });

  await writeAuditLog({
    userId,
    entity: "user_profile",
    entityId: userId,
    action: "update",
    oldValue: {
      firstName: before.firstName,
      lastName: before.lastName,
      language: before.language,
      country: before.country,
      currency: before.currency,
      timezone: before.timezone,
      travelStyle: before.travelStyle,
      budgetLevel: before.budgetLevel,
    },
    newValue: {
      firstName: updated.firstName,
      lastName: updated.lastName,
      language: updated.language,
      country: updated.country,
      currency: updated.currency,
      timezone: updated.timezone,
      travelStyle: updated.travelStyle,
      budgetLevel: updated.budgetLevel,
    },
    ipAddress,
  });

  return toProfileDto(userId);
}
