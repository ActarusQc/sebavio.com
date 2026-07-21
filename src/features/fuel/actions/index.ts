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
import type { FuelEstimateDto } from "@/features/fuel/types";

export type FuelActionResult =
  | {
      ok: true;
      message?: string;
      id?: string;
      estimate?: FuelEstimateDto;
      estimatedCost?: string;
      priceLabel?: string;
      litersNeeded?: string;
      pricePerLiter?: string;
      pricingMethod?: string | null;
      stationCount?: number;
      freshness?: string | null;
      source?: string | null;
      priceCapturedAt?: string | null;
      fallbackUsed?: boolean;
      warnings?: string[];
    }
  | { ok: false; message: string; code?: string };

function formString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (value == null) return undefined;
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

function formBool(formData: FormData, key: string): boolean | undefined {
  if (!formData.has(key)) return undefined;
  const v = String(formData.get(key) ?? "").toLowerCase();
  return v === "true" || v === "1" || v === "on" || v === "yes";
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

function parseEstimateForm(formData: FormData) {
  const initialMode = formString(formData, "initialFuelMode") ?? "full";
  const departureMode = formString(formData, "departureRefillMode") ?? "none";
  const reserveMode = formString(formData, "reserveMode");
  const reserveValue = formNumber(formData, "reserveValue");

  return fuelEstimateSchema.safeParse({
    defaultPricePerLiter: formNumber(formData, "defaultPricePerLiter"),
    consumptionL100: formNumber(formData, "consumptionL100"),
    tankCapacityL: formNumber(formData, "tankCapacityL"),
    fuelType: formString(formData, "fuelType"),
    includeReturnTrip: formBool(formData, "includeReturnTrip") ?? true,
    returnDistanceKm: formNumber(formData, "returnDistanceKm"),
    initialFuel: {
      mode: initialMode,
      value: formNumber(formData, "initialFuelValue") ?? undefined,
    },
    departureRefill: {
      mode: departureMode,
      manualTotal: formNumber(formData, "departureManualTotal"),
    },
    includeExistingFuelValue:
      formBool(formData, "includeExistingFuelValue") ?? false,
    refillStrategy: formString(formData, "refillStrategy") ?? "full_tank",
    reserve:
      reserveMode && reserveValue != null
        ? { mode: reserveMode, value: reserveValue }
        : undefined,
    refillAtDestination: formBool(formData, "refillAtDestination") ?? false,
    finishWithFullTank: formBool(formData, "finishWithFullTank") ?? false,
  });
}

export async function estimateTripFuelAction(
  _prev: FuelActionResult | undefined,
  formData: FormData,
): Promise<FuelActionResult> {
  const tripId = formString(formData, "tripId");
  if (!tripId) return { ok: false, message: "Identifiant manquant" };

  const parsed = parseEstimateForm(formData);
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
        estimate,
        estimatedCost: estimate.estimatedCost,
        priceLabel: estimate.priceLabel ?? undefined,
        fallbackUsed: false,
        warnings: [],
      };
    }
    return {
      ok: true,
      message: `Argent dépensé : ${estimate.calculation?.moneySpent ?? estimate.estimatedCost} ${estimate.currency}`,
      estimate,
      estimatedCost: estimate.estimatedCost,
      priceLabel: estimate.priceLabel ?? undefined,
      litersNeeded: estimate.litersNeeded,
      pricePerLiter: estimate.pricePerLiter,
      pricingMethod: estimate.pricingMethod,
      stationCount: estimate.priceSampleCount,
      freshness: estimate.freshness,
      source:
        estimate.attribution ?? estimate.priceLabel ?? estimate.priceSource,
      priceCapturedAt: estimate.priceCapturedAt,
      fallbackUsed: estimate.fallbackUsed,
      warnings: estimate.warnings,
    };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message, code: error.code };
    }
    return { ok: false, message: "Estimation impossible" };
  }
}
