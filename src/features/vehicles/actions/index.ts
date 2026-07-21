"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/features/auth/services/session";
import { isAppError } from "@/lib/errors";
import {
  vehicleCreateSchema,
  vehicleDocumentCreateSchema,
  vehiclePhotoCreateSchema,
  vehicleUpdateSchema,
  odometerUpdateSchema,
} from "@/features/vehicles/schemas";
import {
  addVehicleDocument,
  addVehiclePhoto,
  createVehicle,
  deleteVehicle,
  setPrimaryVehicle,
  updateOdometer,
  updateVehicle,
} from "@/features/vehicles/services";

export type VehiclesActionResult =
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
  if (formData.get(`${key}__reset`) === "1") return null;
  if (!formData.has(key)) return undefined;
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return null;
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : Number.NaN;
}

/** Override numérique : ignore si égal à la suggestion (évite de marquer comme custom). */
function formOverrideNumber(
  formData: FormData,
  key: string,
  suggestedKey?: string,
): number | null | undefined {
  if (formData.get(`${key}__reset`) === "1") return null;
  if (!formData.has(key)) return undefined;
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return null;
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return Number.NaN;
  if (suggestedKey && formData.has(suggestedKey)) {
    const suggestedRaw = String(formData.get(suggestedKey) ?? "").trim();
    const suggested = Number(suggestedRaw.replace(/\s/g, "").replace(",", "."));
    if (Number.isFinite(suggested) && Math.abs(n - suggested) < 0.001) {
      // Identique à la suggestion → pas d'override (sauf si déjà custom côté UI via __keep)
      if (formData.get(`${key}__keep`) !== "1") return undefined;
    }
  }
  return Math.round(n * 100) / 100;
}

function buildSpecOverridesFromForm(formData: FormData) {
  const keys = [
    ["lengthM", "specLengthM"],
    ["widthM", "specWidthM"],
    ["heightM", "specHeightM"],
    ["weightKg", "specWeightKg"],
    ["electricRangeKm", "specElectricRangeKm"],
    ["batteryCapacityKwh", "specBatteryCapacityKwh"],
  ] as const;
  const out: Record<string, number | null> = {};
  let any = false;
  for (const [outKey, formKey] of keys) {
    if (!formData.has(formKey) && formData.get(`${formKey}__reset`) !== "1") {
      continue;
    }
    any = true;
    out[outKey] = formNumber(formData, formKey) ?? null;
  }
  return any ? out : undefined;
}

function revalidateVehiclePaths(id?: string) {
  revalidatePath("/dashboard/vehicles");
  revalidatePath("/dashboard/trips");
  if (id) {
    revalidatePath(`/dashboard/vehicles/${id}`);
    revalidatePath(`/dashboard/vehicles/${id}/edit`);
  }
}

export async function createVehicleAction(
  _prev: VehiclesActionResult | undefined,
  formData: FormData,
): Promise<VehiclesActionResult> {
  const isManual = formBoolean(formData, "isManualEntry") === true;
  const catalogEntryId = formNullable(formData, "catalogEntryId");
  const parsed = vehicleCreateSchema.safeParse({
    modelId:
      isManual || catalogEntryId ? null : formNullable(formData, "modelId"),
    catalogEntryId: isManual ? null : catalogEntryId,
    isManualEntry: isManual,
    manualManufacturerName: formNullable(formData, "manualManufacturerName"),
    manualModelName: formNullable(formData, "manualModelName"),
    manualYear: formNumber(formData, "manualYear"),
    manualCategory: formNullable(formData, "manualCategory"),
    manualTrim: formNullable(formData, "manualTrim"),
    fuelType: formNullable(formData, "fuelType"),
    officialCityConsumptionL100: formNumber(
      formData,
      "officialCityConsumptionL100",
    ),
    officialHighwayConsumptionL100: formNumber(
      formData,
      "officialHighwayConsumptionL100",
    ),
    officialCombinedConsumptionL100: formNumber(
      formData,
      "officialCombinedConsumptionL100",
    ),
    consumptionDataSource: formNullable(formData, "consumptionDataSource"),
    nickname: formNullable(formData, "nickname"),
    vin: formNullable(formData, "vin"),
    licensePlate: formNullable(formData, "licensePlate"),
    purchaseDate: formNullable(formData, "purchaseDate"),
    purchasePrice: formNumber(formData, "purchasePrice"),
    currentOdometer: formNumber(formData, "currentOdometer"),
    customConsumptionL100: formOverrideNumber(
      formData,
      "customConsumptionL100",
      "manufacturerConsumptionHint",
    ),
    tankCapacityOverride: formOverrideNumber(
      formData,
      "tankCapacityOverride",
      "manufacturerTankCapacityL",
    ),
    manufacturerTankCapacityL: formNumber(
      formData,
      "manufacturerTankCapacityL",
    ),
    customFuelType: formNullable(formData, "customFuelType"),
    manufacturerFuelType: formNullable(formData, "manufacturerFuelType"),
    engine: formNullable(formData, "engine"),
    resetAllManufacturerSpecs:
      formBoolean(formData, "resetAllManufacturerSpecs") === true
        ? true
        : undefined,
    specOverrides: buildSpecOverridesFromForm(formData),
    primaryVehicle: formBoolean(formData, "primaryVehicle") === true,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Véhicule invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    const vehicle = await createVehicle(user.id, parsed.data);
    revalidateVehiclePaths(vehicle.id);
    return { ok: true, message: "Véhicule créé.", id: vehicle.id };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Création impossible" };
  }
}

export async function updateVehicleAction(
  _prev: VehiclesActionResult | undefined,
  formData: FormData,
): Promise<VehiclesActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  const isManual = formBoolean(formData, "isManualEntry") === true;
  const linkModelId = formNullable(formData, "modelId");
  const catalogEntryId = formNullable(formData, "catalogEntryId");

  const parsed = vehicleUpdateSchema.safeParse({
    modelId: isManual ? null : linkModelId,
    catalogEntryId: isManual ? null : catalogEntryId,
    isManualEntry: isManual,
    manualManufacturerName: formNullable(formData, "manualManufacturerName"),
    manualModelName: formNullable(formData, "manualModelName"),
    manualYear: formNumber(formData, "manualYear"),
    manualCategory: formNullable(formData, "manualCategory"),
    manualTrim: formNullable(formData, "manualTrim"),
    fuelType: formNullable(formData, "fuelType"),
    officialCityConsumptionL100: formNumber(
      formData,
      "officialCityConsumptionL100",
    ),
    officialHighwayConsumptionL100: formNumber(
      formData,
      "officialHighwayConsumptionL100",
    ),
    officialCombinedConsumptionL100: formNumber(
      formData,
      "officialCombinedConsumptionL100",
    ),
    consumptionDataSource: formNullable(formData, "consumptionDataSource"),
    nickname: formNullable(formData, "nickname"),
    vin: formNullable(formData, "vin"),
    licensePlate: formNullable(formData, "licensePlate"),
    purchaseDate: formNullable(formData, "purchaseDate"),
    purchasePrice: formNumber(formData, "purchasePrice"),
    currentOdometer: formNumber(formData, "currentOdometer") ?? undefined,
    customConsumptionL100: formOverrideNumber(
      formData,
      "customConsumptionL100",
      "manufacturerConsumptionHint",
    ),
    tankCapacityOverride: formOverrideNumber(
      formData,
      "tankCapacityOverride",
      "manufacturerTankCapacityL",
    ),
    manufacturerTankCapacityL: formNumber(
      formData,
      "manufacturerTankCapacityL",
    ),
    customFuelType: formNullable(formData, "customFuelType"),
    manufacturerFuelType: formNullable(formData, "manufacturerFuelType"),
    engine: formNullable(formData, "engine"),
    resetAllManufacturerSpecs:
      formBoolean(formData, "resetAllManufacturerSpecs") === true
        ? true
        : undefined,
    specOverrides: buildSpecOverridesFromForm(formData),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Véhicule invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    await updateVehicle(user.id, id, parsed.data);
    revalidateVehiclePaths(id);
    return { ok: true, message: "Véhicule mis à jour.", id };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Mise à jour impossible" };
  }
}

export async function deleteVehicleAction(
  _prev: VehiclesActionResult | undefined,
  formData: FormData,
): Promise<VehiclesActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  try {
    const user = await requireActiveUser();
    await deleteVehicle(user.id, id);
    revalidateVehiclePaths(id);
    return { ok: true, message: "Véhicule supprimé." };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Suppression impossible" };
  }
}

export async function setPrimaryVehicleAction(
  _prev: VehiclesActionResult | undefined,
  formData: FormData,
): Promise<VehiclesActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  try {
    const user = await requireActiveUser();
    await setPrimaryVehicle(user.id, id);
    revalidateVehiclePaths(id);
    return { ok: true, message: "Véhicule principal défini.", id };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Action impossible" };
  }
}

export async function updateOdometerAction(
  _prev: VehiclesActionResult | undefined,
  formData: FormData,
): Promise<VehiclesActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  const parsed = odometerUpdateSchema.safeParse({
    currentOdometer: formNumber(formData, "currentOdometer"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Kilométrage invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    await updateOdometer(user.id, id, parsed.data);
    revalidateVehiclePaths(id);
    return { ok: true, message: "Kilométrage mis à jour.", id };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Mise à jour impossible" };
  }
}

export async function addPhotoAction(
  _prev: VehiclesActionResult | undefined,
  formData: FormData,
): Promise<VehiclesActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  const parsed = vehiclePhotoCreateSchema.safeParse({
    photoUrl: formString(formData, "photoUrl"),
    caption: formNullable(formData, "caption"),
    displayOrder: formNumber(formData, "displayOrder") ?? 0,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Photo invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    await addVehiclePhoto(user.id, id, parsed.data);
    revalidateVehiclePaths(id);
    return { ok: true, message: "Photo ajoutée.", id };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Ajout impossible" };
  }
}

export async function addDocumentAction(
  _prev: VehiclesActionResult | undefined,
  formData: FormData,
): Promise<VehiclesActionResult> {
  const id = formString(formData, "id");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  const parsed = vehicleDocumentCreateSchema.safeParse({
    type: formString(formData, "type"),
    title: formString(formData, "title"),
    expiryDate: formNullable(formData, "expiryDate"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Document invalide",
    };
  }

  try {
    const user = await requireActiveUser();
    await addVehicleDocument(user.id, id, parsed.data);
    revalidateVehiclePaths(id);
    return { ok: true, message: "Document ajouté.", id };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Ajout impossible" };
  }
}
