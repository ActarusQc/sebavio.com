import "server-only";

import { isAppError, AppError } from "@/lib/errors";
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
  assertAiWebSearchLimits,
} from "@/features/ai/services/rate-limit";
import {
  appendConversationMessages,
  getOrCreateConversation,
  listConversationMessages,
  type AiConversationDto,
} from "@/features/ai/services/conversations";
import { recordAiUsage } from "@/features/ai/services/usage";
import { routeTripAssistantRequest } from "@/features/ai/services/intent-router";
import { buildRouteSearchContext } from "@/features/ai/services/route-search-context";
import {
  enforceMichelinVerification,
  mergeAndSanitizeSources,
} from "@/features/ai/services/verify-claims";
import { enrichRestaurantRouteImpacts } from "@/features/ai/services/enrich-route-impact";
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

  if (!access.canUsePersonalizedAi) {
    await recordAiUsage({
      userId: params.userId,
      tripId: input.tripId,
      requestType: input.requestType,
      durationMs: Date.now() - started,
      success: true,
      planSlug: access.access.planSlug,
      promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
      provider: "demo",
      model: "demo-static",
      knowledgeMode: "trip_context",
      webSearchUsed: false,
      intent: "general_question",
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
      provider: config.provider,
      model: config.model || null,
    });
    return {
      ok: false,
      message:
        "L’assistant est temporairement indisponible. Réessayez plus tard.",
      code: "AI_DISABLED",
    };
  }

  let release: (() => Promise<void>) | null = null;
  try {
    await assertTripAssistantEntitlements(params.userId, input.requestType);
    await assertAiRateLimit(params.userId);
    release = await acquireAiRequestLock(params.userId, input.tripId);
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
      provider: config.provider,
      model: config.model || null,
    });
    return { ok: false, message, code };
  }

  try {
    const context = await buildTripAssistantContext({
      userId: params.userId,
      tripId: input.tripId,
      requestType: input.requestType,
      includeLiveLocation: input.includeLiveLocation,
      liveLatitude: input.liveLatitude,
      liveLongitude: input.liveLongitude,
    });

    const routing = routeTripAssistantRequest({
      message: input.message,
      requestType: input.requestType,
      hasExistingActivitiesInContext: (context.activities?.length ?? 0) > 0,
    });

    if (
      routing.requiresRecommendationsEntitlement &&
      !access.canUseRecommendations
    ) {
      throw new AppError(
        "ACCESS_DENIED",
        "Les recommandations IA ne sont pas incluses dans votre forfait.",
        403,
      );
    }

    const knowledgeMode = routing.knowledgeMode;
    let enableWebSearch = false;
    let routeSearchJson: string | null = null;
    let routeSearch = null;

    if (routing.knowledgeMode === "web_grounded") {
      if (!config.webSearchEnabled) {
        await recordAiUsage({
          userId: params.userId,
          tripId: input.tripId,
          requestType: input.requestType,
          provider: config.provider,
          model: config.model,
          promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
          durationMs: Date.now() - started,
          success: false,
          errorCode: "AI_WEB_SEARCH_DISABLED",
          planSlug: access.access.planSlug,
          knowledgeMode: "web_grounded",
          webSearchUsed: false,
          intent: routing.intent,
        });
        return {
          ok: false,
          message:
            "Je ne peux pas rechercher des établissements en ligne pour le moment.",
          code: "AI_WEB_SEARCH_DISABLED",
        };
      }

      const conversation = await getOrCreateConversation(
        params.userId,
        input.tripId,
      );
      await assertAiWebSearchLimits({
        userId: params.userId,
        conversationId: conversation.id,
        tripId: input.tripId,
      });
      enableWebSearch = true;

      if (routing.needsRouteSearchContext) {
        routeSearch = await buildRouteSearchContext({
          tripId: input.tripId,
          userId: params.userId,
          searchRadiusKm: config.routeSearchRadiusKm,
          maxDetourKm: config.routeMaxDetourKm,
        });
        if (routeSearch) {
          routeSearchJson = JSON.stringify(routeSearch);
        }
      }
    }

    const systemPrompt = buildTripAssistantSystemPrompt({
      knowledgeMode,
      webSearchEnabled: enableWebSearch,
    });
    const userPayload = wrapUserPayload({
      requestType: input.requestType,
      message: input.message,
      contextJson: JSON.stringify(context),
      routeSearchJson,
      intent: routing.intent,
      knowledgeMode,
    });

    const provider = createAiProvider();
    const providerInput = {
      systemPrompt,
      userPayload,
      requestType: input.requestType,
      model: config.model,
      timeoutMs: enableWebSearch ? config.webSearchTimeoutMs : config.timeoutMs,
      knowledgeMode,
      enableWebSearch,
    };

    const result =
      input.requestType === "analyze"
        ? await provider.analyzeTrip(providerInput)
        : await provider.generateTripAssistantResponse(providerInput);

    const mergedSources = mergeAndSanitizeSources(
      result.response.sources,
      result.citationSources,
    );

    let response: TripAssistantResponse = {
      ...result.response,
      knowledgeMode,
      webSearchUsed: enableWebSearch && result.webSearchUsed,
      sources: mergedSources,
      restaurantRecommendations:
        result.response.restaurantRecommendations ?? [],
    };

    response = enforceMichelinVerification(response, mergedSources);
    response = await enrichRestaurantRouteImpacts({
      tripId: input.tripId,
      userId: params.userId,
      response,
      routeSearch,
    });

    const conversation = await getOrCreateConversation(
      params.userId,
      input.tripId,
    );
    await appendConversationMessages({
      conversationId: conversation.id,
      userContent: input.message,
      assistantContent: response.answer,
      structured: response,
      model: result.model,
      promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
    });

    await recordAiUsage({
      userId: params.userId,
      tripId: input.tripId,
      requestType: input.requestType,
      provider: provider.name,
      model: result.model,
      promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.totalTokens,
      durationMs: Date.now() - started,
      success: true,
      planSlug: access.access.planSlug,
      knowledgeMode,
      webSearchUsed: response.webSearchUsed,
      webSearchCallCount: result.webSearchCallCount,
      intent: routing.intent,
      sourceCount: response.sources.length,
    });

    return {
      ok: true,
      mode: "personalized",
      response,
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
      provider: config.provider,
      durationMs: Date.now() - started,
      success: false,
      errorCode: code,
      planSlug: access.access.planSlug,
      promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
    });
    return { ok: false, message, code };
  } finally {
    if (release) await release();
  }
}

export async function loadTripAssistantHistory(
  userId: string,
  tripId: string,
): Promise<AiConversationDto | null> {
  await getOwnedTripOrThrow(userId, tripId);
  return listConversationMessages(userId, tripId);
}
