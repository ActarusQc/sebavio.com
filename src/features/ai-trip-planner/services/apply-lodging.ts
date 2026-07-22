import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { assertTripPlannerAccess } from "@/features/ai-trip-planner/services/access";
import { getOwnedSessionOrThrow } from "@/features/ai-trip-planner/services/sessions";
import {
  parseStoredDraft,
  parseStoredMessages,
  stripHistoricalQuickReplies,
  toSessionDto,
} from "@/features/ai-trip-planner/services/dto";
import { loadPlannerUserContext } from "@/features/ai-trip-planner/services/user-context";
import { listVehicles } from "@/features/vehicles/services/vehicles";
import {
  hasItineraryProposal,
  resolveCurrentStep,
} from "@/features/ai-trip-planner/lib/planning-step";
import {
  buildControlsForStep,
  CONFIRM_EDIT,
  CONFIRM_YES,
} from "@/features/ai-trip-planner/lib/controls-for-step";
import { recalculateDraftEstimates } from "@/features/ai-trip-planner/services/recalculate-estimates";
import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";
import type { TripPlannerSessionDto } from "@/features/ai-trip-planner/types";
import type { Prisma } from "@prisma/client";

const bodySchema = z.object({
  optionId: z.string().trim().min(1).max(80).optional(),
  optionName: z.string().trim().min(1).max(200).optional(),
  skip: z.boolean().optional().default(false),
  expectedVersion: z.number().int().nonnegative().optional(),
});

function vehicleLabel(v: {
  displayName?: string;
  nickname: string | null;
}): string {
  if (v.displayName?.trim()) return v.displayName.trim();
  if (v.nickname?.trim()) return v.nickname.trim();
  return "Véhicule";
}

export function applyLodgingSelectionToDraft(
  draft: TripDraftParsed,
  option: TripDraftParsed["lodgingOptions"][number],
): TripDraftParsed {
  const lodgingStop = {
    id: randomUUID(),
    name: option.name,
    category: "lodging" as const,
    justification: draft.lodgingType
      ? `Hébergement choisi : ${draft.lodgingType}`
      : "Hébergement sélectionné",
    durationMinutes: 12 * 60,
    latitude: option.latitude,
    longitude: option.longitude,
    placeId: option.placeId,
    address: option.address,
    accepted: true,
    themes: [] as string[],
  };

  const stopsWithoutLodging = draft.stops.filter(
    (s) => s.category !== "lodging",
  );

  return {
    ...draft,
    lodgingSelection: {
      name: option.name,
      placeId: option.placeId,
      address: option.address,
      city: option.city,
      latitude: option.latitude,
      longitude: option.longitude,
      rating: option.rating,
      googleMapsUrl: option.googleMapsUrl,
    },
    lodgingRequested: true,
    stops: [...stopsWithoutLodging, lodgingStop],
    proposalConfirmed: false,
  };
}

export async function applyPlanningLodging(
  userId: string,
  sessionId: string,
  raw: unknown,
): Promise<TripPlannerSessionDto> {
  await assertTripPlannerAccess(userId);
  const input = bodySchema.parse(raw);
  const session = await getOwnedSessionOrThrow(userId, sessionId);
  if (session.status === "created" || session.status === "abandoned") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Cette session ne peut plus être modifiée.",
      400,
    );
  }

  if (
    input.expectedVersion != null &&
    session.sessionVersion !== input.expectedVersion
  ) {
    const ctx = await loadPlannerUserContext(userId);
    return toSessionDto(session, {
      originSuggestions: ctx.originSuggestions,
      homeCity: ctx.homeCity,
    });
  }

  let draft = parseStoredDraft(session.structuredDraft);
  const messages = parseStoredMessages(session.messages);
  const ctx = await loadPlannerUserContext(userId);

  if (input.skip) {
    draft = {
      ...draft,
      lodgingRequested: false,
      lodgingOptions: [],
      lodgingSelection: null,
      accommodationType: null,
      lodgingType: null,
      stops: draft.stops.filter((s) => s.category !== "lodging"),
    };
  } else {
    const option =
      draft.lodgingOptions.find((o) => o.id === input.optionId) ??
      draft.lodgingOptions.find(
        (o) =>
          input.optionName &&
          o.name.toLowerCase() === input.optionName.toLowerCase(),
      ) ??
      draft.lodgingOptions.find(
        (o) =>
          input.optionName &&
          o.name.toLowerCase().includes(input.optionName.toLowerCase()),
      );

    if (!option) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Sélectionnez un hébergement parmi les options proposées.",
        400,
      );
    }
    draft = applyLodgingSelectionToDraft(draft, option);
    draft = await recalculateDraftEstimates(userId, draft, { strict: false });
  }

  const vehiclesPage = await listVehicles(userId, { pageSize: "20" });
  const ownedVehicles = vehiclesPage.items.map((v) => ({
    id: v.id,
    label: vehicleLabel(v),
  }));

  const currentStep = resolveCurrentStep(draft, {
    sessionStatus: session.status,
    hasTripTypeHint: true,
  });
  const controls = buildControlsForStep({
    step: currentStep,
    draft,
    ownedVehicles,
    homeCity: ctx.homeCity,
    hasHome: Boolean(ctx.home),
    originSuggestions: ctx.originSuggestions,
    hasProposal: hasItineraryProposal(draft),
  });

  const assistantContent = input.skip
    ? "D’accord, on continue sans hébergement réservé pour l’instant. Souhaitez-vous confirmer cet itinéraire?"
    : `Parfait, j’ajoute « ${draft.lodgingSelection?.name} » à votre itinéraire. Souhaitez-vous confirmer cette proposition ou modifier des détails?`;

  const withMessages = stripHistoricalQuickReplies([
    ...messages,
    {
      id: randomUUID(),
      role: "user" as const,
      content: input.skip
        ? "Sans hébergement"
        : `Hébergement : ${draft.lodgingSelection?.name}`,
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      role: "assistant" as const,
      content:
        controls.forceAssistantMessage && currentStep !== "confirmation"
          ? controls.forceAssistantMessage
          : assistantContent,
      createdAt: new Date().toISOString(),
      quickReplies:
        controls.quickReplies.length > 0
          ? controls.quickReplies
          : [CONFIRM_YES, CONFIRM_EDIT],
    },
  ]);

  const updated = await prisma.aiTripPlanningSession.update({
    where: { id: session.id },
    data: {
      sessionVersion: { increment: 1 },
      messages: withMessages as unknown as Prisma.InputJsonValue,
      structuredDraft: draft as unknown as Prisma.InputJsonValue,
      status:
        currentStep === "confirmation" ? "ready_for_confirmation" : "proposing",
    },
  });

  const finalQuickReplies =
    controls.quickReplies.length > 0
      ? controls.quickReplies
      : [CONFIRM_YES, CONFIRM_EDIT];

  return toSessionDto(updated, {
    currentStep,
    quickReplies: finalQuickReplies,
    requestedInput: controls.requestedInput,
    originSuggestions: ctx.originSuggestions,
    homeCity: ctx.homeCity,
    ownedVehicles,
  });
}

/** Trouve une option dans le brouillon à partir d’un libellé de quick reply. */
export function findLodgingOptionByReply(
  draft: TripDraftParsed,
  reply: string,
): TripDraftParsed["lodgingOptions"][number] | null {
  const t = reply.trim().toLowerCase();
  if (!t) return null;
  return (
    draft.lodgingOptions.find((o) => o.name.toLowerCase() === t) ??
    draft.lodgingOptions.find((o) => o.name.toLowerCase().startsWith(t)) ??
    draft.lodgingOptions.find((o) =>
      t.includes(o.name.toLowerCase().slice(0, 24)),
    ) ??
    null
  );
}
