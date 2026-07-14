"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/features/auth/services/session";
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from "@/features/notifications/services";

export type NotificationsActionResult =
  { ok: true; message: string } | { ok: false; message: string };

function formBoolean(formData: FormData, name: string): boolean {
  const v = formData.get(name);
  return v === "on" || v === "true" || v === "1";
}

export async function markReadAction(
  _prev: NotificationsActionResult | undefined,
  formData: FormData,
): Promise<NotificationsActionResult> {
  try {
    const user = await requireActiveUser();
    const id = String(formData.get("id") ?? "");
    await markNotificationRead(user.id, id);
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Notification marquée comme lue." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de marquer comme lue.",
    };
  }
}

export async function markAllReadAction(
  _prev: NotificationsActionResult | undefined,
  formData: FormData,
): Promise<NotificationsActionResult> {
  void formData;
  try {
    const user = await requireActiveUser();
    const result = await markAllNotificationsRead(user.id);
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard", "layout");
    return {
      ok: true,
      message:
        result.updated > 0
          ? `${result.updated} notification(s) marquée(s) comme lue(s).`
          : "Aucune notification non lue.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de tout marquer comme lu.",
    };
  }
}

export async function deleteNotificationAction(
  _prev: NotificationsActionResult | undefined,
  formData: FormData,
): Promise<NotificationsActionResult> {
  try {
    const user = await requireActiveUser();
    const id = String(formData.get("id") ?? "");
    await deleteNotification(user.id, id);
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: "Notification supprimée." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de supprimer la notification.",
    };
  }
}

export async function updateNotificationPreferencesAction(
  _prev: NotificationsActionResult | undefined,
  formData: FormData,
): Promise<NotificationsActionResult> {
  try {
    const user = await requireActiveUser();
    await updateNotificationPreferences(user.id, {
      inAppMaintenance: formBoolean(formData, "inAppMaintenance"),
      inAppTrip: formBoolean(formData, "inAppTrip"),
      inAppBudget: formBoolean(formData, "inAppBudget"),
      inAppWeather: formBoolean(formData, "inAppWeather"),
      inAppFuel: formBoolean(formData, "inAppFuel"),
      emailMaintenance: formBoolean(formData, "emailMaintenance"),
      emailTrip: formBoolean(formData, "emailTrip"),
      emailBudget: formBoolean(formData, "emailBudget"),
      emailWeather: formBoolean(formData, "emailWeather"),
      emailFuel: formBoolean(formData, "emailFuel"),
      pushMaintenance: formBoolean(formData, "pushMaintenance"),
      pushTrip: formBoolean(formData, "pushTrip"),
      pushBudget: formBoolean(formData, "pushBudget"),
      pushWeather: formBoolean(formData, "pushWeather"),
      pushFuel: formBoolean(formData, "pushFuel"),
    });
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard/settings");
    return { ok: true, message: "Préférences de notification enregistrées." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Préférences invalides.",
    };
  }
}
