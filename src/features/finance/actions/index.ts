"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/features/auth/services/session";
import { isAppError } from "@/lib/errors";
import {
  budgetUpsertSchema,
  expenseCreateSchema,
  expenseReceiptSchema,
  expenseUpdateSchema,
  importFuelExpenseSchema,
} from "@/features/finance/schemas";
import {
  addExpenseReceipt,
  createExpense,
  deleteExpense,
  importExpenseFromFuelLog,
  updateExpense,
  upsertTripBudget,
} from "@/features/finance/services";

export type FinanceActionResult =
  | {
      ok: true;
      message?: string;
      id?: string;
      warnings?: string[];
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

function revalidateFinance(tripId?: string) {
  revalidatePath("/dashboard/finance");
  if (tripId) {
    revalidatePath(`/dashboard/finance/trips/${tripId}`);
    revalidatePath(`/dashboard/trips/${tripId}`);
  }
}

export async function upsertBudgetAction(
  _prev: FinanceActionResult | undefined,
  formData: FormData,
): Promise<FinanceActionResult> {
  try {
    const user = await requireActiveUser();
    const tripId = formString(formData, "tripId");
    if (!tripId) return { ok: false, message: "Voyage manquant" };

    const parsed = budgetUpsertSchema.safeParse({
      plannedAmount: formNumber(formData, "plannedAmount"),
      currency: formString(formData, "currency") ?? "CAD",
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Budget invalide",
      };
    }

    await upsertTripBudget(user.id, tripId, parsed.data);
    revalidateFinance(tripId);
    return { ok: true, message: "Budget enregistré" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur lors de l'enregistrement du budget" };
  }
}

export async function createExpenseAction(
  _prev: FinanceActionResult | undefined,
  formData: FormData,
): Promise<FinanceActionResult> {
  try {
    const user = await requireActiveUser();
    const parsed = expenseCreateSchema.safeParse({
      tripId: formString(formData, "tripId"),
      category: formString(formData, "category"),
      amount: formNumber(formData, "amount"),
      currency: formString(formData, "currency") ?? "CAD",
      expenseDate: formString(formData, "expenseDate"),
      merchant: formNullable(formData, "merchant"),
      notes: formNullable(formData, "notes"),
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Dépense invalide",
      };
    }

    const result = await createExpense(user.id, parsed.data);
    revalidateFinance(parsed.data.tripId);
    return {
      ok: true,
      id: result.expense.id,
      message: "Dépense ajoutée",
      warnings: result.warnings,
    };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur lors de la création de la dépense" };
  }
}

export async function updateExpenseAction(
  _prev: FinanceActionResult | undefined,
  formData: FormData,
): Promise<FinanceActionResult> {
  try {
    const user = await requireActiveUser();
    const id = formString(formData, "id");
    const tripId = formString(formData, "tripId");
    if (!id) return { ok: false, message: "Identifiant manquant" };

    const parsed = expenseUpdateSchema.safeParse({
      category: formString(formData, "category"),
      amount: formNumber(formData, "amount"),
      currency: formString(formData, "currency"),
      expenseDate: formString(formData, "expenseDate"),
      merchant: formNullable(formData, "merchant"),
      notes: formNullable(formData, "notes"),
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Dépense invalide",
      };
    }

    const result = await updateExpense(user.id, id, parsed.data);
    revalidateFinance(tripId ?? result.expense.tripId);
    return {
      ok: true,
      message: "Dépense mise à jour",
      warnings: result.warnings,
    };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur lors de la mise à jour" };
  }
}

export async function deleteExpenseAction(
  _prev: FinanceActionResult | undefined,
  formData: FormData,
): Promise<FinanceActionResult> {
  try {
    const user = await requireActiveUser();
    const id = formString(formData, "id");
    const tripId = formString(formData, "tripId");
    if (!id) return { ok: false, message: "Identifiant manquant" };

    await deleteExpense(user.id, id);
    revalidateFinance(tripId);
    return { ok: true, message: "Dépense supprimée" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur lors de la suppression" };
  }
}

export async function addReceiptAction(
  _prev: FinanceActionResult | undefined,
  formData: FormData,
): Promise<FinanceActionResult> {
  try {
    const user = await requireActiveUser();
    const expenseId = formString(formData, "expenseId");
    const tripId = formString(formData, "tripId");
    if (!expenseId) return { ok: false, message: "Dépense manquante" };

    const parsed = expenseReceiptSchema.safeParse({
      fileUrl: formString(formData, "fileUrl"),
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Reçu invalide",
      };
    }

    const receipt = await addExpenseReceipt(user.id, expenseId, parsed.data);
    revalidateFinance(tripId);
    return { ok: true, id: receipt.id, message: "Reçu ajouté" };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur lors de l'ajout du reçu" };
  }
}

export async function importFuelExpenseAction(
  _prev: FinanceActionResult | undefined,
  formData: FormData,
): Promise<FinanceActionResult> {
  try {
    const user = await requireActiveUser();
    const parsed = importFuelExpenseSchema.safeParse({
      tripId: formString(formData, "tripId"),
      fuelLogId: formString(formData, "fuelLogId"),
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Import invalide",
      };
    }

    const result = await importExpenseFromFuelLog(user.id, parsed.data);
    revalidateFinance(parsed.data.tripId);
    return {
      ok: true,
      id: result.expense.id,
      message: "Plein ajouté aux dépenses",
      warnings: result.warnings,
    };
  } catch (error) {
    if (isAppError(error)) return { ok: false, message: error.message };
    return { ok: false, message: "Erreur lors de l'import du plein" };
  }
}
