import type { WeatherCacheProximity, WeatherDisplayWindow } from "./types";

export type TripWeatherTiming = {
  /** Jours jusqu'au départ (négatif = déjà passé / en cours). */
  daysUntilDeparture: number;
  /** Heures jusqu'au départ. */
  hoursUntilDeparture: number;
  tripStatus: "planned" | "in_progress" | "completed" | "cancelled" | string;
};

/**
 * Fenêtre d'affichage météo (théorique).
 * La disponibilité réelle des données API a toujours priorité.
 */
export function resolveDisplayWindow(
  timing: TripWeatherTiming,
): WeatherDisplayWindow {
  if (timing.tripStatus === "in_progress") {
    return "live";
  }
  if (timing.tripStatus === "completed" || timing.tripStatus === "cancelled") {
    return "none";
  }
  if (timing.daysUntilDeparture > 16) {
    return "none";
  }
  if (timing.daysUntilDeparture > 8) {
    return "too_early_detail";
  }
  if (timing.hoursUntilDeparture <= 48) {
    return "hourly";
  }
  return "daily";
}

export function shouldCallProvider(window: WeatherDisplayWindow): boolean {
  return window === "daily" || window === "hourly" || window === "live";
}

export function resolveCacheProximity(
  timing: TripWeatherTiming,
): WeatherCacheProximity {
  if (timing.tripStatus === "in_progress") return "live";
  if (timing.hoursUntilDeparture <= 48) return "near";
  if (timing.daysUntilDeparture <= 5) return "mid";
  return "far";
}

export function cacheTtlSeconds(proximity: WeatherCacheProximity): number {
  switch (proximity) {
    case "live":
      return 30 * 60;
    case "near":
      return 60 * 60;
    case "mid":
      return 3 * 60 * 60;
    case "far":
    default:
      return 6 * 60 * 60;
  }
}

export const NEGATIVE_CACHE_TTL_SECONDS = 10 * 60;

export function computeTripTiming(input: {
  departureDate: Date;
  tripStatus: string;
  now?: Date;
}): TripWeatherTiming {
  const now = input.now ?? new Date();
  const departure = input.departureDate.getTime();
  const ms = departure - now.getTime();
  const hoursUntilDeparture = ms / (1000 * 60 * 60);
  const daysUntilDeparture = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return {
    daysUntilDeparture,
    hoursUntilDeparture,
    tripStatus: input.tripStatus,
  };
}
