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
  toSessionDto,
} from "@/features/ai-trip-planner/services/dto";
import {
  buildRepairUserPayload,
  parseTripPlanningAiResponseSoft,
} from "@/features/ai-trip-planner/services/parse-ai-response";
import { sanitizeAndMergeDraft } from "@/features/ai-trip-planner/lib/sanitize-draft";
import { detectMissingFields } from "@/features/ai-trip-planner/lib/missing-fields";
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
import {
  DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS,
  HOME_QUICK_OTHER,
  HOME_QUICK_RECENT,
  HOME_QUICK_YES,
} from "@/features/ai-trip-planner/constants";
import type { TripPlannerSessionDto } from "@/features/ai-trip-planner/types";
import type { Prisma } from "@prisma/client";

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
        messages: [
          ...messages,
          {
            id: randomUUID(),
            role: "user",
            content: trimmed,
            createdAt: new Date().toISOString(),
          },
          assistantMessage,
        ] as unknown as Prisma.InputJsonValue,
      },
    });
    return toSessionDto(updated, {
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

    // Pré-remplir nom de ville QC sans coords (demande ensuite validation adresse si besoin)
    let draftSeed = previousDraft;
    if (quebecCity && !previousDraft.origin.name) {
      draftSeed = {
        ...previousDraft,
        origin: {
          ...previousDraft.origin,
          name: quebecCity,
          city: quebecCity,
          province: "Québec",
          country: "CA",
        },
      };
    }

    const systemPrompt = buildTripPlannerSystemPrompt({
      vehicles: ownedVehicles,
      groups: ownedGroups,
      currentDraftJson: JSON.stringify({
        ...draftSeed,
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
        const fallbackText =
          parsedSoft.conversationalFallback ??
          "J’ai bien reçu votre réponse. Pour continuer sans ambiguïté, pouvez-vous préciser ou sélectionner le lieu demandé?";
        const missing = detectMissingFields(draftSeed);
        const fallbackAssistant = {
          id: randomUUID(),
          role: "assistant" as const,
          content: fallbackText,
          createdAt: new Date().toISOString(),
          quickReplies: missing.includes("origin")
            ? userCtx.home
              ? [HOME_QUICK_YES, HOME_QUICK_OTHER, HOME_QUICK_RECENT]
              : [...DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS.slice(0, 5)]
            : undefined,
        };
        const updated = await prisma.aiTripPlanningSession.update({
          where: { id: session.id },
          data: {
            messages: [
              ...withUser,
              fallbackAssistant,
            ] as unknown as Prisma.InputJsonValue,
            structuredDraft: draftSeed as unknown as Prisma.InputJsonValue,
          },
        });
        success = true;
        return toSessionDto(updated, {
          requestedInput: inferRequestedInput(draftSeed, null),
          originSuggestions: userCtx.originSuggestions,
          homeCity: userCtx.homeCity,
        });
      }
    }

    const parsed = parsedSoft.data;
    let assistantText = parsed.assistantMessage;
    let quickReplies = [...parsed.quickReplies];
    let aiRequestedInput = parsed.requestedInput;

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

    // Après type de voyage : pousser la question départ domicile / adresse
    const looksLikeTripType =
      /road trip|escapade|famille|couple|destination|idées|idees/i.test(
        trimmed,
      );
    if (looksLikeTripType && !draft.origin.name) {
      if (userCtx.home && userCtx.homeCity) {
        assistantText = `Souhaitez-vous partir de votre domicile à ${userCtx.homeCity}?`;
        quickReplies = [HOME_QUICK_YES, HOME_QUICK_OTHER, HOME_QUICK_RECENT];
        aiRequestedInput = {
          type: "choice",
          field: "origin",
          placeholder: null,
          countryBias: "CA",
          regionBias: "QC",
        };
      } else {
        assistantText =
          "D’où souhaitez-vous partir? Vous pouvez saisir une adresse complète ou choisir une ville.";
        quickReplies = [
          ...DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS.slice(0, 6),
          "Saisir une adresse",
        ];
        aiRequestedInput = {
          type: "address",
          field: "origin",
          placeholder: "Entrez une adresse ou une ville",
          countryBias: "CA",
          regionBias: "QC",
        };
      }
    }

    if (trimmed === "Saisir une adresse") {
      aiRequestedInput = {
        type: "address",
        field: "origin",
        placeholder: "Entrez une adresse ou une ville",
        countryBias: "CA",
        regionBias: "QC",
      };
    }

    draft = await recalculateDraftEstimates(userId, draft, { strict: false });

    const missingFields = detectMissingFields(draft);
    let status: "collecting" | "proposing" | "ready_for_confirmation" =
      "collecting";
    if (missingFields.length === 0) {
      status = "ready_for_confirmation";
    } else if (
      draft.destination.name ||
      draft.stops.length > 0 ||
      draft.activities.length > 0 ||
      parsed.sessionStatus === "proposing"
    ) {
      status = "proposing";
    }

    const requestedInput = inferRequestedInput(draft, aiRequestedInput);

    if (
      quickReplies.length === 0 &&
      ownedVehicles.length > 1 &&
      missingFields.includes("vehicleId")
    ) {
      quickReplies = [
        ...ownedVehicles.slice(0, 3).map((v) => v.label),
        "Je déciderai plus tard",
      ];
    }

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
        messages: [
          ...withUser,
          assistantMessage,
        ] as unknown as Prisma.InputJsonValue,
        structuredDraft: draft as unknown as Prisma.InputJsonValue,
      },
    });

    success = true;
    return toSessionDto(updated, {
      requestedInput,
      originSuggestions: userCtx.originSuggestions,
      homeCity: userCtx.homeCity,
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
