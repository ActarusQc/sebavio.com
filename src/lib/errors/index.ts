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
