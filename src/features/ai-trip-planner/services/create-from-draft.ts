import "server-only";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  addStop,
  createTrip,
  rebuildTripRouteFromCanonicalData,
} from "@/features/trips/services/trips";
import { upsertTravelerProfile } from "@/features/trips/activities/trip-activity-service";
import { estimateTripFuel } from "@/features/fuel/services/estimate";
import { assertTripPlannerAccess } from "@/features/ai-trip-planner/services/access";
import { getOwnedSessionOrThrow } from "@/features/ai-trip-planner/services/sessions";
import {
  parseStoredDraft,
  toSessionDto,
} from "@/features/ai-trip-planner/services/dto";
import { detectMissingFields } from "@/features/ai-trip-planner/lib/missing-fields";
import {
  toDateOnlyIso,
  validatePlanningDates,
} from "@/features/ai-trip-planner/lib/dates";
import { ensureDraftPlacesGeocoded } from "@/features/ai-trip-planner/services/geocode-places";
import type { TripPlannerSessionDto } from "@/features/ai-trip-planner/types";
import type { Prisma } from "@prisma/client";
import type { StopType } from "@/features/trips/constants";

function mapStopType(
  category: string,
): Exclude<StopType, "origin" | "destination"> {
  switch (category) {
    case "activity":
      return "activity";
    case "lodging":
      return "lodging";
    case "fuel":
      return "fuel";
    case "rest":
    case "meal":
      return "rest";
    case "detour":
      return "detour";
    default:
      return "other";
  }
}

export async function createTripFromPlanningSession(
  userId: string,
  sessionId: string,
  ipAddress?: string | null,
): Promise<{ tripId: string; session: TripPlannerSessionDto }> {
  await assertTripPlannerAccess(userId);

  const session = await getOwnedSessionOrThrow(userId, sessionId);

  if (session.createdTripId) {
    return {
      tripId: session.createdTripId,
      session: toSessionDto(session),
    };
  }

  if (session.status === "abandoned") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Cette session a été abandonnée.",
      400,
    );
  }

  let draft = parseStoredDraft(session.structuredDraft);
  const missing = detectMissingFields(draft);
  if (missing.length > 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Informations manquantes : ${missing.join(", ")}.`,
      400,
    );
  }

  if (!draft.vehicleId) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Un véhicule est requis pour créer le voyage.",
      400,
    );
  }

  const dates = validatePlanningDates({
    departureDate: draft.departureDate,
    returnDate: draft.returnDate,
    durationDays: draft.durationDays,
  });

  draft = await ensureDraftPlacesGeocoded(userId, draft);

  const title =
    draft.title?.trim() ||
    `Voyage ${draft.origin.name} → ${draft.destination.name}`.slice(0, 150);

  // Verrou idempotent : claim la session avant création
  const claimed = await prisma.aiTripPlanningSession.updateMany({
    where: {
      id: sessionId,
      userId,
      createdTripId: null,
      status: { not: "abandoned" },
    },
    data: {
      status: "ready_for_confirmation",
      structuredDraft: {
        ...draft,
        departureDate: toDateOnlyIso(dates.departure),
        returnDate: toDateOnlyIso(dates.returnDate),
      } as unknown as Prisma.InputJsonValue,
    },
  });

  if (claimed.count === 0) {
    const fresh = await getOwnedSessionOrThrow(userId, sessionId);
    if (fresh.createdTripId) {
      return { tripId: fresh.createdTripId, session: toSessionDto(fresh) };
    }
    throw new AppError(
      "VALIDATION_ERROR",
      "Impossible de créer le voyage pour cette session.",
      409,
    );
  }

  let tripId: string | null = null;

  try {
    const trip = await createTrip(
      userId,
      {
        vehicleId: draft.vehicleId,
        travelGroupId: draft.travelGroupId,
        title,
        origin: draft.origin.name!,
        destination: draft.destination.name!,
        originLatitude: draft.origin.latitude,
        originLongitude: draft.origin.longitude,
        destinationLatitude: draft.destination.latitude,
        destinationLongitude: draft.destination.longitude,
        departureDate: dates.departure,
        returnDate: dates.returnDate,
      },
      ipAddress,
    );
    tripId = trip.id;

    const waypoints = [
      ...draft.stops.filter((s) => s.accepted),
      ...draft.activities.filter((a) => a.accepted),
    ].slice(0, 20);

    for (const stop of waypoints) {
      const destName = (draft.destination.name ?? "").toLowerCase();
      if (stop.name.trim().toLowerCase() === destName) continue;

      await addStop(
        userId,
        trip.id,
        {
          name: stop.name,
          address: stop.address ?? stop.name,
          latitude: stop.latitude,
          longitude: stop.longitude,
          stopType: mapStopType(stop.category),
          direction: "outbound",
          durationMinutes: stop.durationMinutes ?? 60,
          notes: stop.justification,
        },
        ipAddress,
      );
    }

    const adults = draft.adults ?? draft.travelerCount ?? 1;
    const children = draft.children ?? 0;
    if (adults > 0 || children > 0) {
      try {
        const purpose =
          children > 0 ? "family" : adults === 2 ? "couple" : "friends";
        await upsertTravelerProfile(
          userId,
          trip.id,
          {
            purpose,
            adultCount: Math.max(1, adults),
            childCount: children,
            childAges: Array.from({ length: children }, () => 8),
            interests: [],
            deferred: false,
          },
          ipAddress,
        );
      } catch {
        // profil non bloquant
      }
    }

    try {
      await rebuildTripRouteFromCanonicalData(userId, trip.id, ipAddress);
    } catch {
      // itinéraire non bloquant à la création
    }

    try {
      await estimateTripFuel(userId, trip.id, undefined, ipAddress);
    } catch {
      // carburant non bloquant
    }

    const completed = await prisma.aiTripPlanningSession.update({
      where: { id: sessionId },
      data: {
        status: "created",
        createdTripId: trip.id,
        completedAt: new Date(),
        structuredDraft: draft as unknown as Prisma.InputJsonValue,
      },
    });

    await writeAuditLog({
      userId,
      entity: "ai_trip_planning_sessions",
      entityId: sessionId,
      action: "create_trip",
      newValue: { tripId: trip.id },
      ipAddress,
    });

    return { tripId: trip.id, session: toSessionDto(completed) };
  } catch (error) {
    if (tripId) {
      // Évite un voyage orphelin silencieux : laisser le voyage créé
      // et rattacher la session pour idempotence.
      await prisma.aiTripPlanningSession.update({
        where: { id: sessionId },
        data: {
          status: "created",
          createdTripId: tripId,
          completedAt: new Date(),
        },
      });
      const completed = await getOwnedSessionOrThrow(userId, sessionId);
      return { tripId, session: toSessionDto(completed) };
    }
    throw error;
  }
}

export { resolveCreateIdempotency } from "@/features/ai-trip-planner/lib/idempotency";
