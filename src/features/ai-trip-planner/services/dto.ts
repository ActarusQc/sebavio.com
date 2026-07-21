import {
  emptyTripDraft,
  tripDraftSchema,
  type TripDraftParsed,
} from "@/features/ai-trip-planner/schemas/draft";
import {
  detectMissingFields,
  isDraftReadyForCreation,
} from "@/features/ai-trip-planner/lib/missing-fields";
import {
  plannerMessagesSchema,
  type PlannerMessageStored,
} from "@/features/ai-trip-planner/schemas/session";
import type { TripPlannerSessionDto } from "@/features/ai-trip-planner/types";

export function parseStoredDraft(raw: unknown): TripDraftParsed {
  const parsed = tripDraftSchema.safeParse(raw);
  return parsed.success ? parsed.data : emptyTripDraft();
}

export function parseStoredMessages(raw: unknown): PlannerMessageStored[] {
  const parsed = plannerMessagesSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

export function toSessionDto(session: {
  id: string;
  status: string;
  messages: unknown;
  structuredDraft: unknown;
  createdTripId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TripPlannerSessionDto {
  const draft = parseStoredDraft(session.structuredDraft);
  const messages = parseStoredMessages(session.messages);
  const missingFields = detectMissingFields(draft);
  const canCreate =
    isDraftReadyForCreation(draft) &&
    session.status !== "created" &&
    session.status !== "abandoned" &&
    !session.createdTripId;

  return {
    id: session.id,
    status: session.status as TripPlannerSessionDto["status"],
    messages,
    draft,
    missingFields,
    createdTripId: session.createdTripId,
    canCreate,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}
