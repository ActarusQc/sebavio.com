import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  favoriteCreateSchema,
  type FavoriteCreateInput,
} from "@/features/activities/schemas";
import { toActivityDto } from "@/features/activities/services/mappers";
import type { ActivityFavoriteDto } from "@/features/activities/types";

function parseZod<T>(parse: () => T, fallbackMessage: string): T {
  try {
    return parse();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? fallbackMessage,
        400,
      );
    }
    throw error;
  }
}

export async function listFavorites(
  userId: string,
): Promise<ActivityFavoriteDto[]> {
  const rows = await prisma.userActivityFavorite.findMany({
    where: { userId, deletedAt: null },
    include: { activity: true },
    orderBy: { createdAt: "desc" },
  });

  return rows
    .filter((r) => r.activity.deletedAt == null)
    .map((r) => ({
      id: r.id,
      activityId: r.activityId,
      notes: r.notes,
      activity: toActivityDto(r.activity),
      createdAt: r.createdAt.toISOString(),
    }));
}

export async function addFavorite(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<ActivityFavoriteDto> {
  const input: FavoriteCreateInput = parseZod(
    () => favoriteCreateSchema.parse(raw),
    "Favori invalide",
  );

  const activity = await prisma.activity.findFirst({
    where: { id: input.activityId, deletedAt: null },
  });
  if (!activity) {
    throw new AppError("ACT_001", "Activité introuvable", 404);
  }

  const existing = await prisma.userActivityFavorite.findFirst({
    where: { userId, activityId: input.activityId },
  });

  let row;
  if (existing && existing.deletedAt == null) {
    throw new AppError("ACT_002", "Cette activité est déjà en favori", 409);
  }

  if (existing) {
    row = await prisma.userActivityFavorite.update({
      where: { id: existing.id },
      data: {
        deletedAt: null,
        notes: input.notes ?? null,
      },
      include: { activity: true },
    });
  } else {
    row = await prisma.userActivityFavorite.create({
      data: {
        userId,
        activityId: input.activityId,
        notes: input.notes ?? null,
      },
      include: { activity: true },
    });
  }

  await writeAuditLog({
    userId,
    entity: "user_activity_favorites",
    entityId: row.id,
    action: "create",
    newValue: { activityId: input.activityId },
    ipAddress,
  });

  return {
    id: row.id,
    activityId: row.activityId,
    notes: row.notes,
    activity: toActivityDto(row.activity),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function removeFavorite(
  userId: string,
  activityId: string,
  ipAddress?: string | null,
): Promise<void> {
  const existing = await prisma.userActivityFavorite.findFirst({
    where: { userId, activityId, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("ACT_001", "Favori introuvable", 404);
  }

  await prisma.userActivityFavorite.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    userId,
    entity: "user_activity_favorites",
    entityId: existing.id,
    action: "delete",
    oldValue: { activityId },
    ipAddress,
  });
}
