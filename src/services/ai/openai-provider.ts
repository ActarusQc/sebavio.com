import "server-only";

import { AppError } from "@/lib/errors";
import { tripAssistantResponseSchema } from "@/features/ai/schemas/response";
import type {
  AiGenerateTripAssistantInput,
  AiGenerateTripAssistantResult,
  AiProvider,
} from "@/services/ai/types";

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
      "Réponse de l’assistant invalide.",
      502,
    );
  }
}

function parseStructured(
  rawText: string,
): AiGenerateTripAssistantResult["response"] {
  const parsed = extractJsonObject(rawText);
  const result = tripAssistantResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new AppError(
      "AI_INVALID_RESPONSE",
      "Réponse de l’assistant invalide.",
      502,
    );
  }
  return result.data;
}

/**
 * Provider OpenAI — API Responses uniquement, serveur.
 */
export class OpenAiResponsesProvider implements AiProvider {
  readonly name = "openai-responses";

  constructor(
    private readonly apiKey: string,
    private readonly defaultModel: string,
  ) {}

  async generateTripAssistantResponse(
    input: AiGenerateTripAssistantInput,
  ): Promise<AiGenerateTripAssistantResult> {
    return this.call(input);
  }

  async analyzeTrip(
    input: AiGenerateTripAssistantInput,
  ): Promise<AiGenerateTripAssistantResult> {
    return this.call(input);
  }

  private async call(
    input: AiGenerateTripAssistantInput,
  ): Promise<AiGenerateTripAssistantResult> {
    const model = input.model || this.defaultModel;
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({
      apiKey: this.apiKey,
      timeout: input.timeoutMs,
      maxRetries: 1,
    });

    let rawText = "";
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;
    let totalTokens: number | null = null;

    try {
      const response = await client.responses.create({
        model,
        input: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPayload },
        ],
        text: { format: { type: "json_object" } },
      });

      rawText =
        typeof response.output_text === "string" ? response.output_text : "";

      const usage = response.usage;
      if (usage) {
        inputTokens =
          typeof usage.input_tokens === "number" ? usage.input_tokens : null;
        outputTokens =
          typeof usage.output_tokens === "number" ? usage.output_tokens : null;
        totalTokens =
          typeof usage.total_tokens === "number"
            ? usage.total_tokens
            : inputTokens != null && outputTokens != null
              ? inputTokens + outputTokens
              : null;
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("timeout") || message.includes("timed out")) {
        throw new AppError(
          "AI_005",
          "L’assistant met trop de temps à répondre. Réessayez.",
          504,
        );
      }
      console.error("[ai] openai provider error", {
        name: error instanceof Error ? error.name : "unknown",
      });
      throw new AppError(
        "AI_003",
        "L’assistant est temporairement indisponible.",
        503,
      );
    }

    if (!rawText.trim()) {
      throw new AppError(
        "AI_INVALID_RESPONSE",
        "Réponse de l’assistant invalide.",
        502,
      );
    }

    let structured;
    try {
      structured = parseStructured(rawText);
    } catch (first) {
      // Une seule tentative contrôlée : re-parse après nettoyage markdown
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "");
      try {
        structured = parseStructured(cleaned);
      } catch {
        throw first;
      }
    }

    return {
      response: structured,
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      rawText,
    };
  }
}
