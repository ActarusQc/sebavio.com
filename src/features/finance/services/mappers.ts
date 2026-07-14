import type { ExpenseCategory } from "@/features/finance/constants";
import { moneyToString } from "@/features/finance/lib/money";
import { toDateKey } from "@/features/finance/lib/dates";
import type {
  ExpenseDto,
  ExpenseReceiptDto,
  TripBudgetDto,
} from "@/features/finance/types";

function decimalToString(
  value: { toString(): string } | null | undefined,
): string | null {
  if (value == null) return null;
  return moneyToString(value.toString());
}

export function clampPageSize(pageSize: number, max: number): number {
  return Math.min(Math.max(1, pageSize), max);
}

export function toReceiptDto(row: {
  id: string;
  expenseId: string;
  fileUrl: string;
  createdAt: Date;
}): ExpenseReceiptDto {
  return {
    id: row.id,
    expenseId: row.expenseId,
    fileUrl: row.fileUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toExpenseDto(row: {
  id: string;
  tripId: string;
  category: string;
  amount: { toString(): string };
  currency: string;
  expenseDate: Date;
  merchant: string | null;
  notes: string | null;
  sourceFuelLogId: string | null;
  createdAt: Date;
  updatedAt: Date;
  receipts?: Array<{
    id: string;
    expenseId: string;
    fileUrl: string;
    createdAt: Date;
  }>;
}): ExpenseDto {
  return {
    id: row.id,
    tripId: row.tripId,
    category: row.category as ExpenseCategory,
    amount: moneyToString(row.amount.toString()),
    currency: row.currency,
    expenseDate: toDateKey(row.expenseDate),
    merchant: row.merchant,
    notes: row.notes,
    sourceFuelLogId: row.sourceFuelLogId,
    receipts: (row.receipts ?? []).map(toReceiptDto),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toBudgetDto(row: {
  tripId: string;
  plannedAmount: { toString(): string };
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  trip?: { plannedBudget: { toString(): string } | null };
}): TripBudgetDto {
  return {
    tripId: row.tripId,
    plannedAmount: moneyToString(row.plannedAmount.toString()),
    currency: row.currency,
    mirroredPlannedBudget: decimalToString(row.trip?.plannedBudget),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
