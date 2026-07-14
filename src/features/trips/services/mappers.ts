import type { TripStatus } from "@/features/trips/constants";
import type {
  TripDetailDto,
  TripDto,
  TripRouteDto,
  TripStopDto,
  TripSummaryDto,
  TripVehicleSummaryDto,
} from "@/features/trips/types";

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
  createdAt: Date;
  updatedAt: Date;
}): TripStopDto {
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
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toRouteDto(row: {
  id: string;
  tripId: string;
  provider: string | null;
  distanceKm: { toString(): string } | null;
  estimatedDurationMin: number | null;
  estimatedFuelCost: { toString(): string } | null;
  polyline: string | null;
  updatedAt: Date;
}): TripRouteDto {
  return {
    id: row.id,
    tripId: row.tripId,
    provider: row.provider,
    distanceKm: decimalToString(row.distanceKm),
    estimatedDurationMin: row.estimatedDurationMin,
    estimatedFuelCost: decimalToString(row.estimatedFuelCost),
    polyline: row.polyline,
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

function toVehicleSummary(vehicle: VehicleInclude): TripVehicleSummaryDto {
  return {
    id: vehicle.id,
    displayName: vehicleDisplayName(vehicle),
    nickname: vehicle.nickname,
  };
}

export function toTripDto(row: {
  id: string;
  userId: string;
  vehicleId: string;
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
  _count?: { stops: number };
  stops?: unknown[];
}): TripDto {
  const stopCount =
    row._count?.stops ?? (Array.isArray(row.stops) ? row.stops.length : 0);

  return {
    id: row.id,
    userId: row.userId,
    vehicleId: row.vehicleId,
    title: row.title,
    status: row.status as TripStatus,
    departureDate: row.departureDate.toISOString(),
    returnDate: dateToIso(row.returnDate),
    origin: row.origin,
    destination: row.destination,
    plannedBudget: decimalToString(row.plannedBudget),
    vehicle: row.vehicle ? toVehicleSummary(row.vehicle) : null,
    stopCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toTripDetailDto(row: {
  id: string;
  userId: string;
  vehicleId: string;
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
  stops: Parameters<typeof toStopDto>[0][];
  route: Parameters<typeof toRouteDto>[0] | null;
}): TripDetailDto {
  return {
    ...toTripDto({ ...row, _count: { stops: row.stops.length } }),
    stops: row.stops.map(toStopDto),
    route: row.route ? toRouteDto(row.route) : null,
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
