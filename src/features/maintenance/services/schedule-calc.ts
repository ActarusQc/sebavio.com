/**
 * Calculs d'échéances entretien — côté serveur uniquement (jamais client / IA).
 */

import type { MaintenanceScheduleStatus } from "@/features/maintenance/types";
import {
  APPROACHING_DAYS,
  APPROACHING_KM,
} from "@/features/maintenance/constants";

export type DueCalculationInput = {
  intervalKm: number | null | undefined;
  intervalMonths: number | null | undefined;
  performedDate?: Date | null;
  performedOdometer?: number | null;
  purchaseDate?: Date | null;
  currentOdometer: number;
  /** Référence « aujourd'hui » (injectable pour tests). */
  today?: Date;
};

export type DueCalculationResult = {
  nextDueDate: Date | null;
  nextDueOdometer: number | null;
  status: MaintenanceScheduleStatus;
};

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/** Ajoute N mois calendaires en UTC sans muter la date source. */
export function addMonthsUtc(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, lastDay)));
}

export function resolveDueBase(input: DueCalculationInput): {
  baseDate: Date;
  baseOdometer: number;
  today: Date;
} {
  const today = startOfUtcDay(input.today ?? new Date());
  const baseDate = startOfUtcDay(
    input.performedDate ?? input.purchaseDate ?? today,
  );
  const baseOdometer = input.performedOdometer ?? input.currentOdometer;
  return { baseDate, baseOdometer, today };
}

export function calculateNextDue(
  input: DueCalculationInput,
): DueCalculationResult {
  const { baseDate, baseOdometer, today } = resolveDueBase(input);

  const nextDueDate =
    input.intervalMonths != null && input.intervalMonths > 0
      ? addMonthsUtc(baseDate, input.intervalMonths)
      : null;

  const nextDueOdometer =
    input.intervalKm != null && input.intervalKm > 0
      ? baseOdometer + input.intervalKm
      : null;

  const overdueByDate =
    nextDueDate != null && nextDueDate.getTime() < today.getTime();
  const overdueByKm =
    nextDueOdometer != null && nextDueOdometer <= input.currentOdometer;

  const status: MaintenanceScheduleStatus =
    overdueByDate || overdueByKm ? "overdue" : "upcoming";

  return { nextDueDate, nextDueOdometer, status };
}

/**
 * Détermine si une échéance approche au point de créer une notification.
 * Choix Partie 10 : pas de génération en masse à chaque recalcul —
 * uniquement à l'approche (14 j / 500 km). Envoi réel = module Notifications.
 */
export function isApproachingDue(params: {
  nextDueDate: Date | null;
  nextDueOdometer: number | null;
  currentOdometer: number;
  today?: Date;
  approachingDays?: number;
  approachingKm?: number;
}): boolean {
  const today = startOfUtcDay(params.today ?? new Date());
  const days = params.approachingDays ?? APPROACHING_DAYS;
  const km = params.approachingKm ?? APPROACHING_KM;

  if (params.nextDueDate) {
    const due = startOfUtcDay(params.nextDueDate);
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays <= days) return true;
  }

  if (params.nextDueOdometer != null) {
    const remaining = params.nextDueOdometer - params.currentOdometer;
    if (remaining <= km) return true;
  }

  return false;
}
