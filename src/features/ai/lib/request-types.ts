import type { TripAssistantRequestType } from "@/features/ai/schemas/request";

const RECOMMENDATION_TYPES: ReadonlySet<TripAssistantRequestType> = new Set([
  "suggest_activities",
  "weather",
]);

export function requestTypeNeedsRecommendations(
  requestType: TripAssistantRequestType,
): boolean {
  return RECOMMENDATION_TYPES.has(requestType);
}
