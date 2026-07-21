import { AppError } from "@/lib/errors";

export function parseIsoDateOnly(
  value: string | null | undefined,
): Date | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T12:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function validatePlanningDates(input: {
  departureDate: string | null;
  returnDate: string | null;
  durationDays: number | null;
}): { departure: Date; returnDate: Date } {
  const departure = parseIsoDateOnly(input.departureDate);
  if (!departure) {
    throw new AppError(
      "VALIDATION_ERROR",
      "La date de départ est invalide.",
      400,
    );
  }

  let returnDate = parseIsoDateOnly(input.returnDate);
  if (!returnDate && input.durationDays != null && input.durationDays >= 1) {
    returnDate = new Date(departure);
    returnDate.setUTCDate(returnDate.getUTCDate() + (input.durationDays - 1));
  }

  if (!returnDate) {
    throw new AppError(
      "VALIDATION_ERROR",
      "La date de retour ou la durée est requise.",
      400,
    );
  }

  if (returnDate.getTime() < departure.getTime()) {
    throw new AppError(
      "VALIDATION_ERROR",
      "La date de retour doit être postérieure ou égale au départ.",
      400,
    );
  }

  const maxSpanMs = 90 * 24 * 60 * 60 * 1000;
  if (returnDate.getTime() - departure.getTime() > maxSpanMs) {
    throw new AppError(
      "VALIDATION_ERROR",
      "La durée du voyage semble irréaliste (maximum 90 jours).",
      400,
    );
  }

  const minYear = new Date().getUTCFullYear() - 1;
  if (departure.getUTCFullYear() < minYear) {
    throw new AppError(
      "VALIDATION_ERROR",
      "La date de départ n’est pas réaliste.",
      400,
    );
  }

  return { departure, returnDate };
}

export function toDateOnlyIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
