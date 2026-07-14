import type { ExpenseCategory } from "@/features/finance/constants";

export type ExpenseReceiptDto = {
  id: string;
  expenseId: string;
  fileUrl: string;
  createdAt: string;
};

export type ExpenseDto = {
  id: string;
  tripId: string;
  category: ExpenseCategory;
  amount: string;
  currency: string;
  expenseDate: string;
  merchant: string | null;
  notes: string | null;
  sourceFuelLogId: string | null;
  receipts: ExpenseReceiptDto[];
  createdAt: string;
  updatedAt: string;
};

export type TripBudgetDto = {
  tripId: string;
  plannedAmount: string;
  currency: string;
  /** Miroir trips.planned_budget (doit être identique). */
  mirroredPlannedBudget: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryBreakdownDto = {
  category: ExpenseCategory;
  total: string;
  count: number;
};

export type ExpenseWriteResult = {
  expense: ExpenseDto;
  /** Avertissements non bloquants (ex. date hors période). */
  warnings: string[];
};

export type ReferenceFuelLogDto = {
  id: string;
  filledAt: string;
  totalCost: string;
  liters: string;
  stationName: string | null;
  alreadyImported: boolean;
  importedExpenseId: string | null;
};

export type ReferenceMaintenanceDto = {
  id: string;
  performedDate: string;
  cost: string | null;
  currency: string | null;
  provider: string | null;
};

export type TripFinanceSummaryDto = {
  tripId: string;
  tripTitle: string;
  currency: string;
  plannedAmount: string | null;
  actualTotal: string;
  variance: string | null;
  byCategory: CategoryBreakdownDto[];
  expenseCount: number;
  estimatedFuelCost: string | null;
  referenceFuelLogs: ReferenceFuelLogDto[];
  referenceMaintenance: ReferenceMaintenanceDto[];
  campingPriceHints: Array<{
    stopName: string;
    campgroundName: string;
    priceMin: string | null;
    priceMax: string | null;
  }>;
  activityPriceHints: Array<{
    stopName: string;
    activityName: string;
    priceIndicative: string | null;
  }>;
};

export type FinanceDashboardDto = {
  currency: string;
  tripCount: number;
  totalPlanned: string;
  totalActual: string;
  variance: string;
  byCategory: CategoryBreakdownDto[];
  trips: Array<{
    tripId: string;
    title: string;
    status: string;
    plannedAmount: string | null;
    actualTotal: string;
    variance: string | null;
  }>;
  recentExpenses: ExpenseDto[];
};

export type PaginatedExpenses = {
  items: ExpenseDto[];
  total: number;
  page: number;
  pageSize: number;
};
