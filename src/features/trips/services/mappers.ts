import type { TripStatus } from "@/features/trips/constants";
import type {
  TripDetailDto,
  TripDto,
  TripGroupSummaryDto,
  TripRouteDto,
  TripStopActivityDto,
  TripStopCampgroundDto,
  TripStopDto,
  TripSummaryDto,
  TripVehicleSummaryDto,
} from "@/features/trips/types";
import { ACTIVITY_STOP_DISTANCE_WARN_KM } from "@/features/activities/constants";
import { CAMPGROUND_STOP_DISTANCE_WARN_KM } from "@/features/campings/constants";
import { haversineKm } from "@/lib/geo";
import { computeWaypointsHash } from "@/services/maps/cache";

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

function toStopCampgroundDto(
  campground:
    | {
        id: string;
        name: string;
        latitude: { toString(): string };
        longitude: { toString(): string };
        deletedAt: Date | null;
      }
    | null
    | undefined,
): TripStopCampgroundDto | null {
  if (!campground) return null;
  return {
    id: campground.id,
    name: campground.name,
    archived: Boolean(campground.deletedAt),
    latitude: campground.latitude.toString(),
    longitude: campground.longitude.toString(),
  };
}

function toStopActivityDtos(
  stopLat: { toString(): string } | null | undefined,
  stopLng: { toString(): string } | null | undefined,
  links:
    | {
        deletedAt: Date | null;
        sequence: number;
        activity: {
          id: string;
          name: string;
          kind: string;
          category: string;
          latitude: { toString(): string };
          longitude: { toString(): string };
          deletedAt: Date | null;
        };
      }[]
    | null
    | undefined,
): TripStopActivityDto[] {
  if (!links?.length) return [];
  return links
    .filter((l) => l.deletedAt == null)
    .sort((a, b) => a.sequence - b.sequence)
    .map((l) => {
      let distanceKm: number | null = null;
      let distanceWarning: string | null = null;
      if (stopLat != null && stopLng != null) {
        distanceKm =
          Math.round(
            haversineKm(
              Number(stopLat.toString()),
              Number(stopLng.toString()),
              Number(l.activity.latitude),
              Number(l.activity.longitude),
            ) * 10,
          ) / 10;
        if (distanceKm > ACTIVITY_STOP_DISTANCE_WARN_KM) {
          distanceWarning = `à ${distanceKm} km`;
        }
      }
      return {
        id: l.activity.id,
        name: l.activity.name,
        kind: l.activity.kind,
        category: l.activity.category,
        archived: Boolean(l.activity.deletedAt),
        latitude: l.activity.latitude.toString(),
        longitude: l.activity.longitude.toString(),
        distanceKm,
        distanceWarning,
      };
    });
}

export function clampPageSize(pageSize: number, max: number): number {
  if (!Number.isFinite(pageSize) || pageSize < 1) return 1;
  return Math.min(pageSize, max);
}

export function vehicleDisplayName(row: {
  nickname: string | null;
  isManualEntry: boolean;
  manualManufacturerName: string | null;
  manualModelName: string | null;
  manualYear: number | null;
  model: {
    modelName: string;
    year: number;
    manufacturer: { name: string };
  } | null;
}): string {
  if (row.nickname?.trim()) return row.nickname.trim();
  if (row.model) {
    return `${row.model.manufacturer.name} ${row.model.modelName} (${row.model.year})`;
  }
  if (row.manualManufacturerName && row.manualModelName) {
    const year = row.manualYear ? ` (${row.manualYear})` : "";
    return `${row.manualManufacturerName} ${row.manualModelName}${year}`;
  }
  return "Véhicule";
}

export function toStopDto(row: {
  id: string;
  tripId: string;
  sequence: number;
  name: string;
  address: string | null;
  latitude: { toString(): string } | null;
  longitude: { toString(): string } | null;
  arrivalTime: Date | null;
  departureTime: Date | null;
  stopType: string;
  campgroundId?: string | null;
  campground?: {
    id: string;
    name: string;
    latitude: { toString(): string };
    longitude: { toString(): string };
    deletedAt: Date | null;
  } | null;
  stopActivities?: {
    deletedAt: Date | null;
    sequence: number;
    activity: {
      id: string;
      name: string;
      kind: string;
      category: string;
      latitude: { toString(): string };
      longitude: { toString(): string };
      deletedAt: Date | null;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}): TripStopDto {
  const campground = toStopCampgroundDto(row.campground);
  let distanceKmToCampground: number | null = null;
  let distanceWarning: string | null = null;

  if (campground && row.latitude != null && row.longitude != null) {
    distanceKmToCampground =
      Math.round(
        haversineKm(
          Number(row.latitude.toString()),
          Number(row.longitude.toString()),
          Number(campground.latitude),
          Number(campground.longitude),
        ) * 10,
      ) / 10;
    if (distanceKmToCampground > CAMPGROUND_STOP_DISTANCE_WARN_KM) {
      distanceWarning = `Ce camping est à ${distanceKmToCampground} km de cette étape`;
    }
  }

  const activities = toStopActivityDtos(
    row.latitude,
    row.longitude,
    row.stopActivities,
  );

  return {
    id: row.id,
    tripId: row.tripId,
    sequence: row.sequence,
    name: row.name,
    address: row.address,
    latitude: decimalToString(row.latitude),
    longitude: decimalToString(row.longitude),
    arrivalTime: dateToIso(row.arrivalTime),
    departureTime: dateToIso(row.departureTime),
    stopType: row.stopType,
    campgroundId: row.campgroundId ?? null,
    campground,
    distanceKmToCampground,
    distanceWarning,
    activities,
    activityCount: activities.length,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toRouteDto(
  row: {
    id: string;
    tripId: string;
    provider: string | null;
    distanceKm: { toString(): string } | null;
    estimatedDurationMin: number | null;
    estimatedFuelCost: { toString(): string } | null;
    polyline: string | null;
    waypointsHash: string | null;
    updatedAt: Date;
  },
  currentHash?: string | null,
): TripRouteDto {
  const isStale =
    !row.waypointsHash ||
    (currentHash != null && row.waypointsHash !== currentHash);

  return {
    id: row.id,
    tripId: row.tripId,
    provider: row.provider,
    distanceKm: decimalToString(row.distanceKm),
    estimatedDurationMin: row.estimatedDurationMin,
    estimatedFuelCost: decimalToString(row.estimatedFuelCost),
    polyline: row.polyline,
    waypointsHash: row.waypointsHash,
    isStale,
    updatedAt: row.updatedAt.toISOString(),
  };
}

type VehicleInclude = {
  id: string;
  nickname: string | null;
  isManualEntry: boolean;
  manualManufacturerName: string | null;
  manualModelName: string | null;
  manualYear: number | null;
  model: {
    modelName: string;
    year: number;
    manufacturer: { name: string };
  } | null;
};

type TravelGroupInclude = {
  id: string;
  name: string;
  deletedAt: Date | null;
};

function toVehicleSummary(vehicle: VehicleInclude): TripVehicleSummaryDto {
  return {
    id: vehicle.id,
    displayName: vehicleDisplayName(vehicle),
    nickname: vehicle.nickname,
  };
}

function toGroupSummary(
  group: TravelGroupInclude | null | undefined,
): TripGroupSummaryDto | null {
  if (!group) return null;
  return {
    id: group.id,
    name: group.deletedAt ? "Groupe archivé" : group.name,
    archived: Boolean(group.deletedAt),
  };
}

export function toTripDto(row: {
  id: string;
  userId: string;
  vehicleId: string;
  travelGroupId?: string | null;
  title: string;
  status: string;
  departureDate: Date;
  returnDate: Date | null;
  origin: string;
  destination: string;
  plannedBudget: { toString(): string } | null;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: VehicleInclude | null;
  travelGroup?: TravelGroupInclude | null;
  _count?: { stops: number };
  stops?: unknown[];
}): TripDto {
  const stopCount =
    row._count?.stops ?? (Array.isArray(row.stops) ? row.stops.length : 0);

  return {
    id: row.id,
    userId: row.userId,
    vehicleId: row.vehicleId,
    travelGroupId: row.travelGroupId ?? null,
    title: row.title,
    status: row.status as TripStatus,
    departureDate: row.departureDate.toISOString(),
    returnDate: dateToIso(row.returnDate),
    origin: row.origin,
    destination: row.destination,
    plannedBudget: decimalToString(row.plannedBudget),
    vehicle: row.vehicle ? toVehicleSummary(row.vehicle) : null,
    travelGroup: toGroupSummary(row.travelGroup),
    stopCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toTripDetailDto(row: {
  id: string;
  userId: string;
  vehicleId: string;
  travelGroupId?: string | null;
  title: string;
  status: string;
  departureDate: Date;
  returnDate: Date | null;
  origin: string;
  destination: string;
  plannedBudget: { toString(): string } | null;
  createdAt: Date;
  updatedAt: Date;
  vehicle: VehicleInclude;
  travelGroup?: TravelGroupInclude | null;
  stops: Parameters<typeof toStopDto>[0][];
  route:
    | (Omit<Parameters<typeof toRouteDto>[0], never> & {
        waypointsHash: string | null;
      })
    | null;
}): TripDetailDto {
  const currentHash = computeWaypointsHash({
    origin: row.origin,
    destination: row.destination,
    stops: row.stops.map((s) => ({
      sequence: s.sequence,
      address: s.address,
      latitude: s.latitude == null ? null : s.latitude.toString(),
      longitude: s.longitude == null ? null : s.longitude.toString(),
    })),
  });

  return {
    ...toTripDto({ ...row, _count: { stops: row.stops.length } }),
    stops: row.stops.map(toStopDto),
    route: row.route ? toRouteDto(row.route, currentHash) : null,
  };
}

export function toSummaryDto(row: {
  id: string;
  title: string;
  status: string;
  origin: string;
  destination: string;
  departureDate: Date;
  returnDate: Date | null;
  plannedBudget: { toString(): string } | null;
  stops: unknown[];
  route: {
    distanceKm: { toString(): string } | null;
    estimatedDurationMin: number | null;
    estimatedFuelCost: { toString(): string } | null;
  } | null;
}): TripSummaryDto {
  return {
    id: row.id,
    title: row.title,
    status: row.status as TripStatus,
    origin: row.origin,
    destination: row.destination,
    departureDate: row.departureDate.toISOString(),
    returnDate: dateToIso(row.returnDate),
    plannedBudget: decimalToString(row.plannedBudget),
    stopCount: row.stops.length,
    distanceKm: decimalToString(row.route?.distanceKm),
    estimatedDurationMin: row.route?.estimatedDurationMin ?? null,
    estimatedFuelCost: decimalToString(row.route?.estimatedFuelCost),
  };
}
