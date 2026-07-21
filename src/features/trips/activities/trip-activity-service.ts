import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import {
  getActivityRecommendationEnhancer,
  sanitizeEnhancementResult,
} from "@/features/trips/activities/ai-enhancer";
import {
  rankedToCreateData,
  toTravelerProfileDto,
  toTripActivityDto,
} from "@/features/trips/activities/activity-suggestion-mapper";
import type {
  TripActivityDto,
  TripTravelerProfileDto,
} from "@/features/trips/activities/activity-types";
import { GENERATION_LOCK_TTL_SECONDS } from "@/features/trips/activities/activity-types";
import {
  addTripActivitySchema,
  deferredProfileSchema,
  generateSuggestionsSchema,
  planTripActivitySchema,
  rejectTripActivitySchema,
  tripTravelerProfileSchema,
  type TripTravelerProfileInput,
} from "@/features/trips/activities/activity-validation";
import {
  acquireGenerationLock,
  releaseGenerationLock,
} from "@/features/trips/activities/trip-activity-cache";
import { searchAndRankTripActivities } from "@/features/trips/activities/trip-activity-search-service";
import { writeAuditLog } from "@/features/auth/services/audit";
import { estimateTripFuel } from "@/features/fuel/services/estimate";
import {
  addStop,
  deleteStop,
  getOwnedTripOrThrow,
  rebuildTripRouteFromCanonicalData,
} from "@/features/trips/services/trips";
import { computeOutboundInsertSequence } from "@/features/trips/services/route-stop-order";
import { assertWritableStatus } from "@/features/trips/services/transitions";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { LatLng } from "@/services/maps/types";

type AddActivityOpLog = {
  operation: "add-trip-activity";
  tripId: string;
  activityId: string;
  addAsRouteStop: boolean;
  routeVersionBefore: string | null;
  routeVersionAfter: string | null;
  routeStopCountBefore: number;
  routeStopCountAfter: number;
  refuelStopCountBefore: number;
  refuelStopCountAfter: number;
  fuelPlanRecalculated: boolean;
  fuelPlanPersisted: boolean;
  visitMinutes: number | null;
  durationMs: number;
  errorCode: string | null;
};

function logAddActivityOp(payload: AddActivityOpLog): void {
  console.info("[trip-activities]", JSON.stringify(payload));
}

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

function defaultProfile(): TripTravelerProfileInput {
  return {
    purpose: "couple",
    adultCount: 2,
    childCount: 0,
    childAges: [],
    interests: ["nature", "food", "scenic_views"],
    budgetPreference: "any",
    durationPreference: "any",
    maxDetourMinutes: 15,
    environmentPreference: "both",
    activityLevel: "moderate",
    accessibilityNeeds: ["none"],
    travelingWithPet: false,
    deferred: true,
  };
}

export async function getTravelerProfile(
  userId: string,
  tripId: string,
): Promise<TripTravelerProfileDto | null> {
  await getOwnedTripOrThrow(userId, tripId);
  const row = await prisma.tripTravelerProfile.findUnique({
    where: { tripId },
  });
  return row ? toTravelerProfileDto(row) : null;
}

export async function upsertTravelerProfile(
  userId: string,
  tripId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<TripTravelerProfileDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const deferred = deferredProfileSchema.safeParse(raw);
  const input: TripTravelerProfileInput = deferred.success
    ? defaultProfile()
    : parseZod(
        () => tripTravelerProfileSchema.parse(raw),
        "Profil voyageurs invalide",
      );

  const row = await prisma.tripTravelerProfile.upsert({
    where: { tripId },
    create: {
      tripId,
      purpose: input.purpose,
      adultCount: input.adultCount,
      childCount: input.childCount,
      childAges: input.childAges,
      interests: input.interests,
      budgetPreference: input.budgetPreference ?? "any",
      durationPreference: input.durationPreference ?? "any",
      maxDetourMinutes: input.maxDetourMinutes,
      environmentPreference: input.environmentPreference ?? "both",
      activityLevel: input.activityLevel ?? "moderate",
      accessibilityNeeds: input.accessibilityNeeds,
      travelingWithPet: input.travelingWithPet,
      deferred: input.deferred,
    },
    update: {
      purpose: input.purpose,
      adultCount: input.adultCount,
      childCount: input.childCount,
      childAges: input.childAges,
      interests: input.interests,
      budgetPreference: input.budgetPreference ?? "any",
      durationPreference: input.durationPreference ?? "any",
      maxDetourMinutes: input.maxDetourMinutes,
      environmentPreference: input.environmentPreference ?? "both",
      activityLevel: input.activityLevel ?? "moderate",
      accessibilityNeeds: input.accessibilityNeeds,
      travelingWithPet: input.travelingWithPet,
      deferred: input.deferred,
    },
  });

  await writeAuditLog({
    userId,
    entity: "trip_traveler_profiles",
    entityId: row.id,
    action: "upsert",
    newValue: {
      purpose: row.purpose,
      adultCount: row.adultCount,
      childCount: row.childCount,
    },
    ipAddress,
  });

  return toTravelerProfileDto(row);
}

export async function listTripActivities(
  userId: string,
  tripId: string,
): Promise<{
  profile: TripTravelerProfileDto | null;
  activities: TripActivityDto[];
}> {
  await getOwnedTripOrThrow(userId, tripId);
  const [profile, activities] = await Promise.all([
    prisma.tripTravelerProfile.findUnique({ where: { tripId } }),
    prisma.tripActivity.findMany({
      where: { tripId },
      orderBy: [{ suitabilityScore: "desc" }, { createdAt: "desc" }],
    }),
  ]);
  return {
    profile: profile ? toTravelerProfileDto(profile) : null,
    activities: activities.map(toTripActivityDto),
  };
}

function resolveLatLng(
  lat: Prisma.Decimal | null | undefined,
  lng: Prisma.Decimal | null | undefined,
): LatLng | null {
  if (lat == null || lng == null) return null;
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { lat: a, lng: b };
}

export async function generateTripActivitySuggestions(
  userId: string,
  tripId: string,
  raw?: unknown,
  ipAddress?: string | null,
): Promise<{
  activities: TripActivityDto[];
  profile: TripTravelerProfileDto | null;
  meta: Record<string, unknown>;
  partial: boolean;
  providerError: string | null;
}> {
  const { assertTripFeature } =
    await import("@/features/trips/services/access-gate");
  await assertTripFeature(userId, "ai.recommendations.enabled");

  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);
  const opts = parseZod(
    () => generateSuggestionsSchema.parse(raw ?? {}),
    "Paramètres invalides",
  );

  let profile = await prisma.tripTravelerProfile.findUnique({
    where: { tripId },
  });
  if (!profile) {
    await upsertTravelerProfile(userId, tripId, { deferred: true }, ipAddress);
    profile = await prisma.tripTravelerProfile.findUniqueOrThrow({
      where: { tripId },
    });
  }

  const locked = await acquireGenerationLock(
    tripId,
    GENERATION_LOCK_TTL_SECONDS,
  );
  if (!locked) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Une génération est déjà en cours pour ce voyage",
      409,
    );
  }

  try {
    const origin = resolveLatLng(trip.originLatitude, trip.originLongitude) ?? {
      lat: 46.8139,
      lng: -71.208,
    };
    const destination =
      resolveLatLng(trip.destinationLatitude, trip.destinationLongitude) ??
      origin;
    const waypoints = trip.stops
      .map((s) => resolveLatLng(s.latitude, s.longitude))
      .filter((p): p is LatLng => p != null);

    const existing = await prisma.tripActivity.findMany({
      where: { tripId },
      select: { googlePlaceId: true, status: true },
    });
    const rejectedPlaceIds = new Set(
      existing
        .filter((a) => a.status === "rejected")
        .map((a) => a.googlePlaceId),
    );
    const keptPlaceIds = new Set(
      existing
        .filter((a) => a.status === "added_to_trip" || a.status === "completed")
        .map((a) => a.googlePlaceId),
    );

    const { ranked, meta } = await searchAndRankTripActivities({
      tripId,
      userId,
      purpose: profile.purpose as TripTravelerProfileInput["purpose"],
      interests: (Array.isArray(profile.interests)
        ? profile.interests
        : []) as TripTravelerProfileInput["interests"],
      childAges: (Array.isArray(profile.childAges)
        ? profile.childAges.map(Number)
        : []) as number[],
      budgetPreference: profile.budgetPreference,
      durationPreference: profile.durationPreference,
      maxDetourMinutes: profile.maxDetourMinutes,
      environmentPreference: profile.environmentPreference,
      activityLevel: profile.activityLevel,
      accessibilityNeeds: (Array.isArray(profile.accessibilityNeeds)
        ? profile.accessibilityNeeds
        : ["none"]) as string[],
      travelingWithPet: profile.travelingWithPet,
      route: {
        polyline: trip.route?.polyline ?? null,
        origin,
        destination,
        waypoints,
        totalDistanceKm:
          trip.route?.distanceKm != null ? Number(trip.route.distanceKm) : null,
        totalDurationMin: trip.route?.estimatedDurationMin ?? null,
      },
      rejectedPlaceIds,
      keptPlaceIds,
    });

    // IA optionnelle (descriptions seulement)
    const enhancer = getActivityRecommendationEnhancer();
    const enhanced = sanitizeEnhancementResult(
      {
        tripPurpose: profile.purpose as TripTravelerProfileInput["purpose"],
        interests: (Array.isArray(profile.interests)
          ? profile.interests
          : []) as TripTravelerProfileInput["interests"],
        childAges: (Array.isArray(profile.childAges)
          ? profile.childAges.map(Number)
          : []) as number[],
        activities: ranked.map((r) => ({
          googlePlaceId: r.googlePlaceId,
          name: r.name,
          primaryType: r.primaryType,
          suitabilityReasons: r.suitabilityReasons,
        })),
      },
      await enhancer.enhance({
        tripPurpose: profile.purpose as TripTravelerProfileInput["purpose"],
        interests: (Array.isArray(profile.interests)
          ? profile.interests
          : []) as TripTravelerProfileInput["interests"],
        childAges: (Array.isArray(profile.childAges)
          ? profile.childAges.map(Number)
          : []) as number[],
        activities: ranked.map((r) => ({
          googlePlaceId: r.googlePlaceId,
          name: r.name,
          primaryType: r.primaryType,
          suitabilityReasons: r.suitabilityReasons,
        })),
      }),
    );

    for (const r of ranked) {
      const extra = enhanced.descriptions[r.googlePlaceId];
      if (extra && !r.suitabilityReasons.includes(extra)) {
        r.suitabilityReasons = [extra, ...r.suitabilityReasons].slice(0, 5);
      }
    }

    // Supprimer suggestions obsolètes (pas added / rejected / completed)
    if (opts.force || ranked.length > 0) {
      await prisma.tripActivity.deleteMany({
        where: {
          tripId,
          status: { in: ["suggested", "saved"] },
        },
      });
    }

    if (ranked.length > 0) {
      await prisma.tripActivity.createMany({
        data: ranked.map((r) => rankedToCreateData(tripId, r)),
        skipDuplicates: true,
      });
    }

    await prisma.tripTravelerProfile.update({
      where: { tripId },
      data: { suggestionsGeneratedAt: new Date() },
    });

    await writeAuditLog({
      userId,
      entity: "trip_activities",
      entityId: tripId,
      action: "generate_suggestions",
      newValue: {
        returnedCount: meta.returnedCount,
        provider: meta.provider,
        durationMs: meta.durationMs,
      },
      ipAddress,
    });

    const list = await listTripActivities(userId, tripId);
    const providerFailed = Boolean(meta.errorCode || meta.error);
    return {
      activities: list.activities,
      profile: list.profile,
      meta,
      // « partial » = résultats incomplets, pas un échec total Places
      partial: !providerFailed && meta.returnedCount === 0 && !meta.error,
      providerError: meta.userMessage ?? null,
    };
  } finally {
    await releaseGenerationLock(tripId);
  }
}

export async function previewAddActivityImpact(
  userId: string,
  tripId: string,
  activityId: string,
): Promise<{
  extraDriveKm: number;
  extraDriveMinutes: number;
  visitMinutes: number;
}> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  const activity = await prisma.tripActivity.findFirst({
    where: { id: activityId, tripId },
  });
  if (!activity) {
    throw new AppError("VALIDATION_ERROR", "Activité introuvable", 404);
  }
  const detourKm = activity.detourDistanceKm
    ? Number(activity.detourDistanceKm)
    : 10;
  const detourMin = activity.detourDurationMinutes ?? 15;
  const visit = activity.estimatedVisitMinutes ?? 90;
  void trip;
  return {
    extraDriveKm: detourKm,
    extraDriveMinutes: detourMin,
    visitMinutes: visit,
  };
}

export async function addActivityToTrip(
  userId: string,
  tripId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<{
  activity: TripActivityDto;
  impact: {
    extraDriveKm: number;
    extraDriveMinutes: number;
    visitMinutes: number;
  };
  tripRecalculated: boolean;
  fuelPlanRecalculated: boolean;
}> {
  const { assertTripFeature } =
    await import("@/features/trips/services/access-gate");
  await assertTripFeature(userId, "trip.detours.enabled");

  const startedAt = Date.now();
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);
  const input = parseZod(
    () => addTripActivitySchema.parse(raw),
    "Ajout d'activité invalide",
  );

  const activity = await prisma.tripActivity.findFirst({
    where: { id: input.activityId, tripId },
  });
  if (!activity) {
    throw new AppError("VALIDATION_ERROR", "Activité introuvable", 404);
  }
  if (activity.status === "rejected") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Cette activité est masquée. Restaurez-la d'abord.",
      400,
    );
  }

  const impact = await previewAddActivityImpact(userId, tripId, activity.id);
  const visitMinutes =
    input.estimatedVisitMinutes ??
    activity.estimatedVisitMinutes ??
    impact.visitMinutes;

  if (input.asRouteStop && !input.confirmImpact) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Confirmation de l'impact sur le trajet requise",
      400,
    );
  }

  const routeVersionBefore = trip.route?.waypointsHash ?? null;
  const routeStopCountBefore = trip.stops.length;
  let refuelStopCountBefore = 0;
  let refuelStopCountAfter = 0;
  let routeVersionAfter = routeVersionBefore;
  let routeStopCountAfter = routeStopCountBefore;
  let fuelPlanRecalculated = false;
  let fuelPlanPersisted = false;
  let tripRecalculated = false;
  let linkedStopId: string | null = activity.linkedStopId;
  let createdStopId: string | null = null;

  const addAsRouteStop = Boolean(
    input.asRouteStop && input.placement !== "day",
  );

  try {
    // Les arrêts carburant ne sont pas des TripStop persistés : le « before »
    // n'est pas disponible sans rejouer l'estimation (coût FDE). On journalise
    // surtout l'après-recalcul pour détecter une perte de plan.
    refuelStopCountBefore = -1;

    const plannedStart = input.plannedStartTime ?? null;
    let plannedEnd = input.plannedEndTime ?? null;
    if (plannedStart && !plannedEnd && visitMinutes != null) {
      plannedEnd = new Date(plannedStart.getTime() + visitMinutes * 60_000);
    }

    if (addAsRouteStop) {
      const lat = Number(activity.latitude);
      const lng = Number(activity.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Coordonnées de l'activité indisponibles — impossible d'ajouter l'arrêt",
          400,
        );
      }

      let insertSequence: number | undefined;
      const originLat =
        trip.originLatitude != null ? Number(trip.originLatitude) : NaN;
      const originLng =
        trip.originLongitude != null ? Number(trip.originLongitude) : NaN;
      const destLat =
        trip.destinationLatitude != null
          ? Number(trip.destinationLatitude)
          : NaN;
      const destLng =
        trip.destinationLongitude != null
          ? Number(trip.destinationLongitude)
          : NaN;

      if (
        (input.placement === "outbound" || input.placement === "destination") &&
        Number.isFinite(originLat) &&
        Number.isFinite(destLat)
      ) {
        insertSequence = computeOutboundInsertSequence({
          activity: { lat, lng },
          origin: { lat: originLat, lng: originLng },
          destination: { lat: destLat, lng: destLng },
          existingStops: trip.stops
            .filter((s) => s.latitude != null && s.longitude != null)
            .map((s) => ({
              latitude: Number(s.latitude),
              longitude: Number(s.longitude),
            })),
        });
      }

      const stop = await addStop(
        userId,
        tripId,
        {
          name: activity.name,
          address: activity.address ?? activity.city ?? activity.name,
          latitude: lat,
          longitude: lng,
          stopType: "activity",
          arrivalTime: plannedStart,
          departureTime: plannedEnd,
          ...(insertSequence != null ? { sequence: insertSequence } : {}),
        },
        ipAddress,
      );
      linkedStopId = stop.id;
      createdStopId = stop.id;

      try {
        const optimized = await rebuildTripRouteFromCanonicalData(
          userId,
          tripId,
          ipAddress,
        );
        tripRecalculated = true;
        routeVersionAfter = optimized.route?.waypointsHash ?? null;
        routeStopCountAfter =
          optimized.stops?.length ?? routeStopCountBefore + 1;
      } catch (error) {
        await deleteStop(userId, tripId, stop.id, ipAddress).catch(() => {
          /* rollback best-effort */
        });
        createdStopId = null;
        linkedStopId = activity.linkedStopId;
        throw error instanceof AppError
          ? error
          : new AppError(
              "EXT_002",
              "Impossible de recalculer l'itinéraire après l'ajout de l'activité",
              502,
            );
      }

      try {
        const afterFuel = await estimateTripFuel(
          userId,
          tripId,
          { includeReturnTrip: false },
          ipAddress,
        );
        fuelPlanRecalculated = true;
        fuelPlanPersisted = afterFuel.calculation != null;
        refuelStopCountAfter =
          afterFuel.calculation?.outbound?.refuelStops?.length ?? 0;
      } catch {
        fuelPlanRecalculated = false;
        fuelPlanPersisted = false;
      }
    } else {
      const refreshed = await getOwnedTripOrThrow(userId, tripId);
      routeStopCountAfter = refreshed.stops.length;
      routeVersionAfter = refreshed.route?.waypointsHash ?? null;
    }

    const updated = await prisma.tripActivity.update({
      where: { id: activity.id },
      data: {
        status: "added_to_trip",
        insertPlacement: input.placement,
        plannedDate: input.plannedDate ?? null,
        plannedStartTime: plannedStart,
        plannedEndTime: plannedEnd,
        estimatedVisitMinutes: visitMinutes,
        linkedStopId,
      },
    });

    await writeAuditLog({
      userId,
      entity: "trip_activities",
      entityId: activity.id,
      action: "add_to_trip",
      newValue: {
        placement: input.placement,
        linkedStopId,
        tripRecalculated,
        fuelPlanRecalculated,
        visitMinutes,
      },
      ipAddress,
    });

    logAddActivityOp({
      operation: "add-trip-activity",
      tripId,
      activityId: activity.id,
      addAsRouteStop,
      routeVersionBefore,
      routeVersionAfter,
      routeStopCountBefore,
      routeStopCountAfter,
      refuelStopCountBefore,
      refuelStopCountAfter,
      fuelPlanRecalculated,
      fuelPlanPersisted,
      visitMinutes,
      durationMs: Date.now() - startedAt,
      errorCode: null,
    });

    console.info(
      "[trips]",
      JSON.stringify({
        operation: "recalculate-trip-route-and-fuel",
        tripId,
        routeStopCount: routeStopCountAfter,
        activityRouteStopCount: 1,
        fuelStopCountBefore: refuelStopCountBefore,
        fuelStopCountAfter: refuelStopCountAfter,
        summaryRouteStopCount: routeStopCountAfter,
        summaryFuelStopCount: refuelStopCountAfter,
        fuelPlanStatus: fuelPlanRecalculated
          ? "current"
          : addAsRouteStop
            ? "stale"
            : "current",
        fuelPlanRecalculated,
        routePersisted: tripRecalculated,
        fuelPlanPersisted,
        durationMs: Date.now() - startedAt,
        errorCode: null,
      }),
    );

    return {
      activity: toTripActivityDto(updated),
      impact: { ...impact, visitMinutes },
      tripRecalculated,
      fuelPlanRecalculated,
    };
  } catch (error) {
    if (createdStopId) {
      await deleteStop(userId, tripId, createdStopId, ipAddress).catch(() => {
        /* ignore */
      });
    }
    logAddActivityOp({
      operation: "add-trip-activity",
      tripId,
      activityId: activity.id,
      addAsRouteStop,
      routeVersionBefore,
      routeVersionAfter,
      routeStopCountBefore,
      routeStopCountAfter,
      refuelStopCountBefore,
      refuelStopCountAfter,
      fuelPlanRecalculated,
      fuelPlanPersisted,
      visitMinutes,
      durationMs: Date.now() - startedAt,
      errorCode: error instanceof AppError ? error.code : "ADD_ACTIVITY_FAILED",
    });
    throw error;
  }
}

export async function planTripActivity(
  userId: string,
  tripId: string,
  activityId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<TripActivityDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);
  const input = parseZod(
    () => planTripActivitySchema.parse(raw),
    "Planification invalide",
  );

  const existing = await prisma.tripActivity.findFirst({
    where: { id: activityId, tripId },
  });
  if (!existing) {
    throw new AppError("VALIDATION_ERROR", "Activité introuvable", 404);
  }

  const updated = await prisma.tripActivity.update({
    where: { id: activityId },
    data: {
      plannedDate: input.plannedDate ?? existing.plannedDate,
      plannedStartTime: input.plannedStartTime ?? existing.plannedStartTime,
      plannedEndTime: input.plannedEndTime ?? existing.plannedEndTime,
      estimatedVisitMinutes:
        input.estimatedVisitMinutes ?? existing.estimatedVisitMinutes,
      sequence: input.sequence ?? existing.sequence,
    },
  });

  await writeAuditLog({
    userId,
    entity: "trip_activities",
    entityId: activityId,
    action: "plan",
    ipAddress,
  });

  return toTripActivityDto(updated);
}

/**
 * Étoile : choisir / retirer une suggestion du voyage.
 * suggested → saved ; saved → suggested.
 * Les activités added_to_trip restent choisies (étoile pleine).
 */
export async function toggleStarTripActivity(
  userId: string,
  tripId: string,
  activityId: string,
  ipAddress?: string | null,
): Promise<TripActivityDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const existing = await prisma.tripActivity.findFirst({
    where: { id: activityId, tripId },
  });
  if (!existing) {
    throw new AppError("VALIDATION_ERROR", "Activité introuvable", 404);
  }
  if (existing.status === "rejected") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Restaurez l'activité avant de l'ajouter aux favoris du voyage",
      400,
    );
  }
  if (existing.status === "added_to_trip" || existing.status === "completed") {
    return toTripActivityDto(existing);
  }

  const nextStatus = existing.status === "saved" ? "suggested" : "saved";
  const updated = await prisma.tripActivity.update({
    where: { id: activityId },
    data: { status: nextStatus },
  });

  await writeAuditLog({
    userId,
    entity: "trip_activities",
    entityId: activityId,
    action: nextStatus === "saved" ? "star" : "unstar",
    ipAddress,
  });

  return toTripActivityDto(updated);
}

/** Activités choisies (étoile / ajoutées) pour la page détail voyage. */
export async function listSelectedTripActivities(
  userId: string,
  tripId: string,
): Promise<TripActivityDto[]> {
  await getOwnedTripOrThrow(userId, tripId);
  const rows = await prisma.tripActivity.findMany({
    where: {
      tripId,
      status: { in: ["saved", "added_to_trip", "completed"] },
    },
    orderBy: [{ suitabilityScore: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toTripActivityDto);
}

export async function rejectTripActivity(
  userId: string,
  tripId: string,
  activityId: string,
  raw?: unknown,
  ipAddress?: string | null,
): Promise<TripActivityDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);
  const input = parseZod(
    () => rejectTripActivitySchema.parse(raw ?? {}),
    "Rejet invalide",
  );

  const existing = await prisma.tripActivity.findFirst({
    where: { id: activityId, tripId },
  });
  if (!existing) {
    throw new AppError("VALIDATION_ERROR", "Activité introuvable", 404);
  }
  if (existing.status === "added_to_trip") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Retirez l'activité du voyage avant de la masquer",
      400,
    );
  }

  const updated = await prisma.tripActivity.update({
    where: { id: activityId },
    data: {
      status: "rejected",
      rejectReason: input.reason ?? null,
    },
  });

  await writeAuditLog({
    userId,
    entity: "trip_activities",
    entityId: activityId,
    action: "reject",
    newValue: { reason: input.reason ?? null },
    ipAddress,
  });

  return toTripActivityDto(updated);
}

export async function restoreTripActivity(
  userId: string,
  tripId: string,
  activityId: string,
  ipAddress?: string | null,
): Promise<TripActivityDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const existing = await prisma.tripActivity.findFirst({
    where: { id: activityId, tripId },
  });
  if (!existing) {
    throw new AppError("VALIDATION_ERROR", "Activité introuvable", 404);
  }

  const updated = await prisma.tripActivity.update({
    where: { id: activityId },
    data: { status: "suggested", rejectReason: null },
  });

  await writeAuditLog({
    userId,
    entity: "trip_activities",
    entityId: activityId,
    action: "restore",
    ipAddress,
  });

  return toTripActivityDto(updated);
}

export async function removeActivityFromTrip(
  userId: string,
  tripId: string,
  activityId: string,
  ipAddress?: string | null,
): Promise<{ removed: true }> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  assertWritableStatus(trip.status);

  const existing = await prisma.tripActivity.findFirst({
    where: { id: activityId, tripId },
  });
  if (!existing) {
    throw new AppError("VALIDATION_ERROR", "Activité introuvable", 404);
  }

  if (existing.linkedStopId) {
    try {
      const { deleteStop } = await import("@/features/trips/services/trips");
      await deleteStop(userId, tripId, existing.linkedStopId, ipAddress);
    } catch {
      /* stop peut déjà être supprimé */
    }
  }

  await prisma.tripActivity.update({
    where: { id: activityId },
    data: {
      status: "suggested",
      linkedStopId: null,
      insertPlacement: null,
      plannedDate: null,
      plannedStartTime: null,
      plannedEndTime: null,
    },
  });

  await writeAuditLog({
    userId,
    entity: "trip_activities",
    entityId: activityId,
    action: "remove_from_trip",
    ipAddress,
  });

  return { removed: true };
}
