import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import { MAX_PAGE_SIZE } from "@/features/travel-groups/constants";
import {
  memberCreateSchema,
  memberUpdateSchema,
  petCreateSchema,
  petUpdateSchema,
  preferencesUpsertSchema,
  travelGroupCreateSchema,
  travelGroupsListSchema,
  travelGroupUpdateSchema,
  type MemberCreateInput,
  type MemberUpdateInput,
  type PetCreateInput,
  type PetUpdateInput,
  type PreferencesUpsertInput,
  type TravelGroupCreateInput,
  type TravelGroupUpdateInput,
} from "@/features/travel-groups/schemas";
import {
  clampPageSize,
  toGroupDetailDto,
  toGroupDto,
  toMemberDto,
  toPaginated,
  toPetDto,
  toPreferencesDto,
} from "@/features/travel-groups/services/mappers";
import type {
  PaginatedTravelGroups,
  PetDto,
  TravelGroupDetailDto,
  TravelMemberDto,
  TravelPreferencesDto,
} from "@/features/travel-groups/types";

const groupListInclude = {
  _count: { select: { members: true, pets: true } },
} as const;

const groupDetailInclude = {
  members: { orderBy: { createdAt: "asc" as const } },
  pets: { orderBy: { createdAt: "asc" as const } },
  preferences: true,
} as const;

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

function decimalOrUndefined(
  value: number | null | undefined,
): Prisma.Decimal | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Prisma.Decimal(value);
}

/** Groupe actif du propriétaire — 404 (USR_003) hors périmètre. */
export async function getOwnedGroupOrThrow(userId: string, groupId: string) {
  const group = await prisma.travelGroup.findFirst({
    where: { id: groupId, ownerUserId: userId, deletedAt: null },
    include: groupDetailInclude,
  });
  if (!group) {
    throw new AppError("USR_003", "Groupe introuvable", 404);
  }
  return group;
}

/** Vérifie qu'un groupe actif appartient à l'utilisateur (lien trip). */
export async function assertOwnedTravelGroup(
  userId: string,
  groupId: string,
): Promise<void> {
  const group = await prisma.travelGroup.findFirst({
    where: { id: groupId, ownerUserId: userId, deletedAt: null },
    select: { id: true },
  });
  if (!group) {
    throw new AppError("USR_003", "Groupe introuvable", 404);
  }
}

export async function listTravelGroups(
  userId: string,
  query: unknown,
): Promise<PaginatedTravelGroups> {
  const parsed = parseZod(
    () => travelGroupsListSchema.parse(query),
    "Paramètres invalides",
  );
  const pageSize = clampPageSize(parsed.pageSize, MAX_PAGE_SIZE);
  const page = parsed.page;
  const where = { ownerUserId: userId, deletedAt: null };

  const [total, rows] = await Promise.all([
    prisma.travelGroup.count({ where }),
    prisma.travelGroup.findMany({
      where,
      include: groupListInclude,
      orderBy: [{ defaultGroup: "desc" }, { createdAt: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return toPaginated(rows.map(toGroupDto), page, pageSize, total);
}

export async function getTravelGroupById(
  userId: string,
  groupId: string,
): Promise<TravelGroupDetailDto> {
  const group = await getOwnedGroupOrThrow(userId, groupId);
  return toGroupDetailDto(group);
}

export async function createTravelGroup(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<TravelGroupDetailDto> {
  const input: TravelGroupCreateInput = parseZod(
    () => travelGroupCreateSchema.parse(raw),
    "Groupe invalide",
  );

  const group = await prisma.$transaction(async (tx) => {
    const existingCount = await tx.travelGroup.count({
      where: { ownerUserId: userId, deletedAt: null },
    });
    /** Premier groupe → default_group=true automatiquement. */
    const makeDefault = existingCount === 0 || input.defaultGroup === true;

    if (makeDefault && existingCount > 0) {
      await tx.travelGroup.updateMany({
        where: { ownerUserId: userId, deletedAt: null, defaultGroup: true },
        data: { defaultGroup: false },
      });
    }

    return tx.travelGroup.create({
      data: {
        ownerUserId: userId,
        name: input.name,
        defaultGroup: makeDefault,
        preferences: { create: {} },
      },
      include: groupDetailInclude,
    });
  });

  await writeAuditLog({
    userId,
    entity: "travel_groups",
    entityId: group.id,
    action: "create",
    newValue: { name: group.name, defaultGroup: group.defaultGroup },
    ipAddress,
  });

  return toGroupDetailDto(group);
}

export async function updateTravelGroup(
  userId: string,
  groupId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<TravelGroupDetailDto> {
  const existing = await getOwnedGroupOrThrow(userId, groupId);
  const input: TravelGroupUpdateInput = parseZod(
    () => travelGroupUpdateSchema.parse(raw),
    "Groupe invalide",
  );

  const updated = await prisma.$transaction(async (tx) => {
    if (input.defaultGroup === true) {
      await tx.travelGroup.updateMany({
        where: {
          ownerUserId: userId,
          deletedAt: null,
          defaultGroup: true,
          NOT: { id: groupId },
        },
        data: { defaultGroup: false },
      });
    }

    return tx.travelGroup.update({
      where: { id: groupId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.defaultGroup !== undefined
          ? { defaultGroup: input.defaultGroup }
          : {}),
      },
      include: groupDetailInclude,
    });
  });

  await writeAuditLog({
    userId,
    entity: "travel_groups",
    entityId: groupId,
    action: "update",
    oldValue: { name: existing.name, defaultGroup: existing.defaultGroup },
    newValue: { name: updated.name, defaultGroup: updated.defaultGroup },
    ipAddress,
  });

  return toGroupDetailDto(updated);
}

/**
 * Soft-delete groupe.
 * Refusé si lié à des voyages actifs (planned | in_progress).
 * Si seulement completed/cancelled : soft-delete OK, FK conservée (historique).
 * Si le groupe était default : le plus ancien restant (created_at ASC) devient défaut.
 */
export async function deleteTravelGroup(
  userId: string,
  groupId: string,
  ipAddress?: string | null,
): Promise<void> {
  const existing = await getOwnedGroupOrThrow(userId, groupId);

  const activeTrips = await prisma.trip.findMany({
    where: {
      travelGroupId: groupId,
      deletedAt: null,
      status: { in: ["planned", "in_progress"] },
    },
    select: { id: true, title: true },
    orderBy: { departureDate: "asc" },
  });

  if (activeTrips.length > 0) {
    const titles = activeTrips.map((t) => `« ${t.title} »`).join(", ");
    throw new AppError(
      "USR_004",
      `Impossible de supprimer ce groupe : lié aux voyages actifs ${titles}`,
      409,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.travelGroup.update({
      where: { id: groupId },
      data: { deletedAt: new Date(), defaultGroup: false },
    });

    if (existing.defaultGroup) {
      const nextDefault = await tx.travelGroup.findFirst({
        where: { ownerUserId: userId, deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (nextDefault) {
        await tx.travelGroup.update({
          where: { id: nextDefault.id },
          data: { defaultGroup: true },
        });
      }
    }
  });

  await writeAuditLog({
    userId,
    entity: "travel_groups",
    entityId: groupId,
    action: "delete",
    oldValue: { name: existing.name, defaultGroup: existing.defaultGroup },
    ipAddress,
  });
}

export async function setDefaultTravelGroup(
  userId: string,
  groupId: string,
  ipAddress?: string | null,
): Promise<TravelGroupDetailDto> {
  await getOwnedGroupOrThrow(userId, groupId);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.travelGroup.updateMany({
      where: { ownerUserId: userId, deletedAt: null, defaultGroup: true },
      data: { defaultGroup: false },
    });
    return tx.travelGroup.update({
      where: { id: groupId },
      data: { defaultGroup: true },
      include: groupDetailInclude,
    });
  });

  await writeAuditLog({
    userId,
    entity: "travel_groups",
    entityId: groupId,
    action: "set_default",
    newValue: { defaultGroup: true },
    ipAddress,
  });

  return toGroupDetailDto(updated);
}

export async function addMember(
  userId: string,
  groupId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<TravelMemberDto> {
  await getOwnedGroupOrThrow(userId, groupId);
  const input: MemberCreateInput = parseZod(
    () => memberCreateSchema.parse(raw),
    "Membre invalide",
  );

  const member = await prisma.travelMember.create({
    data: {
      groupId,
      firstName: input.firstName,
      birthDate: input.birthDate ?? null,
      relationship: input.relationship ?? null,
      mobilityLevel: input.mobilityLevel ?? null,
      specialNeeds: input.specialNeeds ?? null,
      notes: input.notes ?? null,
    },
  });

  await writeAuditLog({
    userId,
    entity: "travel_members",
    entityId: member.id,
    action: "create",
    newValue: { groupId, firstName: member.firstName },
    ipAddress,
  });

  return toMemberDto(member);
}

export async function updateMember(
  userId: string,
  groupId: string,
  memberId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<TravelMemberDto> {
  await getOwnedGroupOrThrow(userId, groupId);
  const existing = await prisma.travelMember.findFirst({
    where: { id: memberId, groupId },
  });
  if (!existing) {
    throw new AppError("USR_003", "Membre introuvable", 404);
  }

  const input: MemberUpdateInput = parseZod(
    () => memberUpdateSchema.parse(raw),
    "Membre invalide",
  );

  const updated = await prisma.travelMember.update({
    where: { id: memberId },
    data: {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : {}),
      ...(input.relationship !== undefined
        ? { relationship: input.relationship }
        : {}),
      ...(input.mobilityLevel !== undefined
        ? { mobilityLevel: input.mobilityLevel }
        : {}),
      ...(input.specialNeeds !== undefined
        ? { specialNeeds: input.specialNeeds }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  await writeAuditLog({
    userId,
    entity: "travel_members",
    entityId: memberId,
    action: "update",
    oldValue: { firstName: existing.firstName },
    newValue: { firstName: updated.firstName },
    ipAddress,
  });

  return toMemberDto(updated);
}

export async function deleteMember(
  userId: string,
  groupId: string,
  memberId: string,
  ipAddress?: string | null,
): Promise<void> {
  await getOwnedGroupOrThrow(userId, groupId);
  const existing = await prisma.travelMember.findFirst({
    where: { id: memberId, groupId },
  });
  if (!existing) {
    throw new AppError("USR_003", "Membre introuvable", 404);
  }

  await prisma.travelMember.delete({ where: { id: memberId } });

  await writeAuditLog({
    userId,
    entity: "travel_members",
    entityId: memberId,
    action: "delete",
    oldValue: { firstName: existing.firstName, groupId },
    ipAddress,
  });
}

export async function addPet(
  userId: string,
  groupId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<PetDto> {
  await getOwnedGroupOrThrow(userId, groupId);
  const input: PetCreateInput = parseZod(
    () => petCreateSchema.parse(raw),
    "Animal invalide",
  );

  const pet = await prisma.pet.create({
    data: {
      groupId,
      name: input.name,
      species: input.species ?? null,
      breed: input.breed ?? null,
      weightKg: decimalOrUndefined(input.weightKg) ?? null,
      notes: input.notes ?? null,
    },
  });

  await writeAuditLog({
    userId,
    entity: "pets",
    entityId: pet.id,
    action: "create",
    newValue: { groupId, name: pet.name },
    ipAddress,
  });

  return toPetDto(pet);
}

export async function updatePet(
  userId: string,
  groupId: string,
  petId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<PetDto> {
  await getOwnedGroupOrThrow(userId, groupId);
  const existing = await prisma.pet.findFirst({
    where: { id: petId, groupId },
  });
  if (!existing) {
    throw new AppError("USR_003", "Animal introuvable", 404);
  }

  const input: PetUpdateInput = parseZod(
    () => petUpdateSchema.parse(raw),
    "Animal invalide",
  );

  const updated = await prisma.pet.update({
    where: { id: petId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.species !== undefined ? { species: input.species } : {}),
      ...(input.breed !== undefined ? { breed: input.breed } : {}),
      ...(input.weightKg !== undefined
        ? { weightKg: decimalOrUndefined(input.weightKg) }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  await writeAuditLog({
    userId,
    entity: "pets",
    entityId: petId,
    action: "update",
    oldValue: { name: existing.name },
    newValue: { name: updated.name },
    ipAddress,
  });

  return toPetDto(updated);
}

export async function deletePet(
  userId: string,
  groupId: string,
  petId: string,
  ipAddress?: string | null,
): Promise<void> {
  await getOwnedGroupOrThrow(userId, groupId);
  const existing = await prisma.pet.findFirst({
    where: { id: petId, groupId },
  });
  if (!existing) {
    throw new AppError("USR_003", "Animal introuvable", 404);
  }

  await prisma.pet.delete({ where: { id: petId } });

  await writeAuditLog({
    userId,
    entity: "pets",
    entityId: petId,
    action: "delete",
    oldValue: { name: existing.name, groupId },
    ipAddress,
  });
}

export async function getPreferences(
  userId: string,
  groupId: string,
): Promise<TravelPreferencesDto> {
  await getOwnedGroupOrThrow(userId, groupId);
  const prefs = await prisma.travelPreferences.findUnique({
    where: { groupId },
  });
  if (!prefs) {
    const created = await prisma.travelPreferences.create({
      data: { groupId },
    });
    return toPreferencesDto(created);
  }
  return toPreferencesDto(prefs);
}

export async function upsertPreferences(
  userId: string,
  groupId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<TravelPreferencesDto> {
  await getOwnedGroupOrThrow(userId, groupId);
  const input: PreferencesUpsertInput = parseZod(
    () => preferencesUpsertSchema.parse(raw),
    "Préférences invalides",
  );

  const prefs = await prisma.travelPreferences.upsert({
    where: { groupId },
    create: {
      groupId,
      maxDriveHours: decimalOrUndefined(input.maxDriveHours) ?? null,
      dailyBudget: decimalOrUndefined(input.dailyBudget) ?? null,
      preferredCampgroundType: input.preferredCampgroundType ?? null,
      avoidTolls: input.avoidTolls ?? false,
      avoidFerries: input.avoidFerries ?? false,
      preferredActivityTypes: input.preferredActivityTypes ?? Prisma.JsonNull,
      foodPreferences: input.foodPreferences ?? Prisma.JsonNull,
      accessibilityRequired: input.accessibilityRequired ?? false,
    },
    update: {
      ...(input.maxDriveHours !== undefined
        ? { maxDriveHours: decimalOrUndefined(input.maxDriveHours) }
        : {}),
      ...(input.dailyBudget !== undefined
        ? { dailyBudget: decimalOrUndefined(input.dailyBudget) }
        : {}),
      ...(input.preferredCampgroundType !== undefined
        ? { preferredCampgroundType: input.preferredCampgroundType }
        : {}),
      ...(input.avoidTolls !== undefined
        ? { avoidTolls: input.avoidTolls }
        : {}),
      ...(input.avoidFerries !== undefined
        ? { avoidFerries: input.avoidFerries }
        : {}),
      ...(input.preferredActivityTypes !== undefined
        ? {
            preferredActivityTypes:
              input.preferredActivityTypes ?? Prisma.JsonNull,
          }
        : {}),
      ...(input.foodPreferences !== undefined
        ? { foodPreferences: input.foodPreferences ?? Prisma.JsonNull }
        : {}),
      ...(input.accessibilityRequired !== undefined
        ? { accessibilityRequired: input.accessibilityRequired }
        : {}),
    },
  });

  await writeAuditLog({
    userId,
    entity: "travel_preferences",
    entityId: groupId,
    action: "upsert",
    newValue: {
      maxDriveHours: prefs.maxDriveHours?.toString() ?? null,
      dailyBudget: prefs.dailyBudget?.toString() ?? null,
    },
    ipAddress,
  });

  return toPreferencesDto(prefs);
}
