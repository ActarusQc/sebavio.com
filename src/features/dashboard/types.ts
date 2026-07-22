import type { TripStatus } from "@/features/trips/constants";

export type DashboardSuggestionIcon = "calendar" | "map-pin" | "fuel";

export type DashboardTripCard = {
  id: string;
  title: string;
  status: TripStatus;
  departureDate: string;
  returnDate: string | null;
  destinationLabel: string;
  preparationProgress: number;
  imageSrc: string | null;
  distanceKm: number | null;
};

export type DashboardWeatherCurrent = {
  tempC: number;
  feelsLikeC: number;
  summary: string;
  weatherCode: number;
};

export type DashboardWeatherDaily = {
  date: string;
  tempMinC: number;
  tempMaxC: number;
  weatherCode: number;
  summary: string;
};

export type DashboardWeather = {
  available: boolean;
  locationLabel: string;
  current: DashboardWeatherCurrent | null;
  daily: DashboardWeatherDaily[];
  message: string | null;
  tripIdForLink: string | null;
};

export type DashboardStats = {
  upcomingTrips: number;
  savedActivities: number;
  activeVehicles: number;
  nextTripDistanceKm: number | null;
};

export type DashboardSuggestion = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: DashboardSuggestionIcon;
};

export type DashboardData = {
  greetingFirstName: string | null;
  weather: DashboardWeather | null;
  nextTrip: DashboardTripCard | null;
  recentTrips: DashboardTripCard[];
  stats: DashboardStats;
  suggestions: DashboardSuggestion[];
};
