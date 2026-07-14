import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import { getFuelPriceProvider } from "@/services/fuel-prices";
import { getMapsService } from "@/services/maps";
import {
  fuelEstimateSchema,
  type FuelEstimateInput,
} from "@/features/fuel/schemas";
import { estimateTripFuelCost } from "@/features/fuel/lib/consumption";
import { getOwnedTripOrThrow } from "@/features/trips/services/trips";
import type { FuelEstimateDto } from "@/features/fuel/types";

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

function collectTripPoints(trip: {
  stops: Array<{ latitude: unknown; longitude: unknown }>;
}): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  for (const stop of trip.stops) {
    if (stop.latitude == null || stop.longitude == null) continue;
    const lat = Number(stop.latitude);
    const lng = Number(stop.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      points.push({ lat, lng });
    }
  }
  return points;
}

async function resolveEstimatePoints(trip: {
  origin: string;
  destination: string;
  userId: string;
  stops: Array<{ latitude: unknown; longitude: unknown }>;
}): Promise<Array<{ lat: number; lng: number }>> {
  const fromStops = collectTripPoints(trip);
  if (fromStops.length > 0) return fromStops;

  const maps = getMapsService();
  if (!maps.availability().available) return [];

  const points: Array<{ lat: number; lng: number }> = [];
  try {
    const origin = await maps.geocode(trip.userId, trip.origin);
    points.push({ lat: origin.lat, lng: origin.lng });
  } catch {
    /* repli silencieux */
  }
  try {
    const dest = await maps.geocode(trip.userId, trip.destination);
    points.push({ lat: dest.lat, lng: dest.lng });
  } catch {
    /* repli silencieux */
  }
  return points;
}

/**
 * Estimation coût carburant d'un voyage (distance trip_routes × conso × prix).
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
      model: { select: { avgConsumption: true, fuelType: true } },
      settings: { select: { preferredFuelType: true } },
    },
  });
  if (!vehicle) {
    throw new AppError("VEH_001", "Véhicule introuvable", 404);
  }

  const vehicleFuelType =
    vehicle.settings?.preferredFuelType ?? vehicle.model?.fuelType ?? null;

  let consumptionL100: number;
  let consumptionSource: FuelEstimateDto["consumptionSource"];

  if (input.consumptionL100 != null) {
    consumptionL100 = input.consumptionL100;
    consumptionSource = "manual";
  } else if (vehicle.realAvgConsumption != null) {
    consumptionL100 = Number(vehicle.realAvgConsumption);
    consumptionSource = "real_avg";
  } else if (vehicle.model?.avgConsumption != null) {
    consumptionL100 = Number(vehicle.model.avgConsumption);
    consumptionSource = "catalog";
  } else {
    // VE électrique : pas de conso L/100 — on laisse 0 si non applicable
    consumptionL100 = 0;
    consumptionSource = "manual";
  }

  const points = await resolveEstimatePoints({
    origin: trip.origin,
    destination: trip.destination,
    userId,
    stops: trip.stops,
  });

  const quote = await getFuelPriceProvider().getPricePerLiter({
    userId,
    defaultPricePerLiter: input.defaultPricePerLiter ?? undefined,
    points,
    vehicleFuelType,
  });

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
      consumptionL100: "0.00",
      consumptionSource: "manual",
      pricePerLiter: "0.000",
      priceSource: "not_applicable",
      priceSampleCount: 0,
      litersNeeded: "0.000",
      estimatedCost: "0.00",
      currency: "CAD",
      priceLabel: quote.label ?? "Carburant non applicable",
      regionLabel: null,
      priceCapturedAt: null,
    };
  }

  if (consumptionL100 <= 0) {
    throw new AppError(
      "FUEL_004",
      "Aucune consommation disponible — saisissez une valeur manuelle",
      400,
    );
  }

  const { litersNeeded, estimatedCost } = estimateTripFuelCost({
    distanceKm,
    consumptionL100,
    pricePerLiter: quote.pricePerLiter,
  });

  await prisma.tripRoute.update({
    where: { tripId },
    data: {
      estimatedFuelCost: new Prisma.Decimal(estimatedCost.toFixed(2)),
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
      pricePerLiter: quote.pricePerLiter,
      estimatedCost,
      priceSource: quote.source,
      regionLabel: quote.regionLabel ?? null,
    },
    ipAddress,
  });

  return {
    isEstimate: true,
    distanceKm: distanceKm.toFixed(2),
    consumptionL100: consumptionL100.toFixed(2),
    consumptionSource,
    pricePerLiter: quote.pricePerLiter.toFixed(3),
    priceSource: quote.source,
    priceSampleCount: quote.sampleCount,
    litersNeeded: litersNeeded.toFixed(3),
    estimatedCost: estimatedCost.toFixed(2),
    currency: "CAD",
    priceLabel: quote.label ?? null,
    regionLabel: quote.regionLabel ?? null,
    priceCapturedAt: quote.capturedAt ?? null,
  };
}
