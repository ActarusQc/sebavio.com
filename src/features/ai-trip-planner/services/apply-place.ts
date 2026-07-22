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
import { placeFromAddressSelection } from "@/features/ai-trip-planner/lib/sanitize-draft";
import { getHomeAddress } from "@/features/users/services/home-address";
import { loadPlannerUserContext } from "@/features/ai-trip-planner/services/user-context";
import {
  HOME_QUICK_OTHER,
  HOME_QUICK_RECENT,
  HOME_QUICK_YES,
} from "@/features/ai-trip-planner/constants";
import { buildControlsForStep } from "@/features/ai-trip-planner/lib/controls-for-step";
import {
  hasItineraryProposal,
  resolveCurrentStep,
} from "@/features/ai-trip-planner/lib/planning-step";
import { listVehicles } from "@/features/vehicles/services/vehicles";
import type { TripPlannerSessionDto } from "@/features/ai-trip-planner/types";
import type { Prisma } from "@prisma/client";

const placeBodySchema = z.object({
  field: z.enum(["origin", "destination"]),
  useHome: z.boolean().optional().default(false),
  expectedVersion: z.number().int().nonnegative().optional(),
  address: z
    .object({
      formattedAddress: z.string().trim().min(1).max(2000),
      placeId: z.string().trim().min(1).max(255),
      latitude: z.number().finite(),
      longitude: z.number().finite(),
      city: z.string().nullable().optional(),
      province: z.string().nullable().optional(),
      postalCode: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
    })
    .optional()
    .nullable(),
});

export async function applyPlanningPlace(
  userId: string,
  sessionId: string,
  raw: unknown,
): Promise<TripPlannerSessionDto> {
  await assertTripPlannerAccess(userId);
  const input = placeBodySchema.parse(raw);
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

  const draft = parseStoredDraft(session.structuredDraft);
  const messages = parseStoredMessages(session.messages);
  const ctx = await loadPlannerUserContext(userId);

  let place = draft[input.field];
  let userLabel = "";

  if (input.useHome) {
    const home = await getHomeAddress(userId);
    if (!home) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Aucune adresse de domicile enregistrée.",
        400,
      );
    }
    place = placeFromAddressSelection({
      formattedAddress: home.label,
      placeId: home.placeId,
      latitude: home.latitude,
      longitude: home.longitude,
      city: home.city,
      province: home.province,
      postalCode: home.postalCode,
      country: home.country,
      isHome: true,
    });
    userLabel = home.city
      ? `Départ : domicile à ${home.city}`
      : "Départ : mon domicile";
  } else if (input.address) {
    place = placeFromAddressSelection({
      ...input.address,
      city: input.address.city ?? null,
      province: input.address.province ?? null,
      postalCode: input.address.postalCode ?? null,
      country: input.address.country ?? null,
      isHome: false,
    });
    userLabel =
      input.field === "origin"
        ? `Départ : ${place.name}`
        : `Destination : ${place.name}`;
  } else {
    throw new AppError(
      "VALIDATION_ERROR",
      "Sélectionnez une adresse valide.",
      400,
    );
  }

  const nextDraft = {
    ...draft,
    [input.field]: place,
    ...(input.field === "destination"
      ? { destinationMode: draft.destinationMode ?? ("known" as const) }
      : {}),
  };

  const currentStep = resolveCurrentStep(nextDraft, {
    sessionStatus: "collecting",
    hasTripTypeHint: true,
  });

  const vehiclesPage = await listVehicles(userId, { pageSize: "20" });
  const ownedVehicles = vehiclesPage.items.map((v) => ({
    id: v.id,
    label: v.displayName?.trim() || v.nickname?.trim() || "Véhicule",
  }));

  const controls = buildControlsForStep({
    step: currentStep,
    draft: nextDraft,
    ownedVehicles,
    homeCity: ctx.homeCity,
    hasHome: Boolean(ctx.home),
    originSuggestions: ctx.originSuggestions,
    hasProposal: hasItineraryProposal(nextDraft),
  });

  const assistantFollowUp =
    controls.forceAssistantMessage ??
    (input.field === "origin"
      ? "Avez-vous déjà une destination, ou souhaitez-vous des idées selon une distance ou durée de trajet maximale?"
      : "Merci. Précisons maintenant les dates du voyage.");

  const withMessages = stripHistoricalQuickReplies([
    ...messages,
    {
      id: randomUUID(),
      role: "user" as const,
      content: userLabel,
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      role: "assistant" as const,
      content: assistantFollowUp,
      createdAt: new Date().toISOString(),
      quickReplies: controls.quickReplies,
    },
  ]);

  const updated = await prisma.aiTripPlanningSession.update({
    where: { id: session.id },
    data: {
      sessionVersion: { increment: 1 },
      messages: withMessages as unknown as Prisma.InputJsonValue,
      structuredDraft: nextDraft as unknown as Prisma.InputJsonValue,
      status: "collecting",
    },
  });

  return toSessionDto(updated, {
    currentStep,
    quickReplies: controls.quickReplies,
    requestedInput: controls.requestedInput,
    originSuggestions: ctx.originSuggestions,
    homeCity: ctx.homeCity,
    ownedVehicles,
  });
}

export function isHomeQuickReply(content: string): boolean {
  const t = content.trim();
  return (
    t === HOME_QUICK_YES || t.toLowerCase().includes("partir de mon domicile")
  );
}

export function isOtherAddressQuickReply(content: string): boolean {
  const t = content.trim();
  return t === HOME_QUICK_OTHER || t === HOME_QUICK_RECENT;
}
