import {
  emptyTripDraft,
  tripDraftSchema,
  type TripDraftParsed,
  type RequestedInput,
} from "@/features/ai-trip-planner/schemas/draft";
import {
  detectMissingFields,
  isDraftReadyForCreation,
} from "@/features/ai-trip-planner/lib/missing-fields";
import {
  plannerMessagesSchema,
  type PlannerMessageStored,
} from "@/features/ai-trip-planner/schemas/session";
import type {
  OriginSuggestionDto,
  RequestedInputDto,
  TripPlannerSessionDto,
} from "@/features/ai-trip-planner/types";

export function parseStoredDraft(raw: unknown): TripDraftParsed {
  const parsed = tripDraftSchema.safeParse(raw);
  return parsed.success ? parsed.data : emptyTripDraft();
}

export function parseStoredMessages(raw: unknown): PlannerMessageStored[] {
  const parsed = plannerMessagesSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

export function inferRequestedInput(
  draft: TripDraftParsed,
  fromAi: RequestedInput | null | undefined,
): RequestedInputDto {
  if (fromAi) {
    return {
      type: fromAi.type,
      field: fromAi.field ?? "other",
      placeholder: fromAi.placeholder ?? null,
      countryBias: fromAi.countryBias ?? "CA",
      regionBias: fromAi.regionBias ?? "QC",
    };
  }
  const missing = detectMissingFields(draft);
  if (missing.includes("origin")) {
    return {
      type: "address",
      field: "origin",
      placeholder: "Entrez une adresse ou une ville",
      countryBias: "CA",
      regionBias: "QC",
    };
  }
  if (missing.includes("destination")) {
    return {
      type: "address",
      field: "destination",
      placeholder: "Entrez une destination",
      countryBias: "CA",
      regionBias: "QC",
    };
  }
  return null;
}

export function toSessionDto(
  session: {
    id: string;
    status: string;
    messages: unknown;
    structuredDraft: unknown;
    createdTripId: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  extras?: {
    requestedInput?: RequestedInputDto;
    originSuggestions?: OriginSuggestionDto[];
    homeCity?: string | null;
  },
): TripPlannerSessionDto {
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
    requestedInput: extras?.requestedInput ?? inferRequestedInput(draft, null),
    originSuggestions: extras?.originSuggestions ?? [],
    homeCity: extras?.homeCity ?? null,
    createdTripId: session.createdTripId,
    canCreate,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}
