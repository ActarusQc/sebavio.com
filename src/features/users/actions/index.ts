"use server";

import { requireActiveUser } from "@/features/auth/services/session";
import {
  updateProfileSchema,
  updatePreferencesSchema,
  changePasswordSchema,
} from "@/features/users/schemas";
import {
  updateProfile,
  updatePreferences,
  changePassword,
  upsertHomeAddress,
  clearHomeAddress,
} from "@/features/users/services";
import { homeAddressSchema } from "@/features/users/schemas/home-address";
import { isAppError } from "@/lib/errors";

export type UsersActionResult =
  { ok: true; message?: string } | { ok: false; message: string };

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

function formBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export async function updateProfileAction(
  _prev: UsersActionResult | undefined,
  formData: FormData,
): Promise<UsersActionResult> {
  const parsed = updateProfileSchema.safeParse({
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    language: formString(formData, "language"),
    country: formString(formData, "country"),
    currency: formString(formData, "currency"),
    timezone: formString(formData, "timezone"),
    travelStyle: formNullable(formData, "travelStyle"),
    budgetLevel: formNullable(formData, "budgetLevel"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Profil invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    await updateProfile(user.id, parsed.data);
    return { ok: true, message: "Profil enregistré." };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Enregistrement impossible" };
  }
}

export async function updatePreferencesAction(
  _prev: UsersActionResult | undefined,
  formData: FormData,
): Promise<UsersActionResult> {
  const parsed = updatePreferencesSchema.safeParse({
    distanceUnit: formString(formData, "distanceUnit"),
    temperatureUnit: formString(formData, "temperatureUnit"),
    fuelUnit: formString(formData, "fuelUnit"),
    notificationsEnabled: formBoolean(formData, "notificationsEnabled"),
    aiProactive: formBoolean(formData, "aiProactive"),
    costcoMember: formBoolean(formData, "costcoMember"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Préférences invalides",
    };
  }

  try {
    const user = await requireActiveUser();
    await updatePreferences(user.id, parsed.data);
    return { ok: true, message: "Préférences enregistrées." };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Enregistrement impossible" };
  }
}

export async function upsertHomeAddressAction(
  _prev: UsersActionResult | undefined,
  formData: FormData,
): Promise<UsersActionResult> {
  const lat = formString(formData, "homeAddressLatitude");
  const lng = formString(formData, "homeAddressLongitude");
  const parsed = homeAddressSchema.safeParse({
    homeAddressLabel: formString(formData, "homeAddressLabel"),
    homeAddressPlaceId: formString(formData, "homeAddressPlaceId"),
    homeAddressLatitude: lat != null ? Number(lat) : Number.NaN,
    homeAddressLongitude: lng != null ? Number(lng) : Number.NaN,
    homeAddressCity: formNullable(formData, "homeAddressCity"),
    homeAddressProvince: formNullable(formData, "homeAddressProvince"),
    homeAddressPostalCode: formNullable(formData, "homeAddressPostalCode"),
    homeAddressCountry: formNullable(formData, "homeAddressCountry"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ??
        "Sélectionnez une adresse valide dans les suggestions.",
    };
  }

  try {
    const user = await requireActiveUser();
    await upsertHomeAddress(user.id, parsed.data);
    return { ok: true, message: "Adresse de domicile enregistrée." };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Enregistrement impossible" };
  }
}

export async function clearHomeAddressAction(
  _prev: UsersActionResult | undefined,
  _formData: FormData,
): Promise<UsersActionResult> {
  void _formData;
  try {
    const user = await requireActiveUser();
    await clearHomeAddress(user.id);
    return { ok: true, message: "Adresse de domicile supprimée." };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Suppression impossible" };
  }
}

export async function changePasswordAction(
  _prev: UsersActionResult | undefined,
  formData: FormData,
): Promise<UsersActionResult> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formString(formData, "currentPassword"),
    newPassword: formString(formData, "newPassword"),
    confirmPassword: formString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Mot de passe invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    await changePassword(user.id, parsed.data);
    return { ok: true, message: "Mot de passe modifié." };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Modification impossible" };
  }
}
