import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  favoriteCreateSchema,
  type FavoriteCreateInput,
} from "@/features/campings/schemas";
import { toCampgroundDto } from "@/features/campings/services/mappers";
import type { CampgroundFavoriteDto } from "@/features/campings/types";

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
): Promise<CampgroundFavoriteDto[]> {
  const rows = await prisma.userCampgroundFavorite.findMany({
    where: { userId, deletedAt: null },
    include: { campground: true },
    orderBy: { createdAt: "desc" },
  });

  return rows
    .filter((r) => r.campground.deletedAt == null)
    .map((r) => ({
      id: r.id,
      campgroundId: r.campgroundId,
      notes: r.notes,
      campground: toCampgroundDto(r.campground),
      createdAt: r.createdAt.toISOString(),
    }));
}

export async function addFavorite(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<CampgroundFavoriteDto> {
  const input: FavoriteCreateInput = parseZod(
    () => favoriteCreateSchema.parse(raw),
    "Favori invalide",
  );

  const campground = await prisma.campground.findFirst({
    where: { id: input.campgroundId, deletedAt: null },
  });
  if (!campground) {
    throw new AppError("CAMP_001", "Camping introuvable", 404);
  }

  const existing = await prisma.userCampgroundFavorite.findFirst({
    where: { userId, campgroundId: input.campgroundId },
  });

  let row;
  if (existing && existing.deletedAt == null) {
    throw new AppError("CAMP_002", "Ce camping est déjà en favori", 409);
  }

  if (existing) {
    row = await prisma.userCampgroundFavorite.update({
      where: { id: existing.id },
      data: {
        deletedAt: null,
        notes: input.notes ?? null,
      },
      include: { campground: true },
    });
  } else {
    row = await prisma.userCampgroundFavorite.create({
      data: {
        userId,
        campgroundId: input.campgroundId,
        notes: input.notes ?? null,
      },
      include: { campground: true },
    });
  }

  await writeAuditLog({
    userId,
    entity: "user_campground_favorites",
    entityId: row.id,
    action: "create",
    newValue: { campgroundId: input.campgroundId },
    ipAddress,
  });

  return {
    id: row.id,
    campgroundId: row.campgroundId,
    notes: row.notes,
    campground: toCampgroundDto(row.campground),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function removeFavorite(
  userId: string,
  campgroundId: string,
  ipAddress?: string | null,
): Promise<void> {
  const existing = await prisma.userCampgroundFavorite.findFirst({
    where: { userId, campgroundId, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("CAMP_001", "Favori introuvable", 404);
  }

  await prisma.userCampgroundFavorite.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    userId,
    entity: "user_campground_favorites",
    entityId: existing.id,
    action: "delete",
    oldValue: { campgroundId },
    ipAddress,
  });
}
