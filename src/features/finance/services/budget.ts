/**
 * Synchronisation unique trip_budgets ↔ trips.planned_budget.
 *
 * Source de vérité : `trip_budgets`.
 * Toute écriture de budget voyage DOIT passer par `upsertTripBudgetAmount`.
 * Ne jamais écrire `trips.planned_budget` ailleurs.
 */
import { Prisma } from "@prisma/client";
import { DEFAULT_CURRENCY } from "@/features/finance/constants";
import { toMoney } from "@/features/finance/lib/money";

export type BudgetTx = Prisma.TransactionClient;

export type TripBudgetRow = {
  id: string;
  tripId: string;
  plannedAmount: Prisma.Decimal;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Upsert / suppression du budget voyage et miroir `trips.planned_budget`.
 * - `plannedAmount === null` → supprime trip_budgets et met planned_budget à null.
 * - sinon → upsert trip_budgets puis copie le montant sur le voyage.
 */
export async function upsertTripBudgetAmount(
  tx: BudgetTx,
  tripId: string,
  plannedAmount: Prisma.Decimal | number | string | null,
  currency: string = DEFAULT_CURRENCY,
): Promise<TripBudgetRow | null> {
  const currencyCode = currency.trim().toUpperCase() || DEFAULT_CURRENCY;

  if (plannedAmount === null) {
    await tx.tripBudget.deleteMany({ where: { tripId } });
    await tx.trip.update({
      where: { id: tripId },
      data: { plannedBudget: null },
    });
    return null;
  }

  const amount = toMoney(plannedAmount);

  const budget = await tx.tripBudget.upsert({
    where: { tripId },
    create: {
      tripId,
      plannedAmount: amount,
      currency: currencyCode,
    },
    update: {
      plannedAmount: amount,
      currency: currencyCode,
    },
  });

  await tx.trip.update({
    where: { id: tripId },
    data: { plannedBudget: amount },
  });

  return budget;
}

/** Vérifie que trip_budgets.planned_amount === trips.planned_budget (ou les deux absents/null). */
export async function assertBudgetMirrorConsistent(
  tx: BudgetTx,
  tripId: string,
): Promise<{
  consistent: boolean;
  budgetAmount: string | null;
  tripPlannedBudget: string | null;
}> {
  const [budget, trip] = await Promise.all([
    tx.tripBudget.findUnique({ where: { tripId } }),
    tx.trip.findUnique({
      where: { id: tripId },
      select: { plannedBudget: true },
    }),
  ]);

  const budgetAmount = budget ? toMoney(budget.plannedAmount).toFixed(2) : null;
  const tripPlannedBudget = trip?.plannedBudget
    ? toMoney(trip.plannedBudget).toFixed(2)
    : null;

  return {
    consistent: budgetAmount === tripPlannedBudget,
    budgetAmount,
    tripPlannedBudget,
  };
}
