import "server-only";

import { isAppError } from "@/lib/errors";
import { getOwnedTripOrThrow } from "@/features/trips/services/trips";
import {
  addStop,
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

export type ApplyActionResult =
  | {
      ok: true;
      message: string;
      applied: true;
      actionType: ProposedTripAction["type"];
    }
  | {
      ok: true;
      message: string;
      applied: false;
      actionType: ProposedTripAction["type"];
      deferred: true;
    }
  | { ok: false; message: string; code?: string };

function isApplicableInV1(action: ProposedTripAction): boolean {
  return (
    action.type === "add_activity" ||
    action.type === "add_pause" ||
    action.type === "update_activity_duration" ||
    action.type === "update_departure_time"
  );
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

    await getOwnedTripOrThrow(params.userId, params.tripId);

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
        if (action.activityId) {
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
        } else {
          await addStop(
            params.userId,
            params.tripId,
            {
              name: action.title,
              stopType: "activity",
              durationMinutes: action.durationMinutes,
              direction: action.direction ?? "outbound",
              address: action.address ?? undefined,
              latitude: action.latitude ?? undefined,
              longitude: action.longitude ?? undefined,
              notes: action.description ?? undefined,
            },
            params.ipAddress,
          );
        }
        break;
      }
      case "add_pause": {
        await addStop(
          params.userId,
          params.tripId,
          {
            name: action.title,
            stopType: "rest",
            durationMinutes: action.durationMinutes,
            direction: action.direction ?? "outbound",
            address: action.address ?? undefined,
            latitude: action.latitude ?? undefined,
            longitude: action.longitude ?? undefined,
          },
          params.ipAddress,
        );
        break;
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
            // Sync best-effort — updateStop est la source d’itinéraire
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

export { describeProposedAction } from "@/features/ai/services/apply-action-client";
