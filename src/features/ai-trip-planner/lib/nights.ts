import { parseIsoDateOnly } from "@/features/ai-trip-planner/lib/dates";

/**
 * Nombre de nuits = jours calendaires entre départ et retour.
 * Même jour → 0 ; 25→26 → 1.
 */
export function computeNights(
  departureDate: string | null | undefined,
  returnDate: string | null | undefined,
  durationDays: number | null | undefined,
): number {
  const dep = parseIsoDateOnly(departureDate);
  const ret = parseIsoDateOnly(returnDate);
  if (dep && ret) {
    const a = Date.UTC(
      dep.getUTCFullYear(),
      dep.getUTCMonth(),
      dep.getUTCDate(),
    );
    const b = Date.UTC(
      ret.getUTCFullYear(),
      ret.getUTCMonth(),
      ret.getUTCDate(),
    );
    const days = Math.round((b - a) / 86_400_000);
    return Math.max(0, days);
  }
  if (durationDays != null && durationDays >= 1) {
    return Math.max(0, durationDays - 1);
  }
  return 0;
}

export function needsOvernightStay(
  departureDate: string | null | undefined,
  returnDate: string | null | undefined,
  durationDays: number | null | undefined,
): boolean {
  return computeNights(departureDate, returnDate, durationDays) >= 1;
}
