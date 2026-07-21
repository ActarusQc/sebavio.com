import type { TripStatus } from "@/features/trips/constants";

export type TripStopCampgroundDto = {
  id: string;
  name: string;
  archived: boolean;
  latitude: string;
  longitude: string;
};

export type TripStopActivityDto = {
  id: string;
  name: string;
  kind: string;
  category: string;
  archived: boolean;
  latitude: string;
  longitude: string;
  distanceKm: number | null;
  distanceWarning: string | null;
};

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
  /** outbound | return */
  direction: string;
  placeId: string | null;
  /** Durée sur place en minutes (0 = simple passage). */
  durationMinutes: number;
  notes: string | null;
  campgroundId: string | null;
  campground: TripStopCampgroundDto | null;
  /** Distance étape ↔ camping (km), si les deux ont des coordonnées. */
  distanceKmToCampground: number | null;
  /** Avertissement non bloquant si distance camping > 50 km. */
  distanceWarning: string | null;
  /** Activités liées (aperçu pour la liste d'étapes). */
  activities: TripStopActivityDto[];
  activityCount: number;
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
  returnDistanceKm: string | null;
  returnEstimatedDurationMin: number | null;
  returnPolyline: string | null;
  waypointsHash: string | null;
  /** true si les étapes ont changé depuis le dernier calcul d'itinéraire. */
  isStale: boolean;
  /** true si les caractéristiques véhicule ont changé depuis le dernier calcul carburant. */
  fuelEstimateStale: boolean;
  updatedAt: string;
};

export type TripVehicleSummaryDto = {
  id: string;
  displayName: string;
  nickname: string | null;
  fuelType: string | null;
  preferredFuelType: string | null;
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
  originPlaceId: string | null;
  originLatitude: string | null;
  originLongitude: string | null;
  originCity: string | null;
  originProvince: string | null;
  originPostalCode: string | null;
  originCountry: string | null;
  destination: string;
  destinationPlaceId: string | null;
  destinationLatitude: string | null;
  destinationLongitude: string | null;
  destinationCity: string | null;
  destinationProvince: string | null;
  destinationPostalCode: string | null;
  destinationCountry: string | null;
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
  /** Somme des durées sur place des activités ajoutées à l'itinéraire. */
  activityVisitMinutes: number;
  /**
   * Durée totale = conduite (route) + temps sur place des activités.
   * Null si l'itinéraire n'a pas encore de durée de conduite.
   */
  totalDurationMin: number | null;
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
