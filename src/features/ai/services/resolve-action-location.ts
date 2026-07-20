import "server-only";

import { prisma } from "@/lib/prisma";
import {
  isPointInTripCorridor,
  isValidCoordinatePair,
  type LocationResolveResult,
  type LocationSource,
  type ResolvedLocation,
} from "@/features/ai/lib/location-resolve";
import { AI_CORRIDOR_MAX_DETOUR_KM } from "@/features/ai/lib/distance-guards";

type TripForLocation = {
  originLatitude: { toString(): string } | number | null;
  originLongitude: { toString(): string } | number | null;
  destinationLatitude: { toString(): string } | number | null;
  destinationLongitude: { toString(): string } | number | null;
  route?: { distanceKm: { toString(): string } | number | null } | null;
  stops: Array<{
    id: string;
    latitude: { toString(): string } | number | null;
    longitude: { toString(): string } | number | null;
  }>;
};

function num(
  v: { toString(): string } | number | null | undefined,
): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function corridorFromTrip(trip: TripForLocation) {
  const originLat = num(trip.originLatitude);
  const originLng = num(trip.originLongitude);
  const destLat = num(trip.destinationLatitude);
  const destLng = num(trip.destinationLongitude);
  if (
    originLat == null ||
    originLng == null ||
    destLat == null ||
    destLng == null
  ) {
    return null;
  }
  return {
    origin: { lat: originLat, lng: originLng },
    destination: { lat: destLat, lng: destLng },
    stops: trip.stops
      .map((s) => {
        const lat = num(s.latitude);
        const lng = num(s.longitude);
        if (lat == null || lng == null) return null;
        return { lat, lng };
      })
      .filter((s): s is { lat: number; lng: number } => s != null),
    tripDistanceKm: num(trip.route?.distanceKm ?? null),
    maxCorridorDetourKm: AI_CORRIDOR_MAX_DETOUR_KM,
  };
}

function fail(
  reasonCode:
    "AI_ACTION_LOCATION_REQUIRED" | "AI_ACTION_LOCATION_OUT_OF_CORRIDOR",
  message: string,
): LocationResolveResult {
  return {
    applicable: false,
    requiresLocationConfirmation: true,
    reasonCode,
    message,
  };
}

function succeed(
  location: ResolvedLocation,
  trip: TripForLocation,
  allowOutOfCorridor: boolean,
): LocationResolveResult {
  const corridor = corridorFromTrip(trip);
  if (
    corridor &&
    !isPointInTripCorridor(
      { lat: location.latitude, lng: location.longitude },
      corridor,
    )
  ) {
    if (!allowOutOfCorridor) {
      return fail(
        "AI_ACTION_LOCATION_OUT_OF_CORRIDOR",
        "Cet emplacement semble trop éloigné du trajet. Confirmez-le explicitement.",
      );
    }
  }
  return { applicable: true, location };
}

/**
 * Résout un emplacement fiable pour add_activity / add_pause.
 * Jamais de fallback « fin de séquence » silencieux.
 */
export async function resolveActionLocation(params: {
  userId: string;
  trip: TripForLocation;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  activityId?: string | null;
  targetStopId?: string | null;
  locationSource?: LocationSource;
  locationConfirmed?: boolean;
}): Promise<LocationResolveResult> {
  const source = params.locationSource ?? "ai_suggested";
  const confirmed = Boolean(params.locationConfirmed);
  const allowFar = confirmed && source === "user_confirmed";

  // 1) Étape existante ciblée
  if (params.targetStopId) {
    const stop = params.trip.stops.find((s) => s.id === params.targetStopId);
    const lat = num(stop?.latitude);
    const lng = num(stop?.longitude);
    if (lat == null || lng == null || !isValidCoordinatePair(lat, lng)) {
      return fail(
        "AI_ACTION_LOCATION_REQUIRED",
        "L’étape ciblée n’a pas de coordonnées exploitables.",
      );
    }
    return succeed(
      {
        latitude: lat,
        longitude: lng,
        address: null,
        locationSource: "catalog",
      },
      params.trip,
      true,
    );
  }

  // 2) Activité catalogue
  if (params.activityId) {
    const activity = await prisma.activity.findFirst({
      where: { id: params.activityId, deletedAt: null },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        address: true,
        name: true,
      },
    });
    if (activity) {
      const lat = num(activity.latitude);
      const lng = num(activity.longitude);
      if (lat != null && lng != null && isValidCoordinatePair(lat, lng)) {
        return succeed(
          {
            latitude: lat,
            longitude: lng,
            address: activity.address,
            locationSource: "catalog",
          },
          params.trip,
          true,
        );
      }
    }
    // TripActivity (Google Places déjà sur le voyage)
    const tripActivity = await prisma.tripActivity.findFirst({
      where: { id: params.activityId },
      select: {
        latitude: true,
        longitude: true,
        address: true,
        name: true,
      },
    });
    if (tripActivity) {
      const lat = num(tripActivity.latitude);
      const lng = num(tripActivity.longitude);
      if (lat != null && lng != null && isValidCoordinatePair(lat, lng)) {
        return succeed(
          {
            latitude: lat,
            longitude: lng,
            address: tripActivity.address,
            locationSource: "catalog",
          },
          params.trip,
          true,
        );
      }
    }
  }

  // 3) Coordonnées explicites
  if (isValidCoordinatePair(params.latitude, params.longitude)) {
    const latitude = params.latitude as number;
    const longitude = params.longitude as number;
    if (source === "ai_suggested" && !confirmed) {
      return fail(
        "AI_ACTION_LOCATION_REQUIRED",
        "Sebavio doit confirmer l’emplacement de cette suggestion avant de pouvoir l’ajouter au trajet.",
      );
    }
    return succeed(
      {
        latitude,
        longitude,
        address: params.address ?? null,
        locationSource: confirmed ? "user_confirmed" : source,
      },
      params.trip,
      allowFar || source === "user_confirmed" || source === "geocoded",
    );
  }

  // 4) Géocodage d'adresse
  const address = params.address?.trim();
  if (address && address.length >= 5) {
    try {
      const { getMapsService } = await import("@/services/maps");
      const maps = getMapsService();
      const geo = await maps.geocode(params.userId, address);
      if (geo && isValidCoordinatePair(geo.lat, geo.lng)) {
        return succeed(
          {
            latitude: geo.lat,
            longitude: geo.lng,
            address: geo.formattedAddress ?? address,
            locationSource: "geocoded",
          },
          params.trip,
          confirmed,
        );
      }
    } catch {
      // géocodage échoué → confirmation requise
    }
  }

  return fail(
    "AI_ACTION_LOCATION_REQUIRED",
    "Sebavio doit confirmer l’emplacement de cette suggestion avant de pouvoir l’ajouter au trajet.",
  );
}
