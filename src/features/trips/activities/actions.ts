"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/features/auth/services/session";
import {
  addActivityToTrip,
  generateTripActivitySuggestions,
  rejectTripActivity,
  removeActivityFromTrip,
  restoreTripActivity,
  toggleStarTripActivity,
  upsertTravelerProfile,
} from "@/features/trips/activities/trip-activity-service";
import { isAppError } from "@/lib/errors";

export type ActivityActionResult =
  | { ok: true; message?: string; data?: unknown }
  | { ok: false; message: string; data?: unknown };

function revalidate(tripId: string) {
  revalidatePath(`/dashboard/trips/${tripId}`);
  revalidatePath(`/dashboard/trips/${tripId}/edit`);
  revalidatePath("/dashboard/activities");
}

export async function upsertTravelerProfileAction(
  tripId: string,
  raw: unknown,
): Promise<ActivityActionResult> {
  try {
    const user = await requireActiveUser();
    const profile = await upsertTravelerProfile(user.id, tripId, raw);
    revalidate(tripId);
    return { ok: true, message: "Préférences enregistrées", data: profile };
  } catch (error) {
    return {
      ok: false,
      message: isAppError(error)
        ? error.message
        : "Impossible d'enregistrer le profil",
    };
  }
}

export async function generateSuggestionsAction(
  tripId: string,
  force = false,
): Promise<ActivityActionResult> {
  try {
    const user = await requireActiveUser();
    const result = await generateTripActivitySuggestions(user.id, tripId, {
      force,
    });
    revalidate(tripId);
    const suggested = result.activities.filter(
      (a) => a.status === "suggested",
    ).length;
    if (result.providerError) {
      return {
        ok: false,
        message: result.providerError,
        data: result,
      };
    }
    return {
      ok: true,
      message:
        suggested > 0
          ? "Suggestions actualisées"
          : "Aucune nouvelle suggestion pour le moment",
      data: result,
    };
  } catch (error) {
    return {
      ok: false,
      message: isAppError(error)
        ? error.message
        : "Génération temporairement indisponible",
    };
  }
}

export async function addActivityAction(
  tripId: string,
  raw: unknown,
): Promise<ActivityActionResult> {
  try {
    const user = await requireActiveUser();
    const result = await addActivityToTrip(user.id, tripId, raw);
    revalidate(tripId);
    const parts = ["Activité ajoutée au voyage"];
    if (result.tripRecalculated) parts.push("itinéraire recalculé");
    if (result.fuelPlanRecalculated) parts.push("plan carburant mis à jour");
    if (result.impact.visitMinutes > 0) {
      parts.push(`${result.impact.visitMinutes} min sur place`);
    }
    return {
      ok: true,
      message: parts.join(" — "),
      data: result,
    };
  } catch (error) {
    return {
      ok: false,
      message: isAppError(error)
        ? error.message
        : "Impossible d'ajouter l'activité",
    };
  }
}

export async function toggleStarActivityAction(
  tripId: string,
  activityId: string,
): Promise<ActivityActionResult> {
  try {
    const user = await requireActiveUser();
    const activity = await toggleStarTripActivity(user.id, tripId, activityId);
    revalidate(tripId);
    return {
      ok: true,
      message:
        activity.status === "saved"
          ? "Activité ajoutée à votre voyage"
          : "Activité retirée de la sélection",
      data: activity,
    };
  } catch (error) {
    return {
      ok: false,
      message: isAppError(error)
        ? error.message
        : "Impossible de modifier la sélection",
    };
  }
}

export async function rejectActivityAction(
  tripId: string,
  activityId: string,
  reason?: string,
): Promise<ActivityActionResult> {
  try {
    const user = await requireActiveUser();
    await rejectTripActivity(user.id, tripId, activityId, { reason });
    revalidate(tripId);
    return { ok: true, message: "Suggestion masquée" };
  } catch (error) {
    return {
      ok: false,
      message: isAppError(error) ? error.message : "Impossible de masquer",
    };
  }
}

export async function restoreActivityAction(
  tripId: string,
  activityId: string,
): Promise<ActivityActionResult> {
  try {
    const user = await requireActiveUser();
    await restoreTripActivity(user.id, tripId, activityId);
    revalidate(tripId);
    return { ok: true, message: "Suggestion restaurée" };
  } catch (error) {
    return {
      ok: false,
      message: isAppError(error) ? error.message : "Impossible de restaurer",
    };
  }
}

export async function removeActivityAction(
  tripId: string,
  activityId: string,
): Promise<ActivityActionResult> {
  try {
    const user = await requireActiveUser();
    await removeActivityFromTrip(user.id, tripId, activityId);
    revalidate(tripId);
    return { ok: true, message: "Activité retirée du voyage" };
  } catch (error) {
    return {
      ok: false,
      message: isAppError(error) ? error.message : "Impossible de retirer",
    };
  }
}
