import { APIError } from "openai";
import { AppError } from "@/lib/errors";

const GENERIC_USER_MESSAGE =
  "L’Assistant Sebavio ne peut pas répondre pour le moment. Veuillez réessayer dans quelques instants.";

export type NormalizedAiErrorLog = {
  provider: string;
  httpStatus: number | null;
  code: string;
  durationMs: number;
  model: string;
  requestId: string | null;
};

/**
 * Normalise les erreurs fournisseur vers AppError (jamais de message brut).
 */
export function normalizeProviderError(
  error: unknown,
  context: {
    provider: string;
    model: string;
    durationMs: number;
  },
): AppError {
  if (error instanceof AppError) return error;

  let httpStatus: number | null = null;
  let requestId: string | null = null;
  let code: AppError["code"] = "AI_003";
  let message = GENERIC_USER_MESSAGE;
  let status = 503;

  if (error instanceof APIError) {
    httpStatus = error.status ?? null;
    const headers = error.headers;
    if (headers && typeof headers === "object") {
      const get =
        typeof (headers as Headers).get === "function"
          ? (headers as Headers).get.bind(headers)
          : null;
      requestId =
        get?.("x-request-id") ??
        get?.("x-openai-request-id") ??
        (typeof (headers as Record<string, string>)["x-request-id"] === "string"
          ? (headers as Record<string, string>)["x-request-id"]
          : null);
    }

    const errCode =
      typeof error.code === "string" ? error.code.toLowerCase() : "";
    const errType =
      typeof error.type === "string" ? error.type.toLowerCase() : "";
    const errMsg = (error.message ?? "").toLowerCase();

    if (httpStatus === 401 || errCode.includes("invalid_api_key")) {
      code = "AI_CONFIGURATION";
      status = 503;
    } else if (
      httpStatus === 404 ||
      errCode.includes("model_not_found") ||
      (errMsg.includes("model") &&
        (errMsg.includes("not found") ||
          errMsg.includes("does not exist") ||
          errMsg.includes("not available") ||
          errMsg.includes("not accessible")))
    ) {
      code = "AI_CONFIGURATION";
      status = 503;
      console.error("[ai] configuration error", {
        provider: context.provider,
        httpStatus,
        code,
        durationMs: context.durationMs,
        model: context.model,
        requestId,
      } satisfies NormalizedAiErrorLog);
      return new AppError(code, message, status);
    } else if (
      httpStatus === 429 ||
      errCode.includes("rate_limit") ||
      errType.includes("rate_limit")
    ) {
      code = "AI_RATE_LIMIT";
      status = 429;
      message =
        "Trop de requêtes pour l’instant. Réessayez dans quelques instants.";
    } else if (
      httpStatus === 402 ||
      errCode.includes("insufficient") ||
      errMsg.includes("quota") ||
      errMsg.includes("billing") ||
      errMsg.includes("credits")
    ) {
      code = "AI_003";
      status = 503;
    } else if (httpStatus === 400 || httpStatus === 403) {
      code = "AI_003";
      status = 503;
    } else if (httpStatus != null && httpStatus >= 500) {
      code = "AI_003";
      status = 503;
    }
  } else {
    const msg = error instanceof Error ? error.message.toLowerCase() : "";
    if (
      msg.includes("timeout") ||
      msg.includes("timed out") ||
      msg.includes("aborted")
    ) {
      code = "AI_005";
      status = 504;
      message = "L’assistant met trop de temps à répondre. Réessayez.";
    } else if (
      msg.includes("fetch failed") ||
      msg.includes("network") ||
      msg.includes("econnrefused") ||
      msg.includes("enotfound")
    ) {
      code = "AI_003";
      status = 503;
    }
  }

  console.error("[ai] provider error", {
    provider: context.provider,
    httpStatus,
    code,
    durationMs: context.durationMs,
    model: context.model,
    requestId,
  } satisfies NormalizedAiErrorLog);

  return new AppError(code, message, status);
}
