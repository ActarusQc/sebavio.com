export { AITripPlannerPage } from "@/features/ai-trip-planner/components";
export { useAITripPlanningSession } from "@/features/ai-trip-planner/hooks/use-ai-trip-planning-session";
export {
  WELCOME_MESSAGE,
  INITIAL_QUICK_REPLIES,
  DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS,
} from "@/features/ai-trip-planner/constants";
export {
  emptyTripDraft,
  tripDraftSchema,
  tripPlanningAiResponseSchema,
} from "@/features/ai-trip-planner/schemas/draft";
export { plannerMessagesSchema } from "@/features/ai-trip-planner/schemas/session";
export { detectMissingFields } from "@/features/ai-trip-planner/lib/missing-fields";
export { validatePlanningDates } from "@/features/ai-trip-planner/lib/dates";
export {
  formatDateRangeFr,
  formatPlaceSummary,
} from "@/features/ai-trip-planner/lib/format";
export {
  sanitizeAndMergeDraft,
  rejectForeignVehicleId,
} from "@/features/ai-trip-planner/lib/sanitize-draft";
export { resolveCreateIdempotency } from "@/features/ai-trip-planner/lib/idempotency";
export { normalizeTripPlanningAiJson } from "@/features/ai-trip-planner/lib/normalize-ai-json";
export type {
  TripDraft,
  TripPlannerSessionDto,
  TripPlannerAccessDto,
  PlaceRef,
} from "@/features/ai-trip-planner/types";
