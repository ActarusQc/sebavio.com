import { prisma } from "@/lib/prisma";
import {
  addMoney,
  budgetVariance,
  toMoney,
} from "@/features/finance/lib/money";
import { budgetExceededDedupeKey } from "@/features/notifications/constants";
import {
  createInAppNotification,
  softDeleteByDedupeKey,
} from "@/features/notifications/services/create";

/**
 * Cycle de vie budget dépassé :
 * - variance < 0 → crée (ou conserve) la notif budget_exceeded:{tripId}
 * - variance ≥ 0 (ou pas de budget) → soft-delete la notif active
 *   (unique partielle : un nouveau dépassement recrée proprement)
 */
export async function syncBudgetExceededNotification(
  userId: string,
  tripId: string,
): Promise<"created" | "exists" | "cleared" | "unchanged" | "skipped_prefs"> {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId, deletedAt: null },
    include: { budget: true },
  });
  if (!trip) {
    return "unchanged";
  }

  const dedupeKey = budgetExceededDedupeKey(tripId);

  if (!trip.budget) {
    const cleared = await softDeleteByDedupeKey(userId, dedupeKey);
    return cleared > 0 ? "cleared" : "unchanged";
  }

  const expenses = await prisma.expense.findMany({
    where: { tripId, deletedAt: null },
    select: { amount: true },
  });
  const actual = expenses.reduce(
    (acc, e) => addMoney(acc, e.amount.toString()),
    toMoney(0),
  );
  const planned = trip.budget.plannedAmount.toString();
  const variance = budgetVariance(planned, actual.toString());
  const isExceeded = variance != null && toMoney(variance).lessThan(0);

  if (!isExceeded) {
    const cleared = await softDeleteByDedupeKey(userId, dedupeKey);
    return cleared > 0 ? "cleared" : "unchanged";
  }

  const overAmount = toMoney(variance!).abs().toFixed(2);
  const result = await createInAppNotification({
    userId,
    type: "budget",
    title: "Budget dépassé",
    body: `Le voyage « ${trip.title} » dépasse le budget prévu de ${overAmount} ${trip.budget.currency}.`,
    priority: "high",
    dedupeKey,
    sourceEntity: "trips",
    sourceId: tripId,
    href: `/dashboard/finance/trips/${tripId}`,
  });

  if (result.status === "created") return "created";
  if (result.status === "exists") return "exists";
  return "skipped_prefs";
}
