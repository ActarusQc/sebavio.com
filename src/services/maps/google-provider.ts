import { AppError } from "@/lib/errors";
import type {
  DirectionsResult,
  DirectionsWaypoint,
  GeocodeResult,
  MapsProvider,
  MapsProviderAvailability,
} from "./types";

type GoogleGeocodeResponse = {
  status: string;
  error_message?: string;
  results?: Array<{
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
  }>;
};

type GoogleDirectionsResponse = {
  status: string;
  error_message?: string;
  routes?: Array<{
    overview_polyline?: { points?: string };
    legs?: Array<{
      distance?: { value?: number };
      duration?: { value?: number };
    }>;
  }>;
};

function formatLatLng(point: DirectionsWaypoint): string {
  return `${point.lat},${point.lng}`;
}

/**
 * Implémentation Google Maps (Geocoding + Directions) — serveur uniquement.
 */
export class GoogleMapsProvider implements MapsProvider {
  readonly name = "google";

  constructor(private readonly apiKey: string) {}

  isAvailable(): MapsProviderAvailability {
    if (!this.apiKey.trim()) {
      return { available: false, reason: "missing_key" };
    }
    return { available: true };
  }

  async geocode(address: string): Promise<GeocodeResult> {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", this.apiKey);

    let data: GoogleGeocodeResponse;
    try {
      const res = await fetch(url.toString(), { method: "GET" });
      if (!res.ok) {
        throw new AppError(
          "EXT_001",
          "Service cartographique indisponible",
          503,
        );
      }
      data = (await res.json()) as GoogleGeocodeResponse;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("EXT_001", "Service cartographique indisponible", 503);
    }

    if (data.status === "ZERO_RESULTS" || !data.results?.length) {
      throw new AppError("EXT_002", "Position invalide ou introuvable", 400);
    }

    if (data.status !== "OK") {
      throw new AppError(
        "EXT_001",
        data.error_message ?? "Service cartographique indisponible",
        503,
      );
    }

    const first = data.results[0];
    return {
      lat: first.geometry.location.lat,
      lng: first.geometry.location.lng,
      formattedAddress: first.formatted_address,
    };
  }

  async directions(
    origin: DirectionsWaypoint,
    destination: DirectionsWaypoint,
    waypoints: DirectionsWaypoint[] = [],
  ): Promise<DirectionsResult> {
    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", formatLatLng(origin));
    url.searchParams.set("destination", formatLatLng(destination));
    url.searchParams.set("mode", "driving");
    url.searchParams.set("key", this.apiKey);
    if (waypoints.length > 0) {
      url.searchParams.set(
        "waypoints",
        waypoints.map((w) => formatLatLng(w)).join("|"),
      );
    }

    let data: GoogleDirectionsResponse;
    try {
      const res = await fetch(url.toString(), { method: "GET" });
      if (!res.ok) {
        throw new AppError(
          "EXT_001",
          "Service cartographique indisponible",
          503,
        );
      }
      data = (await res.json()) as GoogleDirectionsResponse;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("EXT_001", "Service cartographique indisponible", 503);
    }

    if (
      data.status === "NOT_FOUND" ||
      data.status === "ZERO_RESULTS" ||
      !data.routes?.length
    ) {
      throw new AppError("EXT_005", "Itinéraire impossible", 400);
    }

    if (data.status !== "OK") {
      throw new AppError(
        "EXT_001",
        data.error_message ?? "Service cartographique indisponible",
        503,
      );
    }

    const route = data.routes[0];
    const polyline = route.overview_polyline?.points;
    if (!polyline) {
      throw new AppError("EXT_005", "Itinéraire impossible", 400);
    }

    let distanceM = 0;
    let durationS = 0;
    for (const leg of route.legs ?? []) {
      distanceM += leg.distance?.value ?? 0;
      durationS += leg.duration?.value ?? 0;
    }

    return {
      distanceKm: Math.round((distanceM / 1000) * 100) / 100,
      durationMin: Math.max(1, Math.round(durationS / 60)),
      polyline,
      provider: "google",
    };
  }
}
