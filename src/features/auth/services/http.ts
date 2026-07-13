import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAppError } from "@/lib/errors";
import type { AuthApiResponse } from "@/features/auth/types";

export function jsonOk<T>(data: T, status = 200): NextResponse {
  const body: AuthApiResponse<T> = { success: true, data };
  return NextResponse.json(body, { status });
}

export function jsonFail(
  code: string,
  message: string,
  status = 400,
): NextResponse {
  const body: AuthApiResponse<never> = {
    success: false,
    error: { code, message },
  };
  return NextResponse.json(body, { status });
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function handleRouteError(error: unknown): NextResponse {
  if (isAppError(error)) {
    return jsonFail(error.code, error.message, error.status);
  }

  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Données invalides";
    return jsonFail("VALIDATION_ERROR", message, 400);
  }

  console.error("[api/auth]", error instanceof Error ? error.message : error);
  return jsonFail("INTERNAL_ERROR", "Erreur interne", 500);
}
