"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/features/auth/services/session";
import { isAppError } from "@/lib/errors";
import {
  fuelEstimateSchema,
  fuelLogCreateSchema,
} from "@/features/fuel/schemas";
import {
  createFuelLog,
  deleteFuelLog,
  estimateTripFuel,
} from "@/features/fuel/services";

export type FuelActionResult =
  | {
      ok: true;
      message?: string;
      id?: string;
      estimatedCost?: string;
      priceLabel?: string;
    }
  | { ok: false; message: string };

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

function revalidateFuelPaths(vehicleId?: string, tripId?: string) {
  if (vehicleId) {
    revalidatePath(`/dashboard/vehicles/${vehicleId}`);
    revalidatePath(`/dashboard/vehicles/${vehicleId}/fuel`);
  }
  revalidatePath("/dashboard/finance");
  if (tripId) {
    revalidatePath(`/dashboard/trips/${tripId}`);
  }
}

export async function createFuelLogAction(
  _prev: FuelActionResult | undefined,
  formData: FormData,
): Promise<FuelActionResult> {
  const parsed = fuelLogCreateSchema.safeParse({
    vehicleId: formString(formData, "vehicleId"),
    filledAt: formString(formData, "filledAt"),
    odometerKm: formNumber(formData, "odometerKm"),
    liters: formNumber(formData, "liters"),
    pricePerLiter: formNumber(formData, "pricePerLiter"),
    totalCost: formNumber(formData, "totalCost"),
    isFull: formString(formData, "isFull") ?? "true",
    fuelType: formNullable(formData, "fuelType"),
    stationName: formNullable(formData, "stationName"),
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
    const log = await createFuelLog(user.id, parsed.data);
    revalidateFuelPaths(log.vehicleId);
    return { ok: true, id: log.id, message: "Plein enregistré" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Création impossible" };
  }
}

export async function deleteFuelLogAction(
  _prev: FuelActionResult | undefined,
  formData: FormData,
): Promise<FuelActionResult> {
  const id = formString(formData, "id");
  const vehicleId = formString(formData, "vehicleId");
  if (!id) return { ok: false, message: "Identifiant manquant" };

  try {
    const user = await requireActiveUser();
    await deleteFuelLog(user.id, id);
    revalidateFuelPaths(vehicleId);
    return { ok: true, message: "Plein supprimé" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Suppression impossible" };
  }
}

export async function estimateTripFuelAction(
  _prev: FuelActionResult | undefined,
  formData: FormData,
): Promise<FuelActionResult> {
  const tripId = formString(formData, "tripId");
  if (!tripId) return { ok: false, message: "Identifiant manquant" };

  const parsed = fuelEstimateSchema.safeParse({
    defaultPricePerLiter: formNumber(formData, "defaultPricePerLiter"),
    consumptionL100: formNumber(formData, "consumptionL100"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  try {
    const user = await requireActiveUser();
    const estimate = await estimateTripFuel(user.id, tripId, parsed.data);
    revalidateFuelPaths(undefined, tripId);
    if (estimate.priceSource === "not_applicable") {
      return {
        ok: true,
        message: estimate.priceLabel ?? "Carburant non applicable",
        estimatedCost: estimate.estimatedCost,
        priceLabel: estimate.priceLabel ?? undefined,
      };
    }
    return {
      ok: true,
      message: `Estimation : ${estimate.estimatedCost} ${estimate.currency}`,
      estimatedCost: estimate.estimatedCost,
      priceLabel: estimate.priceLabel ?? undefined,
    };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Estimation impossible" };
  }
}
