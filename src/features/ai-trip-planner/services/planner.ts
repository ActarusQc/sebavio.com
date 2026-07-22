import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { createAiProvider, getAiRuntimeConfig } from "@/services/ai";
import {
  assertAiRateLimit,
  acquireAiRequestLock,
} from "@/features/ai/services/rate-limit";
import { recordAiUsage } from "@/features/ai/services/usage";
import { listVehicles } from "@/features/vehicles/services/vehicles";
import { listTravelGroups } from "@/features/travel-groups/services/travel-groups";
import { assertTripPlannerAccess } from "@/features/ai-trip-planner/services/access";
import { getOwnedSessionOrThrow } from "@/features/ai-trip-planner/services/sessions";
import {
  inferRequestedInput,
  parseStoredDraft,
  parseStoredMessages,
  stripHistoricalQuickReplies,
  toSessionDto,
} from "@/features/ai-trip-planner/services/dto";
import {
  buildRepairUserPayload,
  parseTripPlanningAiResponseSoft,
} from "@/features/ai-trip-planner/services/parse-ai-response";
import { sanitizeAndMergeDraft } from "@/features/ai-trip-planner/lib/sanitize-draft";
import {
  buildTripPlannerSystemPrompt,
  TRIP_PLANNER_PROMPT_VERSION,
  wrapTripPlannerUserPayload,
} from "@/features/ai-trip-planner/prompts/system";
import { recalculateDraftEstimates } from "@/features/ai-trip-planner/services/recalculate-estimates";
import { loadPlannerUserContext } from "@/features/ai-trip-planner/services/user-context";
import {
  applyPlanningPlace,
  isHomeQuickReply,
  isOtherAddressQuickReply,
} from "@/features/ai-trip-planner/services/apply-place";
import { DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS } from "@/features/ai-trip-planner/constants";
import {
  buildControlsForStep,
  CONFIRM_EDIT,
  CONFIRM_YES,
  filterAiQuickRepliesForStep,
  GENERATE_ITINERARY,
} from "@/features/ai-trip-planner/lib/controls-for-step";
import {
  hasItineraryProposal,
  parseDriveLimitFromText,
  resolveCurrentStep,
  resolveSessionStatus,
} from "@/features/ai-trip-planner/lib/planning-step";
import { ensureMinimalItineraryContent } from "@/features/ai-trip-planner/lib/ensure-minimal-proposal";
import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";
import type { TripPlannerSessionDto } from "@/features/ai-trip-planner/types";
import type { Prisma } from "@prisma/client";

function applyDeterministicDraftPatches(
  draft: TripDraftParsed,
  userText: string,
  step: ReturnType<typeof resolveCurrentStep>,
): TripDraftParsed {
  const t = userText.trim();
  const lower = t.toLowerCase();
  let next = draft;

  if (
    step === "destination_mode" ||
    (!draft.destination.name && draft.origin.name)
  ) {
    if (
      /j[’']ai déjà une destination|deja une destination|destination précise/i.test(
        lower,
      )
    ) {
      next = { ...next, destinationMode: "known" };
    } else if (
      /cherche des idées|cherche des idees|des idées|des idees/i.test(lower)
    ) {
      next = { ...next, destinationMode: "suggest" };
    }
  }

  if (
    step === "destination_radius" ||
    (next.destinationMode === "suggest" &&
      next.maxDriveMinutes == null &&
      next.maxDistanceKm == null)
  ) {
    const limit = parseDriveLimitFromText(t);
    if (limit.maxDriveMinutes != null || limit.maxDistanceKm != null) {
      next = {
        ...next,
        maxDriveMinutes: limit.maxDriveMinutes ?? next.maxDriveMinutes,
        maxDistanceKm: limit.maxDistanceKm ?? next.maxDistanceKm,
        destinationMode: next.destinationMode ?? "suggest",
      };
    }
    if (/moins d[’']?1\s*h|moins d'une heure/i.test(lower)) {
      next = { ...next, maxDriveMinutes: 60, destinationMode: "suggest" };
    }
    if (/moins de 200\s*km/i.test(lower)) {
      next = { ...next, maxDistanceKm: 200, destinationMode: "suggest" };
    }
    if (/moins de 400\s*km/i.test(lower)) {
      next = { ...next, maxDistanceKm: 400, destinationMode: "suggest" };
    }
  }

  if (/passer à l[’']itinéraire|passer a l'itineraire/i.test(lower)) {
    next = {
      ...next,
      preferences:
        next.preferences.length > 0 ? next.preferences : ["itineraire"],
    };
  }

  if (t === CONFIRM_YES && hasItineraryProposal(next)) {
    next = { ...next, proposalConfirmed: true };
  }
  if (t === CONFIRM_EDIT) {
    next = { ...next, proposalConfirmed: false };
  }

  // Voyageurs rapides
  const travelersMatch = lower.match(/^(\d+)\s*personnes?$/);
  if (travelersMatch && step === "travelers") {
    const n = Number(travelersMatch[1]);
    if (n >= 1 && n <= 50) {
      next = { ...next, travelerCount: n, adults: n, children: 0 };
    }
  }

  return next;
}

function summarizeHistory(
  messages: Array<{ role: string; content: string }>,
): string {
  const recent = messages.slice(-12);
  return recent.map((m) => `${m.role}: ${m.content.slice(0, 400)}`).join("\n");
}

function vehicleLabel(v: {
  displayName?: string;
  nickname: string | null;
}): string {
  if (v.displayName?.trim()) return v.displayName.trim();
  if (v.nickname?.trim()) return v.nickname.trim();
  return "Véhicule";
}

function logPlannerParseError(input: {
  sessionId: string;
  provider: string | null;
  model: string | null;
  attempt: "primary" | "repair";
  step: string | null;
  issues: Array<{ path: string; code: string }>;
  durationMs: number;
}): void {
  console.error(
    "[ai-trip-planner]",
    JSON.stringify({
      event: "ai_response_invalid",
      sessionId: input.sessionId,
      provider: input.provider,
      model: input.model,
      attempt: input.attempt,
      step: input.step,
      issues: input.issues,
      durationMs: input.durationMs,
    }),
  );
}

export async function sendPlanningMessage(
  userId: string,
  sessionId: string,
  content: string,
  expectedVersion?: number,
): Promise<TripPlannerSessionDto> {
  await assertTripPlannerAccess(userId);
  await assertAiRateLimit(userId);

  const config = getAiRuntimeConfig();
  const trimmed = content.trim();
  if (!trimmed) {
    throw new AppError("VALIDATION_ERROR", "Message requis.", 400);
  }
  if (trimmed.length > config.maxMessageChars) {
    throw new AppError("VALIDATION_ERROR", "Message trop long.", 400);
  }

  // Raccourcis domicile / autre adresse — sans appel modèle
  if (isHomeQuickReply(trimmed)) {
    return applyPlanningPlace(userId, sessionId, {
      field: "origin",
      useHome: true,
      expectedVersion,
    });
  }
  if (isOtherAddressQuickReply(trimmed)) {
    const session = await getOwnedSessionOrThrow(userId, sessionId);
    const messages = parseStoredMessages(session.messages);
    const ctx = await loadPlannerUserContext(userId);
    const assistantMessage = {
      id: randomUUID(),
      role: "assistant" as const,
      content:
        "D’où souhaitez-vous partir? Vous pouvez saisir une adresse complète ou choisir une ville.",
      createdAt: new Date().toISOString(),
      quickReplies: [
        ...ctx.originSuggestions
          .filter((s) => s.kind !== "home")
          .slice(0, 5)
          .map((s) => s.label),
        "Saisir une adresse",
      ],
    };
    const updated = await prisma.aiTripPlanningSession.update({
      where: { id: session.id },
      data: {
        sessionVersion: { increment: 1 },
        messages: stripHistoricalQuickReplies([
          ...messages,
          {
            id: randomUUID(),
            role: "user",
            content: trimmed,
            createdAt: new Date().toISOString(),
          },
          assistantMessage,
        ]) as unknown as Prisma.InputJsonValue,
      },
    });
    return toSessionDto(updated, {
      currentStep: "origin",
      quickReplies: assistantMessage.quickReplies ?? [],
      requestedInput: {
        type: "address",
        field: "origin",
        placeholder: "Entrez une adresse ou une ville",
        countryBias: "CA",
        regionBias: "QC",
      },
      originSuggestions: ctx.originSuggestions,
      homeCity: ctx.homeCity,
    });
  }

  // Suggestion ville QC → résolution via message + requestedInput address confirmation
  const quebecCity = DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase(),
  );
  if (quebecCity) {
    // Laisse l’IA / le flux normal, mais on peut pré-remplir le nom
  }

  const session = await getOwnedSessionOrThrow(userId, sessionId);
  if (session.status === "created" || session.createdTripId) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Cette planification est terminée. Recommencez pour un nouveau voyage.",
      400,
    );
  }
  if (session.status === "abandoned") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Cette session a été abandonnée. Démarrez une nouvelle planification.",
      400,
    );
  }

  if (expectedVersion != null && session.sessionVersion !== expectedVersion) {
    // Course asynchrone : renvoyer l’état actuel sans appliquer le message
    const userCtx = await loadPlannerUserContext(userId);
    return toSessionDto(session, {
      originSuggestions: userCtx.originSuggestions,
      homeCity: userCtx.homeCity,
    });
  }

  const release = await acquireAiRequestLock(userId, sessionId);
  const started = Date.now();
  let success = false;
  let errorCode: string | null = null;
  let model: string | null = null;
  let providerName: string | null = null;
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;
  let totalTokens: number | null = null;

  try {
    const messages = parseStoredMessages(session.messages);
    const previousDraft = parseStoredDraft(session.structuredDraft);
    const userCtx = await loadPlannerUserContext(userId);

    const userMessage = {
      id: randomUUID(),
      role: "user" as const,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const withUser = [...messages, userMessage];

    const vehiclesPage = await listVehicles(userId, { pageSize: "20" });
    const ownedVehicles = vehiclesPage.items.map((v) => ({
      id: v.id,
      label: vehicleLabel(v),
    }));

    let ownedGroups: Array<{ id: string; name: string }> = [];
    try {
      const groups = await listTravelGroups(userId, { pageSize: "20" });
      ownedGroups = groups.items.map((g) => ({ id: g.id, name: g.name }));
    } catch {
      ownedGroups = [];
    }

    const hasTripTypeHint =
      previousDraft.travelStyle.length > 0 ||
      previousDraft.preferences.length > 0 ||
      withUser.some(
        (m) =>
          m.role === "user" &&
          /road trip|escapade|famille|couple|destination|idées|idees/i.test(
            m.content,
          ),
      );

    const stepBefore = resolveCurrentStep(previousDraft, {
      sessionStatus: session.status,
      hasTripTypeHint,
    });

    // Pré-remplir ville QC selon l’étape (jamais écraser une autre étape)
    let draftSeed = applyDeterministicDraftPatches(
      previousDraft,
      trimmed,
      stepBefore,
    );
    if (quebecCity) {
      if (stepBefore === "origin" && !draftSeed.origin.name) {
        draftSeed = {
          ...draftSeed,
          origin: {
            ...draftSeed.origin,
            name: quebecCity,
            city: quebecCity,
            province: "Québec",
            country: "CA",
          },
        };
      } else if (
        (stepBefore === "destination" || stepBefore === "destination_mode") &&
        !draftSeed.destination.name
      ) {
        draftSeed = {
          ...draftSeed,
          destinationMode: draftSeed.destinationMode ?? "known",
          destination: {
            ...draftSeed.destination,
            name: quebecCity,
            city: quebecCity,
            province: "Québec",
            country: "CA",
          },
        };
      }
    }

    // Style de voyage depuis les réponses rapides initiales
    if (stepBefore === "trip_type") {
      const style = trimmed.slice(0, 80);
      draftSeed = {
        ...draftSeed,
        travelStyle:
          draftSeed.travelStyle.length > 0 ? draftSeed.travelStyle : [style],
      };
    }

    const systemPrompt = buildTripPlannerSystemPrompt({
      vehicles: ownedVehicles,
      groups: ownedGroups,
      currentDraftJson: JSON.stringify({
        ...draftSeed,
        currentStepHint: stepBefore,
        // Ne jamais envoyer l’adresse civique du domicile au modèle
        origin: draftSeed.origin.isHome
          ? {
              name: draftSeed.origin.city
                ? `Domicile — ${draftSeed.origin.city}`
                : "Domicile",
              city: draftSeed.origin.city,
              province: draftSeed.origin.province,
              country: draftSeed.origin.country,
              placeId: null,
              latitude: null,
              longitude: null,
              isHome: true,
            }
          : {
              name: draftSeed.origin.name,
              city: draftSeed.origin.city,
              province: draftSeed.origin.province,
              country: draftSeed.origin.country,
              placeId: null,
              latitude: null,
              longitude: null,
              isHome: false,
            },
      }),
      homeCity: userCtx.homeCity,
      hasHomeAddress: Boolean(userCtx.home),
      recentOriginCities: userCtx.recentOriginCities,
    });

    const provider = createAiProvider();
    providerName = provider.name;

    const callAi = async (userPayload: string) =>
      provider.generateRawJsonResponse({
        systemPrompt,
        userPayload,
        model: config.model,
        timeoutMs: config.timeoutMs,
      });

    let aiResult = await callAi(
      wrapTripPlannerUserPayload({
        historySummary: summarizeHistory(withUser),
        userMessage: trimmed,
      }),
    );
    model = aiResult.model;
    inputTokens = aiResult.inputTokens;
    outputTokens = aiResult.outputTokens;
    totalTokens = aiResult.totalTokens;

    let parsedSoft = parseTripPlanningAiResponseSoft(aiResult.rawText);
    if (!parsedSoft.ok) {
      logPlannerParseError({
        sessionId,
        provider: providerName,
        model,
        attempt: "primary",
        step: null,
        issues: parsedSoft.issues,
        durationMs: Date.now() - started,
      });

      const repairResult = await callAi(
        buildRepairUserPayload({
          previousRaw: aiResult.rawText,
          issues: parsedSoft.issues,
          userMessage: trimmed,
        }),
      );
      inputTokens = (inputTokens ?? 0) + (repairResult.inputTokens ?? 0);
      outputTokens = (outputTokens ?? 0) + (repairResult.outputTokens ?? 0);
      totalTokens = (totalTokens ?? 0) + (repairResult.totalTokens ?? 0);
      model = repairResult.model;
      aiResult = repairResult;
      parsedSoft = parseTripPlanningAiResponseSoft(repairResult.rawText);

      if (!parsedSoft.ok) {
        logPlannerParseError({
          sessionId,
          provider: providerName,
          model,
          attempt: "repair",
          step: null,
          issues: parsedSoft.issues,
          durationMs: Date.now() - started,
        });

        // Niveau 4 — fallback conversationnel, conserve le brouillon
        const fallbackStep = resolveCurrentStep(draftSeed, {
          sessionStatus: session.status,
          hasTripTypeHint: true,
        });
        const fallbackControls = buildControlsForStep({
          step: fallbackStep,
          draft: draftSeed,
          ownedVehicles,
          homeCity: userCtx.homeCity,
          hasHome: Boolean(userCtx.home),
          originSuggestions: userCtx.originSuggestions,
          hasProposal: hasItineraryProposal(draftSeed),
        });
        const fallbackText =
          parsedSoft.conversationalFallback ??
          fallbackControls.forceAssistantMessage ??
          "J’ai bien reçu votre réponse. Pour continuer, utilisez les choix ci-dessous ou précisez votre réponse.";
        const fallbackAssistant = {
          id: randomUUID(),
          role: "assistant" as const,
          content: fallbackText,
          createdAt: new Date().toISOString(),
          quickReplies: fallbackControls.quickReplies,
        };
        const updated = await prisma.aiTripPlanningSession.update({
          where: { id: session.id },
          data: {
            sessionVersion: { increment: 1 },
            messages: stripHistoricalQuickReplies([
              ...withUser,
              fallbackAssistant,
            ]) as unknown as Prisma.InputJsonValue,
            structuredDraft: draftSeed as unknown as Prisma.InputJsonValue,
          },
        });
        success = true;
        return toSessionDto(updated, {
          currentStep: fallbackStep,
          quickReplies: fallbackControls.quickReplies,
          requestedInput: fallbackControls.requestedInput,
          originSuggestions: userCtx.originSuggestions,
          homeCity: userCtx.homeCity,
          ownedVehicles,
        });
      }
    }

    const parsed = parsedSoft.data;
    let assistantText = parsed.assistantMessage;

    const patchSource = parsed.tripDraftPatch ?? parsed.tripDraft ?? {};
    let draft = sanitizeAndMergeDraft({
      previous: draftSeed,
      incoming: {
        ...patchSource,
        suggestions:
          parsed.suggestions ??
          parsed.destinationIdeas ??
          (patchSource as { suggestions?: unknown }).suggestions,
      },
      ownedVehicles,
      ownedGroups,
    });

    // Réappliquer patches déterministes après merge IA (limites, mode, etc.)
    draft = applyDeterministicDraftPatches(draft, trimmed, stepBefore);

    if (!draft.vehicleId) {
      const lower = trimmed.toLowerCase();
      const match = ownedVehicles.find(
        (v) =>
          lower === v.label.toLowerCase() ||
          lower.includes(v.label.toLowerCase()),
      );
      if (match) {
        draft = { ...draft, vehicleId: match.id, vehicleLabel: match.label };
      }
    }

    draft = await recalculateDraftEstimates(userId, draft, { strict: false });

    // Génération / secours de proposition concrète
    const stepMid = resolveCurrentStep(draft, {
      sessionStatus: session.status,
      hasTripTypeHint: true,
    });
    if (
      stepMid === "itinerary_proposal" ||
      trimmed === GENERATE_ITINERARY ||
      /proposer un itin[eé]raire|génère|genere/i.test(trimmed)
    ) {
      draft = ensureMinimalItineraryContent(draft);
    }

    // Si l’IA affirme une proposition sans contenu → forcer génération minimale
    if (
      /voici une proposition|confirmer cet itin[eé]raire/i.test(
        assistantText,
      ) &&
      !hasItineraryProposal(draft)
    ) {
      draft = ensureMinimalItineraryContent(draft);
    }

    const currentStep = resolveCurrentStep(draft, {
      sessionStatus: session.status,
      hasTripTypeHint: true,
    });
    const hasProposal = hasItineraryProposal(draft);
    const status = resolveSessionStatus(draft, currentStep);

    const controls = buildControlsForStep({
      step: currentStep,
      draft,
      ownedVehicles,
      homeCity: userCtx.homeCity,
      hasHome: Boolean(userCtx.home),
      originSuggestions: userCtx.originSuggestions,
      hasProposal,
    });

    // Quick replies : autorité serveur (filtre IA puis remplacement par étape)
    const filteredAi = filterAiQuickRepliesForStep(
      currentStep,
      parsed.quickReplies,
      ownedVehicles.map((v) => v.label),
    );
    let quickReplies =
      currentStep === "vehicle" && filteredAi && filteredAi.length > 0
        ? filteredAi
        : controls.quickReplies;

    // Ne jamais afficher confirmation sans proposition
    if (
      !hasProposal &&
      quickReplies.some((r) => /confirmer cet itin[eé]raire/i.test(r))
    ) {
      quickReplies = controls.quickReplies;
    }

    if (controls.forceAssistantMessage) {
      // Remplacer le message IA s’il est désynchronisé (ex. confirmation vide)
      if (
        currentStep !== "confirmation" ||
        !hasProposal ||
        /confirmer cet itin[eé]raire|voici une proposition/i.test(assistantText)
      ) {
        if (
          currentStep === "origin" ||
          currentStep === "destination_mode" ||
          currentStep === "destination_radius" ||
          currentStep === "itinerary_proposal" ||
          (currentStep === "confirmation" && !hasProposal)
        ) {
          assistantText = controls.forceAssistantMessage;
        }
      }
    }

    // Si message IA parle de dates mais étape = vehicle (ou inverse) : message serveur
    if (
      currentStep === "dates" &&
      /v[ée]hicule|elantra|acura/i.test(assistantText)
    ) {
      assistantText =
        "Quelle date précise souhaitez-vous pour ce départ? Vous pouvez indiquer un jour ou une plage.";
    }
    if (
      currentStep === "vehicle" &&
      /date|samedi|dimanche|juillet|août|aout/i.test(assistantText) &&
      !/v[ée]hicule/i.test(assistantText)
    ) {
      assistantText = "Quel véhicule souhaitez-vous utiliser pour ce voyage?";
    }

    if (
      hasProposal &&
      currentStep === "confirmation" &&
      !/voici|proposition|itinéraire|itineraire/i.test(assistantText)
    ) {
      assistantText =
        "Voici une proposition d’itinéraire concrète (voir le détail ci-dessous). Souhaitez-vous la confirmer ou modifier des détails?";
    }

    const requestedInput =
      controls.requestedInput ??
      inferRequestedInput(draft, parsed.requestedInput, currentStep);

    const assistantMessage = {
      id: randomUUID(),
      role: "assistant" as const,
      content: assistantText,
      createdAt: new Date().toISOString(),
      quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
    };

    const updated = await prisma.aiTripPlanningSession.update({
      where: { id: session.id },
      data: {
        status,
        sessionVersion: { increment: 1 },
        messages: stripHistoricalQuickReplies([
          ...withUser,
          assistantMessage,
        ]) as unknown as Prisma.InputJsonValue,
        structuredDraft: draft as unknown as Prisma.InputJsonValue,
      },
    });

    success = true;
    return toSessionDto(updated, {
      currentStep,
      quickReplies,
      requestedInput,
      originSuggestions: userCtx.originSuggestions,
      homeCity: userCtx.homeCity,
      ownedVehicles,
    });
  } catch (error) {
    errorCode =
      error instanceof AppError
        ? error.code
        : error instanceof Error
          ? error.name
          : "UNKNOWN";
    if (error instanceof AppError && error.code === "AI_INVALID_RESPONSE") {
      throw new AppError(
        "AI_INVALID_RESPONSE",
        "Une erreur temporaire a empêché l’assistant de poursuivre. Vos réponses ont été conservées.",
        502,
      );
    }
    throw error;
  } finally {
    await release();
    await recordAiUsage({
      userId,
      requestType: "trip_planning",
      provider: providerName,
      model,
      promptVersion: TRIP_PLANNER_PROMPT_VERSION,
      inputTokens,
      outputTokens,
      totalTokens,
      durationMs: Date.now() - started,
      success,
      errorCode,
      knowledgeMode: "trip_context",
    });
  }
}

export async function recalculatePlanningSession(
  userId: string,
  sessionId: string,
): Promise<TripPlannerSessionDto> {
  await assertTripPlannerAccess(userId);
  const session = await getOwnedSessionOrThrow(userId, sessionId);
  if (session.status === "created" || session.status === "abandoned") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Recalcul impossible pour cette session.",
      400,
    );
  }

  const draft = parseStoredDraft(session.structuredDraft);
  const next = await recalculateDraftEstimates(userId, draft, { strict: true });
  const ctx = await loadPlannerUserContext(userId);
  const updated = await prisma.aiTripPlanningSession.update({
    where: { id: session.id },
    data: {
      structuredDraft: next as unknown as Prisma.InputJsonValue,
    },
  });
  return toSessionDto(updated, {
    requestedInput: inferRequestedInput(next, null),
    originSuggestions: ctx.originSuggestions,
    homeCity: ctx.homeCity,
  });
}
