import { AppError } from "@/lib/errors";
import {
  getCachedDirections,
  getCachedGeocode,
  setCachedDirections,
  setCachedGeocode,
} from "./cache";
import { GoogleMapsProvider } from "./google-provider";
import { NullMapsProvider } from "./null-provider";
import { assertMapsRateLimit } from "./rate-limit";
import type {
  DirectionsResult,
  DirectionsWaypoint,
  GeocodeResult,
  MapsProvider,
  MapsProviderAvailability,
} from "./types";

export type MapsService = {
  availability(): MapsProviderAvailability;
  geocode(userId: string, address: string): Promise<GeocodeResult>;
  directions(
    userId: string,
    origin: DirectionsWaypoint,
    destination: DirectionsWaypoint,
    waypoints?: DirectionsWaypoint[],
  ): Promise<DirectionsResult>;
};

let providerOverride: MapsProvider | null = null;

export function setMapsProviderForTests(provider: MapsProvider | null): void {
  providerOverride = provider;
}

export function createMapsProviderFromEnv(): MapsProvider {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim() ?? "";
  if (!key) {
    return new NullMapsProvider();
  }
  return new GoogleMapsProvider(key);
}

function resolveProvider(): MapsProvider {
  return providerOverride ?? createMapsProviderFromEnv();
}

/**
 * Si Redis/cache est down, on refuse l'appel fournisseur (coûts).
 * Un hit cache ne consomme pas le rate-limit ni Google.
 */
export function createMapsService(provider?: MapsProvider): MapsService {
  const resolved = provider ?? resolveProvider();

  return {
    availability() {
      return resolved.isAvailable();
    },

    async geocode(userId, address) {
      const trimmed = address.trim();
      if (!trimmed) {
        throw new AppError("EXT_002", "Position invalide ou introuvable", 400);
      }

      const cached = await getCachedGeocode(trimmed);
      if (cached) {
        return cached;
      }

      if (!resolved.isAvailable().available) {
        throw new AppError(
          "EXT_001",
          "Service cartographique indisponible",
          503,
        );
      }

      await assertMapsRateLimit(userId);
      const result = await resolved.geocode(trimmed);
      await setCachedGeocode(trimmed, result);
      return result;
    },

    async directions(userId, origin, destination, waypoints = []) {
      const cached = await getCachedDirections(origin, destination, waypoints);
      // Ignorer le cache legacy sans legs / destination finale (pré-intégrité).
      if (
        cached &&
        cached.finalDestination &&
        typeof cached.legCount === "number" &&
        Array.isArray(cached.legs)
      ) {
        return cached;
      }

      if (!resolved.isAvailable().available) {
        throw new AppError(
          "EXT_001",
          "Service cartographique indisponible",
          503,
        );
      }

      await assertMapsRateLimit(userId);
      const result = await resolved.directions(origin, destination, waypoints);
      await setCachedDirections(origin, destination, waypoints, result);
      return result;
    },
  };
}

export function getMapsService(): MapsService {
  return createMapsService();
}
