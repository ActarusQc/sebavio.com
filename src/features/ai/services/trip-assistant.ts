import "server-only";

import { isAppError } from "@/lib/errors";
import { getAiRuntimeConfig, createAiProvider } from "@/services/ai";
import {
  TRIP_ASSISTANT_PROMPT_VERSION,
  DEMO_STATIC_RESPONSE,
} from "@/features/ai/constants";
import {
  buildTripAssistantSystemPrompt,
  wrapUserPayload,
} from "@/features/ai/prompts/trip-assistant";
import { tripAssistantMessageInputSchema } from "@/features/ai/schemas/request";
import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import { buildTripAssistantContext } from "@/features/ai/services/context-builder";
import {
  assertTripAssistantEntitlements,
  resolveTripAssistantAccess,
} from "@/features/ai/services/access";
import {
  acquireAiRequestLock,
  assertAiRateLimit,
} from "@/features/ai/services/rate-limit";
import {
  appendConversationMessages,
  getOrCreateConversation,
  listConversationMessages,
  type AiConversationDto,
} from "@/features/ai/services/conversations";
import { recordAiUsage } from "@/features/ai/services/usage";
import { getOwnedTripOrThrow } from "@/features/trips/services/trips";

export type TripAssistantRunResult =
  | {
      ok: true;
      mode: "personalized" | "demo";
      response: TripAssistantResponse;
      conversationId: string | null;
      promptVersion: string;
      model: string | null;
    }
  | { ok: false; message: string; code: string };

/**
 * Orchestrateur assistant voyage.
 */
export async function runTripAssistant(params: {
  userId: string;
  raw: unknown;
}): Promise<TripAssistantRunResult> {
  const started = Date.now();
  const config = getAiRuntimeConfig();

  const parsed = tripAssistantMessageInputSchema.safeParse(params.raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Demande invalide.",
      code: "VALIDATION_ERROR",
    };
  }

  const input = parsed.data;
  if (input.message.length > config.maxMessageChars) {
    return {
      ok: false,
      message: `Message trop long (max. ${config.maxMessageChars} caractères).`,
      code: "AI_001",
    };
  }

  try {
    await getOwnedTripOrThrow(params.userId, input.tripId);
  } catch (error) {
    if (isAppError(error) && error.code === "TRIP_001") {
      return { ok: false, message: error.message, code: error.code };
    }
    throw error;
  }

  const access = await resolveTripAssistantAccess(params.userId);

  // Forfait gratuit : démo statique, aucune donnée voyage vers l’IA
  if (!access.canUsePersonalizedAi) {
    await recordAiUsage({
      userId: params.userId,
      tripId: input.tripId,
      requestType: input.requestType,
      durationMs: Date.now() - started,
      success: true,
      planSlug: access.access.planSlug,
      promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
      model: "demo-static",
    });
    return {
      ok: true,
      mode: "demo",
      response: DEMO_STATIC_RESPONSE,
      conversationId: null,
      promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
      model: "demo-static",
    };
  }

  if (!config.enabled) {
    await recordAiUsage({
      userId: params.userId,
      tripId: input.tripId,
      requestType: input.requestType,
      durationMs: Date.now() - started,
      success: false,
      errorCode: "AI_DISABLED",
      planSlug: access.access.planSlug,
    });
    return {
      ok: false,
      message:
        "L’assistant est temporairement indisponible. Réessayez plus tard.",
      code: "AI_DISABLED",
    };
  }

  try {
    await assertTripAssistantEntitlements(params.userId, input.requestType);
    await assertAiRateLimit(params.userId);
  } catch (error) {
    const code = isAppError(error) ? error.code : "ACCESS_DENIED";
    const message = isAppError(error) ? error.message : "Accès refusé.";
    await recordAiUsage({
      userId: params.userId,
      tripId: input.tripId,
      requestType: input.requestType,
      durationMs: Date.now() - started,
      success: false,
      errorCode: code,
      planSlug: access.access.planSlug,
    });
    return { ok: false, message, code };
  }

  const release = await acquireAiRequestLock(params.userId, input.tripId);

  try {
    const context = await buildTripAssistantContext({
      userId: params.userId,
      tripId: input.tripId,
      requestType: input.requestType,
      includeLiveLocation: input.includeLiveLocation,
      liveLatitude: input.liveLatitude,
      liveLongitude: input.liveLongitude,
    });

    const systemPrompt = buildTripAssistantSystemPrompt();
    const userPayload = wrapUserPayload({
      requestType: input.requestType,
      message: input.message,
      contextJson: JSON.stringify(context),
    });

    const provider = createAiProvider();
    const result =
      input.requestType === "analyze"
        ? await provider.analyzeTrip({
            systemPrompt,
            userPayload,
            requestType: input.requestType,
            model: config.model,
            timeoutMs: config.timeoutMs,
          })
        : await provider.generateTripAssistantResponse({
            systemPrompt,
            userPayload,
            requestType: input.requestType,
            model: config.model,
            timeoutMs: config.timeoutMs,
          });

    const conversation = await getOrCreateConversation(
      params.userId,
      input.tripId,
    );
    await appendConversationMessages({
      conversationId: conversation.id,
      userContent: input.message,
      assistantContent: result.response.answer,
      structured: result.response,
      model: result.model,
      promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
    });

    await recordAiUsage({
      userId: params.userId,
      tripId: input.tripId,
      requestType: input.requestType,
      model: result.model,
      promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.totalTokens,
      durationMs: Date.now() - started,
      success: true,
      planSlug: access.access.planSlug,
    });

    return {
      ok: true,
      mode: "personalized",
      response: result.response,
      conversationId: conversation.id,
      promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
      model: result.model,
    };
  } catch (error) {
    const code = isAppError(error) ? error.code : "AI_003";
    const message = isAppError(error)
      ? error.message
      : "L’assistant est temporairement indisponible.";
    console.error("[ai] trip assistant failed", {
      code,
      name: error instanceof Error ? error.name : "unknown",
    });
    await recordAiUsage({
      userId: params.userId,
      tripId: input.tripId,
      requestType: input.requestType,
      durationMs: Date.now() - started,
      success: false,
      errorCode: code,
      planSlug: access.access.planSlug,
      promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
    });
    return { ok: false, message, code };
  } finally {
    await release();
  }
}

export async function loadTripAssistantHistory(
  userId: string,
  tripId: string,
): Promise<AiConversationDto | null> {
  await getOwnedTripOrThrow(userId, tripId);
  return listConversationMessages(userId, tripId);
}
