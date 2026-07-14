/** Constantes module Finances (Doc 4 §9 / Doc 6 §9). */

export const EXPENSE_CATEGORIES = [
  "fuel",
  "camping",
  "activity",
  "food",
  "lodging",
  "toll",
  "maintenance",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  fuel: "Carburant",
  camping: "Camping",
  activity: "Activité",
  food: "Alimentation",
  lodging: "Hébergement",
  toll: "Péage",
  maintenance: "Entretien",
  other: "Autre",
};

export const DEFAULT_CURRENCY = "CAD";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
