/**
 * Utilitaires géolocalisation purs (testables sans navigateur).
 */

export const GEO_SAMPLE_MIN_DISTANCE_M = 50;
export const GEO_SAMPLE_MIN_INTERVAL_MS = 45_000;
export const GEO_EFFECTIVE_MAX_AGE_MS = 2 * 60_000;
export const GEO_EFFECTIVE_MAX_ACCURACY_M = 500;
export const GEO_EXTREME_ACCURACY_M = 5_000;
export const GEO_SERVER_RATE_LIMIT_MS = 10_000;
export const GEO_OFFLINE_BUFFER_MAX = 20;
/** Points plus anciens que ce seuil (buffer obsolète) sont rejetés. */
export const GEO_MAX_POINT_AGE_MS = 24 * 60 * 60_000;
/** Horodatage futur toléré (horloge client). */
export const GEO_MAX_FUTURE_SKEW_MS = 60_000;

export type LatLng = { latitude: number; longitude: number };

export type SampleablePoint = LatLng & {
  recordedAtMs: number;
  accuracyM?: number | null;
};

/** Distance Haversine en mètres. */
export function haversineDistanceM(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isFiniteCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Conserve un point si déplacement ≥ 50 m OU intervalle ≥ 45 s.
 * Rejette les lectures inutilisables.
 */
export function shouldKeepSample(
  candidate: SampleablePoint,
  lastKept: SampleablePoint | null,
  options?: {
    minDistanceM?: number;
    minIntervalMs?: number;
    extremeAccuracyM?: number;
    nowMs?: number;
  },
): boolean {
  const minDistanceM = options?.minDistanceM ?? GEO_SAMPLE_MIN_DISTANCE_M;
  const minIntervalMs = options?.minIntervalMs ?? GEO_SAMPLE_MIN_INTERVAL_MS;
  const extremeAccuracyM = options?.extremeAccuracyM ?? GEO_EXTREME_ACCURACY_M;

  if (!isFiniteCoordinate(candidate.latitude, candidate.longitude)) {
    return false;
  }
  if (!Number.isFinite(candidate.recordedAtMs) || candidate.recordedAtMs <= 0) {
    return false;
  }
  if (
    candidate.accuracyM != null &&
    (!Number.isFinite(candidate.accuracyM) ||
      candidate.accuracyM < 0 ||
      candidate.accuracyM > extremeAccuracyM)
  ) {
    return false;
  }

  if (!lastKept) return true;

  // Lecture plus ancienne que la dernière acceptée (hors tolérance 1 s).
  if (candidate.recordedAtMs < lastKept.recordedAtMs - 1_000) {
    return false;
  }

  const distanceM = haversineDistanceM(lastKept, candidate);
  const elapsedMs = candidate.recordedAtMs - lastKept.recordedAtMs;
  return distanceM >= minDistanceM || elapsedMs >= minIntervalMs;
}

export type CoordinateSource = "live" | "server" | "trip_origin" | "none";

export type EffectiveCoordinatesResult =
  | {
      latitude: number;
      longitude: number;
      source: Exclude<CoordinateSource, "none">;
      accuracyM: number | null;
    }
  | {
      latitude: null;
      longitude: null;
      source: "none";
      accuracyM: null;
    };

type PositionLike = LatLng & {
  accuracyM?: number | null;
  recordedAtMs: number;
};

/**
 * Priorité : live frais+précis → serveur frais+précis → origine voyage → null.
 * Ne modifie jamais l'origine persistée.
 */
export function getEffectiveCoordinates(input: {
  livePosition?: PositionLike | null;
  latestServerPosition?: PositionLike | null;
  tripOrigin?: LatLng | null;
  now?: number;
  maxAgeMs?: number;
  maxAccuracyM?: number;
}): EffectiveCoordinatesResult {
  const now = input.now ?? Date.now();
  const maxAgeMs = input.maxAgeMs ?? GEO_EFFECTIVE_MAX_AGE_MS;
  const maxAccuracyM = input.maxAccuracyM ?? GEO_EFFECTIVE_MAX_ACCURACY_M;

  const usable = (p: PositionLike | null | undefined): p is PositionLike => {
    if (!p) return false;
    if (!isFiniteCoordinate(p.latitude, p.longitude)) return false;
    if (now - p.recordedAtMs > maxAgeMs) return false;
    if (p.accuracyM == null || !Number.isFinite(p.accuracyM)) return false;
    if (p.accuracyM < 0 || p.accuracyM >= maxAccuracyM) return false;
    return true;
  };

  if (usable(input.livePosition)) {
    return {
      latitude: input.livePosition.latitude,
      longitude: input.livePosition.longitude,
      source: "live",
      accuracyM: input.livePosition.accuracyM ?? null,
    };
  }
  if (usable(input.latestServerPosition)) {
    return {
      latitude: input.latestServerPosition.latitude,
      longitude: input.latestServerPosition.longitude,
      source: "server",
      accuracyM: input.latestServerPosition.accuracyM ?? null,
    };
  }
  if (
    input.tripOrigin &&
    isFiniteCoordinate(input.tripOrigin.latitude, input.tripOrigin.longitude)
  ) {
    return {
      latitude: input.tripOrigin.latitude,
      longitude: input.tripOrigin.longitude,
      source: "trip_origin",
      accuracyM: null,
    };
  }
  return {
    latitude: null,
    longitude: null,
    source: "none",
    accuracyM: null,
  };
}

export type GeoUiErrorCode =
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "unsupported"
  | "offline"
  | "server_error";

const GEO_ERROR_MESSAGES_FR: Record<GeoUiErrorCode, string> = {
  PERMISSION_DENIED:
    "L’accès à la position a été refusé. Autorisez-la dans les paramètres du navigateur.",
  POSITION_UNAVAILABLE:
    "Le GPS est temporairement indisponible. Réessayez dans un instant.",
  TIMEOUT: "La localisation a pris trop de temps. Réessayez.",
  unsupported: "La géolocalisation n’est pas supportée sur cet appareil.",
  offline: "Hors ligne — les positions seront envoyées au retour du réseau.",
  server_error: "Impossible d’enregistrer la position pour le moment.",
};

export function mapGeolocationError(
  code: GeoUiErrorCode | number | string | null | undefined,
): { code: GeoUiErrorCode; messageFr: string } {
  if (code === 1 || code === "PERMISSION_DENIED") {
    return {
      code: "PERMISSION_DENIED",
      messageFr: GEO_ERROR_MESSAGES_FR.PERMISSION_DENIED,
    };
  }
  if (code === 2 || code === "POSITION_UNAVAILABLE") {
    return {
      code: "POSITION_UNAVAILABLE",
      messageFr: GEO_ERROR_MESSAGES_FR.POSITION_UNAVAILABLE,
    };
  }
  if (code === 3 || code === "TIMEOUT") {
    return { code: "TIMEOUT", messageFr: GEO_ERROR_MESSAGES_FR.TIMEOUT };
  }
  if (code === "unsupported") {
    return {
      code: "unsupported",
      messageFr: GEO_ERROR_MESSAGES_FR.unsupported,
    };
  }
  if (code === "offline") {
    return { code: "offline", messageFr: GEO_ERROR_MESSAGES_FR.offline };
  }
  return {
    code: "server_error",
    messageFr: GEO_ERROR_MESSAGES_FR.server_error,
  };
}

export function pauseStorageKey(tripId: string): string {
  return `trip-geo-paused:${tripId}`;
}
