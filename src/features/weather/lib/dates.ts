/**
 * Date de prévision pour une étape :
 * 1. jour de arrivalTime si présent
 * 2. sinon departureDate + (sequence - 1) jours
 */
export function toDateOnlyUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysUtc(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function resolveStopForecastDate(input: {
  arrivalTime: Date | null;
  departureDate: Date;
  sequence: number;
}): string {
  if (input.arrivalTime) {
    return toDateOnlyUtc(input.arrivalTime);
  }
  const offset = Math.max(0, input.sequence - 1);
  return toDateOnlyUtc(addDaysUtc(input.departureDate, offset));
}

export function parseDateOnly(isoDate: string): Date {
  const [y, m, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, day!));
}

export function todayUtcDateOnly(): string {
  return toDateOnlyUtc(new Date());
}

export function daysFromToday(dateOnly: string): number {
  const today = parseDateOnly(todayUtcDateOnly());
  const target = parseDateOnly(dateOnly);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function isWithinHorizon(
  dateOnly: string,
  horizonDays: number,
): boolean {
  const delta = daysFromToday(dateOnly);
  return delta >= 0 && delta < horizonDays;
}
