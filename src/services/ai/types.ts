import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import type { TripAssistantRequestType } from "@/features/ai/schemas/request";

export type AiGenerateTripAssistantInput = {
  systemPrompt: string;
  userPayload: string;
  requestType: TripAssistantRequestType;
  model: string;
  timeoutMs: number;
};

export type AiGenerateTripAssistantResult = {
  response: TripAssistantResponse;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  rawText: string;
};

export type AiAnalyzeTripInput = AiGenerateTripAssistantInput;

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
}
