import { DUE_THRESHOLDS, type DueThresholds } from "./thresholds";
import type { DueStatus } from "./types";

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

export function addMonthsUtc(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, lastDay)));
}

export type NextDueInput = {
  intervalKm?: number | null;
  intervalMonths?: number | null;
  firstDueKm?: number | null;
  firstDueMonths?: number | null;
  lastServiceDate?: Date | null;
  lastServiceOdometer?: number | null;
  inServiceDate?: Date | null;
  currentOdometer: number;
  /** true si la source ne recommande qu’une inspection (pas de km inventé). */
  inspectionOnly?: boolean;
  today?: Date;
};

export type NextDueResult = {
  dueDate: Date | null;
  dueOdometerKm: number | null;
  status: DueStatus;
  remainingKm: number | null;
  remainingDays: number | null;
};

function daysBetween(from: Date, to: Date): number {
  const ms = startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/**
 * Calcule la prochaine échéance après un travail effectué
 * (ex. vidange à 82 000 km, intervalle 8 000 → 90 000 km).
 */
export function computeNextDueAfterService(input: {
  serviceOdometerKm: number;
  serviceDate: Date;
  intervalKm?: number | null;
  intervalMonths?: number | null;
}): { dueOdometerKm: number | null; dueDate: Date | null } {
  const dueOdometerKm =
    input.intervalKm != null && input.intervalKm > 0
      ? input.serviceOdometerKm + input.intervalKm
      : null;
  const dueDate =
    input.intervalMonths != null && input.intervalMonths > 0
      ? addMonthsUtc(startOfUtcDay(input.serviceDate), input.intervalMonths)
      : null;
  return { dueOdometerKm, dueDate };
}

export function computeDueStatus(
  input: NextDueInput,
  thresholds: DueThresholds = DUE_THRESHOLDS,
): NextDueResult {
  const today = startOfUtcDay(input.today ?? new Date());

  if (input.inspectionOnly) {
    const hasInterval =
      (input.intervalKm != null && input.intervalKm > 0) ||
      (input.intervalMonths != null && input.intervalMonths > 0);
    if (!hasInterval) {
      return {
        dueDate: null,
        dueOdometerKm: null,
        status: "unknown",
        remainingKm: null,
        remainingDays: null,
      };
    }
  }

  const baseDate = startOfUtcDay(
    input.lastServiceDate ?? input.inServiceDate ?? today,
  );
  const baseOdo = input.lastServiceOdometer ?? 0;
  const hasPriorService = input.lastServiceDate != null;

  let dueDate: Date | null = null;
  let dueOdometerKm: number | null = null;

  if (hasPriorService) {
    if (input.intervalMonths != null && input.intervalMonths > 0) {
      dueDate = addMonthsUtc(baseDate, input.intervalMonths);
    }
    if (input.intervalKm != null && input.intervalKm > 0) {
      dueOdometerKm = baseOdo + input.intervalKm;
    }
  } else {
    if (input.firstDueMonths != null && input.firstDueMonths > 0) {
      dueDate = addMonthsUtc(baseDate, input.firstDueMonths);
    } else if (input.intervalMonths != null && input.intervalMonths > 0) {
      dueDate = addMonthsUtc(baseDate, input.intervalMonths);
    }
    if (input.firstDueKm != null && input.firstDueKm > 0) {
      dueOdometerKm = input.firstDueKm;
    } else if (input.intervalKm != null && input.intervalKm > 0) {
      dueOdometerKm = baseOdo + input.intervalKm;
    }
  }

  if (dueDate == null && dueOdometerKm == null) {
    return {
      dueDate: null,
      dueOdometerKm: null,
      status: "unknown",
      remainingKm: null,
      remainingDays: null,
    };
  }

  const remainingKm =
    dueOdometerKm != null ? dueOdometerKm - input.currentOdometer : null;
  const remainingDays = dueDate != null ? daysBetween(today, dueDate) : null;

  const overdueByKm = remainingKm != null && remainingKm <= 0;
  const overdueByDate = remainingDays != null && remainingDays < 0;

  if (overdueByKm || overdueByDate) {
    return {
      dueDate,
      dueOdometerKm,
      status: "overdue",
      remainingKm,
      remainingDays,
    };
  }

  const dueNowByKm = remainingKm != null && remainingKm <= thresholds.dueNowKm;
  const dueNowByDate =
    remainingDays != null && remainingDays <= thresholds.dueNowDays;
  if (dueNowByKm || dueNowByDate) {
    return {
      dueDate,
      dueOdometerKm,
      status: "due_now",
      remainingKm,
      remainingDays,
    };
  }

  const dueSoonByKm =
    remainingKm != null && remainingKm <= thresholds.dueSoonKm;
  const dueSoonByDate =
    remainingDays != null && remainingDays <= thresholds.dueSoonDays;
  if (dueSoonByKm || dueSoonByDate) {
    return {
      dueDate,
      dueOdometerKm,
      status: "due_soon",
      remainingKm,
      remainingDays,
    };
  }

  return {
    dueDate,
    dueOdometerKm,
    status: "upcoming",
    remainingKm,
    remainingDays,
  };
}
