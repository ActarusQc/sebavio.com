"use server";

import { revalidatePath } from "next/cache";
import {
  requireActiveUser,
  requireAdminUser,
} from "@/features/auth/services/session";
import { isAppError } from "@/lib/errors";
import {
  manufacturerCreateSchema,
  manufacturerUpdateSchema,
  vehicleModelCreateSchema,
  vehicleModelUpdateSchema,
} from "@/features/vehicle-catalog/schemas";
import {
  createManufacturer,
  createModel,
  importCatalog,
  updateManufacturer,
  updateModel,
} from "@/features/vehicle-catalog/services";
import type { CatalogImportReport } from "@/features/vehicle-catalog/types";
import { IMPORT_MAX_BYTES } from "@/features/vehicle-catalog/constants";

export type CatalogActionResult =
  | { ok: true; message?: string; importReport?: CatalogImportReport }
  | { ok: false; message: string };

function formString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (value === null || value === undefined) return undefined;
  return String(value);
}

function formOptionalNumber(
  formData: FormData,
  key: string,
): number | null | undefined {
  if (!formData.has(key)) return undefined;
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : Number.NaN;
}

function formBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export async function createManufacturerAction(
  _prev: CatalogActionResult | undefined,
  formData: FormData,
): Promise<CatalogActionResult> {
  const parsed = manufacturerCreateSchema.safeParse({
    name: formString(formData, "name"),
    countryCode: formString(formData, "countryCode") || null,
    website: formString(formData, "website") || null,
    supportUrl: formString(formData, "supportUrl") || null,
    logoUrl: formString(formData, "logoUrl") || null,
    active: formBoolean(formData, "active"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Constructeur invalide",
    };
  }

  try {
    const admin = await requireAdminUser();
    await createManufacturer(parsed.data, admin.id);
    revalidatePath("/dashboard/catalog");
    return { ok: true, message: "Constructeur créé." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Création impossible" };
  }
}

export async function updateManufacturerAction(
  _prev: CatalogActionResult | undefined,
  formData: FormData,
): Promise<CatalogActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  const parsed = manufacturerUpdateSchema.safeParse({
    name: formString(formData, "name"),
    countryCode: formString(formData, "countryCode") || null,
    website: formString(formData, "website") || null,
    supportUrl: formString(formData, "supportUrl") || null,
    logoUrl: formString(formData, "logoUrl") || null,
    active: formBoolean(formData, "active"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Constructeur invalide",
    };
  }

  try {
    const admin = await requireAdminUser();
    await updateManufacturer(id, parsed.data, admin.id);
    revalidatePath("/dashboard/catalog");
    return { ok: true, message: "Constructeur mis à jour." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Mise à jour impossible" };
  }
}

function modelPayloadFromForm(formData: FormData) {
  return {
    manufacturerId: formString(formData, "manufacturerId"),
    category: formString(formData, "category"),
    modelName: formString(formData, "modelName"),
    trim: formString(formData, "trim") ?? "",
    year: formOptionalNumber(formData, "year"),
    engine: formString(formData, "engine") || null,
    transmission: formString(formData, "transmission") || null,
    driveType: formString(formData, "driveType") || null,
    fuelType: formString(formData, "fuelType") || null,
    fuelCapacityL: formOptionalNumber(formData, "fuelCapacityL"),
    avgConsumption: formOptionalNumber(formData, "avgConsumption"),
    lengthM: formOptionalNumber(formData, "lengthM"),
    widthM: formOptionalNumber(formData, "widthM"),
    heightM: formOptionalNumber(formData, "heightM"),
    gvwrKg: formOptionalNumber(formData, "gvwrKg"),
    sleepingCapacity: formOptionalNumber(formData, "sleepingCapacity"),
    freshWaterL: formOptionalNumber(formData, "freshWaterL"),
    greyWaterL: formOptionalNumber(formData, "greyWaterL"),
    blackWaterL: formOptionalNumber(formData, "blackWaterL"),
  };
}

export async function createModelAction(
  _prev: CatalogActionResult | undefined,
  formData: FormData,
): Promise<CatalogActionResult> {
  const parsed = vehicleModelCreateSchema.safeParse(
    modelPayloadFromForm(formData),
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Modèle invalide",
    };
  }

  try {
    const admin = await requireAdminUser();
    await createModel(parsed.data, admin.id);
    revalidatePath("/dashboard/catalog");
    return { ok: true, message: "Modèle créé." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Création impossible" };
  }
}

export async function updateModelAction(
  _prev: CatalogActionResult | undefined,
  formData: FormData,
): Promise<CatalogActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  const parsed = vehicleModelUpdateSchema.safeParse(
    modelPayloadFromForm(formData),
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Modèle invalide",
    };
  }

  try {
    const admin = await requireAdminUser();
    await updateModel(id, parsed.data, admin.id);
    revalidatePath("/dashboard/catalog");
    revalidatePath(`/dashboard/catalog/${id}`);
    return { ok: true, message: "Modèle mis à jour." };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Mise à jour impossible" };
  }
}

export async function importCatalogAction(
  _prev: CatalogActionResult | undefined,
  formData: FormData,
): Promise<CatalogActionResult> {
  const raw = formString(formData, "payload");
  if (!raw) return { ok: false, message: "Payload JSON requis" };

  if (raw.length > IMPORT_MAX_BYTES) {
    return {
      ok: false,
      message: `Fichier trop volumineux (max ${IMPORT_MAX_BYTES} octets)`,
    };
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { ok: false, message: "JSON invalide" };
  }

  try {
    const admin = await requireAdminUser();
    const report = await importCatalog(body, admin.id, null, raw.length);
    revalidatePath("/dashboard/catalog");
    return {
      ok: true,
      message: `Import terminé : ${report.totals.acceptedLines} acceptée(s), ${report.totals.rejectedLines} rejetée(s).`,
      importReport: report,
    };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Import impossible" };
  }
}

/** Garde session pour pages catalogue (lecture). */
export async function ensureCatalogReader() {
  return requireActiveUser();
}
