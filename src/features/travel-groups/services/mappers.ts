import type {
  PaginatedTravelGroups,
  PetDto,
  TravelGroupDetailDto,
  TravelGroupDto,
  TravelMemberDto,
  TravelPreferencesDto,
} from "@/features/travel-groups/types";

function decimalToString(
  value: { toString(): string } | null | undefined,
): string | null {
  if (value == null) return null;
  return value.toString();
}

function dateToIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

function dateOnlyToIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

export function clampPageSize(pageSize: number, max: number): number {
  if (!Number.isFinite(pageSize) || pageSize < 1) return 1;
  return Math.min(pageSize, max);
}

function asStringArray(value: unknown): string[] | null {
  if (value == null) return null;
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return value;
  }
  return null;
}

export function toMemberDto(row: {
  id: string;
  groupId: string;
  firstName: string;
  birthDate: Date | null;
  relationship: string | null;
  mobilityLevel: string | null;
  specialNeeds: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TravelMemberDto {
  return {
    id: row.id,
    groupId: row.groupId,
    firstName: row.firstName,
    birthDate: dateOnlyToIso(row.birthDate),
    relationship: row.relationship,
    mobilityLevel: row.mobilityLevel,
    specialNeeds: row.specialNeeds,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toPetDto(row: {
  id: string;
  groupId: string;
  name: string;
  species: string | null;
  breed: string | null;
  weightKg: { toString(): string } | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PetDto {
  return {
    id: row.id,
    groupId: row.groupId,
    name: row.name,
    species: row.species,
    breed: row.breed,
    weightKg: decimalToString(row.weightKg),
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toPreferencesDto(row: {
  groupId: string;
  maxDriveHours: { toString(): string } | null;
  dailyBudget: { toString(): string } | null;
  preferredCampgroundType: string | null;
  avoidTolls: boolean;
  avoidFerries: boolean;
  preferredActivityTypes: unknown;
  foodPreferences: unknown;
  accessibilityRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TravelPreferencesDto {
  return {
    groupId: row.groupId,
    maxDriveHours: decimalToString(row.maxDriveHours),
    dailyBudget: decimalToString(row.dailyBudget),
    preferredCampgroundType: row.preferredCampgroundType,
    avoidTolls: row.avoidTolls,
    avoidFerries: row.avoidFerries,
    preferredActivityTypes: asStringArray(row.preferredActivityTypes),
    foodPreferences: asStringArray(row.foodPreferences),
    accessibilityRequired: row.accessibilityRequired,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toGroupDto(row: {
  id: string;
  ownerUserId: string;
  name: string;
  defaultGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: { members: number; pets: number };
  members?: unknown[];
  pets?: unknown[];
}): TravelGroupDto {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    name: row.name,
    defaultGroup: row.defaultGroup,
    memberCount:
      row._count?.members ??
      (Array.isArray(row.members) ? row.members.length : 0),
    petCount:
      row._count?.pets ?? (Array.isArray(row.pets) ? row.pets.length : 0),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toGroupDetailDto(row: {
  id: string;
  ownerUserId: string;
  name: string;
  defaultGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
  members: Parameters<typeof toMemberDto>[0][];
  pets: Parameters<typeof toPetDto>[0][];
  preferences: Parameters<typeof toPreferencesDto>[0] | null;
}): TravelGroupDetailDto {
  return {
    ...toGroupDto({
      ...row,
      _count: { members: row.members.length, pets: row.pets.length },
    }),
    members: row.members.map(toMemberDto),
    pets: row.pets.map(toPetDto),
    preferences: row.preferences ? toPreferencesDto(row.preferences) : null,
  };
}

export function toPaginated(
  items: TravelGroupDto[],
  page: number,
  pageSize: number,
  total: number,
): PaginatedTravelGroups {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export { dateToIso };
