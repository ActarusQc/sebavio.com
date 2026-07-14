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

const vehicleInclude = {
  model: { include: { manufacturer: { select: { name: true } } } },
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
    orderBy: { sequence: "asc" as const },
    include: {
      campground: campgroundInclude,
      stopActivities: stopActivitiesInclude,
    },
  },
  route: true,
} as const;

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
  orderedIds?: string[],
) {
  const existing = await tx.tripStop.findMany({
    where: { tripId },
    orderBy: { sequence: "asc" },
    select: { id: true, sequence: true },
  });

  const ids = orderedIds ?? existing.map((s) => s.id);

  if (orderedIds) {
    const known = new Set(existing.map((s) => s.id));
    for (const id of orderedIds) {
      if (!known.has(id)) {
        throw new AppError("VALIDATION_ERROR", "Étape inconnue", 400);
      }
    }
    if (orderedIds.length !== existing.length) {
      throw new AppError(
        "VALIDATION_ERROR",
        "La renumérotation doit couvrir toutes les étapes",
        400,
      );
    }
  }

  const assignments = buildContiguousAssignments(ids);
  assertContiguousSequences(assignments.map((a) => a.sequence));

  // Deux passes pour éviter les collisions sur @@unique(tripId, sequence).
  for (let i = 0; i < assignments.length; i++) {
    await tx.tripStop.update({
      where: { id: assignments[i].id },
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
  return toTripDetailDto(trip);
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
        destination: input.destination,
        plannedBudget: decimalOrUndefined(input.plannedBudget) ?? null,
        route: { create: {} },
      },
      include: tripDetailInclude,
    });
    return created;
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

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: {
      ...(input.vehicleId !== undefined ? { vehicleId: input.vehicleId } : {}),
      ...(input.travelGroupId !== undefined
        ? { travelGroupId: input.travelGroupId }
        : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.origin !== undefined ? { origin: input.origin } : {}),
      ...(input.destination !== undefined
        ? { destination: input.destination }
        : {}),
      ...(input.departureDate !== undefined
        ? { departureDate: input.departureDate }
        : {}),
      ...(input.returnDate !== undefined
        ? { returnDate: input.returnDate }
        : {}),
      ...(input.plannedBudget !== undefined
        ? { plannedBudget: decimalOrUndefined(input.plannedBudget) }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    include: tripDetailInclude,
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

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { status: "completed" },
    include: tripDetailInclude,
  });

  await writeAuditLog({
    userId,
    entity: "trips",
    entityId: tripId,
    action: "complete",
    oldValue: { status: existing.status },
    newValue: { status: "completed" },
    ipAddress,
  });

  return toTripDetailDto(updated);
}

export async function cancelTrip(
  userId: string,
  tripId: string,
  ipAddress?: string | null,
): Promise<TripDetailDto> {
  const existing = await getOwnedTripOrThrow(userId, tripId);
  assertCanCancel(existing.status);

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: { status: "cancelled" },
    include: tripDetailInclude,
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

export async function optimizeTrip(
  userId: string,
  tripId: string,
  ipAddress?: string | null,
): Promise<TripDetailDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const maps = getMapsService();
  const origin = await resolvePoint(userId, trip.origin);
  const destination = await resolvePoint(userId, trip.destination);

  const waypoints: LatLng[] = [];
  for (const stop of trip.stops) {
    const existing = toLatLng(stop.latitude, stop.longitude);
    if (existing) {
      waypoints.push(existing);
      continue;
    }
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
    waypoints.push({ lat: geocoded.lat, lng: geocoded.lng });
  }

  const directions = await maps.directions(
    userId,
    origin,
    destination,
    waypoints,
  );

  const refreshedStops = await prisma.tripStop.findMany({
    where: { tripId },
    orderBy: { sequence: "asc" },
  });

  const waypointsHash = computeWaypointsHash({
    origin: trip.origin,
    destination: trip.destination,
    stops: refreshedStops.map((s) => ({
      sequence: s.sequence,
      address: s.address,
      latitude: s.latitude?.toString() ?? null,
      longitude: s.longitude?.toString() ?? null,
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
      waypointsHash,
    },
    update: {
      provider: directions.provider,
      distanceKm: new Prisma.Decimal(directions.distanceKm),
      estimatedDurationMin: directions.durationMin,
      polyline: directions.polyline,
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
      waypointsHash,
    },
    ipAddress,
  });

  return getTripById(userId, tripId);
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
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const input: StopCreateInput = parseZod(
    () => stopCreateSchema.parse(raw),
    "Étape invalide",
  );

  const stop = await prisma.$transaction(async (tx) => {
    const others = await tx.tripStop.findMany({
      where: { tripId },
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
    await renumberStopsInTx(tx, tripId, ordered);
    return tx.tripStop.findUniqueOrThrow({ where: { id: created.id } });
  });

  await writeAuditLog({
    userId,
    entity: "trip_stops",
    entityId: stop.id,
    action: "create",
    newValue: { tripId, name: stop.name, sequence: stop.sequence },
    ipAddress,
  });

  if (stop.address && (stop.latitude == null || stop.longitude == null)) {
    const coords = await tryGeocodeAddress(userId, stop.address);
    if (coords) {
      const geocoded = await prisma.tripStop.update({
        where: { id: stop.id },
        data: {
          latitude: new Prisma.Decimal(coords.lat),
          longitude: new Prisma.Decimal(coords.lng),
        },
      });
      return toStopDto(geocoded);
    }
  }

  return toStopDto(stop);
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
      },
    });

    if (input.sequence !== undefined && input.sequence !== existing.sequence) {
      const others = trip.stops
        .filter((s) => s.id !== stopId)
        .sort((a, b) => a.sequence - b.sequence)
        .map((s) => s.id);
      const insertAt = Math.min(Math.max(input.sequence, 1), others.length + 1);
      const ordered = [
        ...others.slice(0, insertAt - 1),
        stopId,
        ...others.slice(insertAt - 1),
      ];
      await renumberStopsInTx(tx, tripId, ordered);
    } else {
      await renumberStopsInTx(tx, tripId);
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
    newValue: { tripId, sequence: updated.sequence, name: updated.name },
    ipAddress,
  });

  if (
    updated.address &&
    (updated.latitude == null || updated.longitude == null)
  ) {
    const coords = await tryGeocodeAddress(userId, updated.address);
    if (coords) {
      const geocoded = await prisma.tripStop.update({
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
      return toStopDto(geocoded);
    }
  }

  return toStopDto(updated);
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
    await renumberStopsInTx(tx, tripId);
  });

  await writeAuditLog({
    userId,
    entity: "trip_stops",
    entityId: stopId,
    action: "delete",
    oldValue: { tripId, name: existing.name, sequence: existing.sequence },
    ipAddress,
  });
}

/** Exposé pour tests d’isolation (réutilise getOwnedTripOrThrow). */
export async function assertTripAccess(
  userId: string,
  tripId: string,
): Promise<TripDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  return toTripDto(trip);
}
