import type { LatLng } from "@/services/maps/types";
import type { StopDirection } from "@/features/trips/constants";

/** Rayon (km) pour considérer une activité « près de la destination ». */
export const MAX_DESTINATION_ACTIVITY_RADIUS_KM = 40;

export type TripRoutePointKind = "origin" | "intermediate_stop" | "destination";

export type ComputedActivityPlacement =
  "outbound" | "near_destination" | "return" | "off_route";

export type TripRouteSourceStop = {
  id: string;
  name: string;
  stopType: string;
  sequence: number;
  latitude: number;
  longitude: number;
  direction?: StopDirection | string;
  durationMinutes?: number;
};

export type TripRouteSource = {
  origin: string;
  destination: string;
  originLatitude: number | null;
  originLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  stops: TripRouteSourceStop[];
};

export type TripRouteRequest = {
  origin: LatLng & { address: string };
  intermediateWaypoints: Array<LatLng & { id: string; name: string }>;
  destination: LatLng & { address: string };
};

export type RouteIntegrityCheck = {
  originMatchesTrip: boolean;
  destinationMatchesTrip: boolean;
  expectedWaypointCount: number;
  actualLegCount: number;
  totalDistanceKm: number;
  polylinePresent: boolean;
  passed: boolean;
  failureReasons: string[];
};

export type RouteSegment = {
  fromName: string;
  toName: string;
  from: LatLng;
  to: LatLng;
  direction: StopDirection;
  index: number;
};

const EARTH_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function coordinatesApproximatelyEqual(
  a: LatLng,
  b: LatLng,
  toleranceKm = 25,
): boolean {
  return haversineKm(a, b) <= toleranceKm;
}

/**
 * Classifie une activité par rapport à l'origine / destination du voyage.
 * « À destination » UI ≠ destination géographique si hors rayon.
 */
export function computeActivityPlacement(input: {
  activity: LatLng;
  origin: LatLng;
  destination: LatLng;
  maxDestinationRadiusKm?: number;
}): ComputedActivityPlacement {
  const radius =
    input.maxDestinationRadiusKm ?? MAX_DESTINATION_ACTIVITY_RADIUS_KM;
  const toDest = haversineKm(input.activity, input.destination);
  if (toDest <= radius) return "near_destination";

  const toOrigin = haversineKm(input.activity, input.origin);
  const od = haversineKm(input.origin, input.destination);
  const viaActivity =
    haversineKm(input.origin, input.activity) +
    haversineKm(input.activity, input.destination);
  const detourRatio = od > 1 ? viaActivity / od : Infinity;
  if (detourRatio <= 1.35 && toOrigin < toDest) return "outbound";
  if (detourRatio <= 1.35) return "outbound";
  return "off_route";
}

function isRoutableStopType(stopType: string): boolean {
  return stopType !== "origin" && stopType !== "destination";
}

/**
 * Étapes routières ordonnées pour une direction — jamais origin/destination Trip.
 */
export function getOrderedRouteStops(
  trip: TripRouteSource,
  direction: StopDirection | "all" = "outbound",
): TripRouteSourceStop[] {
  return [...trip.stops]
    .filter(
      (s) =>
        Number.isFinite(s.latitude) &&
        Number.isFinite(s.longitude) &&
        isRoutableStopType(s.stopType) &&
        (direction === "all" || (s.direction ?? "outbound") === direction),
    )
    .sort((a, b) => a.sequence - b.sequence);
}

/**
 * Construit la requête Routes aller.
 * La destination vient TOUJOURS des champs Trip, jamais du dernier stop.
 */
export function buildTripRouteRequest(
  trip: TripRouteSource,
  direction: StopDirection = "outbound",
): TripRouteRequest {
  if (
    trip.originLatitude == null ||
    trip.originLongitude == null ||
    trip.destinationLatitude == null ||
    trip.destinationLongitude == null
  ) {
    throw new Error(
      "Coordonnées origin/destination manquantes pour construire la route",
    );
  }

  const intermediates = getOrderedRouteStops(trip, direction).map((s) => ({
    id: s.id,
    name: s.name,
    lat: s.latitude,
    lng: s.longitude,
  }));

  if (direction === "return") {
    return {
      origin: {
        lat: trip.destinationLatitude,
        lng: trip.destinationLongitude,
        address: trip.destination,
      },
      intermediateWaypoints: intermediates,
      destination: {
        lat: trip.originLatitude,
        lng: trip.originLongitude,
        address: trip.origin,
      },
    };
  }

  return {
    origin: {
      lat: trip.originLatitude,
      lng: trip.originLongitude,
      address: trip.origin,
    },
    intermediateWaypoints: intermediates,
    destination: {
      lat: trip.destinationLatitude,
      lng: trip.destinationLongitude,
      address: trip.destination,
    },
  };
}

/**
 * Points pour estimation carburant / échantillonnage :
 * origin → arrêts intermédiaires (direction) → destination finale.
 * Ne jamais s'arrêter au dernier TripStop.
 */
export function buildCanonicalRoutePoints(
  trip: {
    originLatitude?: unknown;
    originLongitude?: unknown;
    destinationLatitude?: unknown;
    destinationLongitude?: unknown;
    stops: Array<{
      latitude: unknown;
      longitude: unknown;
      direction?: string | null;
      stopType?: string | null;
    }>;
  },
  direction: StopDirection = "outbound",
): LatLng[] {
  const points: LatLng[] = [];
  const push = (latRaw: unknown, lngRaw: unknown) => {
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const last = points[points.length - 1];
    if (
      last &&
      Math.abs(last.lat - lat) < 1e-5 &&
      Math.abs(last.lng - lng) < 1e-5
    ) {
      return;
    }
    points.push({ lat, lng });
  };

  const filteredStops = trip.stops.filter((s) => {
    const dir = s.direction ?? "outbound";
    if (dir !== direction) return false;
    if (s.stopType === "origin" || s.stopType === "destination") return false;
    return true;
  });

  if (direction === "return") {
    push(trip.destinationLatitude, trip.destinationLongitude);
    for (const stop of filteredStops) {
      push(stop.latitude, stop.longitude);
    }
    push(trip.originLatitude, trip.originLongitude);
    return points;
  }

  push(trip.originLatitude, trip.originLongitude);
  for (const stop of filteredStops) {
    push(stop.latitude, stop.longitude);
  }
  push(trip.destinationLatitude, trip.destinationLongitude);
  return points;
}

/**
 * Segments nommés (Montréal → Saguenay, Saguenay → Gaspé, …).
 */
export function buildRouteSegments(
  trip: TripRouteSource,
  direction: StopDirection = "outbound",
): RouteSegment[] {
  if (
    trip.originLatitude == null ||
    trip.originLongitude == null ||
    trip.destinationLatitude == null ||
    trip.destinationLongitude == null
  ) {
    return [];
  }

  const waypoints = getOrderedRouteStops(trip, direction);
  const nodes: Array<{ name: string; point: LatLng }> =
    direction === "return"
      ? [
          {
            name: trip.destination,
            point: {
              lat: trip.destinationLatitude,
              lng: trip.destinationLongitude,
            },
          },
          ...waypoints.map((w) => ({
            name: w.name,
            point: { lat: w.latitude, lng: w.longitude },
          })),
          {
            name: trip.origin,
            point: { lat: trip.originLatitude, lng: trip.originLongitude },
          },
        ]
      : [
          {
            name: trip.origin,
            point: { lat: trip.originLatitude, lng: trip.originLongitude },
          },
          ...waypoints.map((w) => ({
            name: w.name,
            point: { lat: w.latitude, lng: w.longitude },
          })),
          {
            name: trip.destination,
            point: {
              lat: trip.destinationLatitude,
              lng: trip.destinationLongitude,
            },
          },
        ];

  const segments: RouteSegment[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const from = nodes[i]!;
    const to = nodes[i + 1]!;
    segments.push({
      fromName: from.name,
      toName: to.name,
      from: from.point,
      to: to.point,
      direction,
      index: i,
    });
  }
  return segments;
}

export function evaluateRouteIntegrity(input: {
  requestDestination: LatLng;
  responseFinalDestination: LatLng | null;
  intermediateWaypointCount: number;
  actualLegCount: number;
  totalDistanceKm: number;
  polylinePresent: boolean;
  originMatchesTrip?: boolean;
}): RouteIntegrityCheck {
  const failureReasons: string[] = [];
  const destinationMatchesTrip =
    input.responseFinalDestination != null &&
    coordinatesApproximatelyEqual(
      input.requestDestination,
      input.responseFinalDestination,
    );
  if (!destinationMatchesTrip) {
    failureReasons.push("destination_mismatch");
  }
  const expectedLegs = input.intermediateWaypointCount + 1;
  if (input.actualLegCount !== expectedLegs) {
    failureReasons.push(
      `leg_count_mismatch:expected_${expectedLegs}:actual_${input.actualLegCount}`,
    );
  }
  if (!(input.totalDistanceKm > 0)) {
    failureReasons.push("distance_invalid");
  }
  if (!input.polylinePresent) {
    failureReasons.push("polyline_missing");
  }
  const originMatchesTrip = input.originMatchesTrip ?? true;
  if (!originMatchesTrip) {
    failureReasons.push("origin_mismatch");
  }

  return {
    originMatchesTrip,
    destinationMatchesTrip,
    expectedWaypointCount: input.intermediateWaypointCount,
    actualLegCount: input.actualLegCount,
    totalDistanceKm: input.totalDistanceKm,
    polylinePresent: input.polylinePresent,
    passed: failureReasons.length === 0,
    failureReasons,
  };
}
