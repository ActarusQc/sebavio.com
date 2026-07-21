import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import type { TripAssistantRequestType } from "@/features/ai/schemas/request";
import type { AiKnowledgeMode } from "@/features/ai/schemas/sources";

export type AiGenerateTripAssistantInput = {
  systemPrompt: string;
  userPayload: string;
  requestType: TripAssistantRequestType;
  model: string;
  timeoutMs: number;
  knowledgeMode?: AiKnowledgeMode;
  enableWebSearch?: boolean;
};

export type AiGenerateTripAssistantResult = {
  response: TripAssistantResponse;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  rawText: string;
  webSearchUsed: boolean;
  webSearchCallCount: number;
  citationSources: TripAssistantResponse["sources"];
};

export type AiAnalyzeTripInput = AiGenerateTripAssistantInput;

export type AiGenerateRawJsonInput = {
  systemPrompt: string;
  userPayload: string;
  model: string;
  timeoutMs: number;
};

export type AiGenerateRawJsonResult = {
  rawText: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
};

/**
 * Abstraction multi-fournisseurs — jamais d’appel direct depuis le métier.
 */
export interface AiProvider {
  readonly name: string;
  generateTripAssistantResponse(
    input: AiGenerateTripAssistantInput,
  ): Promise<AiGenerateTripAssistantResult>;
  analyzeTrip(
    input: AiAnalyzeTripInput,
  ): Promise<AiGenerateTripAssistantResult>;
  /** Réponse JSON brute (planification voyage) — sans parse trip-assistant. */
  generateRawJsonResponse(
    input: AiGenerateRawJsonInput,
  ): Promise<AiGenerateRawJsonResult>;
}
