import "server-only";

import { AppError } from "@/lib/errors";
import { parseStructuredWithRetry } from "@/services/ai/parse-structured";
import { normalizeProviderError } from "@/services/ai/normalize-provider-error";
import type {
  AiGenerateTripAssistantInput,
  AiGenerateTripAssistantResult,
  AiProvider,
} from "@/services/ai/types";

/**
 * Provider OpenAI — API Responses uniquement, serveur.
 * Conservé pour retour arrière via AI_PROVIDER=openai.
 */
export class OpenAiResponsesProvider implements AiProvider {
  readonly name = "openai";

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
    if (!this.apiKey.trim()) {
      throw new AppError(
        "AI_CONFIGURATION",
        "L’Assistant Sebavio ne peut pas répondre pour le moment. Veuillez réessayer dans quelques instants.",
        503,
      );
    }

    const model = input.model || this.defaultModel;
    const started = Date.now();
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
        store: false,
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
      throw normalizeProviderError(error, {
        provider: this.name,
        model,
        durationMs: Date.now() - started,
      });
    }

    if (!rawText.trim()) {
      throw new AppError(
        "AI_INVALID_RESPONSE",
        "L’Assistant Sebavio ne peut pas répondre pour le moment. Veuillez réessayer dans quelques instants.",
        502,
      );
    }

    const structured = parseStructuredWithRetry(rawText);

    return {
      response: structured,
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      rawText,
      webSearchUsed: false,
      webSearchCallCount: 0,
      citationSources: [],
    };
  }
}
