import type { TripStatus } from "@/features/trips/constants";

export type TripStopDto = {
  id: string;
  tripId: string;
  sequence: number;
  name: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  arrivalTime: string | null;
  departureTime: string | null;
  stopType: string;
  createdAt: string;
  updatedAt: string;
};

export type TripRouteDto = {
  id: string;
  tripId: string;
  provider: string | null;
  distanceKm: string | null;
  estimatedDurationMin: number | null;
  estimatedFuelCost: string | null;
  polyline: string | null;
  waypointsHash: string | null;
  /** true si les étapes ont changé depuis le dernier calcul d'itinéraire. */
  isStale: boolean;
  updatedAt: string;
};

export type TripVehicleSummaryDto = {
  id: string;
  displayName: string;
  nickname: string | null;
};

export type TripGroupSummaryDto = {
  id: string;
  name: string;
  archived: boolean;
};

export type TripDto = {
  id: string;
  userId: string;
  vehicleId: string;
  travelGroupId: string | null;
  title: string;
  status: TripStatus;
  departureDate: string;
  returnDate: string | null;
  origin: string;
  destination: string;
  plannedBudget: string | null;
  vehicle: TripVehicleSummaryDto | null;
  travelGroup: TripGroupSummaryDto | null;
  stopCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TripDetailDto = TripDto & {
  stops: TripStopDto[];
  route: TripRouteDto | null;
};

export type TripSummaryDto = {
  id: string;
  title: string;
  status: TripStatus;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  plannedBudget: string | null;
  stopCount: number;
  distanceKm: string | null;
  estimatedDurationMin: number | null;
  estimatedFuelCost: string | null;
};

export type PaginatedTrips = {
  items: TripDto[];
  page: number;
  pageSize: number;
  total: number;
};
