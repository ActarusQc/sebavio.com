"use server";

import { revalidatePath } from "next/cache";
import {
  requireActiveUser,
  requireAdminUser,
} from "@/features/auth/services/session";
import { isAppError } from "@/lib/errors";
import {
  documentCreateSchema,
  historyCreateSchema,
  historyUpdateSchema,
  templateCreateSchema,
} from "@/features/maintenance/schemas";
import {
  addHistoryDocument,
  createHistory,
  createTemplate,
  deleteHistory,
  recalculateVehicleSchedule,
  updateHistory,
} from "@/features/maintenance/services";

export type MaintenanceActionResult =
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

function revalidateMaintenancePaths(historyId?: string, vehicleId?: string) {
  revalidatePath("/dashboard/maintenance");
  revalidatePath("/dashboard/maintenance/calendar");
  revalidatePath("/dashboard/maintenance/history");
  revalidatePath("/dashboard/maintenance/new");
  if (historyId) {
    revalidatePath(`/dashboard/maintenance/${historyId}`);
  }
  if (vehicleId) {
    revalidatePath(`/dashboard/vehicles/${vehicleId}`);
  }
}

export async function createHistoryAction(
  _prev: MaintenanceActionResult | undefined,
  formData: FormData,
): Promise<MaintenanceActionResult> {
  const parsed = historyCreateSchema.safeParse({
    vehicleId: formString(formData, "vehicleId"),
    templateId: formNullable(formData, "templateId"),
    performedDate: formString(formData, "performedDate"),
    performedOdometer: formNumber(formData, "performedOdometer"),
    provider: formNullable(formData, "provider"),
    cost: formNumber(formData, "cost"),
    currency: formNullable(formData, "currency") ?? undefined,
    notes: formNullable(formData, "notes"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  try {
    const user = await requireActiveUser();
    const history = await createHistory(user.id, parsed.data);
    revalidateMaintenancePaths(history.id, history.vehicleId);
    return { ok: true, id: history.id, message: "Entretien enregistré" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Création impossible" };
  }
}

export async function updateHistoryAction(
  historyId: string,
  _prev: MaintenanceActionResult | undefined,
  formData: FormData,
): Promise<MaintenanceActionResult> {
  const parsed = historyUpdateSchema.safeParse({
    templateId: formData.has("templateId")
      ? formNullable(formData, "templateId")
      : undefined,
    performedDate: formData.has("performedDate")
      ? formString(formData, "performedDate")
      : undefined,
    performedOdometer: formData.has("performedOdometer")
      ? formNumber(formData, "performedOdometer")
      : undefined,
    provider: formData.has("provider")
      ? formNullable(formData, "provider")
      : undefined,
    cost: formData.has("cost") ? formNumber(formData, "cost") : undefined,
    currency: formData.has("currency")
      ? formNullable(formData, "currency")
      : undefined,
    notes: formData.has("notes") ? formNullable(formData, "notes") : undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  try {
    const user = await requireActiveUser();
    const history = await updateHistory(user.id, historyId, parsed.data);
    revalidateMaintenancePaths(history.id, history.vehicleId);
    return { ok: true, id: history.id, message: "Entretien mis à jour" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Mise à jour impossible" };
  }
}

export async function deleteHistoryAction(
  historyId: string,
): Promise<MaintenanceActionResult> {
  try {
    const user = await requireActiveUser();
    const existing = await (
      await import("@/features/maintenance/services")
    ).getHistoryById(user.id, historyId);
    await deleteHistory(user.id, historyId);
    revalidateMaintenancePaths(historyId, existing.vehicleId);
    return { ok: true, message: "Entretien supprimé" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Suppression impossible" };
  }
}

export async function addDocumentAction(
  historyId: string,
  _prev: MaintenanceActionResult | undefined,
  formData: FormData,
): Promise<MaintenanceActionResult> {
  const parsed = documentCreateSchema.safeParse({
    documentType: formString(formData, "documentType"),
    fileUrl: formString(formData, "fileUrl"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Document invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    await addHistoryDocument(user.id, historyId, parsed.data);
    revalidateMaintenancePaths(historyId);
    return { ok: true, message: "Document ajouté" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Ajout document impossible" };
  }
}

export async function recalculateAction(
  vehicleId: string,
): Promise<MaintenanceActionResult> {
  try {
    const user = await requireActiveUser();
    await recalculateVehicleSchedule(user.id, vehicleId);
    revalidateMaintenancePaths(undefined, vehicleId);
    return { ok: true, message: "Échéances recalculées" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Recalcul impossible" };
  }
}

export async function createTemplateAction(
  _prev: MaintenanceActionResult | undefined,
  formData: FormData,
): Promise<MaintenanceActionResult> {
  const parsed = templateCreateSchema.safeParse({
    modelId: formString(formData, "modelId"),
    title: formString(formData, "title"),
    category: formString(formData, "category"),
    intervalKm: formNumber(formData, "intervalKm"),
    intervalMonths: formNumber(formData, "intervalMonths"),
    priority: formString(formData, "priority") ?? "normal",
    description: formNullable(formData, "description"),
    manufacturerSource: formNullable(formData, "manufacturerSource"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Gabarit invalide",
    };
  }

  try {
    const admin = await requireAdminUser();
    const template = await createTemplate(parsed.data, admin.id);
    revalidatePath(`/dashboard/catalog/${parsed.data.modelId}`);
    return { ok: true, id: template.id, message: "Gabarit créé" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Création gabarit impossible" };
  }
}
