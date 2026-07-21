import "server-only";

import { decodeGooglePolyline } from "@/features/maps/lib/polyline";
import { resolveRoutePointAtDistance } from "@/features/fuel/lib/resolve-route-point";
import { reverseGeocodeRoutePoint } from "@/features/fuel/services/reverse-geocode-route-point";
import { prisma } from "@/lib/prisma";
import type { LatLng } from "@/services/maps/types";
import {
  resolveDepartureTiming,
  resolveMealTiming,
  TRIP_TIME_ZONE,
} from "@/features/ai/lib/meal-timing";

export type EstimatedRoutePosition = {
  latitude: number;
  longitude: number;
  routeProgressKm: number;
  routeProgressRatio: number;
  nearestCity: string | null;
  nearestRoutePointLabel: string | null;
  estimatedLocalDateTime: string;
  /** @deprecated utiliser estimatedLocalDateTime — conservé pour compat */
  estimatedArrivalAtPoint: string;
  elapsedDrivingMinutes: number;
  elapsedStopMinutes: number;
  activeSegmentId: string | null;
  confidence: "high" | "medium" | "low";
  /** alias de routeProgressKm */
  routeDistanceFromOriginKm: number;
};

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Réexport pour les appels existants. */
export { combineTripDateAndClock } from "@/features/ai/lib/meal-timing";

export function parseClockTime(
  text: string,
): { hour: number; minute: number } | null {
  const msg = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (/\bmidi\b/.test(msg)) return { hour: 12, minute: 0 };
  if (/\bminuit\b/.test(msg)) return { hour: 0, minute: 0 };
  const m = msg.match(/\b(\d{1,2})\s*[h:]\s*(\d{2})?\b/);
  if (!m) return null;
  const hour = Number.parseInt(m[1]!, 10);
  const minute = m[2] ? Number.parseInt(m[2], 10) : 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function parseMealClockTime(
  text: string,
): { hour: number; minute: number } | null {
  const meal = resolveMealTiming(text);
  if (!meal) return null;
  return { hour: meal.targetHour, minute: meal.targetMinute };
}

export function parseDepartureClockTime(
  text: string,
): { hour: number; minute: number } | null {
  const dep = resolveDepartureTiming(text);
  if (!dep) return null;
  return { hour: dep.hour, minute: dep.minute };
}

/**
 * Position sur l’itinéraire à une heure cible — progression temporelle
 * (conduite + arrêts), interpolation sur la polyline (pas barycentre).
 */
export async function resolveTripPositionAtTime(input: {
  tripId: string;
  userId: string;
  departureDateTime: Date;
  targetDateTime: Date;
  leg?: "outbound" | "return";
}): Promise<EstimatedRoutePosition | null> {
  const leg = input.leg ?? "outbound";
  const trip = await prisma.trip.findFirst({
    where: { id: input.tripId, userId: input.userId, deletedAt: null },
    include: {
      route: true,
      stops: { orderBy: { sequence: "asc" } },
    },
  });
  if (!trip?.route) return null;

  const totalDistanceKm =
    leg === "return"
      ? (toNum(trip.route.returnDistanceKm) ?? toNum(trip.route.distanceKm))
      : toNum(trip.route.distanceKm);
  const totalDurationMin =
    leg === "return"
      ? (trip.route.returnEstimatedDurationMin ??
        trip.route.estimatedDurationMin)
      : trip.route.estimatedDurationMin;

  if (
    totalDistanceKm == null ||
    totalDistanceKm <= 0 ||
    !totalDurationMin ||
    totalDurationMin <= 0
  ) {
    return null;
  }

  const elapsedMs =
    input.targetDateTime.getTime() - input.departureDateTime.getTime();
  if (elapsedMs <= 0) return null;

  const elapsedTotalMinutes = elapsedMs / 60_000;

  let elapsedStopMinutes = 0;
  let activeAtStopName: string | null = null;

  for (const stop of trip.stops) {
    if (stop.direction !== leg) continue;
    const stopDuration = stop.durationMinutes ?? 0;
    if (stopDuration <= 0) continue;

    // Si arrivalTime connue : compter seulement si avant la cible
    if (stop.arrivalTime) {
      if (stop.arrivalTime >= input.targetDateTime) continue;
      const leave =
        stop.departureTime ??
        new Date(stop.arrivalTime.getTime() + stopDuration * 60_000);
      if (
        stop.arrivalTime <= input.targetDateTime &&
        leave > input.targetDateTime
      ) {
        activeAtStopName = stop.name;
        elapsedStopMinutes += Math.max(
          0,
          (input.targetDateTime.getTime() - stop.arrivalTime.getTime()) /
            60_000,
        );
        continue;
      }
      if (leave <= input.targetDateTime) {
        elapsedStopMinutes += stopDuration;
      }
      continue;
    }

    // Sans horaire d’arrivée : on additionne les arrêts « plausibles »
    // dans l’ordre tant que le budget temps le permet (estimation basse).
    if (elapsedStopMinutes + stopDuration < elapsedTotalMinutes * 0.9) {
      elapsedStopMinutes += stopDuration;
    }
  }

  const elapsedDrivingMinutes = Math.max(
    0,
    Math.min(totalDurationMin, elapsedTotalMinutes - elapsedStopMinutes),
  );

  const fraction = Math.min(
    1,
    Math.max(0, elapsedDrivingMinutes / totalDurationMin),
  );
  const routeProgressKm = fraction * totalDistanceKm;

  let path: LatLng[] = [];
  if (trip.route.polyline) {
    path = decodeGooglePolyline(trip.route.polyline);
  }
  const originLat = toNum(trip.originLatitude);
  const originLng = toNum(trip.originLongitude);
  const destLat = toNum(trip.destinationLatitude);
  const destLng = toNum(trip.destinationLongitude);
  if (
    path.length < 2 &&
    originLat != null &&
    originLng != null &&
    destLat != null &&
    destLng != null
  ) {
    path = [
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng },
    ];
  }
  if (path.length < 2) return null;

  const point = resolveRoutePointAtDistance({
    path,
    distanceFromStartKm: routeProgressKm,
    totalDistanceKm,
  });
  if (!point) return null;

  let nearestCity: string | null = null;
  try {
    const geo = await reverseGeocodeRoutePoint({
      latitude: point.latitude,
      longitude: point.longitude,
      userId: input.userId,
    });
    nearestCity = geo.locality?.trim() || null;
  } catch {
    /* best-effort */
  }

  let confidence: EstimatedRoutePosition["confidence"] = "medium";
  if (trip.route.polyline && totalDurationMin > 0) confidence = "high";
  if (!trip.route.polyline) confidence = "low";

  const estimatedLocalDateTime = input.targetDateTime.toISOString();

  return {
    latitude: Math.round(point.latitude * 1000) / 1000,
    longitude: Math.round(point.longitude * 1000) / 1000,
    routeProgressKm: Math.round(routeProgressKm * 10) / 10,
    routeProgressRatio: Math.round(fraction * 1000) / 1000,
    nearestCity,
    nearestRoutePointLabel: activeAtStopName ?? nearestCity,
    estimatedLocalDateTime,
    estimatedArrivalAtPoint: estimatedLocalDateTime,
    elapsedDrivingMinutes: Math.round(elapsedDrivingMinutes),
    elapsedStopMinutes: Math.round(elapsedStopMinutes),
    activeSegmentId: null,
    confidence,
    routeDistanceFromOriginKm: Math.round(routeProgressKm * 10) / 10,
  };
}

export { TRIP_TIME_ZONE };
