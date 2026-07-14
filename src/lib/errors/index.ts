/**
 * Erreurs applicatives centralisées.
 */

export type AppErrorCode =
  | "AUTH_001"
  | "AUTH_002"
  | "AUTH_003"
  | "AUTH_004"
  | "AUTH_005"
  | "AUTH_006"
  | "AUTH_RATE_LIMIT"
  | "AUTH_UNAVAILABLE"
  | "USR_001"
  | "USR_002"
  | "USR_003"
  | "USR_004"
  | "USR_005"
  | "CAT_001"
  | "CAT_002"
  | "CAT_003"
  | "CAT_004"
  | "CAT_005"
  | "VEH_001"
  | "VEH_002"
  | "VEH_003"
  | "VEH_004"
  | "VEH_005"
  | "MNT_001"
  | "MNT_002"
  | "MNT_003"
  | "MNT_004"
  | "MNT_005"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;

  constructor(code: AppErrorCode, message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
