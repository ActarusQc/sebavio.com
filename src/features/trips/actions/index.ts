"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/features/auth/services/session";
import { isAppError } from "@/lib/errors";
import {
  addStop,
  cancelTrip,
  completeTrip,
  createTrip,
  deleteStop,
  deleteTrip,
  geocodeStop,
  recalculateTripItineraryAtomic,
  reorderStops,
  updateStop,
  updateTrip,
} from "@/features/trips/services";
import {
  stopCreateSchema,
  stopReorderSchema,
  stopUpdateSchema,
  tripCreateSchema,
  tripUpdateSchema,
} from "@/features/trips/schemas";
import { parseTravelerJson } from "@/features/trips/activities/parse-traveler-form";
import { upsertTravelerProfile } from "@/features/trips/activities/trip-activity-service";

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

function formTripPlaceFields(formData: FormData) {
  return {
    originPlaceId: formNullable(formData, "originPlaceId"),
    originLatitude: formNumber(formData, "originLatitude"),
    originLongitude: formNumber(formData, "originLongitude"),
    originCity: formNullable(formData, "originCity"),
    originProvince: formNullable(formData, "originProvince"),
    originPostalCode: formNullable(formData, "originPostalCode"),
    originCountry: formNullable(formData, "originCountry"),
    destinationPlaceId: formNullable(formData, "destinationPlaceId"),
    destinationLatitude: formNumber(formData, "destinationLatitude"),
    destinationLongitude: formNumber(formData, "destinationLongitude"),
    destinationCity: formNullable(formData, "destinationCity"),
    destinationProvince: formNullable(formData, "destinationProvince"),
    destinationPostalCode: formNullable(formData, "destinationPostalCode"),
    destinationCountry: formNullable(formData, "destinationCountry"),
  };
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
    travelGroupId: formNullable(formData, "travelGroupId"),
    title: formString(formData, "title"),
    origin: formString(formData, "origin"),
    destination: formString(formData, "destination"),
    ...formTripPlaceFields(formData),
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
    const traveler = parseTravelerJson(formString(formData, "travelerJson"));
    if (traveler) {
      await upsertTravelerProfile(user.id, trip.id, traveler);
    }
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
    travelGroupId: formNullable(formData, "travelGroupId"),
    title: formString(formData, "title"),
    origin: formString(formData, "origin"),
    destination: formString(formData, "destination"),
    ...formTripPlaceFields(formData),
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
    const traveler = parseTravelerJson(formString(formData, "travelerJson"));
    if (traveler) {
      await upsertTravelerProfile(user.id, id, traveler);
    }
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

  const alsoReturnRaw = formString(formData, "alsoAddToReturn");
  const parsed = stopCreateSchema.safeParse({
    name: formString(formData, "name"),
    address: formNullable(formData, "address"),
    latitude: formNumber(formData, "latitude"),
    longitude: formNumber(formData, "longitude"),
    placeId: formNullable(formData, "placeId"),
    stopType: formString(formData, "stopType") ?? "detour",
    direction: formString(formData, "direction") ?? "outbound",
    durationMinutes: formNumber(formData, "durationMinutes") ?? 0,
    notes: formNullable(formData, "notes"),
    sequence: formNumber(formData, "sequence") ?? undefined,
    alsoAddToReturn:
      alsoReturnRaw === "true" ||
      alsoReturnRaw === "1" ||
      alsoReturnRaw === "on",
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
    return {
      ok: true,
      message: "Détour / étape ajouté — itinéraire recalculé.",
      id: stop.id,
    };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Ajout impossible" };
  }
}

export async function updateStopAction(
  _prev: TripsActionResult | undefined,
  formData: FormData,
): Promise<TripsActionResult> {
  const tripId = formString(formData, "tripId");
  const stopId = formString(formData, "stopId");
  if (!tripId || !stopId) {
    return { ok: false, message: "Identifiant manquant" };
  }

  const raw: Record<string, unknown> = {};
  if (formData.has("name")) raw.name = formString(formData, "name");
  if (formData.has("address")) raw.address = formNullable(formData, "address");
  if (formData.has("latitude")) raw.latitude = formNumber(formData, "latitude");
  if (formData.has("longitude"))
    raw.longitude = formNumber(formData, "longitude");
  if (formData.has("placeId")) raw.placeId = formNullable(formData, "placeId");
  if (formData.has("stopType")) raw.stopType = formString(formData, "stopType");
  if (formData.has("direction"))
    raw.direction = formString(formData, "direction");
  if (formData.has("durationMinutes"))
    raw.durationMinutes = formNumber(formData, "durationMinutes");
  if (formData.has("notes")) raw.notes = formNullable(formData, "notes");
  if (formData.has("sequence")) raw.sequence = formNumber(formData, "sequence");

  const parsed = stopUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Étape invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    await updateStop(user.id, tripId, stopId, parsed.data);
    revalidateTripPaths(tripId);
    return { ok: true, message: "Étape mise à jour — itinéraire recalculé." };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Mise à jour impossible" };
  }
}

export async function reorderStopsAction(
  _prev: TripsActionResult | undefined,
  formData: FormData,
): Promise<TripsActionResult> {
  const tripId = formString(formData, "tripId");
  if (!tripId) return { ok: false, message: "Identifiant manquant" };

  let orderedIds: string[] = [];
  try {
    const raw = formString(formData, "orderedIds") ?? "[]";
    orderedIds = JSON.parse(raw) as string[];
  } catch {
    return { ok: false, message: "Ordre invalide" };
  }

  const parsed = stopReorderSchema.safeParse({
    direction: formString(formData, "direction") ?? "outbound",
    orderedIds,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Réordonnancement invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    await reorderStops(
      user.id,
      tripId,
      parsed.data.direction,
      parsed.data.orderedIds,
    );
    revalidateTripPaths(tripId);
    return { ok: true, message: "Ordre mis à jour — itinéraire recalculé." };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Réordonnancement impossible" };
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
    return { ok: true, message: "Étape supprimée — itinéraire recalculé." };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Suppression impossible" };
  }
}

export async function geocodeStopAction(
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
    await geocodeStop(user.id, tripId, stopId);
    revalidateTripPaths(tripId);
    return { ok: true, message: "Étape géocodée." };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Géocodage impossible" };
  }
}

export async function optimizeTripAction(
  _prev: TripsActionResult | undefined,
  formData: FormData,
): Promise<TripsActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  try {
    const user = await requireActiveUser();
    const startedAt = Date.now();
    const result = await recalculateTripItineraryAtomic(user.id, id);

    console.info(
      "[trips]",
      JSON.stringify({
        operation: "recalculate-trip-route-and-fuel",
        tripId: id,
        fuelStopCountAfter: result.fuelStopCount,
        fuelPlanStatus: result.fuelRecalculated ? "current" : "failed",
        fuelPlanRecalculated: result.fuelRecalculated,
        fuelPlanPersisted: result.fuelRecalculated,
        routePersisted: true,
        durationMs: Date.now() - startedAt,
        errorCode: null,
      }),
    );

    revalidateTripPaths(id);
    return {
      ok: true,
      message: "Itinéraire, carburant et arrêts recalculés.",
      id,
    };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Recalcul impossible" };
  }
}
