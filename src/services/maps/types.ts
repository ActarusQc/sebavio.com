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

export type DirectionsLegSummary = {
  distanceKm: number;
  durationMin: number;
  start: LatLng;
  end: LatLng;
};

export type DirectionsResult = {
  distanceKm: number;
  durationMin: number;
  /** Encoded polyline Google (overview). */
  polyline: string;
  provider: "google";
  /** Nombre de legs (= waypoints intermédiaires + 1). */
  legCount: number;
  legs: DirectionsLegSummary[];
  /** Fin du dernier leg — doit correspondre à la destination demandée. */
  finalDestination: LatLng;
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
