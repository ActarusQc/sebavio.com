export type LatLng = {
  lat: number;
  lng: number;
};

export type GeocodeResult = LatLng & {
  formattedAddress: string;
};

export type DirectionsWaypoint = LatLng & {
  /** Libellé optionnel (debug / hash). */
  label?: string;
};

export type DirectionsResult = {
  distanceKm: number;
  durationMin: number;
  /** Encoded polyline Google (overview). */
  polyline: string;
  provider: "google";
};

export type MapsProviderAvailability = {
  available: boolean;
  reason?: "missing_key" | "provider_error";
};

/**
 * Contrat fournisseur cartographique — le métier n'appelle jamais Google directement.
 */
export interface MapsProvider {
  readonly name: string;
  isAvailable(): MapsProviderAvailability;
  geocode(address: string): Promise<GeocodeResult>;
  directions(
    origin: DirectionsWaypoint,
    destination: DirectionsWaypoint,
    waypoints?: DirectionsWaypoint[],
  ): Promise<DirectionsResult>;
}
