import "server-only";

import { AppError } from "@/lib/errors";
import { parseStructuredWithRetry } from "@/services/ai/parse-structured";
import { normalizeProviderError } from "@/services/ai/normalize-provider-error";
import {
  createXaiTransport,
  type XaiResponsesTransport,
} from "@/services/ai/xai-client";
import {
  citationsToAiSources,
  countWebSearchCalls,
  extractCitationsFromXaiResponse,
} from "@/features/ai/services/extract-citations";
import type {
  AiGenerateTripAssistantInput,
  AiGenerateTripAssistantResult,
  AiProvider,
} from "@/services/ai/types";

export type XaiAiProviderOptions = {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
  transport?: XaiResponsesTransport;
};

/**
 * Provider xAI (Grok) — API Responses, store: false.
 * web_search uniquement si enableWebSearch=true.
 */
export class XaiAiProvider implements AiProvider {
  readonly name = "xai";

  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;
  private readonly transport: XaiResponsesTransport;

  constructor(options: XaiAiProviderOptions) {
    this.apiKey = options.apiKey;
    this.defaultModel = options.model;
    this.baseUrl = options.baseUrl;
    this.defaultTimeoutMs = options.timeoutMs;
    this.transport =
      options.transport ??
      createXaiTransport({
        apiKey: options.apiKey,
        baseUrl: options.baseUrl,
        timeoutMs: options.timeoutMs,
      });
  }

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

    const model = (input.model || this.defaultModel).trim();
    if (!model) {
      throw new AppError(
        "AI_CONFIGURATION",
        "L’Assistant Sebavio ne peut pas répondre pour le moment. Veuillez réessayer dans quelques instants.",
        503,
      );
    }

    const enableWebSearch = Boolean(input.enableWebSearch);
    const started = Date.now();
    let rawText = "";
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;
    let totalTokens: number | null = null;
    let webSearchCallCount = 0;
    let citationSources: AiGenerateTripAssistantResult["citationSources"] = [];

    try {
      const params = {
        model,
        input: [
          { role: "system" as const, content: input.systemPrompt },
          { role: "user" as const, content: input.userPayload },
        ],
        store: false as const,
        text: { format: { type: "json_object" as const } },
        ...(enableWebSearch
          ? {
              tools: [{ type: "web_search" as const }],
              tool_choice: "required" as const,
            }
          : {}),
      };

      const response = await this.transport.responses.create(params);

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

      if (enableWebSearch) {
        webSearchCallCount = Math.max(1, countWebSearchCalls(response) || 1);
        citationSources = citationsToAiSources(
          extractCitationsFromXaiResponse(response),
        );
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
      webSearchUsed: enableWebSearch,
      webSearchCallCount: enableWebSearch ? webSearchCallCount : 0,
      citationSources,
    };
  }
}
