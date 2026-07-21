/**
 * Découverte de stations FDE près d'un point (identité lieu, indépendante du prix voyage).
 * Utile quand le carburant du trajet (ex. premium) n'a aucun hit nearby.
 */
import { listNearbyFuelStations } from "@/services/fuel-prices/fde/fuel-price-service";
import { isFdeEnabled } from "@/integrations/fde";
import { haversineKm } from "@/features/fuel/lib/route-segmentation";
import type { FuelStopCandidate } from "@/features/fuel/lib/trip-fuel-types";

const DISCOVERY_FUELS = ["regular", "premium", "diesel"] as const;

export async function discoverFdeStationsNearPoint(input: {
  latitude: number;
  longitude: number;
  preferredFuelType?: string | null;
  radiusKm?: number;
  limit?: number;
}): Promise<FuelStopCandidate[]> {
  if (!isFdeEnabled()) return [];

  const radiusKm = input.radiusKm ?? 15;
  const limit = input.limit ?? 20;
  const fuels = [input.preferredFuelType, ...DISCOVERY_FUELS].filter(
    (f, i, a): f is string => Boolean(f) && a.indexOf(f) === i,
  );

  const byId = new Map<string, FuelStopCandidate>();

  for (const fuelType of fuels) {
    try {
      const { stations } = await listNearbyFuelStations({
        latitude: input.latitude,
        longitude: input.longitude,
        fuelType,
        radiusKm,
        limit,
      });
      for (const st of stations) {
        const lat = st.latitude;
        const lng = st.longitude;
        if (lat == null || lng == null) continue;
        const name = (st.name ?? st.brand ?? "").trim();
        if (!name) continue;
        const id = st.canonicalId ?? st.id;
        if (byId.has(id)) continue;
        const dist = haversineKm(
          { lat: input.latitude, lng: input.longitude },
          { lat, lng },
        );
        byId.set(id, {
          id,
          distanceFromStartKm: 0, // recalculé par le sélecteur via routePoint
          detourKm: Math.round(dist * 2 * 10) / 10,
          pricePerLiter: 0,
          label: name,
          regionLabel: st.administrativeRegionName ?? null,
          granularity: "unknown",
          source: "FDE nearby",
          isStationLevel: false,
          stationName: name,
          address: st.addressLine?.trim() || null,
          city: st.city?.trim() || null,
          latitude: lat,
          longitude: lng,
        });
      }
      if (byId.size >= 5) break;
    } catch {
      /* essai carburant suivant */
    }
  }

  return [...byId.values()].sort((a, b) => a.detourKm - b.detourKm);
}
