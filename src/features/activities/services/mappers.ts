import {
  ACTIVITY_SEASONS,
  type ActivitySeason,
} from "@/features/activities/constants";
import type { ActivityDto } from "@/features/activities/types";

function decimalToString(
  value: { toString(): string } | null | undefined,
): string | null {
  if (value == null) return null;
  return value.toString();
}

export function parseSeasons(raw: unknown): ActivitySeason[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<string>(ACTIVITY_SEASONS);
  return raw.filter((s): s is ActivitySeason => {
    return typeof s === "string" && allowed.has(s);
  });
}

/** true si l'activité couvre au moins une des saisons demandées. */
export function seasonsOverlap(
  activitySeasons: ActivitySeason[],
  filterSeasons: ActivitySeason[],
): boolean {
  if (filterSeasons.length === 0) return true;
  if (activitySeasons.includes("year_round")) return true;
  const set = new Set(activitySeasons);
  return filterSeasons.some((s) => set.has(s) || s === "year_round");
}

export function toActivityDto(
  row: {
    id: string;
    name: string;
    kind: string;
    category: string;
    latitude: { toString(): string };
    longitude: { toString(): string };
    address: string | null;
    city: string | null;
    region: string | null;
    countryCode: string;
    familyScore: number | null;
    petFriendly: boolean;
    estimatedDurationMin: number | null;
    priceIndicative: { toString(): string } | null;
    season: unknown;
    description: string | null;
    rating: { toString(): string } | null;
    website: string | null;
    source: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
  distanceKm: number | null = null,
): ActivityDto {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    category: row.category,
    latitude: row.latitude.toString(),
    longitude: row.longitude.toString(),
    address: row.address,
    city: row.city,
    region: row.region,
    countryCode: row.countryCode,
    familyScore: row.familyScore,
    petFriendly: row.petFriendly,
    estimatedDurationMin: row.estimatedDurationMin,
    priceIndicative: decimalToString(row.priceIndicative),
    season: parseSeasons(row.season),
    description: row.description,
    rating: decimalToString(row.rating),
    website: row.website,
    source: row.source,
    archived: Boolean(row.deletedAt),
    distanceKm,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
