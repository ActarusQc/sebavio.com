import { AppError } from "@/lib/errors";
import {
  tripPlanningAiResponseSchema,
  type TripPlanningAiResponse,
} from "@/features/ai-trip-planner/schemas/draft";

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
      "L’assistant n’a pas pu produire une réponse valide. Réessayez.",
      502,
    );
  }
}

export function parseTripPlanningAiResponse(
  rawText: string,
): TripPlanningAiResponse {
  const tryParse = (text: string) => {
    const obj = extractJsonObject(text);
    const result = tripPlanningAiResponseSchema.safeParse(obj);
    if (!result.success) {
      throw new AppError(
        "AI_INVALID_RESPONSE",
        "L’assistant n’a pas pu produire une réponse valide. Réessayez.",
        502,
      );
    }
    return result.data;
  };

  try {
    return tryParse(rawText);
  } catch (first) {
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");
    try {
      return tryParse(cleaned);
    } catch {
      throw first;
    }
  }
}
