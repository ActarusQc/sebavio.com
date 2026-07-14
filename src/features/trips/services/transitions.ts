import { AppError } from "@/lib/errors";
import type { TripStatus } from "@/features/trips/constants";

const TERMINAL: ReadonlySet<string> = new Set(["completed", "cancelled"]);

/** Statuts terminaux : lecture seule (mutations → TRIP_005). Soft-delete OK. */
export function isTerminalStatus(status: string): boolean {
  return TERMINAL.has(status);
}

export function assertWritableStatus(status: string): void {
  if (isTerminalStatus(status)) {
    throw new AppError("TRIP_005", "Voyage déjà terminé ou annulé", 400);
  }
}

export function assertCanStart(status: string): void {
  assertWritableStatus(status);
  if (status !== "planned") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Seul un voyage planifié peut être démarré",
      400,
    );
  }
}

export function assertCanComplete(status: string): void {
  assertWritableStatus(status);
  if (status !== "planned" && status !== "in_progress") {
    throw new AppError("TRIP_005", "Voyage déjà terminé ou annulé", 400);
  }
}

/** planned → cancelled | in_progress → cancelled (irréversible). */
export function assertCanCancel(status: string): void {
  assertWritableStatus(status);
  if (status !== "planned" && status !== "in_progress") {
    throw new AppError("TRIP_005", "Voyage déjà terminé ou annulé", 400);
  }
}

export function nextStatusAfterCancel(status: TripStatus): "cancelled" {
  assertCanCancel(status);
  return "cancelled";
}
