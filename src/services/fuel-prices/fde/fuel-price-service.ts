import { AppError } from "@/lib/errors";
import {
  FdeFuelPricesError,
  getFdeCachedJson,
  getFdeClient,
  getFdeConfig,
  logFdeEvent,
  nearbyCacheKey,
  regionalCacheKey,
  setFdeCachedJson,
  fdeMetricInc,
} from "@/integrations/fde";
import { requireMappedFdeFuel, type FdeStationFuelType } from "./mapping";
import {
  isPriceFreshEnough,
  selectReferencePrice,
  type PricingMethod,
} from "./price-selection";

export type FuelPriceLookupInput = {
  latitude: number;
  longitude: number;
  fuelType: string | null | undefined;
  radiusKm?: number;
  limit?: number;
  maxPriceAgeHours?: number;
  /** Contourne le cache (tests). */
  bypassCache?: boolean;
  /** Région StatCan hint (ex. Montréal). */
  regionHint?: string;
};

export type FuelPriceReference = {
  fuelType: FdeStationFuelType;
  priceCadPerLitre: number;
  pricingMethod: PricingMethod;
  stationCount: number;
  selectedStationId?: string;
  observedAt: string;
  freshness: string;
  source: string;
  attribution?: string;
  fallbackUsed: boolean;
  granularity: "station" | "regional";
  lowCoverage: boolean;
  warnings: string[];
  regionLabel?: string;
};

type NearbyStation = {
  id: string;
  canonicalId?: string;
  name?: string;
  brand?: string | null;
  city?: string;
  addressLine?: string;
  administrativeRegionName?: string | null;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  prices: Array<{
    fuelType: string;
    price: number;
    observedAt: string;
    collectedAt?: string;
    freshness: { freshnessStatus: string };
    granularity?: string;
  }>;
  source: string;
  attribution?: { notice?: string; source?: string };
};

function mapFdeHttpError(error: unknown): never {
  if (error instanceof AppError) throw error;

  if (error instanceof FdeFuelPricesError) {
    fdeMetricInc("errors");
    switch (error.code) {
      case "TIMEOUT":
        fdeMetricInc("timeouts");
        throw new AppError(
          "FDE_004",
          "Délai dépassé auprès du service de prix",
          504,
        );
      case "UNAUTHORIZED":
        fdeMetricInc("unauthorized");
        throw new AppError(
          "FDE_005",
          "Authentification du service de prix refusée",
          502,
        );
      case "FORBIDDEN":
        fdeMetricInc("forbidden");
        throw new AppError("FDE_006", "Accès au service de prix refusé", 502);
      case "RATE_LIMITED":
        fdeMetricInc("rateLimited");
        throw new AppError(
          "FDE_007",
          "Service de prix saturé — réessayez plus tard",
          503,
        );
      case "VALIDATION_ERROR":
        fdeMetricInc("invalidResponses");
        throw new AppError(
          "FDE_008",
          "Réponse invalide du service de prix",
          502,
        );
      case "SERVER_ERROR":
      case "NETWORK_ERROR":
        fdeMetricInc("serverErrors");
        throw new AppError("FDE_003", "Service de prix indisponible", 503);
      default:
        throw new AppError("FDE_003", "Service de prix indisponible", 503);
    }
  }

  throw new AppError("FDE_003", "Service de prix indisponible", 503);
}

function validateCoords(latitude: number, longitude: number): void {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new AppError("FUEL_007", "Coordonnées invalides", 400);
  }
}

async function fetchNearbyStations(input: {
  latitude: number;
  longitude: number;
  fuelType: FdeStationFuelType;
  radiusKm: number;
  limit: number;
  maxAgeMinutes: number;
  bypassCache?: boolean;
}): Promise<NearbyStation[]> {
  const cacheKey = nearbyCacheKey({
    ...input,
    // Inclure l'horizon de découverte dans la clé (évite le poison des vides 24 h)
    maxAgeMinutes: input.maxAgeMinutes,
  });
  if (!input.bypassCache) {
    const cached = await getFdeCachedJson<{ data: NearbyStation[] }>(cacheKey);
    // [] est truthy en JS — ne réutiliser que des listes non vides
    if (cached?.data && cached.data.length > 0) return cached.data;
  }

  fdeMetricInc("calls");
  const started = Date.now();
  try {
    const client = getFdeClient();
    const response = await client.findNearbyStations({
      latitude: input.latitude,
      longitude: input.longitude,
      radiusKm: input.radiusKm,
      fuelType: input.fuelType,
      limit: input.limit,
      maxAgeMinutes: input.maxAgeMinutes,
    });
    fdeMetricInc("success");
    fdeMetricInc("nearbyStationsTotal", response.data.length);
    logFdeEvent("nearby_ok", {
      durationMs: Date.now() - started,
      stationCount: response.data.length,
      fuelType: input.fuelType,
      radiusKm: input.radiusKm,
      maxAgeMinutes: input.maxAgeMinutes,
    });
    // Ne pas cacher les réponses vides (sync FDE temporairement vide / trop stricte)
    if (response.data.length > 0) {
      await setFdeCachedJson(cacheKey, response);
    }
    return response.data as NearbyStation[];
  } catch (error) {
    mapFdeHttpError(error);
  }
}

async function fetchRegionalFallback(input: {
  fuelType: FdeStationFuelType;
  regionHint?: string;
  bypassCache?: boolean;
}): Promise<FuelPriceReference | null> {
  const region = input.regionHint?.trim() || "Montréal";
  const cacheKey = regionalCacheKey({
    subdivision: "QC",
    region,
    fuelType: input.fuelType,
  });

  type RegionalRow = {
    fuelType: string;
    price: number;
    observedAt: string;
    regionName: string;
    sourceId: string;
    freshness: { freshnessStatus: string };
    attribution?: { notice?: string; source?: string };
  };

  let rows: RegionalRow[] | null = null;
  if (!input.bypassCache) {
    rows = await getFdeCachedJson<RegionalRow[]>(cacheKey);
  }

  if (!rows) {
    fdeMetricInc("calls");
    const started = Date.now();
    try {
      const client = getFdeClient();
      const response = await client.getLatestRegionalPrices({
        country: "CA",
        subdivision: "QC",
        region,
        fuelType: input.fuelType,
      });
      fdeMetricInc("success");
      rows = response.data as RegionalRow[];
      logFdeEvent("regional_ok", {
        durationMs: Date.now() - started,
        count: rows.length,
        region,
        fuelType: input.fuelType,
      });
      await setFdeCachedJson(cacheKey, rows);
    } catch (error) {
      mapFdeHttpError(error);
    }
  }

  const match = rows.find((r) => r.fuelType === input.fuelType) ?? rows[0];
  if (!match || !(match.price > 0)) return null;

  fdeMetricInc("regionalFallbacks");
  return {
    fuelType: input.fuelType,
    priceCadPerLitre: Math.round(match.price * 1000) / 1000,
    pricingMethod: "regional-fallback",
    stationCount: 0,
    observedAt: match.observedAt,
    freshness: match.freshness.freshnessStatus,
    source: match.attribution?.source ?? match.sourceId ?? "Statistique Canada",
    attribution:
      match.attribution?.notice ??
      "Prix estimé à partir d'une moyenne régionale. Source : Statistique Canada.",
    fallbackUsed: true,
    granularity: "regional",
    lowCoverage: true,
    warnings: [
      "Prix régional (moyenne) — ne représente pas un prix de station précis.",
    ],
    regionLabel: match.regionName,
  };
}

/**
 * Liste brute des stations FDE à proximité (pour corridor d'itinéraire).
 * Pagination : FDE nearby est borné par `limit` (pas de next_page_token) —
 * la couverture corridor repose sur plusieurs points d'échantillonnage.
 */
export async function listNearbyFuelStations(
  input: FuelPriceLookupInput,
): Promise<{
  stations: NearbyStation[];
  fuelType: FdeStationFuelType;
}> {
  validateCoords(input.latitude, input.longitude);

  const mapped = requireMappedFdeFuel(input.fuelType);
  if (mapped === "not_applicable") {
    throw new AppError(
      "FUEL_006",
      "Ce type de véhicule ne consomme pas de carburant liquide estimable",
      422,
    );
  }

  const config = getFdeConfig();
  const radiusKm = Math.min(
    input.radiusKm ?? config.nearbyDefaultRadiusKm,
    config.nearbyMaxRadiusKm,
  );
  const limit = Math.min(
    input.limit ?? config.nearbyMaxLimit,
    config.nearbyMaxLimit,
  );
  // Découverte : horizon large (≤ 7 j API). Fraîcheur prix gérée ensuite côté corridor.
  const discoveryHours = Math.min(
    168,
    Math.max(
      config.discoveryMaxAgeHours,
      input.maxPriceAgeHours ?? config.stalePriceMaxHours,
    ),
  );
  const maxAgeMinutes = discoveryHours * 60;

  const stations = await fetchNearbyStations({
    latitude: input.latitude,
    longitude: input.longitude,
    fuelType: mapped,
    radiusKm,
    limit,
    maxAgeMinutes,
    bypassCache: input.bypassCache,
  });

  return { stations, fuelType: mapped };
}

/**
 * Prix régional FDE (StatCan) pour une région donnée.
 */
export async function lookupRegionalFuelPrice(input: {
  fuelType: string | null | undefined;
  regionHint?: string;
  bypassCache?: boolean;
}): Promise<FuelPriceReference | null> {
  const mapped = requireMappedFdeFuel(input.fuelType);
  if (mapped === "not_applicable") return null;
  return fetchRegionalFallback({
    fuelType: mapped,
    regionHint: input.regionHint,
    bypassCache: input.bypassCache,
  });
}

/**
 * Recherche un prix de référence via FDE (médiane nearby → fallback régional).
 */
export async function lookupFuelPriceReference(
  input: FuelPriceLookupInput,
): Promise<FuelPriceReference> {
  validateCoords(input.latitude, input.longitude);

  const mapped = requireMappedFdeFuel(input.fuelType);
  if (mapped === "not_applicable") {
    throw new AppError(
      "FUEL_006",
      "Ce type de véhicule ne consomme pas de carburant liquide estimable",
      422,
    );
  }

  const config = getFdeConfig();
  const radiusKm = Math.min(
    input.radiusKm ?? config.nearbyDefaultRadiusKm,
    config.nearbyMaxRadiusKm,
  );
  const limit = Math.min(
    input.limit ?? config.nearbyDefaultLimit,
    config.nearbyMaxLimit,
  );
  const staleHours = input.maxPriceAgeHours ?? config.stalePriceMaxHours;
  const discoveryHours = Math.min(
    168,
    Math.max(config.discoveryMaxAgeHours, staleHours),
  );
  const maxAgeMinutes = discoveryHours * 60;

  let stations: NearbyStation[] = [];
  try {
    stations = await fetchNearbyStations({
      latitude: input.latitude,
      longitude: input.longitude,
      fuelType: mapped,
      radiusKm,
      limit,
      maxAgeMinutes,
      bypassCache: input.bypassCache,
    });
  } catch (error) {
    // Mode dégradé : tenter fallback régional déjà en cache / live
    logFdeEvent("nearby_failed_try_regional", {
      code: error instanceof AppError ? error.code : "UNKNOWN",
    });
    const regional = await fetchRegionalFallback({
      fuelType: mapped,
      regionHint: input.regionHint,
      bypassCache: input.bypassCache,
    }).catch(() => null);
    if (regional) {
      regional.warnings.push(
        "Stations à proximité indisponibles — repli régional utilisé.",
      );
      return regional;
    }
    throw error;
  }

  type UsablePrice = {
    price: number;
    observedAt: string;
    freshness: string;
    stationId: string;
    source: string;
    attribution?: string;
    region?: string | null;
  };

  const collectUsable = (maxAgeH: number): UsablePrice[] => {
    const rows: UsablePrice[] = [];
    for (const station of stations) {
      const stationId = station.canonicalId ?? station.id;
      const priceRow = station.prices.find((p) => p.fuelType === mapped);
      if (!priceRow) continue;
      if (!isPriceFreshEnough(priceRow.observedAt, maxAgeH)) continue;
      if (!(priceRow.price > 0) || !Number.isFinite(priceRow.price)) continue;
      rows.push({
        price: priceRow.price,
        observedAt: priceRow.observedAt,
        freshness: priceRow.freshness.freshnessStatus,
        stationId,
        source: station.source,
        attribution: station.attribution?.notice,
        region: station.administrativeRegionName,
      });
    }
    return rows;
  };

  // 1) Prix « frais » (staleHours) — 2) sinon fenêtre découverte (ex. 7 j)
  //    pour ne pas échouer alors que le corridor trouve des stations.
  let usable = collectUsable(staleHours);
  let usedDiscoveryWindow = false;
  if (usable.length === 0) {
    usable = collectUsable(discoveryHours);
    usedDiscoveryWindow = usable.length > 0;
  }

  const selected = selectReferencePrice(usable.map((u) => u.price));
  if (selected) {
    // Observation : la plus récente parmi les prix retenus
    const newest = [...usable].sort(
      (a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt),
    )[0]!;
    const warnings: string[] = [];
    if (selected.lowCoverage) {
      warnings.push(
        selected.stationCount === 1
          ? "Couverture faible : une seule station exploitable."
          : "Couverture limitée : moins de 5 stations exploitables.",
      );
    }
    if (
      usedDiscoveryWindow ||
      newest.freshness === "aging" ||
      newest.freshness === "stale"
    ) {
      warnings.push("Prix vieillissant — susceptibles de changer.");
    }

    return {
      fuelType: mapped,
      priceCadPerLitre: selected.priceCadPerLitre,
      pricingMethod: selected.pricingMethod,
      stationCount: selected.stationCount,
      selectedStationId:
        selected.pricingMethod === "selected-station"
          ? newest.stationId
          : undefined,
      observedAt: newest.observedAt,
      freshness: newest.freshness,
      source:
        newest.source === "regie-essence-quebec"
          ? "Régie de l'énergie du Québec"
          : newest.source,
      attribution:
        newest.attribution ??
        "Prix estimé à partir des stations à proximité. Prix susceptibles de changer.",
      fallbackUsed: false,
      granularity: "station",
      lowCoverage: selected.lowCoverage,
      warnings,
      regionLabel: newest.region ?? undefined,
    };
  }

  const regionHint =
    input.regionHint ??
    stations.find((s) => s.administrativeRegionName)
      ?.administrativeRegionName ??
    undefined;

  const regional = await fetchRegionalFallback({
    fuelType: mapped,
    regionHint: regionHint ?? undefined,
    bypassCache: input.bypassCache,
  });
  if (regional) return regional;

  throw new AppError(
    "FDE_009",
    "Aucun prix de carburant disponible pour cette position",
    422,
  );
}
