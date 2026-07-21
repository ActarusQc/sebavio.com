import { AppError } from "@/lib/errors";
import { tripAssistantResponseSchema } from "@/features/ai/schemas/response";
import { normalizeModelJson } from "@/features/ai/services/normalize-model-json";
import type { AiGenerateTripAssistantResult } from "@/services/ai/types";

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
    }
    throw new AppError(
      "AI_INVALID_RESPONSE",
      "L’Assistant Sebavio ne peut pas répondre pour le moment. Veuillez réessayer dans quelques instants.",
      502,
    );
  }
}

/**
 * Valide toute réponse fournisseur avec le schéma Zod final Sebavio.
 */
export function parseStructuredTripAssistantResponse(
  rawText: string,
): AiGenerateTripAssistantResult["response"] {
  const parsed = normalizeModelJson(extractJsonObject(rawText));
  const result = tripAssistantResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new AppError(
      "AI_INVALID_RESPONSE",
      "L’Assistant Sebavio ne peut pas répondre pour le moment. Veuillez réessayer dans quelques instants.",
      502,
    );
  }
  return result.data;
}

/**
 * Une tentative contrôlée : nettoyage markdown puis re-parse.
 */
export function parseStructuredWithRetry(
  rawText: string,
): AiGenerateTripAssistantResult["response"] {
  try {
    return parseStructuredTripAssistantResponse(rawText);
  } catch (first) {
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");
    try {
      return parseStructuredTripAssistantResponse(cleaned);
    } catch {
      throw first;
    }
  }
}
