"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser, requireAdminUser } from "@/features/auth";
import { isAppError } from "@/lib/errors";
import {
  attachCampgroundToStop,
  addFavorite,
  createCampground,
  deleteCampground,
  removeFavorite,
  updateCampground,
} from "@/features/campings/services";
import {
  campgroundCreateSchema,
  campgroundUpdateSchema,
  favoriteCreateSchema,
} from "@/features/campings/schemas";

export type CampingsActionResult = {
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

export async function attachCampgroundAction(
  _prev: CampingsActionResult | undefined,
  formData: FormData,
): Promise<CampingsActionResult> {
  const tripId = formString(formData, "tripId");
  const stopId = formString(formData, "stopId");
  const campgroundId = formString(formData, "campgroundId");
  if (!tripId || !stopId || !campgroundId) {
    return { ok: false, message: "Paramètres manquants" };
  }

  try {
    const user = await requireActiveUser();
    const result = await attachCampgroundToStop(
      user.id,
      tripId,
      stopId,
      campgroundId,
    );
    revalidatePath(`/dashboard/trips/${tripId}`);
    return {
      ok: true,
      message: result.distanceWarning
        ? `Camping planifié. ${result.distanceWarning}`
        : "Camping planifié pour cette étape.",
      id: stopId,
      distanceWarning: result.distanceWarning,
    };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Attachement impossible" };
  }
}

export async function detachCampgroundAction(
  _prev: CampingsActionResult | undefined,
  formData: FormData,
): Promise<CampingsActionResult> {
  const tripId = formString(formData, "tripId");
  const stopId = formString(formData, "stopId");
  if (!tripId || !stopId) {
    return { ok: false, message: "Paramètres manquants" };
  }

  try {
    const user = await requireActiveUser();
    await attachCampgroundToStop(user.id, tripId, stopId, null);
    revalidatePath(`/dashboard/trips/${tripId}`);
    return { ok: true, message: "Camping détaché.", id: stopId };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Détachement impossible" };
  }
}

export async function addFavoriteAction(
  _prev: CampingsActionResult | undefined,
  formData: FormData,
): Promise<CampingsActionResult> {
  const campgroundId = formString(formData, "campgroundId");
  const parsed = favoriteCreateSchema.safeParse({ campgroundId });
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
  _prev: CampingsActionResult | undefined,
  formData: FormData,
): Promise<CampingsActionResult> {
  const campgroundId = formString(formData, "campgroundId");
  if (!campgroundId) return { ok: false, message: "Camping manquant" };

  try {
    const user = await requireActiveUser();
    await removeFavorite(user.id, campgroundId);
    return { ok: true, message: "Retiré des favoris." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Suppression favori impossible" };
  }
}

export async function createCampgroundAction(
  _prev: CampingsActionResult | undefined,
  formData: FormData,
): Promise<CampingsActionResult> {
  const raw = {
    name: formString(formData, "name"),
    latitude: formString(formData, "latitude"),
    longitude: formString(formData, "longitude"),
    address: formString(formData, "address"),
    city: formString(formData, "city"),
    region: formString(formData, "region"),
    campgroundType: formString(formData, "campgroundType") ?? "campground",
    maxLengthM: formString(formData, "maxLengthM"),
    petFriendly: formData.get("petFriendly") === "on",
    priceMin: formString(formData, "priceMin"),
    priceMax: formString(formData, "priceMax"),
    reservationUrl: formString(formData, "reservationUrl"),
  };

  const parsed = campgroundCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Camping invalide",
    };
  }

  try {
    const admin = await requireAdminUser();
    const created = await createCampground(parsed.data, admin.id);
    revalidatePath("/admin/campings");
    return { ok: true, message: "Camping créé.", id: created.id };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Création impossible" };
  }
}

export async function updateCampgroundAction(
  _prev: CampingsActionResult | undefined,
  formData: FormData,
): Promise<CampingsActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  const raw = {
    name: formString(formData, "name") ?? undefined,
    latitude: formString(formData, "latitude") ?? undefined,
    longitude: formString(formData, "longitude") ?? undefined,
    address: formString(formData, "address"),
    city: formString(formData, "city"),
    region: formString(formData, "region"),
    campgroundType: formString(formData, "campgroundType") ?? undefined,
    maxLengthM: formString(formData, "maxLengthM"),
    petFriendly: formData.get("petFriendly") === "on",
    priceMin: formString(formData, "priceMin"),
    priceMax: formString(formData, "priceMax"),
    reservationUrl: formString(formData, "reservationUrl"),
  };

  const parsed = campgroundUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Camping invalide",
    };
  }

  try {
    const admin = await requireAdminUser();
    await updateCampground(id, parsed.data, admin.id);
    revalidatePath("/admin/campings");
    return { ok: true, message: "Camping mis à jour.", id };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Mise à jour impossible" };
  }
}

export async function deleteCampgroundAction(
  _prev: CampingsActionResult | undefined,
  formData: FormData,
): Promise<CampingsActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  try {
    const admin = await requireAdminUser();
    await deleteCampground(id, admin.id);
    revalidatePath("/admin/campings");
    return { ok: true, message: "Camping archivé.", id };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Suppression impossible" };
  }
}
