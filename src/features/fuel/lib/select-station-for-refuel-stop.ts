import {
  haversineKm,
  type LatLng,
} from "@/features/fuel/lib/route-segmentation";
import {
  REFUEL_STOP_LOCAL_CITY_MAX_KM,
  REFUEL_STOP_MAX_ROUTE_POINT_DISTANCE_KM,
  type RoutePointAtDistance,
} from "@/features/fuel/lib/resolve-route-point";
import {
  candidateHasRealStationIdentity,
  type FuelStopCandidate,
} from "@/features/fuel/lib/trip-fuel-types";

export function stationSelectionKey(input: {
  id?: string | null;
  name?: string | null;
  latitude: number;
  longitude: number;
}): string {
  if (input.id?.trim()) return input.id.trim();
  const name = (input.name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return `${name}|${input.latitude.toFixed(5)}|${input.longitude.toFixed(5)}`;
}

/**
 * Choisit une station corridor près du point d'arrêt sur la route.
 * Ne sélectionne pas uniquement sur le prix si la station est trop loin.
 */
export function selectStationForRefuelStop(input: {
  routePoint: RoutePointAtDistance;
  stationCandidates: FuelStopCandidate[];
  previousSelectedStationIds: Set<string>;
  maxRoutePointDistanceKm?: number;
  maxDetourKm?: number;
  expectedDistanceKm?: number;
  distanceToleranceKm?: number;
}): FuelStopCandidate | null {
  const maxRoute =
    input.maxRoutePointDistanceKm ?? REFUEL_STOP_MAX_ROUTE_POINT_DISTANCE_KM;
  const maxDetour = input.maxDetourKm ?? 15;
  const expectedKm =
    input.expectedDistanceKm ?? input.routePoint.distanceFromStartKm;
  const distTol = input.distanceToleranceKm ?? 40;

  const rp: LatLng = {
    lat: input.routePoint.latitude,
    lng: input.routePoint.longitude,
  };

  type Ranked = {
    candidate: FuelStopCandidate;
    toRoutePointKm: number;
    score: number;
  };

  const ranked: Ranked[] = [];

  for (const c of input.stationCandidates) {
    // Exiger une vraie identité de station (nom + coords) — pas une zone prix
    if (!candidateHasRealStationIdentity(c)) continue;

    const key = stationSelectionKey({
      id: c.id,
      name: c.stationName ?? c.label,
      latitude: c.latitude!,
      longitude: c.longitude!,
    });
    if (input.previousSelectedStationIds.has(key)) continue;

    const toRoutePointKm = haversineKm(rp, {
      lat: c.latitude!,
      lng: c.longitude!,
    });
    if (toRoutePointKm > maxRoute) continue;
    if (c.detourKm > maxDetour) continue;

    const alongDelta = Math.abs(c.distanceFromStartKm - expectedKm);
    if (alongDelta > distTol && toRoutePointKm > maxRoute * 0.5) continue;

    // Score : proximité routePoint prioritaire ; prix secondaire (ne pas
    // sacrifier la géographie pour quelques cents)
    const score =
      toRoutePointKm * 10 +
      Math.max(0, c.detourKm) * 2 +
      alongDelta * 0.05 +
      c.pricePerLiter * 0.15 +
      (c.isStationLevel ? 0 : 1);

    ranked.push({ candidate: c, toRoutePointKm, score });
  }

  ranked.sort((a, b) => a.score - b.score);
  return ranked[0]?.candidate ?? null;
}

export function isRefuelStopLocationSuspicious(input: {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  city: string | null | undefined;
  distanceFromStartKm: number;
  routeStart: LatLng | null;
  routeStartCity?: string | null;
  routePoint?: RoutePointAtDistance | null;
  maxRoutePointDistanceKm?: number;
}): boolean {
  const {
    latitude,
    longitude,
    city,
    distanceFromStartKm,
    routeStart,
    routeStartCity,
  } = input;
  const maxRoute =
    input.maxRoutePointDistanceKm ?? REFUEL_STOP_MAX_ROUTE_POINT_DISTANCE_KM;

  if (!(distanceFromStartKm > REFUEL_STOP_LOCAL_CITY_MAX_KM)) {
    // Proche du départ : pas suspect d'utiliser la ville de départ
    if (input.routePoint && latitude != null && longitude != null) {
      const d = haversineKm(
        { lat: latitude, lng: longitude },
        {
          lat: input.routePoint.latitude,
          lng: input.routePoint.longitude,
        },
      );
      return d > maxRoute;
    }
    return false;
  }

  if (latitude != null && longitude != null && routeStart) {
    const toStart = haversineKm({ lat: latitude, lng: longitude }, routeStart);
    if (toStart < REFUEL_STOP_LOCAL_CITY_MAX_KM) return true;
  }

  if (input.routePoint && latitude != null && longitude != null) {
    const d = haversineKm(
      { lat: latitude, lng: longitude },
      {
        lat: input.routePoint.latitude,
        lng: input.routePoint.longitude,
      },
    );
    if (d > maxRoute) return true;
  }

  const cityNorm = city?.trim().toLowerCase() ?? "";
  const startCityNorm = routeStartCity?.trim().toLowerCase() ?? "";
  if (
    cityNorm &&
    startCityNorm &&
    (cityNorm === startCityNorm ||
      cityNorm.includes(startCityNorm) ||
      startCityNorm.includes(cityNorm))
  ) {
    return true;
  }

  // Libellés de régions tarifaires métropolitaines courantes utilisés à tort
  // comme localité d'arrêt (ex. prix régional FDE « Montréal »).
  if (
    distanceFromStartKm > REFUEL_STOP_LOCAL_CITY_MAX_KM &&
    /^(montr[eé]al|quebec|québec|laval|longueuil)$/i.test(cityNorm)
  ) {
    // Suspect seulement si coords absentes ou proches du départ
    if (latitude == null || longitude == null) return true;
    if (routeStart) {
      const toStart = haversineKm(
        { lat: latitude, lng: longitude },
        routeStart,
      );
      if (toStart < 80) return true;
    }
    // Coords loin du départ mais ville = métropole tarifaire → ville incorrecte
    return true;
  }

  return false;
}
