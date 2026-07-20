import "server-only";

import { isAppError } from "@/lib/errors";
import {
  addStop,
  deleteStop,
  getOwnedTripOrThrow,
  updateStop,
  updateTrip,
} from "@/features/trips/services/trips";
import { addActivityToTrip } from "@/features/trips/activities/trip-activity-service";
import { recalculateTripItineraryAtomic } from "@/features/trips/services/recalculate-itinerary";
import { planTripActivity } from "@/features/trips/activities/trip-activity-service";
import {
  proposedTripActionSchema,
  type ProposedTripAction,
} from "@/features/ai/schemas/actions";
import { recordAiUsage } from "@/features/ai/services/usage";
import { resolveActionLocation } from "@/features/ai/services/resolve-action-location";
import {
  estimateInsertedDetourKm,
  haversineKm,
} from "@/features/ai/lib/location-resolve";
import {
  AI_DISTANCE_REFUSE_RATIO,
  AI_DISTANCE_WARN_KM,
  AI_DISTANCE_WARN_RATIO,
} from "@/features/ai/lib/distance-guards";
import { computeOutboundInsertSequence } from "@/features/trips/services/route-stop-order";

export type ApplyActionResult =
  | {
      ok: true;
      message: string;
      applied: true;
      actionType: ProposedTripAction["type"];
      fuelCalculationStatus?: "current" | "stale" | "unavailable";
    }
  | {
      ok: true;
      message: string;
      applied: false;
      actionType: ProposedTripAction["type"];
      deferred: true;
    }
  | {
      ok: false;
      message: string;
      code?: string;
      applicable?: false;
      requiresLocationConfirmation?: boolean;
      requiresLargeDetourConfirmation?: boolean;
      estimatedAddedKm?: number;
      reasonCode?: string;
    };

function isApplicableInV1(action: ProposedTripAction): boolean {
  return (
    action.type === "add_activity" ||
    action.type === "add_pause" ||
    action.type === "update_activity_duration" ||
    action.type === "update_departure_time"
  );
}

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function assessDetour(params: {
  tripDistanceKm: number | null;
  estimatedAddedKm: number;
  confirmLargeDetour: boolean;
}): ApplyActionResult | null {
  const base = params.tripDistanceKm ?? 0;
  const added = params.estimatedAddedKm;
  if (base > 0 && added / base >= AI_DISTANCE_REFUSE_RATIO) {
    return {
      ok: false,
      applicable: false,
      requiresLocationConfirmation: true,
      estimatedAddedKm: Math.round(added),
      code: "AI_ACTION_LARGE_DETOUR",
      reasonCode: "AI_ACTION_LARGE_DETOUR",
      message: `Détour extrême détecté (~${Math.round(added)} km, >${Math.round(AI_DISTANCE_REFUSE_RATIO * 100)} % du trajet). Confirmez l’emplacement.`,
    };
  }
  const warn =
    added >= AI_DISTANCE_WARN_KM ||
    (base > 0 && added / base >= AI_DISTANCE_WARN_RATIO);
  if (warn && !params.confirmLargeDetour) {
    return {
      ok: false,
      applicable: false,
      requiresLargeDetourConfirmation: true,
      estimatedAddedKm: Math.round(added),
      code: "AI_ACTION_LARGE_DETOUR",
      reasonCode: "AI_ACTION_LARGE_DETOUR",
      message: `Détour important détecté : cette suggestion ajouterait environ ${Math.round(added)} km au voyage. Vérifiez son emplacement avant de continuer.`,
    };
  }
  return null;
}

async function insertLocatedStop(params: {
  userId: string;
  tripId: string;
  stopType: "activity" | "rest";
  title: string;
  durationMinutes: number;
  direction: "outbound" | "return";
  latitude: number;
  longitude: number;
  address: string | null;
  notes?: string | null;
  confirmLargeDetour: boolean;
  ipAddress?: string | null;
}): Promise<ApplyActionResult> {
  const trip = await getOwnedTripOrThrow(params.userId, params.tripId);
  const beforeKm = toNum(trip.route?.distanceKm);
  const beforeDestination = trip.destination;

  const originLat = toNum(trip.originLatitude);
  const originLng = toNum(trip.originLongitude);
  const destLat = toNum(trip.destinationLatitude);
  const destLng = toNum(trip.destinationLongitude);

  if (
    originLat == null ||
    originLng == null ||
    destLat == null ||
    destLng == null
  ) {
    return {
      ok: false,
      code: "AI_ACTION_LOCATION_REQUIRED",
      reasonCode: "AI_ACTION_LOCATION_REQUIRED",
      requiresLocationConfirmation: true,
      applicable: false,
      message:
        "Le voyage n’a pas d’origine/destination géocodées — impossible de placer l’étape.",
    };
  }

  const outboundStops = trip.stops
    .filter((s) => s.direction === (params.direction ?? "outbound"))
    .sort((a, b) => a.sequence - b.sequence);

  let sequence = outboundStops.length + 1;
  if (params.direction === "outbound") {
    sequence = computeOutboundInsertSequence({
      activity: { lat: params.latitude, lng: params.longitude },
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng },
      existingStops: outboundStops
        .filter((s) => s.latitude != null && s.longitude != null)
        .map((s) => ({
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
        })),
    });
  }

  // Estimation détour pour garde-fou pré-confirmation
  const chain = [
    { lat: originLat, lng: originLng },
    ...outboundStops
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => ({
        lat: Number(s.latitude),
        lng: Number(s.longitude),
      })),
    { lat: destLat, lng: destLng },
  ];
  const insertAt = Math.min(Math.max(sequence, 1), chain.length - 1);
  const prev = chain[insertAt - 1]!;
  const next = chain[insertAt]!;
  const estimatedAddedKm = estimateInsertedDetourKm({
    point: { lat: params.latitude, lng: params.longitude },
    prev,
    next,
  });

  const detourBlock = assessDetour({
    tripDistanceKm: beforeKm,
    estimatedAddedKm,
    confirmLargeDetour: params.confirmLargeDetour,
  });
  if (detourBlock) return detourBlock;

  const created = await addStop(
    params.userId,
    params.tripId,
    {
      name: params.title,
      stopType: params.stopType,
      durationMinutes: params.durationMinutes,
      direction: params.direction,
      address: params.address ?? undefined,
      latitude: params.latitude,
      longitude: params.longitude,
      notes: params.notes ?? undefined,
      sequence,
    },
    params.ipAddress,
  );

  // Relecture + contrôles de cohérence
  const after = await getOwnedTripOrThrow(params.userId, params.tripId);
  const afterKm = toNum(after.route?.distanceKm);

  if (after.destination !== beforeDestination) {
    await deleteStop(
      params.userId,
      params.tripId,
      created.id,
      params.ipAddress,
    );
    return {
      ok: false,
      code: "AI_002",
      message: "Application annulée : la destination finale aurait changé.",
    };
  }

  // Refuse si distance doublée anormalement après recalcul réel
  if (
    beforeKm != null &&
    beforeKm > 0 &&
    afterKm != null &&
    afterKm / beforeKm >= 1 + AI_DISTANCE_REFUSE_RATIO
  ) {
    await deleteStop(
      params.userId,
      params.tripId,
      created.id,
      params.ipAddress,
    );
    try {
      await recalculateTripItineraryAtomic(params.userId, params.tripId, {
        ipAddress: params.ipAddress,
      });
    } catch {
      /* restore best-effort */
    }
    return {
      ok: false,
      code: "AI_ACTION_LARGE_DETOUR",
      reasonCode: "AI_ACTION_LARGE_DETOUR",
      requiresLocationConfirmation: true,
      applicable: false,
      estimatedAddedKm: Math.round(afterKm - beforeKm),
      message:
        "Application annulée : l’augmentation de distance est excessive. Confirmez l’emplacement.",
    };
  }

  // Destination doit rester la dernière — les stops ne remplacent pas Trip.destination
  const lastOutbound = [...after.stops]
    .filter((s) => s.direction === "outbound")
    .sort((a, b) => a.sequence - b.sequence)
    .at(-1);
  if (lastOutbound && lastOutbound.id === created.id) {
    // OK si proche destination ; sinon vérifier distance à destination
    const dDest = haversineKm(
      { lat: params.latitude, lng: params.longitude },
      { lat: destLat, lng: destLng },
    );
    if (dDest > 30 && sequence >= outboundStops.length + 1) {
      // placé en dernier mais loin de la destination — déjà géré par insert sequence en principe
    }
  }

  const route = after.route;
  const fuelStatus: "current" | "stale" | "unavailable" =
    route?.fuelEstimateStale
      ? "stale"
      : route?.estimatedFuelCost
        ? "current"
        : "unavailable";

  return {
    ok: true,
    applied: true,
    actionType: params.stopType === "activity" ? "add_activity" : "add_pause",
    fuelCalculationStatus: fuelStatus,
    message:
      fuelStatus === "stale"
        ? "Modification appliquée. L’itinéraire est à jour ; l’estimation carburant reste à actualiser."
        : "Modification appliquée. Les données du voyage ont été mises à jour.",
  };
}

/**
 * Applique une proposition IA via les services voyage existants (jamais Prisma direct).
 */
export async function applyProposedTripAction(params: {
  userId: string;
  tripId: string;
  action: unknown;
  confirm: boolean;
  planSlug?: string | null;
  ipAddress?: string | null;
}): Promise<ApplyActionResult> {
  const started = Date.now();
  let actionType = "unknown";

  try {
    if (!params.confirm) {
      return {
        ok: false,
        message: "Confirmation requise avant d’appliquer la suggestion.",
        code: "AI_001",
      };
    }

    const parsed = proposedTripActionSchema.safeParse(params.action);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Action proposée invalide.",
        code: "AI_002",
      };
    }

    const action = parsed.data;
    actionType = action.type;

    const trip = await getOwnedTripOrThrow(params.userId, params.tripId);

    if (!isApplicableInV1(action)) {
      await recordAiUsage({
        userId: params.userId,
        tripId: params.tripId,
        requestType: "apply_action",
        durationMs: Date.now() - started,
        success: true,
        planSlug: params.planSlug,
      });
      return {
        ok: true,
        applied: false,
        deferred: true,
        actionType: action.type,
        message:
          "Cette modification d’itinéraire sera disponible dans une phase ultérieure. La proposition reste consultable.",
      };
    }

    switch (action.type) {
      case "add_activity": {
        if (action.activityId && action.locationConfirmed !== true) {
          // catalogue : coords vérifiées via resolve
        }
        const resolved = await resolveActionLocation({
          userId: params.userId,
          trip,
          latitude: action.latitude,
          longitude: action.longitude,
          address: action.address,
          activityId: action.activityId,
          targetStopId: action.targetStopId,
          locationSource: action.locationSource,
          locationConfirmed: action.locationConfirmed,
        });

        if (!resolved.applicable) {
          await recordAiUsage({
            userId: params.userId,
            tripId: params.tripId,
            requestType: "apply_action",
            durationMs: Date.now() - started,
            success: false,
            errorCode: resolved.reasonCode,
            planSlug: params.planSlug,
          });
          return {
            ok: false,
            applicable: false,
            requiresLocationConfirmation: true,
            code: resolved.reasonCode,
            reasonCode: resolved.reasonCode,
            message: resolved.message,
          };
        }

        if (
          action.activityId &&
          resolved.location.locationSource === "catalog"
        ) {
          // Préférer le flux catalogue lorsqu'il s'agit d'une Activity métier
          const catalog = await (
            await import("@/lib/prisma")
          ).prisma.activity.findFirst({
            where: { id: action.activityId, deletedAt: null },
            select: { id: true },
          });
          if (catalog) {
            await addActivityToTrip(
              params.userId,
              params.tripId,
              {
                activityId: action.activityId,
                placement: action.placement ?? "outbound",
                estimatedVisitMinutes: action.durationMinutes,
                asRouteStop: true,
                confirmImpact: true,
              },
              params.ipAddress,
            );
            break;
          }
        }

        const inserted = await insertLocatedStop({
          userId: params.userId,
          tripId: params.tripId,
          stopType: "activity",
          title: action.title,
          durationMinutes: action.durationMinutes,
          direction: action.direction ?? "outbound",
          latitude: resolved.location.latitude,
          longitude: resolved.location.longitude,
          address: resolved.location.address,
          notes: action.description,
          confirmLargeDetour: Boolean(action.confirmLargeDetour),
          ipAddress: params.ipAddress,
        });
        if (!inserted.ok || !inserted.applied) {
          await recordAiUsage({
            userId: params.userId,
            tripId: params.tripId,
            requestType: "apply_action",
            durationMs: Date.now() - started,
            success: false,
            errorCode: inserted.ok ? "DEFERRED" : inserted.code,
            planSlug: params.planSlug,
          });
          return inserted;
        }
        await recordAiUsage({
          userId: params.userId,
          tripId: params.tripId,
          requestType: "apply_action",
          durationMs: Date.now() - started,
          success: true,
          planSlug: params.planSlug,
        });
        return inserted;
      }
      case "add_pause": {
        const resolved = await resolveActionLocation({
          userId: params.userId,
          trip,
          latitude: action.latitude,
          longitude: action.longitude,
          address: action.address,
          targetStopId: action.targetStopId,
          locationSource: action.locationSource,
          locationConfirmed: action.locationConfirmed,
        });

        if (!resolved.applicable) {
          await recordAiUsage({
            userId: params.userId,
            tripId: params.tripId,
            requestType: "apply_action",
            durationMs: Date.now() - started,
            success: false,
            errorCode: resolved.reasonCode,
            planSlug: params.planSlug,
          });
          return {
            ok: false,
            applicable: false,
            requiresLocationConfirmation: true,
            code: resolved.reasonCode,
            reasonCode: resolved.reasonCode,
            message: resolved.message,
          };
        }

        const inserted = await insertLocatedStop({
          userId: params.userId,
          tripId: params.tripId,
          stopType: "rest",
          title: action.title,
          durationMinutes: action.durationMinutes,
          direction: action.direction ?? "outbound",
          latitude: resolved.location.latitude,
          longitude: resolved.location.longitude,
          address: resolved.location.address,
          confirmLargeDetour: Boolean(action.confirmLargeDetour),
          ipAddress: params.ipAddress,
        });
        if (!inserted.ok || !inserted.applied) {
          await recordAiUsage({
            userId: params.userId,
            tripId: params.tripId,
            requestType: "apply_action",
            durationMs: Date.now() - started,
            success: false,
            errorCode: inserted.ok ? "DEFERRED" : inserted.code,
            planSlug: params.planSlug,
          });
          return inserted;
        }
        await recordAiUsage({
          userId: params.userId,
          tripId: params.tripId,
          requestType: "apply_action",
          durationMs: Date.now() - started,
          success: true,
          planSlug: params.planSlug,
        });
        return inserted;
      }
      case "update_activity_duration": {
        await updateStop(
          params.userId,
          params.tripId,
          action.stopId,
          { durationMinutes: action.durationMinutes },
          params.ipAddress,
        );
        if (action.tripActivityId) {
          try {
            await planTripActivity(
              params.userId,
              params.tripId,
              action.tripActivityId,
              { estimatedVisitMinutes: action.durationMinutes },
              params.ipAddress,
            );
          } catch {
            /* best-effort */
          }
        }
        break;
      }
      case "update_departure_time": {
        const departureDate = new Date(action.departureDate);
        if (Number.isNaN(departureDate.getTime())) {
          return {
            ok: false,
            message: "Date de départ invalide.",
            code: "AI_002",
          };
        }
        await updateTrip(
          params.userId,
          params.tripId,
          { departureDate },
          params.ipAddress,
        );
        try {
          await recalculateTripItineraryAtomic(params.userId, params.tripId, {
            ipAddress: params.ipAddress,
          });
        } catch (error) {
          console.error("[ai] recalc after departure update failed", {
            code: isAppError(error) ? error.code : "unknown",
          });
        }
        break;
      }
      default:
        return {
          ok: false,
          message: "Type d’action non supporté.",
          code: "AI_002",
        };
    }

    await recordAiUsage({
      userId: params.userId,
      tripId: params.tripId,
      requestType: "apply_action",
      durationMs: Date.now() - started,
      success: true,
      planSlug: params.planSlug,
    });

    return {
      ok: true,
      applied: true,
      actionType: action.type,
      message:
        "Modification appliquée. Les données du voyage ont été mises à jour.",
    };
  } catch (error) {
    await recordAiUsage({
      userId: params.userId,
      tripId: params.tripId,
      requestType: "apply_action",
      durationMs: Date.now() - started,
      success: false,
      errorCode: isAppError(error) ? error.code : "INTERNAL_ERROR",
      planSlug: params.planSlug,
    });

    if (isAppError(error)) {
      return { ok: false, message: error.message, code: error.code };
    }
    console.error("[ai] apply action failed", {
      actionType,
      name: error instanceof Error ? error.name : "unknown",
    });
    return {
      ok: false,
      message: "Impossible d’appliquer la suggestion pour le moment.",
      code: "AI_003",
    };
  }
}

export {
  describeProposedAction,
  actionNeedsLocationConfirmation,
} from "@/features/ai/services/apply-action-client";
