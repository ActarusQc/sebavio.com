import {
  CAMPGROUND_SERVICES,
  type CampgroundService,
} from "@/features/campings/constants";
import type { CampgroundDto } from "@/features/campings/types";

function decimalToString(
  value: { toString(): string } | null | undefined,
): string | null {
  if (value == null) return null;
  return value.toString();
}

function parseServices(raw: unknown): CampgroundService[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<string>(CAMPGROUND_SERVICES);
  return raw.filter((s): s is CampgroundService => {
    return typeof s === "string" && allowed.has(s);
  });
}

export function toCampgroundDto(
  row: {
    id: string;
    name: string;
    latitude: { toString(): string };
    longitude: { toString(): string };
    address: string | null;
    city: string | null;
    region: string | null;
    countryCode: string;
    campgroundType: string;
    maxLengthM: { toString(): string } | null;
    services: unknown;
    petFriendly: boolean;
    rating: { toString(): string } | null;
    priceMin: { toString(): string } | null;
    priceMax: { toString(): string } | null;
    reservationUrl: string | null;
    source: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
  distanceKm: number | null = null,
): CampgroundDto {
  return {
    id: row.id,
    name: row.name,
    latitude: row.latitude.toString(),
    longitude: row.longitude.toString(),
    address: row.address,
    city: row.city,
    region: row.region,
    countryCode: row.countryCode,
    campgroundType: row.campgroundType,
    maxLengthM: decimalToString(row.maxLengthM),
    services: parseServices(row.services),
    petFriendly: row.petFriendly,
    rating: decimalToString(row.rating),
    priceMin: decimalToString(row.priceMin),
    priceMax: decimalToString(row.priceMax),
    reservationUrl: row.reservationUrl,
    source: row.source,
    archived: Boolean(row.deletedAt),
    distanceKm,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
