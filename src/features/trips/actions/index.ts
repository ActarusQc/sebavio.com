"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/features/auth/services/session";
import { isAppError } from "@/lib/errors";
import {
  stopCreateSchema,
  tripCreateSchema,
  tripUpdateSchema,
} from "@/features/trips/schemas";
import {
  addStop,
  cancelTrip,
  completeTrip,
  createTrip,
  deleteStop,
  deleteTrip,
  updateTrip,
} from "@/features/trips/services";

export type TripsActionResult =
  { ok: true; message?: string; id?: string } | { ok: false; message: string };

function formString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (value === null || value === undefined) return undefined;
  return String(value);
}

function formNullable(
  formData: FormData,
  key: string,
): string | null | undefined {
  if (!formData.has(key)) return undefined;
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

function formNumber(
  formData: FormData,
  key: string,
): number | null | undefined {
  if (!formData.has(key)) return undefined;
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : Number.NaN;
}

function revalidateTripPaths(id?: string) {
  revalidatePath("/dashboard/trips");
  if (id) {
    revalidatePath(`/dashboard/trips/${id}`);
    revalidatePath(`/dashboard/trips/${id}/edit`);
  }
}

export async function createTripAction(
  _prev: TripsActionResult | undefined,
  formData: FormData,
): Promise<TripsActionResult> {
  const parsed = tripCreateSchema.safeParse({
    vehicleId: formString(formData, "vehicleId"),
    title: formString(formData, "title"),
    origin: formString(formData, "origin"),
    destination: formString(formData, "destination"),
    departureDate: formString(formData, "departureDate"),
    returnDate: formNullable(formData, "returnDate"),
    plannedBudget: formNumber(formData, "plannedBudget"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Voyage invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    const trip = await createTrip(user.id, parsed.data);
    revalidateTripPaths(trip.id);
    return { ok: true, message: "Voyage créé.", id: trip.id };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Création impossible" };
  }
}

export async function updateTripAction(
  _prev: TripsActionResult | undefined,
  formData: FormData,
): Promise<TripsActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  const statusRaw = formNullable(formData, "status");
  const parsed = tripUpdateSchema.safeParse({
    vehicleId: formString(formData, "vehicleId"),
    title: formString(formData, "title"),
    origin: formString(formData, "origin"),
    destination: formString(formData, "destination"),
    departureDate: formString(formData, "departureDate"),
    returnDate: formNullable(formData, "returnDate"),
    plannedBudget: formNumber(formData, "plannedBudget"),
    status:
      statusRaw === "planned" || statusRaw === "in_progress"
        ? statusRaw
        : undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Voyage invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    await updateTrip(user.id, id, parsed.data);
    revalidateTripPaths(id);
    return { ok: true, message: "Voyage mis à jour.", id };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Mise à jour impossible" };
  }
}

export async function deleteTripAction(
  _prev: TripsActionResult | undefined,
  formData: FormData,
): Promise<TripsActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  try {
    const user = await requireActiveUser();
    await deleteTrip(user.id, id);
    revalidateTripPaths(id);
    return { ok: true, message: "Voyage supprimé." };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Suppression impossible" };
  }
}

export async function completeTripAction(
  _prev: TripsActionResult | undefined,
  formData: FormData,
): Promise<TripsActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  try {
    const user = await requireActiveUser();
    await completeTrip(user.id, id);
    revalidateTripPaths(id);
    return { ok: true, message: "Voyage clôturé.", id };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Clôture impossible" };
  }
}

export async function cancelTripAction(
  _prev: TripsActionResult | undefined,
  formData: FormData,
): Promise<TripsActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  try {
    const user = await requireActiveUser();
    await cancelTrip(user.id, id);
    revalidateTripPaths(id);
    return { ok: true, message: "Voyage annulé.", id };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Annulation impossible" };
  }
}

export async function startTripAction(
  _prev: TripsActionResult | undefined,
  formData: FormData,
): Promise<TripsActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  try {
    const user = await requireActiveUser();
    await updateTrip(user.id, id, { status: "in_progress" });
    revalidateTripPaths(id);
    return { ok: true, message: "Voyage démarré.", id };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Démarrage impossible" };
  }
}

export async function addStopAction(
  _prev: TripsActionResult | undefined,
  formData: FormData,
): Promise<TripsActionResult> {
  const tripId = formString(formData, "tripId");
  if (!tripId) return { ok: false, message: "Identifiant manquant" };

  const parsed = stopCreateSchema.safeParse({
    name: formString(formData, "name"),
    address: formNullable(formData, "address"),
    stopType: formString(formData, "stopType") ?? "stop",
    arrivalTime: formNullable(formData, "arrivalTime"),
    departureTime: formNullable(formData, "departureTime"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Étape invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    const stop = await addStop(user.id, tripId, parsed.data);
    revalidateTripPaths(tripId);
    return { ok: true, message: "Étape ajoutée.", id: stop.id };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Ajout impossible" };
  }
}

export async function deleteStopAction(
  _prev: TripsActionResult | undefined,
  formData: FormData,
): Promise<TripsActionResult> {
  const tripId = formString(formData, "tripId");
  const stopId = formString(formData, "stopId");
  if (!tripId || !stopId) {
    return { ok: false, message: "Identifiant manquant" };
  }

  try {
    const user = await requireActiveUser();
    await deleteStop(user.id, tripId, stopId);
    revalidateTripPaths(tripId);
    return { ok: true, message: "Étape supprimée." };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Suppression impossible" };
  }
}
