import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import { assertOwnedTravelGroup } from "@/features/travel-groups/services";
import { MAX_PAGE_SIZE } from "@/features/trips/constants";
import {
  stopCreateSchema,
  stopUpdateSchema,
  tripCreateSchema,
  tripsListSchema,
  tripUpdateSchema,
  type StopCreateInput,
  type StopUpdateInput,
  type TripCreateInput,
  type TripUpdateInput,
} from "@/features/trips/schemas";
import {
  clampPageSize,
  toStopDto,
  toSummaryDto,
  toTripDetailDto,
  toTripDto,
} from "@/features/trips/services/mappers";
import {
  buildTripVehicleSnapshot,
  snapshotToJson,
} from "@/features/vehicles/lib/trip-vehicle-snapshot";
import {
  assertContiguousSequences,
  buildContiguousAssignments,
} from "@/features/trips/services/sequences";
import {
  assertCanCancel,
  assertCanComplete,
  assertCanStart,
  assertWritableStatus,
} from "@/features/trips/services/transitions";
import type {
  PaginatedTrips,
  TripDetailDto,
  TripDto,
  TripRouteDto,
  TripStopDto,
  TripSummaryDto,
} from "@/features/trips/types";
import { computeWaypointsHash } from "@/services/maps/cache";
import { getMapsService } from "@/services/maps";
import type { LatLng } from "@/services/maps/types";
import { upsertTripBudgetAmount } from "@/features/finance/services/budget";
import { createInAppNotification } from "@/features/notifications/services/create";

const vehicleInclude = {
  settings: { select: { preferredFuelType: true } },
  model: {
    select: {
      modelName: true,
      year: true,
      fuelType: true,
      manufacturer: { select: { name: true } },
    },
  },
  catalogEntry: {
    select: {
      make: true,
      model: true,
      modelYear: true,
    },
  },
} as const;

const travelGroupInclude = {
  select: { id: true, name: true, deletedAt: true },
} as const;

const tripListInclude = {
  vehicle: { include: vehicleInclude },
  travelGroup: travelGroupInclude,
  _count: { select: { stops: true } },
} as const;

const campgroundInclude = {
  select: {
    id: true,
    name: true,
    latitude: true,
    longitude: true,
    deletedAt: true,
  },
} as const;

const stopActivitiesInclude = {
  where: { deletedAt: null },
  orderBy: { sequence: "asc" as const },
  include: {
    activity: {
      select: {
        id: true,
        name: true,
        kind: true,
        category: true,
        latitude: true,
        longitude: true,
        deletedAt: true,
      },
    },
  },
} as const;

const tripDetailInclude = {
  vehicle: { include: vehicleInclude },
  travelGroup: travelGroupInclude,
  stops: {
    orderBy: [{ direction: "asc" as const }, { sequence: "asc" as const }],
    include: {
      campground: campgroundInclude,
      stopActivities: stopActivitiesInclude,
    },
  },
  route: true,
};

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

function decimalOrUndefined(
  value: number | null | undefined,
): Prisma.Decimal | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Prisma.Decimal(value);
}

function toLatLng(
  latitude: { toString(): string } | null,
  longitude: { toString(): string } | null,
): LatLng | null {
  if (latitude == null || longitude == null) return null;
  const lat = Number(latitude.toString());
  const lng = Number(longitude.toString());
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/**
 * Géocode une adresse si possible. Échec silencieux (mode dégradé) pour les sauvegardes.
 */
async function tryGeocodeAddress(
  userId: string,
  address: string | null | undefined,
): Promise<LatLng | null> {
  if (!address?.trim()) return null;
  try {
    const result = await getMapsService().geocode(userId, address);
    return { lat: result.lat, lng: result.lng };
  } catch {
    return null;
  }
}

async function resolvePoint(
  userId: string,
  label: string,
  existing?: LatLng | null,
): Promise<LatLng> {
  if (existing) return existing;
  return getMapsService().geocode(userId, label);
}

/** Véhicule du même propriétaire — 404 si absent ou hors périmètre. */
export async function assertOwnedVehicle(
  userId: string,
  vehicleId: string,
): Promise<void> {
  const vehicle = await prisma.userVehicle.findFirst({
    where: { id: vehicleId, userId, deletedAt: null },
    select: { id: true },
  });
  if (!vehicle) {
    throw new AppError("TRIP_003", "Véhicule introuvable", 404);
  }
}

export async function getOwnedTripOrThrow(userId: string, tripId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId, deletedAt: null },
    include: tripDetailInclude,
  });
  if (!trip) {
    throw new AppError("TRIP_001", "Voyage introuvable", 404);
  }
  return trip;
}

async function renumberStopsInTx(
  tx: Prisma.TransactionClient,
  tripId: string,
  options?: {
    direction?: string;
    orderedIds?: string[];
  },
) {
  const direction = options?.direction;
  const existing = await tx.tripStop.findMany({
    where: {
      tripId,
      ...(direction ? { direction } : {}),
    },
    orderBy: { sequence: "asc" },
    select: { id: true, sequence: true, direction: true },
  });

  const ids = options?.orderedIds ?? existing.map((s) => s.id);

  if (options?.orderedIds) {
    const known = new Set(existing.map((s) => s.id));
    for (const id of options.orderedIds) {
      if (!known.has(id)) {
        throw new AppError("VALIDATION_ERROR", "Étape inconnue", 400);
      }
    }
    if (options.orderedIds.length !== existing.length) {
      throw new AppError(
        "VALIDATION_ERROR",
        "La renumérotation doit couvrir toutes les étapes de cette direction",
        400,
      );
    }
  }

  const assignments = buildContiguousAssignments(ids);
  assertContiguousSequences(assignments.map((a) => a.sequence));

  // Deux passes pour éviter les collisions sur @@unique(tripId, direction, sequence).
  for (let i = 0; i < assignments.length; i++) {
    await tx.tripStop.update({
      where: { id: assignments[i]!.id },
      data: { sequence: -(i + 1) },
    });
  }
  for (const a of assignments) {
    await tx.tripStop.update({
      where: { id: a.id },
      data: { sequence: a.sequence },
    });
  }
}

export async function listTrips(
  userId: string,
  rawQuery: Record<string, string | string[] | undefined>,
): Promise<PaginatedTrips> {
  const query = Object.fromEntries(
    Object.entries(rawQuery).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = parseZod(
    () => tripsListSchema.parse(query),
    "Paramètres de liste invalides",
  );
  const pageSize = clampPageSize(parsed.pageSize, MAX_PAGE_SIZE);
  const page = parsed.page;

  if (parsed.vehicleId) {
    await assertOwnedVehicle(userId, parsed.vehicleId);
  }

  const where = {
    userId,
    deletedAt: null,
    ...(parsed.status ? { status: parsed.status } : {}),
    ...(parsed.vehicleId ? { vehicleId: parsed.vehicleId } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.trip.count({ where }),
    prisma.trip.findMany({
      where,
      include: tripListInclude,
      orderBy: [{ departureDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map(toTripDto),
    page,
    pageSize,
    total,
  };
}

export async function getTripById(
  userId: string,
  tripId: string,
): Promise<TripDetailDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  const visitAgg = await prisma.tripActivity.aggregate({
    where: {
      tripId,
      status: { in: ["added_to_trip", "completed"] },
    },
    _sum: { estimatedVisitMinutes: true },
  });
  const dto = toTripDetailDto({
    ...trip,
    activityVisitMinutes: visitAgg._sum.estimatedVisitMinutes ?? 0,
  });

  const { resolveUserAccess, hasFullAccess } =
    await import("@/features/subscriptions/services/access-resolve");
  const access = await resolveUserAccess(userId);
  if (hasFullAccess(access)) {
    return dto;
  }

  // Découverte / sans accès complet : masquer coords précises, étapes et géométrie
  return {
    ...dto,
    originLatitude: null,
    originLongitude: null,
    destinationLatitude: null,
    destinationLongitude: null,
    originPlaceId: null,
    destinationPlaceId: null,
    stops: [],
    stopCount: dto.stopCount,
    route: dto.route
      ? {
          ...dto.route,
          polyline: null,
          returnPolyline: null,
          waypointsHash: null,
          estimatedFuelCost: null,
        }
      : null,
  };
}

export async function createTrip(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<TripDetailDto> {
  const input: TripCreateInput = parseZod(
    () => tripCreateSchema.parse(raw),
    "Voyage invalide",
  );

  if (!input.origin.trim() || !input.destination.trim()) {
    throw new AppError("TRIP_002", "Destination invalide", 400);
  }

  const { assertCanCreateTrip } =
    await import("@/features/trips/services/access-gate");
  await assertCanCreateTrip(userId);

  await assertOwnedVehicle(userId, input.vehicleId);

  if (input.travelGroupId) {
    await assertOwnedTravelGroup(userId, input.travelGroupId);
  }

  const trip = await prisma.$transaction(async (tx) => {
    const created = await tx.trip.create({
      data: {
        userId,
        vehicleId: input.vehicleId,
        travelGroupId: input.travelGroupId ?? null,
        title: input.title,
        status: "planned",
        departureDate: input.departureDate,
        returnDate: input.returnDate ?? null,
        origin: input.origin,
        originPlaceId: input.originPlaceId ?? null,
        originLatitude: decimalOrUndefined(input.originLatitude) ?? null,
        originLongitude: decimalOrUndefined(input.originLongitude) ?? null,
        originCity: input.originCity ?? null,
        originProvince: input.originProvince ?? null,
        originPostalCode: input.originPostalCode ?? null,
        originCountry: input.originCountry ?? null,
        destination: input.destination,
        destinationPlaceId: input.destinationPlaceId ?? null,
        destinationLatitude:
          decimalOrUndefined(input.destinationLatitude) ?? null,
        destinationLongitude:
          decimalOrUndefined(input.destinationLongitude) ?? null,
        destinationCity: input.destinationCity ?? null,
        destinationProvince: input.destinationProvince ?? null,
        destinationPostalCode: input.destinationPostalCode ?? null,
        destinationCountry: input.destinationCountry ?? null,
        // planned_budget uniquement via upsertTripBudgetAmount (finance).
        plannedBudget: null,
        route: { create: {} },
      },
      include: tripDetailInclude,
    });

    if (input.plannedBudget != null) {
      await upsertTripBudgetAmount(tx, created.id, input.plannedBudget);
    }

    return tx.trip.findUniqueOrThrow({
      where: { id: created.id },
      include: tripDetailInclude,
    });
  });

  await writeAuditLog({
    userId,
    entity: "trips",
    entityId: trip.id,
    action: "create",
    newValue: {
      title: trip.title,
      vehicleId: trip.vehicleId,
      travelGroupId: trip.travelGroupId,
      status: trip.status,
    },
    ipAddress,
  });

  return toTripDetailDto(trip);
}

export async function updateTrip(
  userId: string,
  tripId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<TripDetailDto> {
  const existing = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(existing.status);

  const input: TripUpdateInput = parseZod(
    () => tripUpdateSchema.parse(raw),
    "Voyage invalide",
  );

  if (input.vehicleId) {
    await assertOwnedVehicle(userId, input.vehicleId);
  }

  if (input.travelGroupId) {
    await assertOwnedTravelGroup(userId, input.travelGroupId);
  }

  if (input.status === "in_progress") {
    assertCanStart(existing.status);
    const { assertTripFeature } =
      await import("@/features/trips/services/access-gate");
    await assertTripFeature(userId, "trip.travel_mode.enabled");
  }

  // Mutations hors simple métadonnées : accès complet requis pour Découverte expiré / limité
  const mutatingCore =
    input.origin !== undefined ||
    input.destination !== undefined ||
    input.originLatitude !== undefined ||
    input.destinationLatitude !== undefined;
  if (mutatingCore) {
    const { assertFullTripAccess } =
      await import("@/features/trips/services/access-gate");
    await assertFullTripAccess(userId);
  }

  const departureDate = input.departureDate ?? existing.departureDate;
  const returnDate =
    input.returnDate !== undefined ? input.returnDate : existing.returnDate;
  if (returnDate && returnDate.getTime() < departureDate.getTime()) {
    throw new AppError(
      "VALIDATION_ERROR",
      "La date de retour doit être postérieure ou égale au départ",
      400,
    );
  }

  if (input.origin !== undefined && !input.origin.trim()) {
    throw new AppError("TRIP_002", "Destination invalide", 400);
  }
  if (input.destination !== undefined && !input.destination.trim()) {
    throw new AppError("TRIP_002", "Destination invalide", 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.trip.update({
      where: { id: tripId },
      data: {
        ...(input.vehicleId !== undefined
          ? { vehicleId: input.vehicleId }
          : {}),
        ...(input.travelGroupId !== undefined
          ? { travelGroupId: input.travelGroupId }
          : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.origin !== undefined ? { origin: input.origin } : {}),
        ...(input.originPlaceId !== undefined
          ? { originPlaceId: input.originPlaceId }
          : {}),
        ...(input.originLatitude !== undefined
          ? { originLatitude: decimalOrUndefined(input.originLatitude) ?? null }
          : {}),
        ...(input.originLongitude !== undefined
          ? {
              originLongitude:
                decimalOrUndefined(input.originLongitude) ?? null,
            }
          : {}),
        ...(input.originCity !== undefined
          ? { originCity: input.originCity }
          : {}),
        ...(input.originProvince !== undefined
          ? { originProvince: input.originProvince }
          : {}),
        ...(input.originPostalCode !== undefined
          ? { originPostalCode: input.originPostalCode }
          : {}),
        ...(input.originCountry !== undefined
          ? { originCountry: input.originCountry }
          : {}),
        ...(input.destination !== undefined
          ? { destination: input.destination }
          : {}),
        ...(input.destinationPlaceId !== undefined
          ? { destinationPlaceId: input.destinationPlaceId }
          : {}),
        ...(input.destinationLatitude !== undefined
          ? {
              destinationLatitude:
                decimalOrUndefined(input.destinationLatitude) ?? null,
            }
          : {}),
        ...(input.destinationLongitude !== undefined
          ? {
              destinationLongitude:
                decimalOrUndefined(input.destinationLongitude) ?? null,
            }
          : {}),
        ...(input.destinationCity !== undefined
          ? { destinationCity: input.destinationCity }
          : {}),
        ...(input.destinationProvince !== undefined
          ? { destinationProvince: input.destinationProvince }
          : {}),
        ...(input.destinationPostalCode !== undefined
          ? { destinationPostalCode: input.destinationPostalCode }
          : {}),
        ...(input.destinationCountry !== undefined
          ? { destinationCountry: input.destinationCountry }
          : {}),
        ...(input.departureDate !== undefined
          ? { departureDate: input.departureDate }
          : {}),
        ...(input.returnDate !== undefined
          ? { returnDate: input.returnDate }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    if (input.plannedBudget !== undefined) {
      await upsertTripBudgetAmount(
        tx,
        tripId,
        input.plannedBudget === null
          ? null
          : (decimalOrUndefined(input.plannedBudget) ?? null),
      );
    }

    return tx.trip.findUniqueOrThrow({
      where: { id: tripId },
      include: tripDetailInclude,
    });
  });

  await writeAuditLog({
    userId,
    entity: "trips",
    entityId: tripId,
    action: "update",
    oldValue: {
      status: existing.status,
      vehicleId: existing.vehicleId,
      travelGroupId: existing.travelGroupId,
    },
    newValue: {
      status: updated.status,
      vehicleId: updated.vehicleId,
      travelGroupId: updated.travelGroupId,
    },
    ipAddress,
  });

  return toTripDetailDto(updated);
}

export async function deleteTrip(
  userId: string,
  tripId: string,
  ipAddress?: string | null,
): Promise<void> {
  const existing = await getOwnedTripOrThrow(userId, tripId);

  await prisma.trip.update({
    where: { id: tripId },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    userId,
    entity: "trips",
    entityId: tripId,
    action: "delete",
    oldValue: { title: existing.title, status: existing.status },
    ipAddress,
  });
}

export async function completeTrip(
  userId: string,
  tripId: string,
  ipAddress?: string | null,
): Promise<TripDetailDto> {
  const existing = await getOwnedTripOrThrow(userId, tripId);
  assertCanComplete(existing.status);

  const vehicleForSnapshot = existing.vehicleId
    ? await prisma.userVehicle.findFirst({
        where: { id: existing.vehicleId, userId, deletedAt: null },
        include: {
          model: { select: { avgConsumption: true, fuelCapacityL: true } },
          catalogEntry: { select: { fuelTankCapacityL: true } },
          _count: {
            select: {
              fuelLogs: { where: { deletedAt: null, isFull: true } },
            },
          },
        },
      })
    : null;

  const snapshot =
    vehicleForSnapshot != null
      ? buildTripVehicleSnapshot({
          vehicleId: vehicleForSnapshot.id,
          currentOdometer: vehicleForSnapshot.currentOdometer,
          manufacturerConsumptionL100:
            vehicleForSnapshot.officialCombinedConsumptionL100,
          customConsumptionL100: vehicleForSnapshot.customConsumptionL100,
          realAvgConsumption: vehicleForSnapshot.realAvgConsumption,
          fullFillCount: vehicleForSnapshot._count.fuelLogs,
          manufacturerTankCapacityL:
            vehicleForSnapshot.manufacturerTankCapacityL,
          tankCapacityOverride: vehicleForSnapshot.tankCapacityOverride,
          catalogTankL: vehicleForSnapshot.catalogEntry?.fuelTankCapacityL,
          legacyTankL: vehicleForSnapshot.model?.fuelCapacityL,
          manufacturerFuelType: vehicleForSnapshot.manufacturerFuelType,
          customFuelType: vehicleForSnapshot.customFuelType,
          fuelType: vehicleForSnapshot.fuelType,
        })
      : null;

  const updated = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.update({
      where: { id: tripId },
      data: {
        status: "completed",
        ...(snapshot && existing.route
          ? {
              route: {
                update: {
                  vehicleSpecsSnapshot: snapshotToJson(snapshot),
                  fuelEstimateStale: false,
                },
              },
            }
          : {}),
      },
      include: tripDetailInclude,
    });

    const deleted = await tx.tripLocation.deleteMany({ where: { tripId } });
    await writeAuditLog({
      userId,
      entity: "trip_locations",
      entityId: tripId,
      action: "purge_locations",
      oldValue: { count: deleted.count },
      newValue: { reason: "completed" },
      ipAddress,
    });

    return trip;
  });

  await writeAuditLog({
    userId,
    entity: "trips",
    entityId: tripId,
    action: "complete",
    oldValue: { status: existing.status },
    newValue: { status: "completed", vehicleSpecsSnapshot: snapshot },
    ipAddress,
  });

  // Proposition kilométrage véhicule (confirmation utilisateur requise).
  if (updated.vehicleId) {
    const vehicle = await prisma.userVehicle.findFirst({
      where: { id: updated.vehicleId, userId, deletedAt: null },
      select: { id: true, currentOdometer: true },
    });
    const distanceKm = updated.route?.distanceKm
      ? Math.round(Number(updated.route.distanceKm))
      : null;
    if (vehicle && distanceKm != null && distanceKm > 0) {
      const proposed = vehicle.currentOdometer + distanceKm;
      await createInAppNotification({
        userId,
        type: "maintenance",
        title: "Kilométrage à confirmer",
        body: `Kilométrage avant le voyage : ${vehicle.currentOdometer.toLocaleString("fr-CA")} km · Distance : ${distanceKm.toLocaleString("fr-CA")} km · Nouveau proposé : ${proposed.toLocaleString("fr-CA")} km`,
        priority: "normal",
        dedupeKey: `odo-trip:${vehicle.id}:${tripId}`,
        sourceEntity: "trip",
        sourceId: tripId,
        href: `/dashboard/vehicles/${vehicle.id}/maintenance`,
      });
    }
  }

  return toTripDetailDto(updated);
}

export async function cancelTrip(
  userId: string,
  tripId: string,
  ipAddress?: string | null,
): Promise<TripDetailDto> {
  const existing = await getOwnedTripOrThrow(userId, tripId);
  assertCanCancel(existing.status);

  const updated = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.update({
      where: { id: tripId },
      data: { status: "cancelled" },
      include: tripDetailInclude,
    });

    const deleted = await tx.tripLocation.deleteMany({ where: { tripId } });
    await writeAuditLog({
      userId,
      entity: "trip_locations",
      entityId: tripId,
      action: "purge_locations",
      oldValue: { count: deleted.count },
      newValue: { reason: "cancelled" },
      ipAddress,
    });

    return trip;
  });

  await writeAuditLog({
    userId,
    entity: "trips",
    entityId: tripId,
    action: "cancel",
    oldValue: { status: existing.status },
    newValue: { status: "cancelled" },
    ipAddress,
  });

  return toTripDetailDto(updated);
}

export async function getTripSummary(
  userId: string,
  tripId: string,
): Promise<TripSummaryDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  return toSummaryDto(trip);
}

/**
 * Recalcule l'itinéraire depuis les données canoniques du Trip :
 * origin Trip + TripStop intermédiaires + destination Trip.
 * Ne déduit jamais la destination du dernier arrêt.
 */
export async function rebuildTripRouteFromCanonicalData(
  userId: string,
  tripId: string,
  ipAddress?: string | null,
): Promise<TripDetailDto> {
  return optimizeTrip(userId, tripId, ipAddress);
}

export async function optimizeTrip(
  userId: string,
  tripId: string,
  ipAddress?: string | null,
): Promise<TripDetailDto> {
  const { assertTripFeature } =
    await import("@/features/trips/services/access-gate");
  await assertTripFeature(userId, "trip.optimize.enabled");

  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const {
    buildTripRouteRequest,
    evaluateRouteIntegrity,
    getOrderedRouteStops,
  } = await import("@/features/trips/services/build-trip-route-request");

  const maps = getMapsService();
  const origin = await resolvePoint(
    userId,
    trip.origin,
    trip.originLatitude != null && trip.originLongitude != null
      ? {
          lat: Number(trip.originLatitude),
          lng: Number(trip.originLongitude),
        }
      : null,
  );
  const destination = await resolvePoint(
    userId,
    trip.destination,
    trip.destinationLatitude != null && trip.destinationLongitude != null
      ? {
          lat: Number(trip.destinationLatitude),
          lng: Number(trip.destinationLongitude),
        }
      : null,
  );

  // Persister les coords canoniques (évite que l'UI/fuel ne s'appuient que sur les stops).
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      originLatitude: new Prisma.Decimal(origin.lat),
      originLongitude: new Prisma.Decimal(origin.lng),
      destinationLatitude: new Prisma.Decimal(destination.lat),
      destinationLongitude: new Prisma.Decimal(destination.lng),
    },
  });

  for (const stop of trip.stops) {
    const existing = toLatLng(stop.latitude, stop.longitude);
    if (existing) continue;
    if (!stop.address?.trim()) {
      throw new AppError(
        "EXT_002",
        `Étape « ${stop.name} » sans coordonnées ni adresse`,
        400,
      );
    }
    const geocoded = await maps.geocode(userId, stop.address);
    await prisma.tripStop.update({
      where: { id: stop.id },
      data: {
        latitude: new Prisma.Decimal(geocoded.lat),
        longitude: new Prisma.Decimal(geocoded.lng),
      },
    });
  }

  const refreshedStops = await prisma.tripStop.findMany({
    where: { tripId },
    orderBy: [{ direction: "asc" }, { sequence: "asc" }],
  });

  const sourceStops = refreshedStops.map((s) => ({
    id: s.id,
    name: s.name,
    stopType: s.stopType,
    sequence: s.sequence,
    latitude: Number(s.latitude),
    longitude: Number(s.longitude),
    direction: s.direction,
    durationMinutes: s.durationMinutes,
  }));

  const tripSource = {
    origin: trip.origin,
    destination: trip.destination,
    originLatitude: origin.lat,
    originLongitude: origin.lng,
    destinationLatitude: destination.lat,
    destinationLongitude: destination.lng,
    stops: sourceStops,
  };

  const routeRequest = buildTripRouteRequest(tripSource, "outbound");

  const intermediateWaypoints = routeRequest.intermediateWaypoints.map((w) => ({
    lat: w.lat,
    lng: w.lng,
    label: w.name,
  }));

  const directions = await maps.directions(
    userId,
    { lat: routeRequest.origin.lat, lng: routeRequest.origin.lng },
    {
      lat: routeRequest.destination.lat,
      lng: routeRequest.destination.lng,
    },
    intermediateWaypoints,
  );

  const integrity = evaluateRouteIntegrity({
    requestDestination: {
      lat: routeRequest.destination.lat,
      lng: routeRequest.destination.lng,
    },
    responseFinalDestination: directions.finalDestination,
    intermediateWaypointCount: intermediateWaypoints.length,
    actualLegCount: directions.legCount,
    totalDistanceKm: directions.distanceKm,
    polylinePresent: Boolean(directions.polyline),
    originMatchesTrip: coordinatesApproximatelyEqual(
      { lat: routeRequest.origin.lat, lng: routeRequest.origin.lng },
      directions.legs[0]?.start ?? routeRequest.origin,
    ),
  });

  let returnDirections: typeof directions | null = null;
  const hasReturnLeg =
    Boolean(trip.returnDate) ||
    refreshedStops.some((s) => s.direction === "return");

  if (hasReturnLeg) {
    const returnRequest = buildTripRouteRequest(tripSource, "return");
    const returnWaypoints = returnRequest.intermediateWaypoints.map((w) => ({
      lat: w.lat,
      lng: w.lng,
      label: w.name,
    }));
    returnDirections = await maps.directions(
      userId,
      { lat: returnRequest.origin.lat, lng: returnRequest.origin.lng },
      {
        lat: returnRequest.destination.lat,
        lng: returnRequest.destination.lng,
      },
      returnWaypoints,
    );
    const returnIntegrity = evaluateRouteIntegrity({
      requestDestination: {
        lat: returnRequest.destination.lat,
        lng: returnRequest.destination.lng,
      },
      responseFinalDestination: returnDirections.finalDestination,
      intermediateWaypointCount: returnWaypoints.length,
      actualLegCount: returnDirections.legCount,
      totalDistanceKm: returnDirections.distanceKm,
      polylinePresent: Boolean(returnDirections.polyline),
    });
    if (!returnIntegrity.passed) {
      throw new AppError(
        "EXT_005",
        "Itinéraire retour rejeté. L'ancien trajet est conservé.",
        400,
      );
    }
  }

  console.info(
    "[trips]",
    JSON.stringify({
      operation: "rebuild-trip-route",
      tripId,
      originAddress: trip.origin,
      originalDestinationAddress: trip.destination,
      persistedDestinationAddress: trip.destination,
      intermediateWaypointCount: intermediateWaypoints.length,
      intermediateWaypointIds: getOrderedRouteStops(tripSource, "outbound").map(
        (s) => s.id,
      ),
      returnWaypointCount: hasReturnLeg
        ? getOrderedRouteStops(tripSource, "return").length
        : 0,
      requestDestinationLatitude: routeRequest.destination.lat,
      requestDestinationLongitude: routeRequest.destination.lng,
      responseFinalLatitude: directions.finalDestination.lat,
      responseFinalLongitude: directions.finalDestination.lng,
      legCount: directions.legCount,
      totalDistanceKm: directions.distanceKm,
      totalDrivingMinutes: directions.durationMin,
      returnDistanceKm: returnDirections?.distanceKm ?? null,
      routeIntegrityPassed: integrity.passed,
      fuelPlanRecalculated: false,
      refuelStopCount: null,
      integrityFailures: integrity.failureReasons,
    }),
  );

  if (!integrity.passed) {
    throw new AppError(
      "EXT_005",
      "Itinéraire rejeté : la destination calculée ne correspond pas au voyage (ou legs incomplets). L'ancien trajet est conservé.",
      400,
    );
  }

  const waypointsHash = computeWaypointsHash({
    origin: trip.origin,
    destination: trip.destination,
    stops: refreshedStops.map((s) => ({
      sequence: s.sequence,
      address: s.address,
      latitude: s.latitude?.toString() ?? null,
      longitude: s.longitude?.toString() ?? null,
      direction: s.direction,
      durationMinutes: s.durationMinutes,
      stopType: s.stopType,
    })),
  });

  await prisma.tripRoute.upsert({
    where: { tripId },
    create: {
      tripId,
      provider: directions.provider,
      distanceKm: new Prisma.Decimal(directions.distanceKm),
      estimatedDurationMin: directions.durationMin,
      polyline: directions.polyline,
      returnDistanceKm: returnDirections
        ? new Prisma.Decimal(returnDirections.distanceKm)
        : null,
      returnEstimatedDurationMin: returnDirections?.durationMin ?? null,
      returnPolyline: returnDirections?.polyline ?? null,
      waypointsHash,
    },
    update: {
      provider: directions.provider,
      distanceKm: new Prisma.Decimal(directions.distanceKm),
      estimatedDurationMin: directions.durationMin,
      polyline: directions.polyline,
      returnDistanceKm: returnDirections
        ? new Prisma.Decimal(returnDirections.distanceKm)
        : null,
      returnEstimatedDurationMin: returnDirections?.durationMin ?? null,
      returnPolyline: returnDirections?.polyline ?? null,
      waypointsHash,
    },
  });

  await writeAuditLog({
    userId,
    entity: "trip_routes",
    entityId: tripId,
    action: "optimize",
    newValue: {
      distanceKm: directions.distanceKm,
      durationMin: directions.durationMin,
      returnDistanceKm: returnDirections?.distanceKm ?? null,
      waypointsHash,
      legCount: directions.legCount,
      destination: trip.destination,
    },
    ipAddress,
  });

  return getTripById(userId, tripId);
}

function coordinatesApproximatelyEqual(
  a: LatLng,
  b: LatLng,
  toleranceKm = 25,
): boolean {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h))) <= toleranceKm;
}

export async function geocodeStop(
  userId: string,
  tripId: string,
  stopId: string,
  ipAddress?: string | null,
): Promise<TripStopDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const existing = trip.stops.find((s) => s.id === stopId);
  if (!existing) {
    throw new AppError("TRIP_001", "Voyage introuvable", 404);
  }
  if (!existing.address?.trim()) {
    throw new AppError("EXT_002", "Position invalide ou introuvable", 400);
  }

  const result = await getMapsService().geocode(userId, existing.address);
  const updated = await prisma.tripStop.update({
    where: { id: stopId },
    data: {
      latitude: new Prisma.Decimal(result.lat),
      longitude: new Prisma.Decimal(result.lng),
    },
  });

  await writeAuditLog({
    userId,
    entity: "trip_stops",
    entityId: stopId,
    action: "geocode",
    newValue: { lat: result.lat, lng: result.lng },
    ipAddress,
  });

  return toStopDto(updated);
}

/** Exposé pour tests / lecture route périmée. */
export function isRouteStale(
  route: Pick<TripRouteDto, "waypointsHash"> | null,
  trip: {
    origin: string;
    destination: string;
    stops: Array<{
      sequence: number;
      address: string | null;
      latitude: string | null;
      longitude: string | null;
    }>;
  },
): boolean {
  if (!route?.waypointsHash) return Boolean(route);
  const current = computeWaypointsHash(trip);
  return route.waypointsHash !== current;
}

export async function addStop(
  userId: string,
  tripId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<TripStopDto> {
  const { assertFullTripAccess } =
    await import("@/features/trips/services/access-gate");
  await assertFullTripAccess(userId);

  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const input: StopCreateInput = parseZod(
    () => stopCreateSchema.parse(raw),
    "Étape invalide",
  );

  const direction = input.direction ?? "outbound";

  const stop = await prisma.$transaction(async (tx) => {
    const others = await tx.tripStop.findMany({
      where: { tripId, direction },
      orderBy: { sequence: "asc" },
      select: { id: true },
    });

    const created = await tx.tripStop.create({
      data: {
        tripId,
        sequence: -(others.length + 1),
        name: input.name,
        address: input.address ?? null,
        latitude: decimalOrUndefined(input.latitude) ?? null,
        longitude: decimalOrUndefined(input.longitude) ?? null,
        arrivalTime: input.arrivalTime ?? null,
        departureTime: input.departureTime ?? null,
        stopType: input.stopType,
        direction,
        placeId: input.placeId ?? null,
        durationMinutes: input.durationMinutes ?? 0,
        notes: input.notes ?? null,
      },
    });

    const insertAt = Math.min(
      Math.max(input.sequence ?? others.length + 1, 1),
      others.length + 1,
    );
    const ordered = [
      ...others.slice(0, insertAt - 1).map((s) => s.id),
      created.id,
      ...others.slice(insertAt - 1).map((s) => s.id),
    ];
    await renumberStopsInTx(tx, tripId, {
      direction,
      orderedIds: ordered,
    });

    if (input.alsoAddToReturn && direction === "outbound") {
      const returnOthers = await tx.tripStop.findMany({
        where: { tripId, direction: "return" },
        orderBy: { sequence: "asc" },
        select: { id: true },
      });
      const returnCreated = await tx.tripStop.create({
        data: {
          tripId,
          sequence: -(returnOthers.length + 1),
          name: input.name,
          address: input.address ?? null,
          latitude: decimalOrUndefined(input.latitude) ?? null,
          longitude: decimalOrUndefined(input.longitude) ?? null,
          stopType: input.stopType,
          direction: "return",
          placeId: input.placeId ?? null,
          durationMinutes: input.durationMinutes ?? 0,
          notes: input.notes ?? null,
        },
      });
      await renumberStopsInTx(tx, tripId, {
        direction: "return",
        orderedIds: [...returnOthers.map((s) => s.id), returnCreated.id],
      });
    }

    return tx.tripStop.findUniqueOrThrow({ where: { id: created.id } });
  });

  await writeAuditLog({
    userId,
    entity: "trip_stops",
    entityId: stop.id,
    action: "create",
    newValue: {
      tripId,
      name: stop.name,
      sequence: stop.sequence,
      direction: stop.direction,
      stopType: stop.stopType,
    },
    ipAddress,
  });

  let result = stop;
  if (stop.address && (stop.latitude == null || stop.longitude == null)) {
    const coords = await tryGeocodeAddress(userId, stop.address);
    if (coords) {
      result = await prisma.tripStop.update({
        where: { id: stop.id },
        data: {
          latitude: new Prisma.Decimal(coords.lat),
          longitude: new Prisma.Decimal(coords.lng),
        },
      });
    }
  }

  // Recalcul atomique après mutation (itinéraire + carburant)
  try {
    await (
      await import("@/features/trips/services/recalculate-itinerary")
    ).recalculateTripItineraryAtomic(userId, tripId, { ipAddress });
  } catch (err) {
    console.error(
      "[trips]",
      JSON.stringify({
        operation: "add-stop-recalc-failed",
        tripId,
        stopId: result.id,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    // L'étape reste enregistrée ; la route peut être stale.
  }

  return toStopDto(result);
}

export async function updateStop(
  userId: string,
  tripId: string,
  stopId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<TripStopDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const existing = trip.stops.find((s) => s.id === stopId);
  if (!existing) {
    throw new AppError("TRIP_001", "Voyage introuvable", 404);
  }

  const input: StopUpdateInput = parseZod(
    () => stopUpdateSchema.parse(raw),
    "Étape invalide",
  );

  const arrivalTime =
    input.arrivalTime !== undefined ? input.arrivalTime : existing.arrivalTime;
  const departureTime =
    input.departureTime !== undefined
      ? input.departureTime
      : existing.departureTime;
  if (
    arrivalTime &&
    departureTime &&
    departureTime.getTime() < arrivalTime.getTime()
  ) {
    throw new AppError(
      "VALIDATION_ERROR",
      "L'heure de départ de l'étape doit être postérieure ou égale à l'arrivée",
      400,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const addressChanged =
      input.address !== undefined && input.address !== existing.address;
    const clearCoords =
      addressChanged &&
      input.latitude === undefined &&
      input.longitude === undefined;

    const nextDirection = input.direction ?? existing.direction;
    const directionChanged =
      input.direction !== undefined && input.direction !== existing.direction;

    await tx.tripStop.update({
      where: { id: stopId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(clearCoords
          ? { latitude: null, longitude: null }
          : {
              ...(input.latitude !== undefined
                ? { latitude: decimalOrUndefined(input.latitude) }
                : {}),
              ...(input.longitude !== undefined
                ? { longitude: decimalOrUndefined(input.longitude) }
                : {}),
            }),
        ...(input.arrivalTime !== undefined
          ? { arrivalTime: input.arrivalTime }
          : {}),
        ...(input.departureTime !== undefined
          ? { departureTime: input.departureTime }
          : {}),
        ...(input.stopType !== undefined ? { stopType: input.stopType } : {}),
        ...(input.direction !== undefined
          ? { direction: input.direction }
          : {}),
        ...(input.placeId !== undefined ? { placeId: input.placeId } : {}),
        ...(input.durationMinutes !== undefined
          ? { durationMinutes: input.durationMinutes }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    if (directionChanged) {
      await renumberStopsInTx(tx, tripId, { direction: existing.direction });
      const targetOthers = await tx.tripStop.findMany({
        where: {
          tripId,
          direction: nextDirection,
          id: { not: stopId },
        },
        orderBy: { sequence: "asc" },
        select: { id: true },
      });
      const insertAt = Math.min(
        Math.max(input.sequence ?? targetOthers.length + 1, 1),
        targetOthers.length + 1,
      );
      const ordered = [
        ...targetOthers.slice(0, insertAt - 1).map((s) => s.id),
        stopId,
        ...targetOthers.slice(insertAt - 1).map((s) => s.id),
      ];
      await renumberStopsInTx(tx, tripId, {
        direction: nextDirection,
        orderedIds: ordered,
      });
    } else if (
      input.sequence !== undefined &&
      input.sequence !== existing.sequence
    ) {
      const others = trip.stops
        .filter((s) => s.id !== stopId && s.direction === existing.direction)
        .sort((a, b) => a.sequence - b.sequence)
        .map((s) => s.id);
      const insertAt = Math.min(Math.max(input.sequence, 1), others.length + 1);
      const ordered = [
        ...others.slice(0, insertAt - 1),
        stopId,
        ...others.slice(insertAt - 1),
      ];
      await renumberStopsInTx(tx, tripId, {
        direction: existing.direction,
        orderedIds: ordered,
      });
    } else {
      await renumberStopsInTx(tx, tripId, { direction: nextDirection });
    }

    return tx.tripStop.findUniqueOrThrow({
      where: { id: stopId },
      include: {
        campground: campgroundInclude,
        stopActivities: stopActivitiesInclude,
      },
    });
  });

  await writeAuditLog({
    userId,
    entity: "trip_stops",
    entityId: stopId,
    action: "update",
    newValue: {
      tripId,
      sequence: updated.sequence,
      name: updated.name,
      direction: updated.direction,
    },
    ipAddress,
  });

  let result = updated;
  if (
    updated.address &&
    (updated.latitude == null || updated.longitude == null)
  ) {
    const coords = await tryGeocodeAddress(userId, updated.address);
    if (coords) {
      result = await prisma.tripStop.update({
        where: { id: stopId },
        data: {
          latitude: new Prisma.Decimal(coords.lat),
          longitude: new Prisma.Decimal(coords.lng),
        },
        include: {
          campground: campgroundInclude,
          stopActivities: stopActivitiesInclude,
        },
      });
    }
  }

  try {
    await (
      await import("@/features/trips/services/recalculate-itinerary")
    ).recalculateTripItineraryAtomic(userId, tripId, { ipAddress });
  } catch (err) {
    console.error(
      "[trips]",
      JSON.stringify({
        operation: "update-stop-recalc-failed",
        tripId,
        stopId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }

  return toStopDto(result);
}

export async function deleteStop(
  userId: string,
  tripId: string,
  stopId: string,
  ipAddress?: string | null,
): Promise<void> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const existing = trip.stops.find((s) => s.id === stopId);
  if (!existing) {
    throw new AppError("TRIP_001", "Voyage introuvable", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.tripStop.delete({ where: { id: stopId } });
    await renumberStopsInTx(tx, tripId, { direction: existing.direction });
  });

  await writeAuditLog({
    userId,
    entity: "trip_stops",
    entityId: stopId,
    action: "delete",
    oldValue: {
      tripId,
      name: existing.name,
      sequence: existing.sequence,
      direction: existing.direction,
    },
    ipAddress,
  });

  try {
    await (
      await import("@/features/trips/services/recalculate-itinerary")
    ).recalculateTripItineraryAtomic(userId, tripId, { ipAddress });
  } catch (err) {
    console.error(
      "[trips]",
      JSON.stringify({
        operation: "delete-stop-recalc-failed",
        tripId,
        stopId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }
}

export async function reorderStops(
  userId: string,
  tripId: string,
  direction: "outbound" | "return",
  orderedIds: string[],
  ipAddress?: string | null,
): Promise<TripDetailDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  await prisma.$transaction(async (tx) => {
    await renumberStopsInTx(tx, tripId, { direction, orderedIds });
  });

  await writeAuditLog({
    userId,
    entity: "trip_stops",
    entityId: tripId,
    action: "reorder",
    newValue: { direction, orderedIds },
    ipAddress,
  });

  try {
    const { trip: refreshed } = await (
      await import("@/features/trips/services/recalculate-itinerary")
    ).recalculateTripItineraryAtomic(userId, tripId, { ipAddress });
    return refreshed;
  } catch {
    return getTripById(userId, tripId);
  }
}

/** Exposé pour tests d’isolation (réutilise getOwnedTripOrThrow). */
export async function assertTripAccess(
  userId: string,
  tripId: string,
): Promise<TripDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  return toTripDto(trip);
}
