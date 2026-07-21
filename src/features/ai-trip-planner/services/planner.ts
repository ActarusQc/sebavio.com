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
  parseStoredDraft,
  parseStoredMessages,
  toSessionDto,
} from "@/features/ai-trip-planner/services/dto";
import { parseTripPlanningAiResponse } from "@/features/ai-trip-planner/services/parse-ai-response";
import { sanitizeAndMergeDraft } from "@/features/ai-trip-planner/lib/sanitize-draft";
import { detectMissingFields } from "@/features/ai-trip-planner/lib/missing-fields";
import {
  buildTripPlannerSystemPrompt,
  TRIP_PLANNER_PROMPT_VERSION,
  wrapTripPlannerUserPayload,
} from "@/features/ai-trip-planner/prompts/system";
import { recalculateDraftEstimates } from "@/features/ai-trip-planner/services/recalculate-estimates";
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

    const systemPrompt = buildTripPlannerSystemPrompt({
      vehicles: ownedVehicles,
      groups: ownedGroups,
      currentDraftJson: JSON.stringify(previousDraft),
    });
    const userPayload = wrapTripPlannerUserPayload({
      historySummary: summarizeHistory(withUser),
      userMessage: trimmed,
    });

    const provider = createAiProvider();
    providerName = provider.name;
    const aiResult = await provider.generateRawJsonResponse({
      systemPrompt,
      userPayload,
      model: config.model,
      timeoutMs: config.timeoutMs,
    });
    model = aiResult.model;
    inputTokens = aiResult.inputTokens;
    outputTokens = aiResult.outputTokens;
    totalTokens = aiResult.totalTokens;

    const parsed = parseTripPlanningAiResponse(aiResult.rawText);
    let draft = sanitizeAndMergeDraft({
      previous: previousDraft,
      incoming: {
        ...parsed.tripDraft,
        suggestions:
          parsed.suggestions ??
          parsed.destinationIdeas ??
          parsed.tripDraft.suggestions,
      },
      ownedVehicles,
      ownedGroups,
    });

    if (!draft.vehicleId) {
      const lower = trimmed.toLowerCase();
      const match = ownedVehicles.find(
        (v) =>
          lower === v.label.toLowerCase() ||
          lower.includes(v.label.toLowerCase()) ||
          v.label.toLowerCase().includes(lower),
      );
      if (match) {
        draft = {
          ...draft,
          vehicleId: match.id,
          vehicleLabel: match.label,
        };
      }
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

    const assistantMessage = {
      id: randomUUID(),
      role: "assistant" as const,
      content: parsed.assistantMessage,
      createdAt: new Date().toISOString(),
      quickReplies:
        parsed.quickReplies.length > 0
          ? parsed.quickReplies
          : ownedVehicles.length > 1 && missingFields.includes("vehicleId")
            ? [
                ...ownedVehicles.slice(0, 3).map((v) => v.label),
                "Je déciderai plus tard",
              ]
            : undefined,
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
    return toSessionDto(updated);
  } catch (error) {
    errorCode =
      error instanceof AppError
        ? error.code
        : error instanceof Error
          ? error.name
          : "UNKNOWN";
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
  const updated = await prisma.aiTripPlanningSession.update({
    where: { id: session.id },
    data: {
      structuredDraft: next as unknown as Prisma.InputJsonValue,
    },
  });
  return toSessionDto(updated);
}
