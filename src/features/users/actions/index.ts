"use server";

import { requireActiveUser } from "@/features/auth/services/session";
import {
  updateProfileSchema,
  updatePreferencesSchema,
} from "@/features/users/schemas";
import { updateProfile, updatePreferences } from "@/features/users/services";
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
