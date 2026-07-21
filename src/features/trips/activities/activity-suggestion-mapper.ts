import { Prisma } from "@prisma/client";
import { guessEnvironment } from "@/features/trips/activities/activity-category-mapper";
import type {
  ActivitySuggestionStatus,
  RankedActivityCandidate,
  TripActivityDto,
  TripTravelerProfileDto,
} from "@/features/trips/activities/activity-types";

type ProfileRow = {
  id: string;
  tripId: string;
  purpose: string;
  adultCount: number;
  childCount: number;
  childAges: unknown;
  interests: unknown;
  budgetPreference: string | null;
  durationPreference: string | null;
  maxDetourMinutes: number;
  environmentPreference: string | null;
  activityLevel: string | null;
  accessibilityNeeds: unknown;
  travelingWithPet: boolean;
  deferred: boolean;
  suggestionsGeneratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ActivityRow = {
  id: string;
  tripId: string;
  googlePlaceId: string;
  status: string;
  name: string;
  address: string | null;
  city: string | null;
  latitude: Prisma.Decimal | number;
  longitude: Prisma.Decimal | number;
  primaryType: string | null;
  types: unknown;
  rating: Prisma.Decimal | number | null;
  reviewCount: number | null;
  priceLevel: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  photoReference: string | null;
  suggestedForSegment: string | null;
  routePositionKm: Prisma.Decimal | number | null;
  detourDistanceKm: Prisma.Decimal | number | null;
  detourDurationMinutes: number | null;
  estimatedVisitMinutes: number | null;
  suitabilityScore: Prisma.Decimal | number | null;
  suitabilityReasons: unknown;
  warningReasons: unknown;
  rejectReason: string | null;
  plannedDate: Date | null;
  plannedStartTime: Date | null;
  plannedEndTime: Date | null;
  sequence: number | null;
  linkedStopId: string | null;
  insertPlacement: string | null;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => Number(v)).filter((n) => Number.isFinite(n));
}

function num(v: Prisma.Decimal | number | null | undefined): number | null {
  if (v == null) return null;
  return typeof v === "number" ? v : Number(v);
}

export function toTravelerProfileDto(row: ProfileRow): TripTravelerProfileDto {
  return {
    id: row.id,
    tripId: row.tripId,
    purpose: row.purpose as TripTravelerProfileDto["purpose"],
    adultCount: row.adultCount,
    childCount: row.childCount,
    childAges: asNumberArray(row.childAges),
    interests: asStringArray(
      row.interests,
    ) as TripTravelerProfileDto["interests"],
    budgetPreference:
      (row.budgetPreference as TripTravelerProfileDto["budgetPreference"]) ??
      null,
    durationPreference:
      (row.durationPreference as TripTravelerProfileDto["durationPreference"]) ??
      null,
    maxDetourMinutes: row.maxDetourMinutes,
    environmentPreference:
      (row.environmentPreference as TripTravelerProfileDto["environmentPreference"]) ??
      null,
    activityLevel:
      (row.activityLevel as TripTravelerProfileDto["activityLevel"]) ?? null,
    accessibilityNeeds: asStringArray(
      row.accessibilityNeeds,
    ) as TripTravelerProfileDto["accessibilityNeeds"],
    travelingWithPet: row.travelingWithPet,
    deferred: row.deferred,
    suggestionsGeneratedAt: row.suggestionsGeneratedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toTripActivityDto(row: ActivityRow): TripActivityDto {
  const types = asStringArray(row.types);
  return {
    id: row.id,
    tripId: row.tripId,
    googlePlaceId: row.googlePlaceId,
    status: row.status as ActivitySuggestionStatus,
    name: row.name,
    address: row.address,
    city: row.city,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    primaryType: row.primaryType,
    types,
    rating: num(row.rating),
    reviewCount: row.reviewCount,
    priceLevel: row.priceLevel,
    websiteUrl: row.websiteUrl,
    googleMapsUrl: row.googleMapsUrl,
    photoReference: row.photoReference,
    suggestedForSegment: row.suggestedForSegment,
    routePositionKm: num(row.routePositionKm),
    detourDistanceKm: num(row.detourDistanceKm),
    detourDurationMinutes: row.detourDurationMinutes,
    estimatedVisitMinutes: row.estimatedVisitMinutes,
    suitabilityScore: num(row.suitabilityScore),
    suitabilityReasons: asStringArray(row.suitabilityReasons),
    warningReasons: asStringArray(row.warningReasons),
    rejectReason: row.rejectReason,
    plannedDate: row.plannedDate?.toISOString() ?? null,
    plannedStartTime: row.plannedStartTime?.toISOString() ?? null,
    plannedEndTime: row.plannedEndTime?.toISOString() ?? null,
    sequence: row.sequence,
    linkedStopId: row.linkedStopId,
    insertPlacement: row.insertPlacement,
    environmentGuess: guessEnvironment(types, row.primaryType),
  };
}

export function rankedToCreateData(
  tripId: string,
  ranked: RankedActivityCandidate,
): Prisma.TripActivityCreateManyInput {
  return {
    tripId,
    googlePlaceId: ranked.googlePlaceId,
    status: "suggested",
    name: ranked.name.slice(0, 300),
    address: ranked.address,
    city: ranked.city,
    latitude: new Prisma.Decimal(ranked.latitude),
    longitude: new Prisma.Decimal(ranked.longitude),
    primaryType: ranked.primaryType,
    types: ranked.types,
    rating: ranked.rating != null ? new Prisma.Decimal(ranked.rating) : null,
    reviewCount: ranked.reviewCount,
    priceLevel: ranked.priceLevel,
    websiteUrl: ranked.websiteUrl,
    googleMapsUrl: ranked.googleMapsUrl,
    photoReference: ranked.photoReference,
    suggestedForSegment: ranked.suggestedForSegment,
    routePositionKm:
      ranked.routePositionKm != null
        ? new Prisma.Decimal(ranked.routePositionKm)
        : null,
    detourDistanceKm:
      ranked.detourDistanceKm != null
        ? new Prisma.Decimal(ranked.detourDistanceKm)
        : null,
    detourDurationMinutes: ranked.detourDurationMinutes,
    estimatedVisitMinutes: ranked.estimatedVisitMinutes,
    suitabilityScore: new Prisma.Decimal(ranked.suitabilityScore),
    suitabilityReasons: ranked.suitabilityReasons,
    warningReasons: ranked.warningReasons,
    rawMetadata: {
      searchZoneKind: ranked.searchZoneKind,
      environmentGuess: ranked.environmentGuess,
    },
  };
}
