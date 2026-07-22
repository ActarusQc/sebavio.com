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
  buildItineraryProposal,
  resolveCurrentStep,
  type PlannerStep,
} from "@/features/ai-trip-planner/lib/planning-step";
import { buildControlsForStep } from "@/features/ai-trip-planner/lib/controls-for-step";
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

export function stripHistoricalQuickReplies(
  messages: PlannerMessageStored[],
): PlannerMessageStored[] {
  return messages.map((m) => {
    if (m.role !== "assistant" || !m.quickReplies?.length) return m;
    return {
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    };
  });
}

export function inferRequestedInput(
  draft: TripDraftParsed,
  fromAi: RequestedInput | null | undefined,
  step?: PlannerStep,
): RequestedInputDto {
  if (step) {
    const controls = buildControlsForStep({
      step,
      draft,
      ownedVehicles: [],
      homeCity: null,
      hasHome: false,
      originSuggestions: [],
      hasProposal: false,
    });
    if (controls.requestedInput) return controls.requestedInput;
  }

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
    sessionVersion?: number;
  },
  extras?: {
    requestedInput?: RequestedInputDto;
    quickReplies?: string[];
    currentStep?: PlannerStep | string;
    originSuggestions?: OriginSuggestionDto[];
    homeCity?: string | null;
    ownedVehicles?: Array<{ id: string; label: string }>;
  },
): TripPlannerSessionDto {
  const draft = parseStoredDraft(session.structuredDraft);
  const messages = parseStoredMessages(session.messages);
  const missingFields = detectMissingFields(draft);
  const hasTripTypeHint =
    draft.travelStyle.length > 0 ||
    draft.preferences.length > 0 ||
    messages.some(
      (m) =>
        m.role === "user" &&
        /road trip|escapade|famille|couple|destination|idées|idees/i.test(
          m.content,
        ),
    );

  const currentStep =
    (extras?.currentStep as PlannerStep | undefined) ??
    resolveCurrentStep(draft, {
      sessionStatus: session.status,
      hasTripTypeHint,
    });

  const proposal = buildItineraryProposal(draft);
  const controls = buildControlsForStep({
    step: currentStep,
    draft,
    ownedVehicles: extras?.ownedVehicles ?? [],
    homeCity: extras?.homeCity ?? null,
    hasHome: Boolean(extras?.homeCity),
    originSuggestions: extras?.originSuggestions ?? [],
    hasProposal: Boolean(proposal),
  });

  const quickReplies = extras?.quickReplies ?? controls.quickReplies;
  const requestedInput =
    extras?.requestedInput ??
    inferRequestedInput(draft, null, currentStep) ??
    controls.requestedInput;

  const canCreate =
    isDraftReadyForCreation(draft) &&
    session.status !== "created" &&
    session.status !== "abandoned" &&
    !session.createdTripId;

  // N’exposer les QR que sur le dernier message assistant (aligné serveur).
  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "assistant") return i;
    }
    return -1;
  })();
  const syncedMessages = messages.map((m, i) => {
    if (m.role !== "assistant") return m;
    if (i !== lastAssistantIdx) {
      return {
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      };
    }
    return {
      ...m,
      quickReplies: quickReplies.length ? quickReplies : undefined,
    };
  });

  return {
    id: session.id,
    status: session.status as TripPlannerSessionDto["status"],
    sessionVersion: session.sessionVersion ?? 0,
    currentStep,
    messages: syncedMessages,
    draft,
    missingFields,
    quickReplies,
    requestedInput,
    proposal,
    originSuggestions: extras?.originSuggestions ?? [],
    homeCity: extras?.homeCity ?? null,
    createdTripId: session.createdTripId,
    canCreate,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}
