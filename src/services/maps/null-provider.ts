import { AppError } from "@/lib/errors";
import type {
  DirectionsResult,
  DirectionsWaypoint,
  GeocodeResult,
  MapsProvider,
  MapsProviderAvailability,
} from "./types";

/**
 * Fournisseur dégradé : aucune clé / appels impossibles.
 * Le module Voyages continue sans carte.
 */
export class NullMapsProvider implements MapsProvider {
  readonly name = "null";

  isAvailable(): MapsProviderAvailability {
    return { available: false, reason: "missing_key" };
  }

  async geocode(_address: string): Promise<GeocodeResult> {
    void _address;
    throw new AppError("EXT_001", "Service cartographique indisponible", 503);
  }

  async directions(
    _origin: DirectionsWaypoint,
    _destination: DirectionsWaypoint,
    _waypoints?: DirectionsWaypoint[],
  ): Promise<DirectionsResult> {
    void _origin;
    void _destination;
    void _waypoints;
    throw new AppError("EXT_001", "Service cartographique indisponible", 503);
  }
}
