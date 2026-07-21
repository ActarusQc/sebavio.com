import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { DEFAULT_VEHICLE_CONSUMPTION_L100 } from "@/lib/constants";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  assertFdeRateLimit,
  getFuelPriceProvider,
} from "@/services/fuel-prices";
import { isFdeEnabled } from "@/integrations/fde";
import { getMapsService } from "@/services/maps";
import {
  fuelEstimateSchema,
  type FuelEstimateInput,
} from "@/features/fuel/schemas";
import { getFuelSimulationConfig } from "@/features/fuel/config/simulation";
import {
  consumptionSourceLabel,
  resolveVehicleConsumption,
} from "@/features/fuel/lib/resolve-consumption";
import { selectBestFuelPlan } from "@/features/fuel/lib/fuel-strategy-selector";
import { calculateTripFuelPlan } from "@/features/fuel/lib/trip-fuel-calculator";
import {
  resolveTankCapacity,
  tankCapacitySourceLabel,
} from "@/features/fuel/lib/resolve-tank-capacity";
import {
  dedupeWarnings,
  toCoverageDto,
  toRefuelPlanDto,
  toCalculationDto,
} from "@/features/fuel/services/refuel-plan-mapper";
import { toUserFuelWarnings } from "@/features/fuel/lib/user-fuel-warnings";
import { logFuelInternalDiagnostics } from "@/features/fuel/lib/fuel-internal-diagnostics";
import { localizeRefuelStopsOnCalculation } from "@/features/fuel/services/localize-refuel-stops";
import { buildFuelStopCandidatesAlongRoute } from "@/features/fuel/services/route-price-zones";
import { getOwnedTripOrThrow } from "@/features/trips/services/trips";
import type { FuelEstimateDto } from "@/features/fuel/types";
import { mapSebavioFuelToFde } from "@/services/fuel-prices/fde/mapping";
import {
  buildTripVehicleSnapshot,
  parseTripVehicleSnapshot,
  snapshotToJson,
} from "@/features/vehicles/lib/trip-vehicle-snapshot";
import type { FuelPriceQuote } from "@/services/fuel-prices/types";

function parseZod<T>(parse: () => T, fallbackMessage: string): T {
  try {
    return parse();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? fallbackMessage,
        400,
      );
    }
    throw error;
  }
}

/** Extrait une localité plausible depuis une adresse libre (ville de départ). */
export function extractCityHintFromAddress(
  address: string | null | undefined,
): string | null {
  if (!address?.trim()) return null;
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  // Ex. "68 Rue X, Saint-Mathias-sur-Richelieu, QC" → Saint-Mathias-sur-Richelieu
  if (parts.length >= 2) {
    const candidate = parts[1]!;
    if (!/^[A-Z]{2}$/i.test(candidate) && !/\d/.test(candidate)) {
      return candidate;
    }
  }
  if (/montr[eé]al/i.test(address)) return "Montréal";
  return parts[0] ?? null;
}

async function resolveEstimatePoints(trip: {
  origin: string;
  destination: string;
  userId: string;
  originLatitude?: unknown;
  originLongitude?: unknown;
  destinationLatitude?: unknown;
  destinationLongitude?: unknown;
  stops: Array<{
    latitude: unknown;
    longitude: unknown;
    direction?: string | null;
    stopType?: string | null;
  }>;
  direction?: "outbound" | "return";
}): Promise<Array<{ lat: number; lng: number }>> {
  const { buildCanonicalRoutePoints } =
    await import("@/features/trips/services/build-trip-route-request");

  let originLat = Number(trip.originLatitude);
  let originLng = Number(trip.originLongitude);
  let destLat = Number(trip.destinationLatitude);
  let destLng = Number(trip.destinationLongitude);

  const maps = getMapsService();
  const canGeocode = maps.availability().available;

  // Ne jamais construire le corridor uniquement à partir des TripStop :
  // le dernier arrêt (ex. activité à Québec) n'est PAS la destination.
  if (
    (!Number.isFinite(originLat) || !Number.isFinite(originLng)) &&
    canGeocode
  ) {
    try {
      const origin = await maps.geocode(trip.userId, trip.origin);
      originLat = origin.lat;
      originLng = origin.lng;
    } catch {
      /* repli */
    }
  }
  if ((!Number.isFinite(destLat) || !Number.isFinite(destLng)) && canGeocode) {
    try {
      const dest = await maps.geocode(trip.userId, trip.destination);
      destLat = dest.lat;
      destLng = dest.lng;
    } catch {
      /* repli */
    }
  }

  return buildCanonicalRoutePoints(
    {
      originLatitude: originLat,
      originLongitude: originLng,
      destinationLatitude: destLat,
      destinationLongitude: destLng,
      stops: trip.stops,
    },
    trip.direction ?? "outbound",
  );
}

function vehicleDisplayName(vehicle: {
  nickname: string | null;
  manualManufacturerName: string | null;
  manualModelName: string | null;
  manualYear: number | null;
  model: {
    modelName: string;
    year: number;
    manufacturer: { name: string } | null;
  } | null;
  catalogEntry?: {
    make: string;
    model: string;
    modelYear: number;
  } | null;
}): string {
  if (vehicle.nickname?.trim()) return vehicle.nickname.trim();
  if (vehicle.model) {
    const mfr = vehicle.model.manufacturer?.name ?? "";
    return [mfr, vehicle.model.modelName, `(${vehicle.model.year})`]
      .filter(Boolean)
      .join(" ")
      .trim();
  }
  if (vehicle.catalogEntry?.make && vehicle.catalogEntry?.model) {
    return `${vehicle.catalogEntry.make} ${vehicle.catalogEntry.model} (${vehicle.catalogEntry.modelYear})`;
  }
  const parts = [
    vehicle.manualManufacturerName,
    vehicle.manualModelName,
    vehicle.manualYear != null ? `(${vehicle.manualYear})` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Véhicule";
}

function priceSourceLabel(quote: {
  source: string;
  regionLabel?: string | null;
  label?: string | null;
}): string {
  switch (quote.source) {
    case "fde_station":
      return quote.regionLabel
        ? `FDE – ${quote.regionLabel}`
        : "FDE – stations à proximité";
    case "fde_regional":
      return quote.regionLabel
        ? `FDE régional – ${quote.regionLabel}`
        : "FDE – moyenne régionale";
    case "regie_quebec":
      return quote.regionLabel
        ? `Régie – ${quote.regionLabel}`
        : "Régie de l'énergie";
    case "personal_average":
      return "Moyenne de vos pleins";
    case "user_default":
      return "Saisie manuelle";
    case "not_applicable":
      return quote.label ?? "Non applicable";
    default:
      return quote.label ?? quote.source;
  }
}

/**
 * Estimation coût carburant d'un voyage via simulation du réservoir
 * et optimisation des zones de ravitaillement le long de l'itinéraire.
 * Persiste estimated_fuel_cost sur trip_routes (sauf non applicable).
 */
export async function estimateTripFuel(
  userId: string,
  tripId: string,
  raw: unknown = {},
  ipAddress?: string | null,
): Promise<FuelEstimateDto> {
  const input = parseZod(
    () => fuelEstimateSchema.parse(raw ?? {}),
    "Estimation invalide",
  ) as FuelEstimateInput;

  const trip = await getOwnedTripOrThrow(userId, tripId);

  const userPrefs = await prisma.userPreference.findUnique({
    where: { userId },
    select: { costcoMember: true },
  });
  const costcoMember = userPrefs?.costcoMember === true;

  if (isFdeEnabled()) {
    await assertFdeRateLimit(userId);
  }

  if (!trip.route?.distanceKm) {
    throw new AppError(
      "FUEL_004",
      "Itinéraire sans distance — calculez d'abord l'itinéraire",
      400,
    );
  }

  const distanceKm = Number(trip.route.distanceKm);
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    throw new AppError("FUEL_004", "Distance d'itinéraire invalide", 400);
  }

  const vehicle = await prisma.userVehicle.findFirst({
    where: { id: trip.vehicleId, userId, deletedAt: null },
    include: {
      model: {
        select: {
          avgConsumption: true,
          fuelType: true,
          fuelCapacityL: true,
          modelName: true,
          year: true,
          manufacturer: { select: { name: true } },
        },
      },
      catalogEntry: {
        select: {
          fuelTankCapacityL: true,
          make: true,
          model: true,
          modelYear: true,
          normalizedFuelType: true,
        },
      },
      settings: { select: { preferredFuelType: true } },
      _count: {
        select: { fuelLogs: { where: { deletedAt: null, isFull: true } } },
      },
    },
  });
  if (!vehicle) {
    throw new AppError("VEH_001", "Véhicule introuvable", 404);
  }

  const vehicleLabel = vehicleDisplayName(vehicle);
  const effectiveFuelType =
    vehicle.customFuelType ??
    vehicle.fuelType ??
    vehicle.manufacturerFuelType ??
    vehicle.catalogEntry?.normalizedFuelType ??
    vehicle.model?.fuelType ??
    null;
  const vehicleFuelType =
    input.fuelType ?? vehicle.settings?.preferredFuelType ?? effectiveFuelType;

  const fuelMapping = mapSebavioFuelToFde(
    input.fuelType === "ethanol" || input.fuelType === "other"
      ? input.fuelType
      : vehicleFuelType,
  );

  const points = await resolveEstimatePoints({
    origin: trip.origin,
    destination: trip.destination,
    originLatitude: trip.originLatitude,
    originLongitude: trip.originLongitude,
    destinationLatitude: trip.destinationLatitude,
    destinationLongitude: trip.destinationLongitude,
    userId,
    stops: trip.stops,
    direction: "outbound",
  });

  const routeReturnKm =
    trip.route.returnDistanceKm != null
      ? Number(trip.route.returnDistanceKm)
      : null;
  const effectiveReturnDistanceKm =
    input.returnDistanceKm ??
    (Number.isFinite(routeReturnKm) && (routeReturnKm as number) > 0
      ? (routeReturnKm as number)
      : null);

  const unsupportedFuel =
    input.fuelType === "ethanol" ||
    input.fuelType === "other" ||
    fuelMapping.kind === "unsupported";

  if (
    unsupportedFuel &&
    !(input.defaultPricePerLiter != null && input.defaultPricePerLiter > 0)
  ) {
    throw new AppError(
      "FUEL_006",
      "Aucun prix automatique disponible pour ce type de carburant. Entrez un prix manuel.",
      422,
    );
  }

  let quote: FuelPriceQuote;
  if (
    unsupportedFuel &&
    input.defaultPricePerLiter != null &&
    input.defaultPricePerLiter > 0
  ) {
    // Pas d'appel FDE : ne jamais substituer silencieusement par regular.
    quote = {
      pricePerLiter: input.defaultPricePerLiter,
      source: "user_default",
      sampleCount: 0,
      currency: "CAD",
      label: "Prix manuel",
      pricingMethod: "manual",
      fallbackUsed: false,
      warnings: [
        "Prix manuel utilisé — FDE ne fournit pas ce type de carburant.",
      ],
    };
  } else {
    const priceFuelType =
      input.fuelType === "midGrade"
        ? "midGrade"
        : (input.fuelType ?? vehicleFuelType);

    try {
      quote = await getFuelPriceProvider().getPricePerLiter({
        userId,
        defaultPricePerLiter: input.defaultPricePerLiter ?? undefined,
        points,
        vehicleFuelType: priceFuelType,
      });
    } catch (error) {
      if (
        error instanceof AppError &&
        (error.code === "EXT_004" ||
          error.code === "FUEL_006" ||
          error.code === "FDE_009")
      ) {
        // Toujours 422 FUEL_006 : le frontend ouvre le prix manuel
        // (ne pas renvoyer 404 — message trompeur « ressource introuvable »).
        throw new AppError(
          "FUEL_006",
          "Aucun prix automatique disponible pour ce type de carburant. Entrez un prix manuel.",
          422,
        );
      }
      throw error;
    }
  }

  if (quote.source === "not_applicable") {
    await writeAuditLog({
      userId,
      entity: "trip_routes",
      entityId: tripId,
      action: "estimate_fuel",
      newValue: { notApplicable: true, vehicleFuelType },
      ipAddress,
    });

    return {
      isEstimate: true,
      distanceKm: distanceKm.toFixed(2),
      vehicleLabel,
      consumptionL100: "0.00",
      consumptionSource: "manual",
      consumptionSourceLabel: "—",
      pricePerLiter: "0.000",
      priceSource: "not_applicable",
      priceSourceLabel: priceSourceLabel(quote),
      priceSampleCount: 0,
      litersNeeded: "0.000",
      estimatedCost: "0.00",
      currency: "CAD",
      priceLabel: quote.label ?? "Carburant non applicable",
      regionLabel: null,
      priceCapturedAt: null,
      pricingMethod: null,
      freshness: null,
      attribution: null,
      fallbackUsed: false,
      warnings: [],
      selectedStationId: null,
      tankCapacityL: null,
      tankCapacitySource: null,
      tankCapacitySourceLabel: null,
      tankCapacityConfidence: null,
      refuelPlan: null,
      coverage: null,
      fuelType: vehicleFuelType,
      calculation: null,
    };
  }

  const tripIsFrozen =
    trip.status === "completed" || trip.status === "cancelled";
  const frozenSnapshot = tripIsFrozen
    ? parseTripVehicleSnapshot(trip.route?.vehicleSpecsSnapshot)
    : null;

  const officialCombined =
    vehicle.officialCombinedConsumptionL100 != null
      ? Number(vehicle.officialCombinedConsumptionL100)
      : null;
  const legacyCatalog =
    vehicle.model?.avgConsumption != null
      ? Number(vehicle.model.avgConsumption)
      : null;

  const resolved = frozenSnapshot?.consumptionLPer100Km
    ? {
        ok: true as const,
        consumptionL100: frozenSnapshot.consumptionLPer100Km,
        source: "manual" as const,
      }
    : resolveVehicleConsumption({
        manualL100: input.consumptionL100,
        customConsumptionL100:
          vehicle.customConsumptionL100 != null
            ? Number(vehicle.customConsumptionL100)
            : null,
        realAvgConsumption:
          vehicle.realAvgConsumption != null
            ? Number(vehicle.realAvgConsumption)
            : null,
        fullFillCount: vehicle._count.fuelLogs,
        catalogAvgConsumption: officialCombined ?? legacyCatalog,
        appDefaultL100: DEFAULT_VEHICLE_CONSUMPTION_L100,
      });

  if (!resolved.ok) {
    throw new AppError(
      "VEHICLE_FUEL_CONSUMPTION_REQUIRED",
      "La consommation de ce véhicule est inconnue. Ajoutez-la dans la fiche du véhicule.",
      422,
    );
  }

  const consumptionL100 = resolved.consumptionL100;
  const consumptionSource = resolved.source;
  const consoLabel = frozenSnapshot
    ? "Snapshot voyage"
    : consumptionSourceLabel(consumptionSource);
  const simConfig = getFuelSimulationConfig();

  const tank = frozenSnapshot?.tankCapacityLiters
    ? {
        ok: true as const,
        capacityL: frozenSnapshot.tankCapacityLiters,
        source: "user_manual" as const,
        confidence: "high" as const,
      }
    : resolveTankCapacity({
        overrideL:
          input.tankCapacityL != null && input.tankCapacityL > 0
            ? input.tankCapacityL
            : vehicle.tankCapacityOverride != null
              ? Number(vehicle.tankCapacityOverride)
              : null,
        catalogEntryL:
          vehicle.manufacturerTankCapacityL != null
            ? Number(vehicle.manufacturerTankCapacityL)
            : vehicle.catalogEntry?.fuelTankCapacityL != null
              ? Number(vehicle.catalogEntry.fuelTankCapacityL)
              : null,
        legacyModelL:
          vehicle.model?.fuelCapacityL != null
            ? Number(vehicle.model.fuelCapacityL)
            : null,
        recordedSource:
          input.tankCapacityL != null && input.tankCapacityL > 0
            ? "user_manual"
            : vehicle.tankCapacitySource,
        maxTankCapacityL: simConfig.maxTankCapacityL,
      });

  if (!tank.ok) {
    throw new AppError(
      "VEHICLE_TANK_CAPACITY_REQUIRED",
      "La capacité du réservoir de ce véhicule est inconnue. Renseignez-la dans la fiche du véhicule (le catalogue NRCan ne fournit pas cette donnée).",
      422,
    );
  }

  if (
    tank.capacityL < simConfig.minTankCapacityL ||
    tank.capacityL > simConfig.maxTankCapacityL
  ) {
    throw new AppError(
      "FUEL_004",
      `Capacité réservoir hors limites (${simConfig.minTankCapacityL}–${simConfig.maxTankCapacityL} L).`,
      400,
    );
  }

  const corridorFuelType =
    input.fuelType === "midGrade"
      ? "regular"
      : (input.fuelType ?? vehicleFuelType);

  const zoneBuild = await buildFuelStopCandidatesAlongRoute({
    totalDistanceKm: distanceKm,
    polyline: trip.route.polyline,
    waypoints: points,
    vehicleFuelType: corridorFuelType,
    fallbackQuote: quote,
    config: simConfig,
    includeCostcoStations: costcoMember,
  });

  if (input.fuelType === "midGrade") {
    zoneBuild.warnings.push(
      "Essence intermédiaire : prix stations nearby non disponibles — estimations régionales / prix de départ utilisés.",
    );
  }

  const calculation = calculateTripFuelPlan({
    outboundDistanceKm: distanceKm,
    returnDistanceKm: effectiveReturnDistanceKm,
    includeReturnTrip: Boolean(input.includeReturnTrip),
    consumptionL100,
    tankCapacityL: tank.capacityL,
    options: input,
    outboundCandidates: zoneBuild.candidates,
    departurePricePerLiter:
      zoneBuild.departurePricePerLiter ?? quote.pricePerLiter,
    config: simConfig,
  });

  const routeStart =
    points[0] ??
    (Number.isFinite(Number(trip.originLatitude)) &&
    Number.isFinite(Number(trip.originLongitude))
      ? {
          lat: Number(trip.originLatitude),
          lng: Number(trip.originLongitude),
        }
      : null);

  await localizeRefuelStopsOnCalculation({
    calculation,
    polyline: trip.route.polyline,
    waypoints: points,
    outboundCandidates: zoneBuild.candidates,
    routeStart,
    routeStartCity: extractCityHintFromAddress(trip.origin),
    userId,
    preferredFuelType: corridorFuelType,
    includeCostcoStations: costcoMember,
    logger: (msg, meta) => {
      if (process.env.FUEL_DEBUG === "1") {
        console.info(`[fuel-debug:${msg}]`, meta ?? {});
      }
    },
  });

  // Conservé pour compat UI plan d'optimisation
  const selection = selectBestFuelPlan({
    totalDistanceKm: distanceKm,
    consumptionL100,
    tankCapacityL: tank.capacityL,
    candidates: zoneBuild.candidates,
    departurePricePerLiter:
      zoneBuild.departurePricePerLiter ?? quote.pricePerLiter,
    config: simConfig,
  });
  const simulation = calculation.simulation ?? selection.selected;
  zoneBuild.coverage.analyzedByOptimizer = zoneBuild.candidates.length;
  zoneBuild.coverage.retainedStops = calculation.totalStopCount;

  const estimatedCost = calculation.moneySpent;
  const litersNeeded = calculation.allStops.reduce(
    (s, x) => s + x.litersAdded,
    0,
  );
  const avgPrice = calculation.averagePurchasePrice ?? quote.pricePerLiter;

  const warnings = dedupeWarnings([
    ...(quote.warnings ?? []),
    ...zoneBuild.warnings,
    ...calculation.warnings,
    ...(calculation.failureMessage ? [calculation.failureMessage] : []),
  ]);
  const filteredWarnings = warnings.filter((w) => {
    if (
      zoneBuild.coverage.uniqueStations > 1 &&
      (w.includes("une seule station") || w.includes("Couverture limitée"))
    ) {
      return false;
    }
    return true;
  });

  if (!calculation.feasible) {
    filteredWarnings.push(
      calculation.failureMessage ??
        "Simulation de ravitaillement non réalisable.",
    );
  }

  const coverageDto = toCoverageDto(zoneBuild.coverage);
  // Diagnostics corridor : audit / coverage DTO uniquement — jamais dans warnings UI.
  const hasRegionalStops = calculation.allStops.some(
    (s) =>
      s.kind === "en_route" &&
      (s.isEstimatedLocation || s.priceGranularity === "regional"),
  );
  const userWarnings = toUserFuelWarnings(filteredWarnings, {
    forceEstimateNotice: hasRegionalStops || Boolean(quote.fallbackUsed),
    forceStaleNotice:
      quote.freshness === "aging" || quote.freshness === "stale",
  });

  logFuelInternalDiagnostics("estimateTripFuel", {
    coverage: zoneBuild.coverage,
    rawWarnings: filteredWarnings,
  });

  await prisma.tripRoute.update({
    where: { tripId },
    data: {
      estimatedFuelCost: new Prisma.Decimal(estimatedCost.toFixed(2)),
      fuelEstimateStale: false,
      ...(tripIsFrozen && frozenSnapshot
        ? {}
        : {
            vehicleSpecsSnapshot: snapshotToJson(
              buildTripVehicleSnapshot({
                vehicleId: vehicle.id,
                currentOdometer: vehicle.currentOdometer,
                manufacturerConsumptionL100:
                  vehicle.officialCombinedConsumptionL100,
                customConsumptionL100: vehicle.customConsumptionL100,
                realAvgConsumption: vehicle.realAvgConsumption,
                fullFillCount: vehicle._count.fuelLogs,
                manufacturerTankCapacityL: vehicle.manufacturerTankCapacityL,
                tankCapacityOverride: vehicle.tankCapacityOverride,
                catalogTankL: vehicle.catalogEntry?.fuelTankCapacityL,
                legacyTankL: vehicle.model?.fuelCapacityL,
                manufacturerFuelType: vehicle.manufacturerFuelType,
                customFuelType: vehicle.customFuelType,
                fuelType: vehicle.fuelType,
              }),
            ),
          }),
    },
  });

  await writeAuditLog({
    userId,
    entity: "trip_routes",
    entityId: tripId,
    action: "estimate_fuel",
    newValue: {
      distanceKm,
      consumptionL100,
      consumptionSource,
      tankCapacityL: tank.capacityL,
      tankCapacitySource: tank.source,
      fuelType: input.fuelType ?? vehicleFuelType,
      pricePerLiter: avgPrice,
      moneySpent: estimatedCost,
      consumedFuelValue: calculation.consumedFuelValue,
      litersPurchased: litersNeeded,
      stopCount: calculation.totalStopCount,
      includeReturnTrip: Boolean(input.includeReturnTrip),
      refillStrategy: input.refillStrategy,
      coverage: zoneBuild.coverage,
      priceSource: quote.source,
      regionLabel: quote.regionLabel ?? null,
      calculationFeasible: calculation.feasible,
    },
    ipAddress,
  });

  const fuelTypeLabel = input.fuelType ?? vehicleFuelType ?? null;

  return {
    isEstimate: true,
    distanceKm: distanceKm.toFixed(2),
    vehicleLabel,
    consumptionL100: consumptionL100.toFixed(2),
    consumptionSource,
    consumptionSourceLabel: consoLabel,
    tankCapacityL: tank.capacityL.toFixed(1),
    tankCapacitySource: tank.source,
    tankCapacitySourceLabel: tankCapacitySourceLabel(tank.source),
    tankCapacityConfidence: tank.confidence,
    fuelType: fuelTypeLabel,
    pricePerLiter: avgPrice.toFixed(3),
    priceSource: quote.source,
    priceSourceLabel: priceSourceLabel(quote),
    priceSampleCount: zoneBuild.coverage.uniqueStations || quote.sampleCount,
    litersNeeded: litersNeeded.toFixed(2),
    estimatedCost: estimatedCost.toFixed(2),
    currency: "CAD",
    priceLabel: quote.label ?? null,
    regionLabel: quote.regionLabel ?? null,
    priceCapturedAt: quote.capturedAt ?? null,
    pricingMethod: quote.pricingMethod ?? null,
    freshness: quote.freshness ?? null,
    attribution: quote.attribution ?? null,
    fallbackUsed: quote.fallbackUsed ?? false,
    warnings: userWarnings,
    selectedStationId: quote.selectedStationId ?? null,
    refuelPlan: toRefuelPlanDto(simulation, zoneBuild.coverage),
    coverage: coverageDto,
    calculation: toCalculationDto(calculation, fuelTypeLabel ?? "regular"),
  };
}
