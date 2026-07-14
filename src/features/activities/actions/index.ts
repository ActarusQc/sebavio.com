"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser, requireAdminUser } from "@/features/auth";
import { isAppError } from "@/lib/errors";
import {
  attachActivityToStop,
  addFavorite,
  createActivity,
  deleteActivity,
  detachActivityFromStop,
  removeFavorite,
  updateActivity,
} from "@/features/activities/services";
import {
  activityCreateSchema,
  activityUpdateSchema,
  favoriteCreateSchema,
} from "@/features/activities/schemas";
import { ACTIVITY_SEASONS } from "@/features/activities/constants";

export type ActivitiesActionResult = {
  ok: boolean;
  message: string;
  id?: string;
  distanceWarning?: string | null;
};

function formString(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function formSeasons(formData: FormData): string[] {
  const values = formData.getAll("season");
  return values
    .filter((v): v is string => typeof v === "string")
    .filter((v) => (ACTIVITY_SEASONS as readonly string[]).includes(v));
}

export async function attachActivityAction(
  _prev: ActivitiesActionResult | undefined,
  formData: FormData,
): Promise<ActivitiesActionResult> {
  const tripId = formString(formData, "tripId");
  const stopId = formString(formData, "stopId");
  const activityId = formString(formData, "activityId");
  if (!tripId || !stopId || !activityId) {
    return { ok: false, message: "Paramètres manquants" };
  }

  try {
    const user = await requireActiveUser();
    const result = await attachActivityToStop(
      user.id,
      tripId,
      stopId,
      activityId,
    );
    revalidatePath(`/dashboard/trips/${tripId}`);
    return {
      ok: true,
      message: result.distanceWarning
        ? `Activité ajoutée. ${result.distanceWarning}`
        : "Activité ajoutée à cette étape.",
      id: stopId,
      distanceWarning: result.distanceWarning,
    };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Attachement impossible" };
  }
}

export async function detachActivityAction(
  _prev: ActivitiesActionResult | undefined,
  formData: FormData,
): Promise<ActivitiesActionResult> {
  const tripId = formString(formData, "tripId");
  const stopId = formString(formData, "stopId");
  const activityId = formString(formData, "activityId");
  if (!tripId || !stopId || !activityId) {
    return { ok: false, message: "Paramètres manquants" };
  }

  try {
    const user = await requireActiveUser();
    await detachActivityFromStop(user.id, tripId, stopId, activityId);
    revalidatePath(`/dashboard/trips/${tripId}`);
    return { ok: true, message: "Activité détachée.", id: stopId };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Détachement impossible" };
  }
}

export async function addFavoriteAction(
  _prev: ActivitiesActionResult | undefined,
  formData: FormData,
): Promise<ActivitiesActionResult> {
  const activityId = formString(formData, "activityId");
  const parsed = favoriteCreateSchema.safeParse({ activityId });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Favori invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    const fav = await addFavorite(user.id, parsed.data);
    return { ok: true, message: "Ajouté aux favoris.", id: fav.id };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Ajout favori impossible" };
  }
}

export async function removeFavoriteAction(
  _prev: ActivitiesActionResult | undefined,
  formData: FormData,
): Promise<ActivitiesActionResult> {
  const activityId = formString(formData, "activityId");
  if (!activityId) return { ok: false, message: "Activité manquante" };

  try {
    const user = await requireActiveUser();
    await removeFavorite(user.id, activityId);
    return { ok: true, message: "Retiré des favoris." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Suppression favori impossible" };
  }
}

export async function createActivityAction(
  _prev: ActivitiesActionResult | undefined,
  formData: FormData,
): Promise<ActivitiesActionResult> {
  const raw = {
    name: formString(formData, "name"),
    kind: formString(formData, "kind") ?? "activity",
    category: formString(formData, "category") ?? "autre",
    latitude: formString(formData, "latitude"),
    longitude: formString(formData, "longitude"),
    address: formString(formData, "address"),
    city: formString(formData, "city"),
    region: formString(formData, "region"),
    petFriendly: formData.get("petFriendly") === "on",
    estimatedDurationMin: formString(formData, "estimatedDurationMin"),
    priceIndicative: formString(formData, "priceIndicative"),
    season: formSeasons(formData),
    description: formString(formData, "description"),
    website: formString(formData, "website"),
  };

  const parsed = activityCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Activité invalide",
    };
  }

  try {
    const admin = await requireAdminUser();
    const created = await createActivity(parsed.data, admin.id);
    revalidatePath("/admin/activites");
    return { ok: true, message: "Activité créée.", id: created.id };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Création impossible" };
  }
}

export async function updateActivityAction(
  _prev: ActivitiesActionResult | undefined,
  formData: FormData,
): Promise<ActivitiesActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  const raw = {
    name: formString(formData, "name") ?? undefined,
    kind: formString(formData, "kind") ?? undefined,
    category: formString(formData, "category") ?? undefined,
    latitude: formString(formData, "latitude") ?? undefined,
    longitude: formString(formData, "longitude") ?? undefined,
    address: formString(formData, "address"),
    city: formString(formData, "city"),
    region: formString(formData, "region"),
    petFriendly: formData.get("petFriendly") === "on",
    estimatedDurationMin: formString(formData, "estimatedDurationMin"),
    priceIndicative: formString(formData, "priceIndicative"),
    season: formSeasons(formData),
    description: formString(formData, "description"),
    website: formString(formData, "website"),
  };

  const parsed = activityUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Activité invalide",
    };
  }

  try {
    const admin = await requireAdminUser();
    await updateActivity(id, parsed.data, admin.id);
    revalidatePath("/admin/activites");
    return { ok: true, message: "Activité mise à jour.", id };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Mise à jour impossible" };
  }
}

export async function deleteActivityAction(
  _prev: ActivitiesActionResult | undefined,
  formData: FormData,
): Promise<ActivitiesActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  try {
    const admin = await requireAdminUser();
    await deleteActivity(id, admin.id);
    revalidatePath("/admin/activites");
    return { ok: true, message: "Activité archivée.", id };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Suppression impossible" };
  }
}
