import { decodeGooglePolyline } from "@/features/maps/lib/polyline";
import {
  getFuelSimulationConfig,
  type FuelSimulationConfig,
} from "@/features/fuel/config/simulation";
import {
  haversineKm,
  sampleFromWaypoints,
  sampleRoutePoints,
  type LatLng,
  type RouteSamplePoint,
} from "@/features/fuel/lib/route-segmentation";
import {
  classifyStationPrices,
  type PriceGranularityKind,
} from "@/features/fuel/lib/price-granularity";
import type {
  FuelPriceSourceType,
  FuelStopCandidate,
} from "@/features/fuel/lib/trip-fuel-types";
import { isFdeEnabled, logFdeEvent, getFdeConfig } from "@/integrations/fde";
import {
  listNearbyFuelStations,
  lookupFuelPriceReference,
  lookupRegionalFuelPrice,
} from "@/services/fuel-prices/fde";
import { isCostcoStation } from "@/features/fuel/lib/costco-station";
import { isPriceFreshEnough } from "@/services/fuel-prices/fde/price-selection";
import { requireMappedFdeFuel } from "@/services/fuel-prices/fde/mapping";
import type { FuelPriceQuote } from "@/services/fuel-prices/types";

export type CorridorCoverageStats = {
  samplePoints: number;
  nearbyCalls: number;
  rawStationHits: number;
  uniqueStations: number;
  stationsInCorridor: number;
  withExactPrice: number;
  withCityPrice: number;
  withRegionalPrice: number;
  withoutPrice: number;
  rejectedTooFar: number;
  candidates: number;
  analyzedByOptimizer: number;
  retainedStops: number;
  regions: string[];
  distinctPriceValues: number;
  distinctPriceIdentities: number;
  sharedIdentityWarnings: string[];
};

export type BuildCorridorResult = {
  candidates: FuelStopCandidate[];
  departurePricePerLiter: number | null;
  warnings: string[];
  coverage: CorridorCoverageStats;
};

export type BuildCorridorInput = {
  totalDistanceKm: number;
  polyline: string | null | undefined;
  waypoints: LatLng[];
  vehicleFuelType: string | null;
  fallbackQuote?: FuelPriceQuote | null;
  config?: FuelSimulationConfig;
  /** Injecté pour tests. */
  listNearby?: typeof listNearbyFuelStations;
  lookupRegional?: typeof lookupRegionalFuelPrice;
  lookupPrice?: typeof lookupFuelPriceReference;
  /**
   * Inclure les stations Costco (accès membre).
   * Défaut false : exclure Costco du corridor / plan.
   */
  includeCostcoStations?: boolean;
};

type CollectedStation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  city: string | null;
  regionLabel: string | null;
  distanceFromStartKm: number;
  detourKm: number;
  /** Prix déclaré par la station nearby (peut être médiane partagée). */
  rawStationPrice: number | null;
  observedAt: string | null;
  collectedAt: string | null;
  declaredGranularity: string | null;
  freshness: string | null;
  source: string;
  attribution: string | null;
};

function mapGranularity(
  kind: PriceGranularityKind,
): FuelStopCandidate["granularity"] {
  if (kind === "station_exact") return "station";
  if (kind === "city_estimate" || kind === "regional_estimate")
    return "regional";
  return "unknown";
}

/**
 * Collecte les stations FDE le long du tracé (polyline), déduplique,
 * associe prix exact ou régional, produit des candidats pour le simulateur.
 */
export async function buildFuelStopCandidatesAlongRoute(
  input: BuildCorridorInput,
): Promise<BuildCorridorResult> {
  const config = input.config ?? getFuelSimulationConfig();
  const warnings: string[] = [];
  const listNearby = input.listNearby ?? listNearbyFuelStations;
  const lookupRegional = input.lookupRegional ?? lookupRegionalFuelPrice;
  const lookupPrice = input.lookupPrice ?? lookupFuelPriceReference;
  const includeCostco = input.includeCostcoStations === true;

  const coverage: CorridorCoverageStats = {
    samplePoints: 0,
    nearbyCalls: 0,
    rawStationHits: 0,
    uniqueStations: 0,
    stationsInCorridor: 0,
    withExactPrice: 0,
    withCityPrice: 0,
    withRegionalPrice: 0,
    withoutPrice: 0,
    rejectedTooFar: 0,
    candidates: 0,
    analyzedByOptimizer: 0,
    retainedStops: 0,
    regions: [],
    distinctPriceValues: 0,
    distinctPriceIdentities: 0,
    sharedIdentityWarnings: [],
  };

  let path: LatLng[] = [];
  if (input.polyline) {
    try {
      path = decodeGooglePolyline(input.polyline);
    } catch {
      warnings.push("Polyline illisible — repli sur les étapes du voyage.");
    }
  }
  if (path.length < 2 && input.waypoints.length >= 1) {
    path = input.waypoints;
  }

  const samples: RouteSamplePoint[] =
    path.length >= 2
      ? sampleRoutePoints({
          path,
          totalDistanceKm: input.totalDistanceKm,
          intervalKm: config.stationSampleIntervalKm,
          maxSamples: config.maxStationSamples,
        })
      : sampleFromWaypoints({
          points: path.length > 0 ? path : input.waypoints,
          totalDistanceKm: input.totalDistanceKm,
        });

  coverage.samplePoints = samples.length;

  if (samples.length === 0) {
    return fallbackOnly(input, warnings, coverage);
  }

  const mapped = requireMappedFdeFuel(input.vehicleFuelType);
  if (mapped === "not_applicable") {
    return {
      candidates: [],
      departurePricePerLiter: null,
      warnings: [...warnings, "Carburant non applicable."],
      coverage,
    };
  }

  const byId = new Map<string, CollectedStation>();
  const regionCache = new Map<string, number | null>();
  const fdeConfig = isFdeEnabled() ? getFdeConfig() : null;
  // Fraîcheur « exacte » vs horizon découverte (identité station même si prix vieillissant)
  const staleHours = fdeConfig?.stalePriceMaxHours ?? 24;
  const discoveryHours = Math.min(
    168,
    Math.max(fdeConfig?.discoveryMaxAgeHours ?? 168, staleHours),
  );

  // Échantillonner le trajet (pas seulement départ / étapes utilisateur)
  for (const sample of samples) {
    if (
      sample.distanceFromStartKm >= input.totalDistanceKm - 0.5 &&
      samples.length > 1
    ) {
      continue;
    }

    if (!isFdeEnabled()) break;

    let stations: Awaited<ReturnType<typeof listNearby>>["stations"] = [];
    try {
      coverage.nearbyCalls += 1;
      const res = await listNearby({
        latitude: sample.lat,
        longitude: sample.lng,
        fuelType: input.vehicleFuelType,
        radiusKm: config.corridorRadiusKm,
        limit: fdeConfig?.nearbyMaxLimit ?? 50,
      });
      stations = res.stations;
      coverage.rawStationHits += stations.length;

      if (stations.length < config.sparseStationThreshold) {
        coverage.nearbyCalls += 1;
        const widened = await listNearby({
          latitude: sample.lat,
          longitude: sample.lng,
          fuelType: input.vehicleFuelType,
          radiusKm: config.corridorRadiusSparseKm,
          limit: fdeConfig?.nearbyMaxLimit ?? 50,
        });
        stations = mergeStationsById(stations, widened.stations);
        coverage.rawStationHits += widened.stations.length;
      }
    } catch {
      warnings.push(
        `Recherche stations indisponible près de ${sample.label ?? `km ${Math.round(sample.distanceFromStartKm)}`}.`,
      );
      continue;
    }

    for (const st of stations) {
      const id = st.canonicalId ?? st.id;
      const lat = st.latitude;
      const lng = st.longitude;
      if (
        lat == null ||
        lng == null ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        continue;
      }

      const stationName = st.name ?? st.brand ?? `Station ${id.slice(0, 8)}`;
      if (!includeCostco && isCostcoStation(stationName, st.brand, st.name)) {
        continue;
      }

      const along = projectOntoRoute({
        station: { lat, lng },
        path:
          path.length >= 2
            ? path
            : samples.map((s) => ({ lat: s.lat, lng: s.lng })),
        totalDistanceKm: input.totalDistanceKm,
      });

      const detourKm = along.perpendicularKm * 2;
      if (
        detourKm > config.maxDetourKm * 2 &&
        along.perpendicularKm > config.corridorRadiusSparseKm
      ) {
        coverage.rejectedTooFar += 1;
        continue;
      }

      const priceRow = st.prices.find((p) => p.fuelType === mapped) as
        | {
            fuelType: string;
            price: number;
            observedAt: string;
            collectedAt?: string;
            freshness: { freshnessStatus: string };
            granularity?: string;
          }
        | undefined;
      let rawStationPrice: number | null = null;
      let observedAt: string | null = null;
      let collectedAt: string | null = null;
      let declaredGranularity: string | null = null;
      let freshness: string | null = null;
      if (priceRow && priceRow.price > 0) {
        // Accepter le prix dans l'horizon découverte (identité + valeur station).
        // La fraîcheur stricte ne décide plus d'abandonner le prix station.
        if (isPriceFreshEnough(priceRow.observedAt, discoveryHours)) {
          rawStationPrice = Math.round(priceRow.price * 1000) / 1000;
          observedAt = priceRow.observedAt;
          collectedAt = priceRow.collectedAt ?? null;
          declaredGranularity = priceRow.granularity ?? "station";
          freshness = priceRow.freshness.freshnessStatus;
          if (!isPriceFreshEnough(priceRow.observedAt, staleHours)) {
            // Hors fenêtre « frais » : garder le prix station, marquer vieillissant
            freshness = freshness === "fresh" ? "aging" : freshness;
            pushWarningOnce(
              warnings,
              "Prix station hors fenêtre fraîche — identité conservée, granularité prudente.",
            );
          }
        }
      } else if (priceRow && !(priceRow.price > 0)) {
        pushWarningOnce(
          warnings,
          "Réponse nearby : station sans prix propre utilisable.",
        );
      }

      const existing = byId.get(id);
      if (
        !existing ||
        (rawStationPrice != null && existing.rawStationPrice == null) ||
        (rawStationPrice != null &&
          existing.rawStationPrice != null &&
          along.perpendicularKm < existing.detourKm / 2)
      ) {
        byId.set(id, {
          id,
          name: stationName,
          lat,
          lng,
          address: st.addressLine?.trim() || null,
          city: st.city?.trim() || null,
          regionLabel: st.administrativeRegionName ?? null,
          distanceFromStartKm: along.distanceFromStartKm,
          detourKm: Math.round(detourKm * 10) / 10,
          rawStationPrice,
          observedAt,
          collectedAt,
          declaredGranularity,
          freshness,
          source:
            st.source === "regie-essence-quebec"
              ? "Régie de l'énergie du Québec"
              : st.source,
          attribution: st.attribution?.notice ?? null,
        });
      }
    }
  }

  coverage.uniqueStations = byId.size;
  coverage.stationsInCorridor = byId.size;

  // Classification honnête : un même identity de prix sur plusieurs stations
  // → estimation régionale (jamais « exact »).
  const withRawPrice = [...byId.values()].filter(
    (s) => s.rawStationPrice != null && s.observedAt,
  );
  const classified = classifyStationPrices(
    withRawPrice.map((s) => ({
      stationId: s.id,
      regionLabel: s.regionLabel,
      price: s.rawStationPrice!,
      observedAt: s.observedAt!,
      collectedAt: s.collectedAt,
      declaredGranularity: s.declaredGranularity,
    })),
    { sharedIdentityThreshold: 2 },
  );
  coverage.distinctPriceValues = classified.distinctPriceValues;
  coverage.distinctPriceIdentities = classified.distinctPriceIdentities;
  coverage.sharedIdentityWarnings = classified.sharedIdentityWarnings;
  for (const w of classified.sharedIdentityWarnings) {
    pushWarningOnce(warnings, w);
  }
  const classifiedByStation = new Map(
    classified.classified.map((c) => [c.stationId, c]),
  );

  // Prix régional par région (cache) pour stations sans prix propre
  const candidates: FuelStopCandidate[] = [];
  const regionSet = new Set<string>();

  for (const st of byId.values()) {
    let price: number | null = st.rawStationPrice;
    let granularity: FuelStopCandidate["granularity"] = "station";
    let isStationLevel = true;
    let sourceType: FuelPriceSourceType = "station_exact";
    let isExactForStation = true;
    let priceIdentity: string | null = null;
    let observedAt = st.observedAt;
    let source = st.source;
    const classif = classifiedByStation.get(st.id);
    const priceStillFresh =
      st.observedAt != null && isPriceFreshEnough(st.observedAt, staleHours);

    if (price != null && classif) {
      granularity = mapGranularity(classif.granularity);
      // Exact seulement si identité unique ET prix encore frais
      isExactForStation =
        classif.granularity === "station_exact" && priceStillFresh;
      isStationLevel = isExactForStation;
      priceIdentity = classif.priceIdentity;
      if (classif.granularity === "station_exact" && priceStillFresh) {
        sourceType = "station_exact";
        coverage.withExactPrice += 1;
      } else if (classif.granularity === "city_estimate") {
        sourceType = "city_estimate";
        coverage.withCityPrice += 1;
        source = `${st.source} (estimation ville)`;
      } else {
        // Prix partagé OU vieillissant : garder valeur station, granularité prudente
        sourceType = "regional_estimate";
        coverage.withRegionalPrice += 1;
        source = priceStillFresh
          ? `${st.source} (estimation régionale partagée)`
          : `${st.source} (prix station vieillissant)`;
      }
    } else if (price == null) {
      const regionKey = st.regionLabel?.trim() || "unknown";
      if (!regionCache.has(regionKey)) {
        try {
          const reg = await lookupRegional({
            fuelType: input.vehicleFuelType,
            // Préférer la ville de station à la région tarifaire (évite Montréal)
            regionHint: st.city ?? st.regionLabel ?? undefined,
          });
          regionCache.set(regionKey, reg?.priceCadPerLitre ?? null);
          if (reg && !observedAt) observedAt = reg.observedAt;
        } catch {
          regionCache.set(regionKey, null);
        }
      }
      const regional = regionCache.get(regionKey) ?? null;
      if (regional != null && regional > 0) {
        price = regional;
        granularity = "regional";
        isStationLevel = false;
        sourceType = "regional_estimate";
        isExactForStation = false;
        source = "FDE régional";
        coverage.withRegionalPrice += 1;
      } else {
        coverage.withoutPrice += 1;
        continue;
      }
    } else {
      // Prix présent mais non classifié (pas d'observedAt) → régional prudent
      granularity = "regional";
      isStationLevel = false;
      sourceType = "regional_estimate";
      isExactForStation = false;
      coverage.withRegionalPrice += 1;
      source = `${st.source} (granularité incertaine)`;
    }

    if (st.regionLabel) regionSet.add(st.regionLabel);
    if (st.freshness === "aging" || st.freshness === "stale") {
      pushWarningOnce(warnings, "Prix vieillissant — susceptibles de changer.");
    }

    candidates.push({
      id: st.id,
      distanceFromStartKm: st.distanceFromStartKm,
      detourKm: st.detourKm,
      pricePerLiter: price,
      // Toujours le nom de station — le suffixe estimation ne masque plus l'identité
      label: st.name,
      regionLabel: st.regionLabel,
      granularity,
      source,
      observedAt,
      attribution: st.attribution,
      isStationLevel,
      sourceType,
      isExactForStation,
      priceIdentity,
      stationName: st.name,
      address: st.address,
      // Ville réelle de la station uniquement — jamais la région tarifaire (ex. Montréal)
      city: st.city,
      latitude: st.lat,
      longitude: st.lng,
    });
  }

  // Si aucune station FDE mais polyline OK : échantillonner prix régionaux le long du trajet
  if (candidates.length === 0 && isFdeEnabled()) {
    for (const sample of samples) {
      if (sample.distanceFromStartKm >= input.totalDistanceKm - 0.5) continue;
      try {
        const ref = await lookupPrice({
          latitude: sample.lat,
          longitude: sample.lng,
          fuelType: input.vehicleFuelType,
        });
        candidates.push({
          id: `zone-${sample.distanceFromStartKm}`,
          distanceFromStartKm: sample.distanceFromStartKm,
          detourKm: 0,
          pricePerLiter: ref.priceCadPerLitre,
          label: sample.label ?? `Km ${Math.round(sample.distanceFromStartKm)}`,
          regionLabel: ref.regionLabel ?? null,
          granularity: ref.granularity,
          source: ref.source,
          observedAt: ref.observedAt,
          attribution: ref.attribution ?? null,
          isStationLevel: ref.granularity === "station" && !ref.fallbackUsed,
          sourceType: ref.fallbackUsed
            ? "route_fallback"
            : ref.granularity === "station"
              ? "station_exact"
              : "regional_estimate",
          isExactForStation: ref.granularity === "station" && !ref.fallbackUsed,
          priceIdentity: null,
          stationName: null,
          address: null,
          // Localité résolue plus tard (reverse geocode) — pas la région de prix
          city: null,
          latitude: sample.lat,
          longitude: sample.lng,
        });
        if (ref.regionLabel) regionSet.add(ref.regionLabel);
        for (const w of ref.warnings) pushWarningOnce(warnings, w);
      } catch {
        /* zone sans prix */
      }
    }
  }

  if (candidates.length === 0 && input.fallbackQuote?.pricePerLiter) {
    candidates.push({
      id: "fallback-0",
      distanceFromStartKm: 0,
      detourKm: 0,
      pricePerLiter: input.fallbackQuote.pricePerLiter,
      label: "Départ (repli)",
      regionLabel: input.fallbackQuote.regionLabel ?? null,
      granularity:
        input.fallbackQuote.source === "fde_station" ? "station" : "regional",
      source: input.fallbackQuote.source,
      observedAt: input.fallbackQuote.capturedAt ?? null,
      attribution: input.fallbackQuote.attribution ?? null,
      isStationLevel: input.fallbackQuote.source === "fde_station",
      sourceType: "origin_fallback",
      isExactForStation: false,
      priceIdentity: null,
    });
    warnings.push(
      "Repli sur le prix unique disponible (couverture corridor vide).",
    );
  }

  coverage.candidates = candidates.length;
  coverage.analyzedByOptimizer = candidates.length;
  coverage.regions = [...regionSet];

  const departure =
    candidates
      .slice()
      .sort((a, b) => a.distanceFromStartKm - b.distanceFromStartKm)[0]
      ?.pricePerLiter ??
    input.fallbackQuote?.pricePerLiter ??
    null;

  logFdeEvent("corridor_stations", {
    samplePoints: coverage.samplePoints,
    nearbyCalls: coverage.nearbyCalls,
    rawHits: coverage.rawStationHits,
    unique: coverage.uniqueStations,
    exact: coverage.withExactPrice,
    city: coverage.withCityPrice,
    regional: coverage.withRegionalPrice,
    withoutPrice: coverage.withoutPrice,
    distinctPrices: coverage.distinctPriceValues,
    distinctIdentities: coverage.distinctPriceIdentities,
    candidates: coverage.candidates,
    regions: coverage.regions.length,
  });

  return {
    candidates,
    departurePricePerLiter: departure,
    warnings,
    coverage,
  };
}

function fallbackOnly(
  input: BuildCorridorInput,
  warnings: string[],
  coverage: CorridorCoverageStats,
): BuildCorridorResult {
  if (input.fallbackQuote?.pricePerLiter) {
    return {
      candidates: [
        {
          id: "fallback-0",
          distanceFromStartKm: 0,
          detourKm: 0,
          pricePerLiter: input.fallbackQuote.pricePerLiter,
          label: "Départ",
          regionLabel: input.fallbackQuote.regionLabel ?? null,
          granularity:
            input.fallbackQuote.source === "fde_station"
              ? "station"
              : "regional",
          source: input.fallbackQuote.source,
          observedAt: input.fallbackQuote.capturedAt ?? null,
          attribution: input.fallbackQuote.attribution ?? null,
          isStationLevel: input.fallbackQuote.source === "fde_station",
          sourceType: "origin_fallback",
          isExactForStation: false,
          priceIdentity: null,
        },
      ],
      departurePricePerLiter: input.fallbackQuote.pricePerLiter,
      warnings: [
        ...warnings,
        "Aucun point d'itinéraire — prix unique de repli utilisé.",
      ],
      coverage,
    };
  }
  return {
    candidates: [],
    departurePricePerLiter: null,
    warnings,
    coverage,
  };
}

function mergeStationsById<T extends { id: string; canonicalId?: string }>(
  a: T[],
  b: T[],
): T[] {
  const map = new Map<string, T>();
  for (const s of [...a, ...b]) {
    map.set(s.canonicalId ?? s.id, s);
  }
  return [...map.values()];
}

function pushWarningOnce(warnings: string[], message: string): void {
  if (!warnings.includes(message)) warnings.push(message);
}

/**
 * Projette une station sur le tracé : distance cumulée + écart perpendiculaire.
 */
export function projectOntoRoute(input: {
  station: LatLng;
  path: LatLng[];
  totalDistanceKm: number;
}): { distanceFromStartKm: number; perpendicularKm: number } {
  const { station, path, totalDistanceKm } = input;
  if (path.length === 0) {
    return { distanceFromStartKm: 0, perpendicularKm: 0 };
  }
  if (path.length === 1) {
    return {
      distanceFromStartKm: 0,
      perpendicularKm: haversineKm(path[0]!, station),
    };
  }

  const rawCum: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    rawCum.push(rawCum[i - 1]! + haversineKm(path[i - 1]!, path[i]!));
  }
  const rawTotal = rawCum[rawCum.length - 1]!;
  const scale = rawTotal > 0 ? totalDistanceKm / rawTotal : 1;

  let bestDist = Infinity;
  let bestAlong = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const proj = closestPointOnSegment(station, a, b);
    const d = haversineKm(station, proj.point);
    if (d < bestDist) {
      bestDist = d;
      bestAlong =
        (rawCum[i - 1]! + proj.t * (rawCum[i]! - rawCum[i - 1]!)) * scale;
    }
  }

  return {
    distanceFromStartKm: Math.round(bestAlong * 1000) / 1000,
    perpendicularKm: Math.round(bestDist * 1000) / 1000,
  };
}

function closestPointOnSegment(
  p: LatLng,
  a: LatLng,
  b: LatLng,
): { point: LatLng; t: number } {
  const abLat = b.lat - a.lat;
  const abLng = b.lng - a.lng;
  const apLat = p.lat - a.lat;
  const apLng = p.lng - a.lng;
  const ab2 = abLat * abLat + abLng * abLng;
  if (ab2 <= 0) return { point: a, t: 0 };
  const t = Math.max(0, Math.min(1, (apLat * abLat + apLng * abLng) / ab2));
  return {
    point: { lat: a.lat + abLat * t, lng: a.lng + abLng * t },
    t,
  };
}

/** @deprecated — utiliser resolveTankCapacity */
export function resolveTankCapacityL(input: {
  overrideL: number | null | undefined;
  catalogL: number | null | undefined;
  config?: FuelSimulationConfig;
}): { capacityL: number; usedDefault: boolean } {
  const raw = input.overrideL ?? input.catalogL ?? null;
  if (raw != null && Number.isFinite(raw) && raw > 0) {
    return {
      capacityL: Math.min(raw, input.config?.maxTankCapacityL ?? 500),
      usedDefault: false,
    };
  }
  return { capacityL: 0, usedDefault: true };
}
