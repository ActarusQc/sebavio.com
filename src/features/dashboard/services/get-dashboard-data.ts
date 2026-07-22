import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureProfile } from "@/features/users/services/profile";
import { getHomeAddress } from "@/features/users/services/home-address";
import {
  getCurrentForLocation,
  getForecastForLocation,
} from "@/features/weather/services";
import { listFavorites } from "@/features/activities/services/favorites";
import type { TripStatus } from "@/features/trips/constants";
import type {
  DashboardData,
  DashboardSuggestion,
  DashboardTripCard,
  DashboardWeather,
} from "@/features/dashboard/types";

type TripRow = {
  id: string;
  title: string;
  status: string;
  departureDate: Date;
  returnDate: Date | null;
  destination: string;
  destinationCity: string | null;
  destinationProvince: string | null;
  destinationLatitude: Prisma.Decimal | number | null;
  destinationLongitude: Prisma.Decimal | number | null;
  vehicleId: string;
  travelGroupId: string | null;
  plannedBudget: Prisma.Decimal | number | null;
  updatedAt: Date;
  route: { distanceKm: Prisma.Decimal | number | null } | null;
  _count: { stops: number; tripActivities: number };
};

function decimalToNumber(
  value: Prisma.Decimal | number | null | undefined,
): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const n = value.toNumber();
  return Number.isFinite(n) ? n : null;
}

function truncateLabel(text: string, max = 60): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function destinationLabel(trip: TripRow): string {
  const cityProvince = [trip.destinationCity, trip.destinationProvince]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
  if (cityProvince) return cityProvince;
  return truncateLabel(trip.destination || "Destination");
}

function preparationProgress(trip: TripRow): number {
  const stopCount = trip._count.stops;
  const activityCount = trip._count.tripActivities;
  const distanceKm = decimalToNumber(trip.route?.distanceKm ?? null);
  const destLat = decimalToNumber(trip.destinationLatitude);

  const checks = [
    Boolean(trip.departureDate),
    Boolean(trip.destination?.trim()),
    Boolean(trip.vehicleId),
    Boolean(trip.travelGroupId),
    destLat != null,
    stopCount > 0 || activityCount > 0,
    distanceKm != null && distanceKm > 0,
    trip.plannedBudget != null,
  ];

  const total = checks.length;
  const done = checks.filter(Boolean).length;
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

function toTripCard(trip: TripRow): DashboardTripCard {
  return {
    id: trip.id,
    title: trip.title,
    status: trip.status as TripStatus,
    departureDate: trip.departureDate.toISOString(),
    returnDate: trip.returnDate?.toISOString() ?? null,
    destinationLabel: destinationLabel(trip),
    preparationProgress: preparationProgress(trip),
    imageSrc: null,
    distanceKm: decimalToNumber(trip.route?.distanceKm ?? null),
  };
}

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function pickNextTrip(trips: TripRow[]): TripRow | null {
  const inProgress = trips.find((t) => t.status === "in_progress");
  if (inProgress) return inProgress;

  const today = startOfTodayLocal();
  const upcomingPlanned = trips
    .filter((t) => t.status === "planned" && t.departureDate >= today)
    .sort((a, b) => a.departureDate.getTime() - b.departureDate.getTime());
  if (upcomingPlanned[0]) return upcomingPlanned[0];

  const plannedRecent = trips
    .filter((t) => t.status === "planned")
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return plannedRecent[0] ?? null;
}

function buildSuggestions(input: {
  favoritesCount: number;
  nextTripId: string | null;
  activeVehicles: number;
}): DashboardSuggestion[] {
  const suggestions: DashboardSuggestion[] = [
    {
      id: "activities",
      title: "Activités recommandées",
      description:
        input.favoritesCount > 0
          ? `Vous avez ${input.favoritesCount} activité${input.favoritesCount > 1 ? "s" : ""} sauvegardée${input.favoritesCount > 1 ? "s" : ""}.`
          : "Découvrez et enregistrez des activités pour vos voyages.",
      href: "/dashboard/activities",
      icon: "map-pin",
    },
  ];

  if (input.nextTripId) {
    suggestions.push({
      id: "fuel",
      title: "Meilleurs prix d’essence",
      description: "Consultez l’estimation carburant de votre prochain voyage.",
      href: `/dashboard/trips/${input.nextTripId}`,
      icon: "fuel",
    });
  } else if (input.activeVehicles > 0) {
    suggestions.push({
      id: "fuel",
      title: "Meilleurs prix d’essence",
      description:
        "Consultez la consommation et le carburant de vos véhicules.",
      href: "/dashboard/vehicles",
      icon: "fuel",
    });
  }

  return suggestions;
}

async function loadWeather(input: {
  userId: string;
  nextTrip: TripRow | null;
  home: Awaited<ReturnType<typeof getHomeAddress>>;
}): Promise<DashboardWeather | null> {
  const tripLat = input.nextTrip
    ? decimalToNumber(input.nextTrip.destinationLatitude)
    : null;
  const tripLng = input.nextTrip
    ? decimalToNumber(input.nextTrip.destinationLongitude)
    : null;

  let lat: number | null = null;
  let lng: number | null = null;
  let locationLabel = "";

  if (tripLat != null && tripLng != null) {
    lat = tripLat;
    lng = tripLng;
    locationLabel = destinationLabel(input.nextTrip!);
  } else if (input.home?.latitude != null && input.home?.longitude != null) {
    lat = input.home.latitude;
    lng = input.home.longitude;
    const cityProvince = [input.home.city, input.home.province]
      .map((p) => p?.trim())
      .filter(Boolean)
      .join(", ");
    locationLabel = cityProvince || truncateLabel(input.home.label);
  } else {
    return null;
  }

  const tripIdForLink = input.nextTrip?.id ?? null;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      getCurrentForLocation(input.userId, lat, lng),
      getForecastForLocation(input.userId, lat, lng),
    ]);

    const available = Boolean(currentRes.available || forecastRes.available);

    if (!available) {
      return {
        available: false,
        locationLabel,
        current: null,
        daily: [],
        message:
          currentRes.message ??
          forecastRes.message ??
          "Les prévisions ne sont pas disponibles pour le moment.",
        tripIdForLink,
      };
    }

    const current = currentRes.current
      ? {
          tempC: currentRes.current.temperatureC,
          feelsLikeC: currentRes.current.feelsLikeC,
          summary: currentRes.current.summary,
          weatherCode: currentRes.current.weatherCode,
        }
      : null;

    const daily = (forecastRes.daily ?? []).slice(0, 5).map((day) => ({
      date: day.date,
      tempMinC: day.tempMinC,
      tempMaxC: day.tempMaxC,
      weatherCode: day.weatherCode,
      summary: day.summary,
    }));

    return {
      available: true,
      locationLabel,
      current,
      daily,
      message: null,
      tripIdForLink,
    };
  } catch {
    return {
      available: false,
      locationLabel,
      current: null,
      daily: [],
      message: "Les prévisions ne sont pas disponibles pour le moment.",
      tripIdForLink,
    };
  }
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [profile, homeAddress, trips, activeVehicles] = await Promise.all([
    ensureProfile(userId),
    getHomeAddress(userId),
    prisma.trip.findMany({
      where: { userId, deletedAt: null },
      include: {
        route: { select: { distanceKm: true } },
        _count: {
          select: {
            stops: true,
            tripActivities: {
              where: { status: { in: ["added_to_trip", "completed"] } },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.userVehicle.count({
      where: { userId, deletedAt: null },
    }),
  ]);

  const tripRows = trips as unknown as TripRow[];
  const nextTripRow = pickNextTrip(tripRows);
  const nextTrip = nextTripRow ? toTripCard(nextTripRow) : null;

  const upcomingTrips = tripRows.filter(
    (t) => t.status === "planned" || t.status === "in_progress",
  ).length;

  let savedActivities = 0;
  try {
    const favorites = await listFavorites(userId);
    savedActivities = favorites.length;
  } catch {
    savedActivities = 0;
  }

  let weather: DashboardWeather | null = null;
  try {
    weather = await loadWeather({
      userId,
      nextTrip: nextTripRow,
      home: homeAddress,
    });
  } catch {
    weather = nextTripRow
      ? {
          available: false,
          locationLabel: destinationLabel(nextTripRow),
          current: null,
          daily: [],
          message: "Les prévisions ne sont pas disponibles pour le moment.",
          tripIdForLink: nextTripRow.id,
        }
      : homeAddress
        ? {
            available: false,
            locationLabel:
              [homeAddress.city, homeAddress.province]
                .filter(Boolean)
                .join(", ") || truncateLabel(homeAddress.label),
            current: null,
            daily: [],
            message: "Les prévisions ne sont pas disponibles pour le moment.",
            tripIdForLink: null,
          }
        : null;
  }

  const recentTrips = tripRows.slice(0, 3).map(toTripCard);

  const suggestions = buildSuggestions({
    favoritesCount: savedActivities,
    nextTripId: nextTrip?.id ?? null,
    activeVehicles,
  });

  const firstName = profile.firstName?.trim() || null;
  const lastName = profile.lastName?.trim() || null;
  const greetingFirstName = firstName || lastName;

  return {
    greetingFirstName,
    weather,
    nextTrip,
    recentTrips,
    stats: {
      upcomingTrips,
      savedActivities,
      activeVehicles,
      nextTripDistanceKm: nextTrip?.distanceKm ?? null,
    },
    suggestions,
  };
}
