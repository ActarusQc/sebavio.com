import { AppError } from "@/lib/errors";

export type WeatherErrorKind =
  | "disabled"
  | "missing_key"
  | "invalid_location"
  | "validation"
  | "timeout"
  | "temporary"
  | "unauthorized"
  | "rate_limited"
  | "quota_reached"
  | "unavailable";

export class WeatherError extends AppError {
  readonly kind: WeatherErrorKind;
  readonly retryable: boolean;

  constructor(
    kind: WeatherErrorKind,
    message: string,
    status: number,
    options?: { retryable?: boolean; code?: AppError["code"] },
  ) {
    const code =
      options?.code ??
      (kind === "invalid_location"
        ? "EXT_002"
        : kind === "rate_limited" || kind === "quota_reached"
          ? "EXT_RATE_LIMIT"
          : "EXT_003");
    super(code, message, status);
    this.name = "WeatherError";
    this.kind = kind;
    this.retryable = options?.retryable ?? false;
  }
}

export function isWeatherError(error: unknown): error is WeatherError {
  return error instanceof WeatherError;
}

/** Masque les secrets éventuels dans un message d'erreur. */
export function sanitizeWeatherErrorMessage(message: string): string {
  return message
    .replace(/appid=[^&\s]+/gi, "appid=***")
    .replace(/apikey=[^&\s]+/gi, "apikey=***")
    .replace(/Bearer\s+\S+/gi, "Bearer ***");
}
