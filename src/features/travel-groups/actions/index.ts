"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/features/auth/services/session";
import { isAppError } from "@/lib/errors";
import {
  memberCreateSchema,
  petCreateSchema,
  preferencesUpsertSchema,
  travelGroupCreateSchema,
  travelGroupUpdateSchema,
} from "@/features/travel-groups/schemas";
import {
  addMember,
  addPet,
  createTravelGroup,
  deleteMember,
  deletePet,
  deleteTravelGroup,
  setDefaultTravelGroup,
  updateTravelGroup,
  upsertPreferences,
} from "@/features/travel-groups/services";

export type TravelGroupsActionResult =
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

function formBoolean(formData: FormData, key: string): boolean | undefined {
  if (!formData.has(key)) return undefined;
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
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

function revalidateGroupPaths(id?: string) {
  revalidatePath("/dashboard/travel-groups");
  revalidatePath("/dashboard/trips");
  if (id) {
    revalidatePath(`/dashboard/travel-groups/${id}`);
    revalidatePath(`/dashboard/travel-groups/${id}/edit`);
  }
}

export async function createTravelGroupAction(
  _prev: TravelGroupsActionResult | undefined,
  formData: FormData,
): Promise<TravelGroupsActionResult> {
  const parsed = travelGroupCreateSchema.safeParse({
    name: formString(formData, "name"),
    defaultGroup: formBoolean(formData, "defaultGroup") === true,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Groupe invalide",
    };
  }
  try {
    const user = await requireActiveUser();
    const group = await createTravelGroup(user.id, parsed.data);
    revalidateGroupPaths(group.id);
    return { ok: true, message: "Groupe créé.", id: group.id };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Création impossible" };
  }
}

export async function updateTravelGroupAction(
  _prev: TravelGroupsActionResult | undefined,
  formData: FormData,
): Promise<TravelGroupsActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  const parsed = travelGroupUpdateSchema.safeParse({
    name: formString(formData, "name"),
    defaultGroup: formBoolean(formData, "defaultGroup"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Groupe invalide",
    };
  }
  try {
    const user = await requireActiveUser();
    await updateTravelGroup(user.id, id, parsed.data);
    revalidateGroupPaths(id);
    return { ok: true, message: "Groupe mis à jour." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Mise à jour impossible" };
  }
}

export async function deleteTravelGroupAction(
  _prev: TravelGroupsActionResult | undefined,
  formData: FormData,
): Promise<TravelGroupsActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };
  try {
    const user = await requireActiveUser();
    await deleteTravelGroup(user.id, id);
    revalidateGroupPaths(id);
    return { ok: true, message: "Groupe archivé." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Suppression impossible" };
  }
}

export async function setDefaultTravelGroupAction(
  _prev: TravelGroupsActionResult | undefined,
  formData: FormData,
): Promise<TravelGroupsActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };
  try {
    const user = await requireActiveUser();
    await setDefaultTravelGroup(user.id, id);
    revalidateGroupPaths(id);
    return { ok: true, message: "Groupe défini par défaut." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Opération impossible" };
  }
}

export async function addMemberAction(
  _prev: TravelGroupsActionResult | undefined,
  formData: FormData,
): Promise<TravelGroupsActionResult> {
  const groupId = formString(formData, "groupId");
  if (!groupId) return { ok: false, message: "Groupe manquant" };

  const relationship = formNullable(formData, "relationship");
  const mobilityLevel = formNullable(formData, "mobilityLevel");
  const parsed = memberCreateSchema.safeParse({
    firstName: formString(formData, "firstName"),
    birthDate: formNullable(formData, "birthDate"),
    relationship: relationship ?? undefined,
    mobilityLevel: mobilityLevel ?? undefined,
    specialNeeds: formNullable(formData, "specialNeeds"),
    notes: formNullable(formData, "notes"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Membre invalide",
    };
  }
  try {
    const user = await requireActiveUser();
    await addMember(user.id, groupId, parsed.data);
    revalidateGroupPaths(groupId);
    return { ok: true, message: "Membre ajouté." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Ajout impossible" };
  }
}

export async function deleteMemberAction(
  _prev: TravelGroupsActionResult | undefined,
  formData: FormData,
): Promise<TravelGroupsActionResult> {
  const groupId = formString(formData, "groupId");
  const memberId = formString(formData, "memberId");
  if (!groupId || !memberId) {
    return { ok: false, message: "Identifiant manquant" };
  }
  try {
    const user = await requireActiveUser();
    await deleteMember(user.id, groupId, memberId);
    revalidateGroupPaths(groupId);
    return { ok: true, message: "Membre supprimé." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Suppression impossible" };
  }
}

export async function addPetAction(
  _prev: TravelGroupsActionResult | undefined,
  formData: FormData,
): Promise<TravelGroupsActionResult> {
  const groupId = formString(formData, "groupId");
  if (!groupId) return { ok: false, message: "Groupe manquant" };

  const parsed = petCreateSchema.safeParse({
    name: formString(formData, "name"),
    species: formNullable(formData, "species"),
    breed: formNullable(formData, "breed"),
    weightKg: formNumber(formData, "weightKg"),
    notes: formNullable(formData, "notes"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Animal invalide",
    };
  }
  try {
    const user = await requireActiveUser();
    await addPet(user.id, groupId, parsed.data);
    revalidateGroupPaths(groupId);
    return { ok: true, message: "Animal ajouté." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Ajout impossible" };
  }
}

export async function deletePetAction(
  _prev: TravelGroupsActionResult | undefined,
  formData: FormData,
): Promise<TravelGroupsActionResult> {
  const groupId = formString(formData, "groupId");
  const petId = formString(formData, "petId");
  if (!groupId || !petId) {
    return { ok: false, message: "Identifiant manquant" };
  }
  try {
    const user = await requireActiveUser();
    await deletePet(user.id, groupId, petId);
    revalidateGroupPaths(groupId);
    return { ok: true, message: "Animal supprimé." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Suppression impossible" };
  }
}

export async function upsertPreferencesAction(
  _prev: TravelGroupsActionResult | undefined,
  formData: FormData,
): Promise<TravelGroupsActionResult> {
  const groupId = formString(formData, "groupId");
  if (!groupId) return { ok: false, message: "Groupe manquant" };

  const parsed = preferencesUpsertSchema.safeParse({
    maxDriveHours: formNumber(formData, "maxDriveHours"),
    dailyBudget: formNumber(formData, "dailyBudget"),
    preferredCampgroundType: formNullable(formData, "preferredCampgroundType"),
    avoidTolls: formBoolean(formData, "avoidTolls") === true,
    avoidFerries: formBoolean(formData, "avoidFerries") === true,
    preferredActivityTypes: formNullable(formData, "preferredActivityTypes"),
    foodPreferences: formNullable(formData, "foodPreferences"),
    accessibilityRequired:
      formBoolean(formData, "accessibilityRequired") === true,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Préférences invalides",
    };
  }
  try {
    const user = await requireActiveUser();
    await upsertPreferences(user.id, groupId, parsed.data);
    revalidateGroupPaths(groupId);
    return { ok: true, message: "Préférences enregistrées." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Enregistrement impossible" };
  }
}
