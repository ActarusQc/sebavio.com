import { AppError } from "@/lib/errors";
import {
  tripPlanningAiResponseSchema,
  type TripPlanningAiResponse,
} from "@/features/ai-trip-planner/schemas/draft";
import { normalizeTripPlanningAiJson } from "@/features/ai-trip-planner/lib/normalize-ai-json";

export type ParseAiResult =
  | { ok: true; data: TripPlanningAiResponse; repaired: boolean }
  | {
      ok: false;
      issues: Array<{ path: string; code: string }>;
      conversationalFallback: string | null;
    };

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
    throw new Error("json_extract_failed");
  }
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractConversationalFallback(rawText: string): string | null {
  const cleaned = cleanMarkdown(rawText);
  try {
    const obj = extractJsonObject(cleaned);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      const o = obj as Record<string, unknown>;
      for (const key of ["assistantMessage", "message", "answer", "content"]) {
        if (typeof o[key] === "string" && (o[key] as string).trim()) {
          return (o[key] as string).trim().slice(0, 2000);
        }
      }
    }
  } catch {
    // ignore
  }
  const plain = cleaned.replace(/[{[][\s\S]*$/, "").trim();
  if (plain.length >= 12 && plain.length <= 2000 && !plain.startsWith("{")) {
    return plain;
  }
  return null;
}

/**
 * Niveau 1–2 : extraction JSON + normalisation + Zod.
 */
export function parseTripPlanningAiResponseSoft(
  rawText: string,
): ParseAiResult {
  const attempts = [rawText, cleanMarkdown(rawText)];
  let lastIssues: Array<{ path: string; code: string }> = [];

  for (const text of attempts) {
    try {
      const extracted = extractJsonObject(text);
      const normalized = normalizeTripPlanningAiJson(extracted);
      const result = tripPlanningAiResponseSchema.safeParse(normalized);
      if (result.success) {
        return {
          ok: true,
          data: result.data,
          repaired: text !== rawText || normalized !== extracted,
        };
      }
      lastIssues = result.error.issues.slice(0, 12).map((i) => ({
        path: i.path.join("."),
        code: i.code,
      }));
    } catch {
      lastIssues = [{ path: "", code: "json_parse" }];
    }
  }

  return {
    ok: false,
    issues: lastIssues,
    conversationalFallback: extractConversationalFallback(rawText),
  };
}

/** Compat tests / appels stricts. */
export function parseTripPlanningAiResponse(
  rawText: string,
): TripPlanningAiResponse {
  const result = parseTripPlanningAiResponseSoft(rawText);
  if (result.ok) return result.data;
  throw new AppError(
    "AI_INVALID_RESPONSE",
    "Une erreur temporaire a empêché l’assistant de poursuivre. Vos réponses ont été conservées.",
    502,
  );
}

export function buildRepairUserPayload(input: {
  previousRaw: string;
  issues: Array<{ path: string; code: string }>;
  userMessage: string;
}): string {
  return JSON.stringify({
    instruction:
      "La réponse précédente ne respecte pas le schéma. Retourne UNIQUEMENT un objet JSON valide selon le schéma fourni, sans texte ni markdown. Les champs inconnus peuvent être null ou [].",
    validationIssues: input.issues.slice(0, 8),
    previousAttemptSnippet: input.previousRaw.slice(0, 1200),
    userMessage: input.userMessage,
  });
}
