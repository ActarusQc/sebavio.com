/**
 * Localise les arrêts carburant sur la polyline réelle et associe de vraies stations.
 * Lieu (station) et prix sont indépendants : station exacte + prix régional = OK.
 */
import type {
  CalculatedFillStop,
  TripFuelCalculationResult,
} from "@/features/fuel/lib/trip-fuel-calculator";
import type { FuelStopCandidate } from "@/features/fuel/lib/trip-fuel-types";
import type { LatLng } from "@/features/fuel/lib/route-segmentation";
import { decodeGooglePolyline } from "@/features/maps/lib/polyline";
import {
  REFUEL_STOP_MAX_DETOUR_KM,
  REFUEL_STOP_MAX_ROUTE_POINT_DISTANCE_KM,
  REFUEL_STOP_ROUTE_DISTANCE_TOLERANCE_KM,
  resolveRoutePointAtDistance,
  reverseRoutePath,
} from "@/features/fuel/lib/resolve-route-point";
import {
  isRefuelStopLocationSuspicious,
  selectStationForRefuelStop,
  stationSelectionKey,
} from "@/features/fuel/lib/select-station-for-refuel-stop";
import { reverseGeocodeRoutePoint } from "@/features/fuel/services/reverse-geocode-route-point";
import { haversineKm } from "@/features/fuel/lib/route-segmentation";
import {
  extractGasBrand,
  findBestGasStationNearPoint,
  type NearbyGasStation,
} from "@/services/maps/places-gas-stations";
import { discoverFdeStationsNearPoint } from "@/features/fuel/services/discover-fde-stations-near-point";
import {
  excludeCostcoStations,
  isCostcoStation,
} from "@/features/fuel/lib/costco-station";

export type LocalizeRefuelStopsInput = {
  calculation: TripFuelCalculationResult;
  polyline: string | null | undefined;
  waypoints: LatLng[];
  outboundCandidates: FuelStopCandidate[];
  routeStart: LatLng | null;
  routeStartCity?: string | null;
  userId?: string;
  preferredFuelType?: string | null;
  /** Défaut false : ne pas associer de station Costco. */
  includeCostcoStations?: boolean;
  reverseGeocode?: typeof reverseGeocodeRoutePoint;
  findGasStation?: typeof findBestGasStationNearPoint;
  discoverFdeStations?: typeof discoverFdeStationsNearPoint;
  logger?: (msg: string, meta?: Record<string, unknown>) => void;
};

function decodePath(
  polyline: string | null | undefined,
  waypoints: LatLng[],
): LatLng[] {
  let path: LatLng[] = [];
  if (polyline) {
    try {
      path = decodeGooglePolyline(polyline);
    } catch {
      path = [];
    }
  }
  if (path.length < 2 && waypoints.length > 0) {
    path = waypoints;
  }
  return path;
}

function applyEstimatedAtRoutePoint(
  stop: CalculatedFillStop,
  routePoint: { latitude: number; longitude: number },
  city: string | null,
): void {
  stop.stationName = null;
  stop.address = null;
  stop.city = city;
  stop.latitude = Math.round(routePoint.latitude * 1e6) / 1e6;
  stop.longitude = Math.round(routePoint.longitude * 1e6) / 1e6;
  stop.isEstimatedLocation = true;
  stop.stationBrand = null;
  stop.placeId = null;
  stop.googleMapsUrl = null;
  stop.distanceFromRouteKm = null;
}

function applyNamedStation(
  stop: CalculatedFillStop,
  input: {
    name: string;
    address: string | null;
    city: string | null;
    latitude: number;
    longitude: number;
    brand?: string | null;
    placeId?: string | null;
    googleMapsUrl?: string | null;
    distanceFromRouteKm: number;
    detourKm: number;
    /** Si Google fournit un prix station, l'appliquer (sans changer les litres). */
    googlePricePerLiter?: number | null;
    googlePriceUpdatedAt?: string | null;
  },
): void {
  stop.stationName = input.name;
  stop.address = input.address;
  stop.city = input.city;
  stop.latitude = Math.round(input.latitude * 1e6) / 1e6;
  stop.longitude = Math.round(input.longitude * 1e6) / 1e6;
  stop.isEstimatedLocation = false;
  stop.stationBrand = input.brand ?? extractGasBrand(input.name);
  stop.placeId = input.placeId ?? null;
  stop.googleMapsUrl =
    input.googleMapsUrl ??
    `https://www.google.com/maps/search/?api=1&query=${input.latitude},${input.longitude}`;
  stop.distanceFromRouteKm =
    Math.round(input.distanceFromRouteKm * 1000) / 1000;
  stop.detourKm = Math.round(input.detourKm * 10) / 10;

  if (
    input.googlePricePerLiter != null &&
    input.googlePricePerLiter > 0 &&
    stop.litersAdded > 0
  ) {
    stop.pricePerLiter = input.googlePricePerLiter;
    stop.priceGranularity = "station";
    stop.priceSource = "Google Places";
    stop.pricePeriod = input.googlePriceUpdatedAt ?? stop.pricePeriod;
    stop.cost =
      Math.round(stop.litersAdded * input.googlePricePerLiter * 100) / 100;
  }

  stop.positionLabel = input.name;
}

function applyCandidateStation(
  stop: CalculatedFillStop,
  station: FuelStopCandidate,
  routePoint: { latitude: number; longitude: number },
): void {
  const lat = station.latitude!;
  const lng = station.longitude!;
  const distanceFromRouteKm = haversineKm(
    { lat: routePoint.latitude, lng: routePoint.longitude },
    { lat, lng },
  );
  const name =
    station.stationName?.trim() ||
    station.label.replace(/\s*\(prix régional estimé\)\s*$/i, "").trim();

  applyNamedStation(stop, {
    name,
    address: station.address?.trim() || null,
    city: station.city?.trim() || null,
    latitude: lat,
    longitude: lng,
    brand: extractGasBrand(name),
    placeId: station.id.startsWith("zone-") ? null : station.id,
    distanceFromRouteKm,
    detourKm: station.detourKm > 0 ? station.detourKm : distanceFromRouteKm * 2,
  });
  // Toujours rattacher le prix du candidat station (même si estimation).
  // Ne pas laisser un prix de zone / Montréal écraser le prix de la station.
  if (station.pricePerLiter > 0) {
    stop.pricePerLiter = station.pricePerLiter;
    stop.priceGranularity = station.isStationLevel ? "station" : "regional";
    stop.priceSource = station.source;
    stop.priceIsEstimate = !station.isExactForStation;
    stop.cost =
      Math.round(stop.litersAdded * station.pricePerLiter * 100) / 100;
  }
}

function applyPlacesStation(
  stop: CalculatedFillStop,
  station: NearbyGasStation,
): void {
  applyNamedStation(stop, {
    name: station.name,
    address: station.address,
    city: station.city,
    latitude: station.latitude,
    longitude: station.longitude,
    brand: station.brand,
    placeId: station.placeId,
    googleMapsUrl: station.googleMapsUrl,
    distanceFromRouteKm: station.distanceFromSearchKm,
    detourKm: station.distanceFromSearchKm * 2,
    googlePricePerLiter: station.pricePerLiter,
    googlePriceUpdatedAt: station.priceUpdatedAt,
  });
}

async function localizeLegStops(input: {
  stops: CalculatedFillStop[];
  path: LatLng[];
  legDistanceKm: number;
  candidates: FuelStopCandidate[];
  selectedIds: Set<string>;
  excludePlaceIds: Set<string>;
  routeStart: LatLng | null;
  routeStartCity?: string | null;
  userId?: string;
  preferredFuelType?: string | null;
  includeCostcoStations?: boolean;
  reverseGeocode: typeof reverseGeocodeRoutePoint;
  findGasStation: typeof findBestGasStationNearPoint;
  discoverFdeStations: typeof discoverFdeStationsNearPoint;
  logger?: LocalizeRefuelStopsInput["logger"];
}): Promise<void> {
  const {
    stops,
    path,
    legDistanceKm,
    selectedIds,
    excludePlaceIds,
    routeStart,
    routeStartCity,
    userId,
    preferredFuelType,
    reverseGeocode,
    findGasStation,
    discoverFdeStations,
    logger,
  } = input;
  const includeCostco = input.includeCostcoStations === true;
  const candidates = excludeCostcoStations(input.candidates, includeCostco);

  for (const stop of stops) {
    if (stop.kind !== "en_route") continue;

    if (path.length < 2) {
      logger?.("fuel_localize_no_polyline", {
        stopId: stop.id,
        distanceFromStartKm: stop.distanceFromStartKm,
      });
      const suspicious = isRefuelStopLocationSuspicious({
        latitude: stop.latitude,
        longitude: stop.longitude,
        city: stop.city,
        distanceFromStartKm: stop.distanceFromStartKm,
        routeStart,
        routeStartCity,
      });
      if (suspicious || !stop.stationName) {
        stop.stationName = null;
        stop.address = null;
        stop.city = null;
        stop.latitude = null;
        stop.longitude = null;
        stop.isEstimatedLocation = true;
        stop.stationBrand = null;
        stop.placeId = null;
        stop.googleMapsUrl = null;
        stop.distanceFromRouteKm = null;
      }
      continue;
    }

    const routePoint = resolveRoutePointAtDistance({
      path,
      distanceFromStartKm: stop.distanceFromStartKm,
      totalDistanceKm: legDistanceKm,
    });
    if (!routePoint) continue;

    const suspicious = isRefuelStopLocationSuspicious({
      latitude: stop.latitude,
      longitude: stop.longitude,
      city: stop.city,
      distanceFromStartKm: stop.distanceFromStartKm,
      routeStart,
      routeStartCity,
      routePoint,
    });

    const nearRoutePoint =
      stop.latitude != null &&
      stop.longitude != null &&
      haversineKm(
        { lat: stop.latitude, lng: stop.longitude },
        { lat: routePoint.latitude, lng: routePoint.longitude },
      ) <= REFUEL_STOP_MAX_ROUTE_POINT_DISTANCE_KM;

    const hasConfirmedStation =
      Boolean(stop.stationName?.trim()) &&
      !stop.isEstimatedLocation &&
      nearRoutePoint &&
      !suspicious &&
      (includeCostco || !isCostcoStation(stop.stationName, stop.stationBrand));

    if (hasConfirmedStation) {
      const key = stationSelectionKey({
        name: stop.stationName,
        latitude: stop.latitude!,
        longitude: stop.longitude!,
      });
      selectedIds.add(key);
      if (stop.placeId) excludePlaceIds.add(stop.placeId);
      if (stop.distanceFromRouteKm == null && stop.latitude != null) {
        stop.distanceFromRouteKm =
          Math.round(
            haversineKm(
              { lat: routePoint.latitude, lng: routePoint.longitude },
              { lat: stop.latitude, lng: stop.longitude! },
            ) * 1000,
          ) / 1000;
      }
      if (
        !stop.googleMapsUrl &&
        stop.latitude != null &&
        stop.longitude != null
      ) {
        stop.googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`;
      }
      if (!stop.stationBrand && stop.stationName) {
        stop.stationBrand = extractGasBrand(stop.stationName);
      }
      continue;
    }

    // 1) Candidats corridor FDE avec vraie identité (même prix régional)
    let selected = selectStationForRefuelStop({
      routePoint,
      stationCandidates: candidates,
      previousSelectedStationIds: selectedIds,
      maxRoutePointDistanceKm: REFUEL_STOP_MAX_ROUTE_POINT_DISTANCE_KM,
      maxDetourKm: REFUEL_STOP_MAX_DETOUR_KM,
      expectedDistanceKm: stop.distanceFromStartKm,
      distanceToleranceKm: Math.max(
        REFUEL_STOP_ROUTE_DISTANCE_TOLERANCE_KM * 2,
        40,
      ),
    });

    // 1b) Nearby FDE ciblé sur le routePoint (autres carburants si premium vide)
    if (!selected) {
      try {
        const localFde = excludeCostcoStations(
          await discoverFdeStations({
            latitude: routePoint.latitude,
            longitude: routePoint.longitude,
            preferredFuelType,
            radiusKm: REFUEL_STOP_MAX_DETOUR_KM,
          }),
          includeCostco,
        );
        selected = selectStationForRefuelStop({
          routePoint,
          stationCandidates: localFde,
          previousSelectedStationIds: selectedIds,
          maxRoutePointDistanceKm: REFUEL_STOP_MAX_ROUTE_POINT_DISTANCE_KM,
          maxDetourKm: REFUEL_STOP_MAX_DETOUR_KM,
          expectedDistanceKm: stop.distanceFromStartKm,
          distanceToleranceKm: 80,
        });
      } catch (err) {
        logger?.("fuel_fde_discover_failed", {
          stopId: stop.id,
          error: err instanceof Error ? err.message : "unknown",
        });
      }
    }

    if (selected) {
      applyCandidateStation(stop, selected, routePoint);
      selectedIds.add(
        stationSelectionKey({
          id: selected.id,
          name: selected.stationName ?? selected.label,
          latitude: selected.latitude!,
          longitude: selected.longitude!,
        }),
      );
      continue;
    }

    // 2) Google Places (New) près du routePoint
    try {
      const placesStation = await findGasStation({
        latitude: routePoint.latitude,
        longitude: routePoint.longitude,
        preferredFuelType,
        userId,
        maxDistanceKm: REFUEL_STOP_MAX_DETOUR_KM,
        excludePlaceIds,
        excludeCostco: !includeCostco,
      });
      if (placesStation) {
        applyPlacesStation(stop, placesStation);
        excludePlaceIds.add(placesStation.placeId);
        selectedIds.add(
          stationSelectionKey({
            id: placesStation.placeId,
            name: placesStation.name,
            latitude: placesStation.latitude,
            longitude: placesStation.longitude,
          }),
        );
        continue;
      }
    } catch (err) {
      logger?.("fuel_places_search_failed", {
        stopId: stop.id,
        error: err instanceof Error ? err.message : "unknown",
      });
    }

    // 3) Repli : point sur polyline + reverse geocode (pas de station inventée)
    let city: string | null = null;
    try {
      const geo = await reverseGeocode({
        latitude: routePoint.latitude,
        longitude: routePoint.longitude,
        userId,
      });
      city = geo.locality;
    } catch {
      city = null;
    }

    if (
      city &&
      routeStartCity &&
      city.trim().toLowerCase() === routeStartCity.trim().toLowerCase() &&
      stop.distanceFromStartKm > 40
    ) {
      city = null;
    }

    applyEstimatedAtRoutePoint(stop, routePoint, city);
  }
}

/**
 * Associe une vraie station (FDE ou Google Places) à chaque arrêt en route.
 * Ne modifie pas litres / stratégie ; peut raffiner le prix si Google le fournit.
 */
export async function localizeRefuelStopsOnCalculation(
  input: LocalizeRefuelStopsInput,
): Promise<void> {
  const reverseGeocode = input.reverseGeocode ?? reverseGeocodeRoutePoint;
  const findGasStation = input.findGasStation ?? findBestGasStationNearPoint;
  const discoverFdeStations =
    input.discoverFdeStations ?? discoverFdeStationsNearPoint;
  const path = decodePath(input.polyline, input.waypoints);
  const selectedIds = new Set<string>();
  const excludePlaceIds = new Set<string>();

  const returnCandidates = input.outboundCandidates.map((c) => ({
    ...c,
    id: `ret-${c.id}`,
    distanceFromStartKm: Math.max(
      0,
      input.calculation.outbound.distanceKm - c.distanceFromStartKm,
    ),
  }));

  await localizeLegStops({
    stops: input.calculation.outbound.stops,
    path,
    legDistanceKm: input.calculation.outbound.distanceKm,
    candidates: input.outboundCandidates,
    selectedIds,
    excludePlaceIds,
    routeStart: input.routeStart,
    routeStartCity: input.routeStartCity,
    userId: input.userId,
    preferredFuelType: input.preferredFuelType,
    includeCostcoStations: input.includeCostcoStations,
    reverseGeocode,
    findGasStation,
    discoverFdeStations,
    logger: input.logger,
  });

  if (input.calculation.returnLeg) {
    const returnPath = path.length >= 2 ? reverseRoutePath(path) : path;
    await localizeLegStops({
      stops: input.calculation.returnLeg.stops,
      path: returnPath,
      legDistanceKm: input.calculation.returnLeg.distanceKm,
      candidates: returnCandidates,
      selectedIds: new Set<string>(),
      excludePlaceIds: new Set<string>(),
      routeStart: path.length >= 2 ? path[path.length - 1]! : input.routeStart,
      routeStartCity: input.routeStartCity,
      userId: input.userId,
      preferredFuelType: input.preferredFuelType,
      includeCostcoStations: input.includeCostcoStations,
      reverseGeocode,
      findGasStation,
      discoverFdeStations,
      logger: input.logger,
    });
  }

  for (const s of input.calculation.allStops ?? []) {
    const src =
      input.calculation.outbound.stops.find((x) => x.id === s.id) ??
      input.calculation.returnLeg?.stops.find((x) => x.id === s.id);
    if (!src || src === s) continue;
    s.stationName = src.stationName;
    s.address = src.address;
    s.city = src.city;
    s.latitude = src.latitude;
    s.longitude = src.longitude;
    s.isEstimatedLocation = src.isEstimatedLocation;
    s.detourKm = src.detourKm;
    s.regionLabel = src.regionLabel;
    s.stationBrand = src.stationBrand;
    s.placeId = src.placeId;
    s.googleMapsUrl = src.googleMapsUrl;
    s.distanceFromRouteKm = src.distanceFromRouteKm;
    s.pricePerLiter = src.pricePerLiter;
    s.priceGranularity = src.priceGranularity;
    s.priceSource = src.priceSource;
    s.pricePeriod = src.pricePeriod;
    s.cost = src.cost;
    s.positionLabel = src.positionLabel;
  }
}
