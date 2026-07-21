import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  updatePreferencesSchema,
  type UpdatePreferencesInput,
} from "@/features/users/schemas";
import { defaultPreferencesData } from "@/features/users/services/defaults";
import type { UserPreferencesDto } from "@/features/users/types";

function toPreferencesDto(row: {
  userId: string;
  distanceUnit: string;
  temperatureUnit: string;
  fuelUnit: string;
  notificationsEnabled: boolean;
  aiProactive: boolean;
  costcoMember: boolean;
  updatedAt: Date;
}): UserPreferencesDto {
  return {
    userId: row.userId,
    distanceUnit: row.distanceUnit,
    temperatureUnit: row.temperatureUnit,
    fuelUnit: row.fuelUnit,
    notificationsEnabled: row.notificationsEnabled,
    aiProactive: row.aiProactive,
    costcoMember: row.costcoMember,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Crée les préférences si absentes (comptes pré-migration). */
export async function ensurePreferences(userId: string) {
  const existing = await prisma.userPreference.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  return prisma.userPreference.create({
    data: defaultPreferencesData(userId),
  });
}

export async function getPreferences(
  userId: string,
): Promise<UserPreferencesDto> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true },
  });
  if (!user) {
    throw new AppError("USR_001", "Utilisateur introuvable", 404);
  }

  const prefs = await ensurePreferences(userId);
  return toPreferencesDto(prefs);
}

export async function updatePreferences(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<UserPreferencesDto> {
  let input: UpdatePreferencesInput;
  try {
    input = updatePreferencesSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "USR_005",
        error.issues[0]?.message ?? "Préférences invalides",
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

  const before = await ensurePreferences(userId);

  const updated = await prisma.userPreference.update({
    where: { userId },
    data: {
      distanceUnit: input.distanceUnit,
      temperatureUnit: input.temperatureUnit,
      fuelUnit: input.fuelUnit,
      notificationsEnabled: input.notificationsEnabled,
      aiProactive: input.aiProactive,
      costcoMember: input.costcoMember,
    },
  });

  await writeAuditLog({
    userId,
    entity: "user_preferences",
    entityId: userId,
    action: "update",
    oldValue: {
      distanceUnit: before.distanceUnit,
      temperatureUnit: before.temperatureUnit,
      fuelUnit: before.fuelUnit,
      notificationsEnabled: before.notificationsEnabled,
      aiProactive: before.aiProactive,
      costcoMember: before.costcoMember,
    },
    newValue: {
      distanceUnit: updated.distanceUnit,
      temperatureUnit: updated.temperatureUnit,
      fuelUnit: updated.fuelUnit,
      notificationsEnabled: updated.notificationsEnabled,
      aiProactive: updated.aiProactive,
      costcoMember: updated.costcoMember,
    },
    ipAddress,
  });

  return toPreferencesDto(updated);
}
