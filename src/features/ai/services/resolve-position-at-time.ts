import "server-only";

import { decodeGooglePolyline } from "@/features/maps/lib/polyline";
import { resolveRoutePointAtDistance } from "@/features/fuel/lib/resolve-route-point";
import { reverseGeocodeRoutePoint } from "@/features/fuel/services/reverse-geocode-route-point";
import { prisma } from "@/lib/prisma";
import type { LatLng } from "@/services/maps/types";

export type EstimatedRoutePosition = {
  latitude: number;
  longitude: number;
  nearestCity: string | null;
  estimatedArrivalAtPoint: string;
  elapsedDrivingMinutes: number;
  elapsedStopMinutes: number;
  confidence: "high" | "medium" | "low";
  routeDistanceFromOriginKm: number;
};

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Extrait heure (0–23) et minutes depuis un texte FR.
 */
export function parseClockTime(
  text: string,
): { hour: number; minute: number } | null {
  const msg = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (/\bmidi\b/.test(msg)) return { hour: 12, minute: 0 };
  if (/\bminuit\b/.test(msg)) return { hour: 0, minute: 0 };
  const m = msg.match(
    /\b(?:a|à|vers|pour|quitte|depart|départ|partir|partirai)?\s*(?:a|à)?\s*(\d{1,2})\s*[h:]\s*(\d{2})?\b/,
  );
  if (!m) return null;
  const hour = Number.parseInt(m[1]!, 10);
  const minute = m[2] ? Number.parseInt(m[2], 10) : 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function parseMealClockTime(
  text: string,
): { hour: number; minute: number } | null {
  const msg = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (/\b(midi|dejeuner|déjeuner)\b/.test(msg)) return { hour: 12, minute: 0 };
  if (/\b(souper|diner|dîner)\b/.test(msg) && !/\bdejeuner\b/.test(msg)) {
    return { hour: 18, minute: 30 };
  }
  // « à midi », « vers 12 h », « à 12h30 »
  const afterMeal = msg.match(
    /\b(?:manger|repas|arreter|arrêter|pause)\b[\s\S]{0,40}?\b(?:a|à|vers)?\s*(\d{1,2})\s*[h:]\s*(\d{2})?\b/,
  );
  if (afterMeal) {
    const hour = Number.parseInt(afterMeal[1]!, 10);
    const minute = afterMeal[2] ? Number.parseInt(afterMeal[2], 10) : 0;
    if (hour >= 0 && hour <= 23) return { hour, minute };
  }
  if (/\bmidi\b/.test(msg)) return { hour: 12, minute: 0 };
  return parseClockTime(text);
}

export function parseDepartureClockTime(
  text: string,
): { hour: number; minute: number } | null {
  const msg = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const m = msg.match(
    /\b(?:quitte|partir|depart|départ|laisse|laisse)\b[\s\S]{0,40}?\b(?:a|à|vers)?\s*(\d{1,2})\s*[h:]\s*(\d{2})?\b/,
  );
  if (m) {
    const hour = Number.parseInt(m[1]!, 10);
    const minute = m[2] ? Number.parseInt(m[2], 10) : 0;
    if (hour >= 0 && hour <= 23) return { hour, minute };
  }
  return null;
}

/**
 * Point sur l’itinéraire réel correspondant à une durée de conduite écoulée.
 */
export async function resolveTripPositionAtTime(input: {
  tripId: string;
  userId: string;
  departureDateTime: Date;
  targetDateTime: Date;
}): Promise<EstimatedRoutePosition | null> {
  const trip = await prisma.trip.findFirst({
    where: { id: input.tripId, userId: input.userId, deletedAt: null },
    include: {
      route: true,
      stops: { orderBy: { sequence: "asc" } },
    },
  });
  if (!trip?.route) return null;

  const totalDistanceKm = toNum(trip.route.distanceKm);
  const totalDurationMin = trip.route.estimatedDurationMin;
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

  // Arrêts outbound avant l’heure cible (durée planifiée)
  let elapsedStopMinutes = 0;
  for (const stop of trip.stops) {
    if (stop.direction !== "outbound") continue;
    if (stop.arrivalTime && stop.arrivalTime > input.targetDateTime) continue;
    elapsedStopMinutes += stop.durationMinutes ?? 0;
  }

  const elapsedDrivingMinutes = Math.max(
    0,
    Math.min(totalDurationMin, elapsedTotalMinutes - elapsedStopMinutes),
  );

  const fraction = Math.min(
    1,
    Math.max(0, elapsedDrivingMinutes / totalDurationMin),
  );
  const routeDistanceFromOriginKm = fraction * totalDistanceKm;

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
    distanceFromStartKm: routeDistanceFromOriginKm,
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

  return {
    latitude: Math.round(point.latitude * 1000) / 1000,
    longitude: Math.round(point.longitude * 1000) / 1000,
    nearestCity,
    estimatedArrivalAtPoint: input.targetDateTime.toISOString(),
    elapsedDrivingMinutes: Math.round(elapsedDrivingMinutes),
    elapsedStopMinutes: Math.round(elapsedStopMinutes),
    confidence,
    routeDistanceFromOriginKm: Math.round(routeDistanceFromOriginKm * 10) / 10,
  };
}

/** Combine date de départ voyage + heure (locales America/Toronto approximatif via offset fixe -4/-5 non — utiliser composants locaux UTC-aware). */
export function combineTripDateAndClock(
  departureDateIso: string,
  clock: { hour: number; minute: number },
): Date {
  const base = new Date(departureDateIso);
  const d = new Date(base);
  d.setHours(clock.hour, clock.minute, 0, 0);
  // Si l’heure cible est avant le départ le même jour, garder le même jour (caller gère meal > departure)
  return d;
}
