/**
 * Feature `finance` — budgets voyage, dépenses, tableau de bord.
 * Stripe / OCR / exports : hors scope (voir ARCHITECTURE.md).
 */
export {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  DEFAULT_CURRENCY,
} from "./constants";
export type { ExpenseCategory } from "./constants";

export {
  listExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  addExpenseReceipt,
  importExpenseFromFuelLog,
  getTripBudget,
  upsertTripBudget,
  getTripFinanceSummary,
  getFinanceDashboard,
  upsertTripBudgetAmount,
  assertBudgetMirrorConsistent,
} from "./services";

export {
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
  upsertBudgetAction,
  addReceiptAction,
  importFuelExpenseAction,
} from "./actions";

export {
  ExpenseForm,
  BudgetForm,
  ExpensesList,
  TripFinancePanels,
  FinanceDashboard,
} from "./components";

export type {
  ExpenseDto,
  TripBudgetDto,
  TripFinanceSummaryDto,
  FinanceDashboardDto,
  ExpenseWriteResult,
  PaginatedExpenses,
} from "./types";
