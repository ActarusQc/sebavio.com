/**
 * Comparaisons date-only (UTC) pour cohérence période voyage / dépenses.
 */

/** YYYY-MM-DD en UTC. */
export function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/**
 * true si expenseDate (jour) est strictement avant le jour de départ
 * ou strictement après le jour de retour (si returnDate défini).
 */
export function isExpenseDateOutsideTripPeriod(
  expenseDate: Date,
  departureDate: Date,
  returnDate: Date | null | undefined,
): boolean {
  const expenseKey = toDateKey(expenseDate);
  const departureKey = toDateKey(departureDate);
  if (expenseKey < departureKey) return true;
  if (returnDate) {
    const returnKey = toDateKey(returnDate);
    if (expenseKey > returnKey) return true;
  }
  return false;
}

export const OUT_OF_PERIOD_WARNING =
  "La date de dépense est hors de la période du voyage (avant le départ ou après le retour).";
