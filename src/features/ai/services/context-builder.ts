import "server-only";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { AI_MAX_CONTEXT_CHARS_DEFAULT } from "@/lib/constants";
import type { TripAssistantRequestType } from "@/features/ai/schemas/request";

export type TripAssistantContextDto = {
  trip: {
    id: string;
    title: string;
    status: string;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate: string | null;
    originCity: string | null;
    destinationCity: string | null;
  };
  route: {
    distanceKm: number | null;
    estimatedDurationMin: number | null;
    returnDistanceKm: number | null;
    returnEstimatedDurationMin: number | null;
    estimatedFuelCost: number | null;
    isStale: boolean;
    fuelEstimateStale: boolean;
    dataKind: "calculated";
  } | null;
  stops: Array<{
    id: string;
    name: string;
    stopType: string;
    direction: string;
    sequence: number;
    durationMinutes: number;
    arrivalTime: string | null;
    departureTime: string | null;
    address: string | null;
    /** Coordonnées arrondies (3 décimales ~100 m) — jamais GPS précis. */
    latApprox: number | null;
    lngApprox: number | null;
  }>;
  activities: Array<{
    id: string;
    name: string;
    status: string;
    placement: string | null;
    estimatedVisitMinutes: number | null;
    linkedStopId: string | null;
  }>;
  vehicle: {
    label: string;
    fuelType: string | null;
    customConsumptionL100: number | null;
    realAvgConsumption: number | null;
    tankCapacityOverride: number | null;
  } | null;
  fuel: {
    dataKind: "estimated";
    estimatedCost: number | null;
    litersNeeded: number | null;
    consumptionL100: number | null;
    consumptionSource: string | null;
    pricePerLiter: number | null;
    priceSource: string | null;
    fillStopCount: number | null;
    warnings: string[];
  } | null;
  weather: {
    dataKind: "observed_or_forecast";
    available: boolean;
    message: string | null;
    locations: Array<{
      name: string;
      type: string;
      date: string | null;
      summary: string | null;
      tempC: number | null;
      precipProbability: number | null;
      condition: string | null;
    }>;
  } | null;
  preferences: {
    purpose: string | null;
    adultCount: number | null;
    childCount: number | null;
    interests: unknown;
    maxDetourMinutes: number | null;
    environmentPreference: string | null;
  } | null;
  liveLocation: {
    included: boolean;
    latApprox: number | null;
    lngApprox: number | null;
    note: string;
  } | null;
  counts: {
    stops: number;
    fuelStops: number;
    restStops: number;
    activityStops: number;
  };
  meta: {
    requestType: TripAssistantRequestType;
    units: { distance: "km"; duration: "min"; currency: "CAD" };
  };
};

function roundCoord(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value * 1000) / 1000;
}

function toNum(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Construit un DTO minimal pour l’IA — jamais d’objet Prisma brut.
 */
export async function buildTripAssistantContext(params: {
  userId: string;
  tripId: string;
  requestType: TripAssistantRequestType;
  includeLiveLocation?: boolean;
  liveLatitude?: number | null;
  liveLongitude?: number | null;
}): Promise<TripAssistantContextDto> {
  const trip = await prisma.trip.findFirst({
    where: { id: params.tripId, userId: params.userId, deletedAt: null },
    include: {
      route: true,
      stops: { orderBy: { sequence: "asc" } },
      tripActivities: {
        where: {
          status: { in: ["suggested", "saved", "added_to_trip", "completed"] },
        },
        orderBy: { createdAt: "asc" },
        take: 40,
      },
      travelerProfile: true,
      vehicle: true,
    },
  });

  if (!trip) {
    throw new AppError("TRIP_001", "Voyage introuvable", 404);
  }

  const fuelStops = trip.stops.filter((s) => s.stopType === "fuel");
  const restStops = trip.stops.filter((s) => s.stopType === "rest");
  const activityStops = trip.stops.filter((s) => s.stopType === "activity");

  let weather: TripAssistantContextDto["weather"] = null;
  try {
    const { getTripWeather } = await import("@/features/weather");
    const wx = await getTripWeather(params.userId, params.tripId, {
      liveLatitude: params.liveLatitude,
      liveLongitude: params.liveLongitude,
    });
    const response = wx.response;
    const locations = (response?.locations ?? []).slice(0, 12).map((loc) => {
      const day = loc.daily?.[0] ?? null;
      return {
        name: loc.name,
        type: loc.type,
        date: loc.date ?? day?.date ?? null,
        summary: loc.summary ?? day?.summary ?? null,
        tempC: day?.tempMaxC ?? loc.current?.temperatureC ?? null,
        precipProbability: day?.precipitationProbability ?? null,
        condition: day?.summary ?? day?.condition?.description ?? null,
      };
    });
    weather = {
      dataKind: "observed_or_forecast",
      available: wx.providerAvailable && response?.status === "available",
      message: response?.message ?? null,
      locations,
    };
  } catch {
    weather = {
      dataKind: "observed_or_forecast",
      available: false,
      message: "Météo indisponible pour ce voyage.",
      locations: [],
    };
  }

  // Estimation carburant : reprise des champs route + éventuels warnings stockés nulle part → minimal
  const fuel: TripAssistantContextDto["fuel"] = trip.route
    ? {
        dataKind: "estimated",
        estimatedCost: toNum(trip.route.estimatedFuelCost),
        litersNeeded: null,
        consumptionL100:
          toNum(trip.vehicle.customConsumptionL100) ??
          toNum(trip.vehicle.realAvgConsumption),
        consumptionSource: trip.vehicle.customConsumptionL100
          ? "custom"
          : trip.vehicle.realAvgConsumption
            ? "real_avg"
            : null,
        pricePerLiter: null,
        priceSource: null,
        fillStopCount: fuelStops.length,
        warnings: trip.route.fuelEstimateStale
          ? ["L’estimation carburant est potentiellement obsolète."]
          : [],
      }
    : null;

  const includeLive =
    Boolean(params.includeLiveLocation) &&
    trip.status === "in_progress" &&
    params.liveLatitude != null &&
    params.liveLongitude != null;

  const dto: TripAssistantContextDto = {
    trip: {
      id: trip.id,
      title: trip.title,
      status: trip.status,
      origin: trip.origin,
      destination: trip.destination,
      departureDate: trip.departureDate.toISOString(),
      returnDate: trip.returnDate?.toISOString() ?? null,
      originCity: trip.originCity,
      destinationCity: trip.destinationCity,
    },
    route: trip.route
      ? {
          distanceKm: toNum(trip.route.distanceKm),
          estimatedDurationMin: trip.route.estimatedDurationMin,
          returnDistanceKm: toNum(trip.route.returnDistanceKm),
          returnEstimatedDurationMin: trip.route.returnEstimatedDurationMin,
          estimatedFuelCost: toNum(trip.route.estimatedFuelCost),
          isStale: false,
          fuelEstimateStale: trip.route.fuelEstimateStale,
          dataKind: "calculated",
        }
      : null,
    stops: trip.stops.slice(0, 60).map((s) => ({
      id: s.id,
      name: s.name,
      stopType: s.stopType,
      direction: s.direction,
      sequence: s.sequence,
      durationMinutes: s.durationMinutes,
      arrivalTime: s.arrivalTime?.toISOString() ?? null,
      departureTime: s.departureTime?.toISOString() ?? null,
      address: s.address,
      latApprox: roundCoord(toNum(s.latitude)),
      lngApprox: roundCoord(toNum(s.longitude)),
    })),
    activities: trip.tripActivities.map((a) => ({
      id: a.id,
      name: a.name,
      status: a.status,
      placement: a.insertPlacement,
      estimatedVisitMinutes: a.estimatedVisitMinutes,
      linkedStopId: a.linkedStopId,
    })),
    vehicle: {
      label:
        trip.vehicle.nickname?.trim() ||
        [
          trip.vehicle.manualYear,
          trip.vehicle.manualManufacturerName,
          trip.vehicle.manualModelName,
        ]
          .filter(Boolean)
          .join(" ") ||
        "Véhicule",
      fuelType:
        trip.vehicle.customFuelType ??
        trip.vehicle.fuelType ??
        trip.vehicle.manufacturerFuelType,
      customConsumptionL100: toNum(trip.vehicle.customConsumptionL100),
      realAvgConsumption: toNum(trip.vehicle.realAvgConsumption),
      tankCapacityOverride: toNum(trip.vehicle.tankCapacityOverride),
    },
    fuel,
    weather,
    preferences: trip.travelerProfile
      ? {
          purpose: trip.travelerProfile.purpose,
          adultCount: trip.travelerProfile.adultCount,
          childCount: trip.travelerProfile.childCount,
          interests: trip.travelerProfile.interests,
          maxDetourMinutes: trip.travelerProfile.maxDetourMinutes,
          environmentPreference: trip.travelerProfile.environmentPreference,
        }
      : null,
    liveLocation: includeLive
      ? {
          included: true,
          latApprox: roundCoord(params.liveLatitude),
          lngApprox: roundCoord(params.liveLongitude),
          note: "Position approximative pendant un voyage actif (précision réduite).",
        }
      : {
          included: false,
          latApprox: null,
          lngApprox: null,
          note: "Position non incluse.",
        },
    counts: {
      stops: trip.stops.length,
      fuelStops: fuelStops.length,
      restStops: restStops.length,
      activityStops: activityStops.length,
    },
    meta: {
      requestType: params.requestType,
      units: { distance: "km", duration: "min", currency: "CAD" },
    },
  };

  return truncateContext(dto);
}

function truncateContext(
  dto: TripAssistantContextDto,
): TripAssistantContextDto {
  let json = JSON.stringify(dto);
  if (json.length <= AI_MAX_CONTEXT_CHARS_DEFAULT) return dto;

  const copy: TripAssistantContextDto = {
    ...dto,
    stops: dto.stops.slice(0, 30),
    activities: dto.activities.slice(0, 20),
    weather: dto.weather
      ? { ...dto.weather, locations: dto.weather.locations.slice(0, 6) }
      : null,
  };
  json = JSON.stringify(copy);
  if (json.length > AI_MAX_CONTEXT_CHARS_DEFAULT) {
    copy.stops = copy.stops.slice(0, 15);
    copy.activities = copy.activities.slice(0, 10);
  }
  return copy;
}
