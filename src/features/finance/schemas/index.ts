import { z } from "zod";
import {
  DEFAULT_CURRENCY,
  DEFAULT_PAGE_SIZE,
  EXPENSE_CATEGORIES,
  MAX_PAGE_SIZE,
} from "@/features/finance/constants";

const moneyAmount = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    if (typeof v === "string") return Number(v);
    return v;
  },
  z.number().finite().nonnegative({ error: "Montant invalide" }),
);

const optionalMoney = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") return Number(v);
  return v;
}, z.number().finite().nonnegative().nullable());

const currencySchema = z
  .string()
  .trim()
  .length(3, { error: "Devise ISO-4217 requise (3 lettres)" })
  .transform((v) => v.toUpperCase())
  .default(DEFAULT_CURRENCY);

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));

export const budgetUpsertSchema = z.object({
  plannedAmount: moneyAmount,
  currency: currencySchema,
});

export const expensesListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  tripId: z.string().uuid({ error: "Voyage invalide" }).optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
});

export const expenseCreateSchema = z.object({
  tripId: z.string().uuid({ error: "Voyage invalide" }),
  category: z.enum(EXPENSE_CATEGORIES, { error: "Catégorie invalide" }),
  amount: moneyAmount,
  currency: currencySchema,
  expenseDate: z.coerce.date({ error: "Date invalide" }),
  merchant: optionalString(200),
  notes: optionalString(5000),
});

export const expenseUpdateSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  amount: moneyAmount.optional(),
  currency: currencySchema.optional(),
  expenseDate: z.coerce.date().optional(),
  merchant: optionalString(200),
  notes: optionalString(5000),
});

export const expenseReceiptSchema = z.object({
  fileUrl: z.string().trim().url({ error: "URL de reçu invalide" }).max(2000),
});

export const importFuelExpenseSchema = z.object({
  tripId: z.string().uuid({ error: "Voyage invalide" }),
  fuelLogId: z.string().uuid({ error: "Plein invalide" }),
});

export const clearBudgetSchema = z.object({
  plannedAmount: optionalMoney,
  currency: currencySchema.optional(),
});

export type BudgetUpsertInput = z.infer<typeof budgetUpsertSchema>;
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
export type ExpenseReceiptInput = z.infer<typeof expenseReceiptSchema>;
export type ImportFuelExpenseInput = z.infer<typeof importFuelExpenseSchema>;
