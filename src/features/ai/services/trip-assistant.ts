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
  recordAiWebSearchConversationUse,
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
import {
  detectRestaurantStyle,
  defaultMealDurationMinutes,
  isRestaurantSearchFollowUp,
  isSameStyleRequest,
  isStyleChangeWithinRequest,
  restaurantStyleLabel,
  type RestaurantStyleId,
} from "@/features/ai/lib/restaurant-preferences";
import {
  combineTripDateAndClock,
  resolveTripPositionAtTime,
} from "@/features/ai/services/resolve-position-at-time";
import {
  formatLocalClock,
  mealTypeLabelFr,
  resolveDepartureTiming,
  resolveMealTiming,
} from "@/features/ai/lib/meal-timing";
import {
  buildPendingRestaurantRequest,
  detectLegFromMessage,
  detectRegionHintFromMessage,
  extractActiveCompletedRestaurantRequest,
  extractPendingRestaurantRequest,
  isNewMealOccasion,
  isStyleOnlyClarificationReply,
  resolveMealDateIso,
} from "@/features/ai/lib/pending-assistant-request";
import {
  RESTAURANT_SEARCH_DEFAULT_RADIUS_KM,
  RESTAURANT_SEARCH_MAX_DETOUR_MINUTES,
  RESTAURANT_SEARCH_TIME_TOLERANCE_MINUTES,
  searchRestaurantsNearPosition,
} from "@/features/ai/services/search-restaurants-near";
import {
  buildNoRestaurantResultSuggestions,
  buildRestaurantClarificationResponse,
  filterOpenRestaurantRecommendations,
} from "@/features/ai/services/restaurant-flow";
import {
  LINGUISTIC_CORRECTION_INSTRUCTION,
  validateAndNormalizeFrenchResponse,
} from "@/features/ai/services/linguistic-validation";
import {
  collectTextsForLinguisticScan,
  findForbiddenAnglicisms,
} from "@/features/ai/lib/linguistic";
import type { TripAssistantIntent } from "@/features/ai/services/intent-router";
import type { PendingAssistantRequest } from "@/features/ai/lib/pending-assistant-request";

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

    const conversationEarly = await getOrCreateConversation(
      params.userId,
      input.tripId,
    );
    const history = await listConversationMessages(params.userId, input.tripId);
    const historyMessages =
      history?.messages.map((m) => ({
        role: m.role,
        content: m.content,
        structuredPayload: m.structuredPayload,
      })) ?? [];

    const pendingFromHistory = extractPendingRestaurantRequest(historyMessages);
    const completedRestaurant =
      extractActiveCompletedRestaurantRequest(historyMessages);

    let effectiveMessage = input.message;
    let activeMealRequest: PendingAssistantRequest | null = null;
    let forcedRestaurantStyle: RestaurantStyleId | null = null;
    let skipClarification = false;

    // Reprise après clarification style / confirmation « même style »
    if (pendingFromHistory && isStyleOnlyClarificationReply(input.message)) {
      const normalized = input.message
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "");

      if (
        pendingFromHistory.status === "awaiting_same_style_confirm" &&
        (normalized.includes("choisir un autre style") ||
          normalized === "choose_other_style")
      ) {
        const pending = {
          ...pendingFromHistory,
          status: "awaiting_style" as const,
          clarificationStep: "restaurant_style" as const,
          restaurantStyle: null,
          previousStyleLabel: pendingFromHistory.previousStyleLabel ?? null,
        };
        const clarificationResponse = buildRestaurantClarificationResponse(
          pending,
          pending.mealType,
        );
        await appendConversationMessages({
          conversationId: conversationEarly.id,
          userContent: input.message,
          assistantContent: clarificationResponse.answer,
          structured: clarificationResponse,
          model: null,
          promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
        });
        await recordAiUsage({
          userId: params.userId,
          tripId: input.tripId,
          requestType: input.requestType,
          provider: "local",
          model: "clarification",
          promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
          durationMs: Date.now() - started,
          success: true,
          planSlug: access.access.planSlug,
          knowledgeMode: "trip_context",
          webSearchUsed: false,
          intent: "restaurant_clarification",
          sourceCount: 0,
        });
        return {
          ok: true,
          mode: "personalized",
          response: clarificationResponse,
          conversationId: conversationEarly.id,
          promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
          model: null,
        };
      }

      if (
        pendingFromHistory.status === "awaiting_same_style_confirm" &&
        (normalized.includes("oui, conserver") ||
          normalized === "keep_previous_style") &&
        pendingFromHistory.restaurantStyle
      ) {
        activeMealRequest = {
          ...pendingFromHistory,
          status: "searching",
          clarificationStep: null,
        };
        forcedRestaurantStyle = pendingFromHistory.restaurantStyle;
        effectiveMessage = pendingFromHistory.originalMessage;
        skipClarification = true;
      } else {
        const style = detectRestaurantStyle(input.message);
        if (style) {
          activeMealRequest = {
            ...pendingFromHistory,
            restaurantStyle: style,
            status: "searching",
            clarificationStep: null,
          };
          forcedRestaurantStyle = style;
          effectiveMessage = pendingFromHistory.originalMessage;
          skipClarification = true;
        }
      }
    }

    let routing = routeTripAssistantRequest({
      message: effectiveMessage,
      requestType: input.requestType,
      hasExistingActivitiesInContext: (context.activities?.length ?? 0) > 0,
    });

    if (activeMealRequest && skipClarification) {
      routing = {
        intent: "restaurant_recommendation",
        knowledgeMode: "web_grounded",
        requiresRecommendationsEntitlement: true,
        needsRouteSearchContext: true,
        reason: "reprise après clarification style",
      };
    }

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

    const departureFromMessage =
      resolveDepartureTiming(effectiveMessage) ??
      (activeMealRequest
        ? {
            hour: activeMealRequest.departureHour,
            minute: activeMealRequest.departureMinute,
            source: "conversation" as const,
          }
        : completedRestaurant && isRestaurantSearchFollowUp(input.message)
          ? {
              hour: completedRestaurant.departureHour,
              minute: completedRestaurant.departureMinute,
              source: "conversation" as const,
            }
          : null);
    const mealFromMessage =
      resolveMealTiming(effectiveMessage) ??
      (activeMealRequest
        ? {
            mealType: activeMealRequest.mealType,
            targetHour: activeMealRequest.targetHour,
            targetMinute: activeMealRequest.targetMinute,
            targetTimeSource: "conversation" as const,
          }
        : completedRestaurant && isRestaurantSearchFollowUp(input.message)
          ? {
              mealType: completedRestaurant.mealType,
              targetHour: completedRestaurant.targetHour,
              targetMinute: completedRestaurant.targetMinute,
              targetTimeSource: "conversation" as const,
            }
          : null);

    const depForOccasion = departureFromMessage ?? {
      hour:
        activeMealRequest?.departureHour ??
        completedRestaurant?.departureHour ??
        8,
      minute:
        activeMealRequest?.departureMinute ??
        completedRestaurant?.departureMinute ??
        0,
      source: "trip_default" as const,
    };
    const mealForOccasion = mealFromMessage ?? {
      mealType: (activeMealRequest?.mealType ??
        completedRestaurant?.mealType ??
        "lunch") as "breakfast" | "lunch" | "dinner",
      targetHour:
        activeMealRequest?.targetHour ?? completedRestaurant?.targetHour ?? 12,
      targetMinute:
        activeMealRequest?.targetMinute ??
        completedRestaurant?.targetMinute ??
        0,
      targetTimeSource: "trip_default" as const,
    };
    const legForOccasion = detectLegFromMessage(effectiveMessage);
    const mealDateForOccasion = resolveMealDateIso(
      context.trip.departureDate,
      depForOccasion.hour,
      depForOccasion.minute,
      mealForOccasion.targetHour,
      mealForOccasion.targetMinute,
    );
    const regionHintForOccasion = detectRegionHintFromMessage(effectiveMessage);

    // Clarification style : une fois par nouvelle occasion de repas (pas depuis l’historique)
    if (routing.intent === "restaurant_recommendation" && !skipClarification) {
      const styleFromCurrentMessage = detectRestaurantStyle(input.message);
      const styleChange = isStyleChangeWithinRequest(input.message);
      const followUp = isRestaurantSearchFollowUp(input.message);
      const sameStyleAsk = isSameStyleRequest(input.message);

      const referenceRequest =
        completedRestaurant &&
        !isNewMealOccasion(completedRestaurant, {
          mealType: mealForOccasion.mealType,
          targetHour: mealForOccasion.targetHour,
          targetMinute: mealForOccasion.targetMinute,
          mealDate: mealDateForOccasion,
          leg: legForOccasion,
          message: input.message,
          regionHint: regionHintForOccasion,
        })
          ? completedRestaurant
          : null;

      // « Même style que précédemment » → confirmation, jamais de réutilisation silencieuse
      if (
        sameStyleAsk &&
        completedRestaurant?.restaurantStyle &&
        (!referenceRequest ||
          isNewMealOccasion(completedRestaurant, {
            mealType: mealForOccasion.mealType,
            targetHour: mealForOccasion.targetHour,
            targetMinute: mealForOccasion.targetMinute,
            mealDate: mealDateForOccasion,
            leg: legForOccasion,
            message: input.message,
            regionHint: regionHintForOccasion,
          }))
      ) {
        const pending = buildPendingRestaurantRequest({
          tripId: input.tripId,
          originalMessage: effectiveMessage,
          departureHour: depForOccasion.hour,
          departureMinute: depForOccasion.minute,
          mealType: mealForOccasion.mealType,
          targetHour: mealForOccasion.targetHour,
          targetMinute: mealForOccasion.targetMinute,
          mealDate: mealDateForOccasion,
          targetLocalTime: `${mealForOccasion.targetHour} h ${String(mealForOccasion.targetMinute).padStart(2, "0")}`,
          leg: legForOccasion,
          restaurantStyle: completedRestaurant.restaurantStyle,
          previousStyleLabel: restaurantStyleLabel(
            completedRestaurant.restaurantStyle,
          ),
          regionHint: regionHintForOccasion,
          status: "awaiting_same_style_confirm",
          clarificationStep: "same_style_confirm",
        });
        const clarificationResponse = buildRestaurantClarificationResponse(
          pending,
          mealForOccasion.mealType,
        );
        await appendConversationMessages({
          conversationId: conversationEarly.id,
          userContent: input.message,
          assistantContent: clarificationResponse.answer,
          structured: clarificationResponse,
          model: null,
          promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
        });
        await recordAiUsage({
          userId: params.userId,
          tripId: input.tripId,
          requestType: input.requestType,
          provider: "local",
          model: "clarification",
          promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
          durationMs: Date.now() - started,
          success: true,
          planSlug: access.access.planSlug,
          knowledgeMode: "trip_context",
          webSearchUsed: false,
          intent: "restaurant_clarification",
          sourceCount: 0,
        });
        return {
          ok: true,
          mode: "personalized",
          response: clarificationResponse,
          conversationId: conversationEarly.id,
          promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
          model: null,
        };
      }

      // Suivi même demande (« voir plus ») ou changement de style dans la demande
      if (referenceRequest?.restaurantStyle && (followUp || styleChange)) {
        forcedRestaurantStyle = styleChange
          ? (styleFromCurrentMessage ?? referenceRequest.restaurantStyle)
          : referenceRequest.restaurantStyle;
        activeMealRequest = {
          ...referenceRequest,
          restaurantStyle: forcedRestaurantStyle,
          status: "searching",
          clarificationStep: null,
          originalMessage: styleChange
            ? effectiveMessage
            : referenceRequest.originalMessage,
        };
        skipClarification = true;
      } else if (styleFromCurrentMessage) {
        // Style explicite dans le message courant → nouvelle recherche sans clarification
        forcedRestaurantStyle = styleFromCurrentMessage;
        activeMealRequest = buildPendingRestaurantRequest({
          tripId: input.tripId,
          originalMessage: effectiveMessage,
          departureHour: depForOccasion.hour,
          departureMinute: depForOccasion.minute,
          mealType: mealForOccasion.mealType,
          targetHour: mealForOccasion.targetHour,
          targetMinute: mealForOccasion.targetMinute,
          mealDate: mealDateForOccasion,
          leg: legForOccasion,
          restaurantStyle: styleFromCurrentMessage,
          regionHint: regionHintForOccasion,
          status: "searching",
          clarificationStep: null,
          requestId:
            referenceRequest &&
            !isNewMealOccasion(referenceRequest, {
              mealType: mealForOccasion.mealType,
              targetHour: mealForOccasion.targetHour,
              targetMinute: mealForOccasion.targetMinute,
              mealDate: mealDateForOccasion,
              leg: legForOccasion,
              message: input.message,
              regionHint: regionHintForOccasion,
            })
              ? referenceRequest.requestId
              : undefined,
        });
        skipClarification = true;
      } else if (!followUp) {
        // Nouvelle occasion sans style → clarification (ignore l’historique)
        const pending = buildPendingRestaurantRequest({
          tripId: input.tripId,
          originalMessage: effectiveMessage,
          departureHour: depForOccasion.hour,
          departureMinute: depForOccasion.minute,
          mealType: mealForOccasion.mealType,
          targetHour: mealForOccasion.targetHour,
          targetMinute: mealForOccasion.targetMinute,
          mealDate: mealDateForOccasion,
          leg: legForOccasion,
          restaurantStyle: null,
          regionHint: regionHintForOccasion,
          status: "awaiting_style",
          clarificationStep: "restaurant_style",
        });
        const clarificationResponse = buildRestaurantClarificationResponse(
          pending,
          mealForOccasion.mealType,
        );
        await appendConversationMessages({
          conversationId: conversationEarly.id,
          userContent: input.message,
          assistantContent: clarificationResponse.answer,
          structured: clarificationResponse,
          model: null,
          promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
        });
        await recordAiUsage({
          userId: params.userId,
          tripId: input.tripId,
          requestType: input.requestType,
          provider: "local",
          model: "clarification",
          promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
          durationMs: Date.now() - started,
          success: true,
          planSlug: access.access.planSlug,
          knowledgeMode: "trip_context",
          webSearchUsed: false,
          intent: "restaurant_clarification",
          sourceCount: 0,
        });
        return {
          ok: true,
          mode: "personalized",
          response: clarificationResponse,
          conversationId: conversationEarly.id,
          promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
          model: null,
        };
      }
    }

    const restaurantStyle: RestaurantStyleId | null =
      routing.intent === "restaurant_recommendation"
        ? (forcedRestaurantStyle ??
          detectRestaurantStyle(input.message) ??
          activeMealRequest?.restaurantStyle ??
          null)
        : null;

    const knowledgeMode = routing.knowledgeMode;
    let enableWebSearch = false;
    let routeSearchJson: string | null = null;
    let routeSearch = null;
    let mealPositionJson: string | null = null;
    let restaurantCandidatesJson: string | null = null;
    let placesFailed = false;
    let placesCandidateCount = 0;
    let targetProgressKm: number | null = null;
    let mealLocalClockLabel: string | null = null;
    let mealPositionNearestCity: string | null = null;

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

      await assertAiWebSearchLimits({
        userId: params.userId,
        conversationId: conversationEarly.id,
        tripId: input.tripId,
      });
      enableWebSearch = true;

      // Pour restaurants : ne PAS injecter le mi-parcours (induit Québec).
      // Garder routeSearch seulement pour hébergement / tourisme.
      if (
        routing.needsRouteSearchContext &&
        routing.intent !== "restaurant_recommendation"
      ) {
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

      if (routing.intent === "restaurant_recommendation" && restaurantStyle) {
        const depClock = departureFromMessage ?? {
          hour: activeMealRequest?.departureHour ?? 8,
          minute: activeMealRequest?.departureMinute ?? 0,
          source: "trip_default" as const,
        };
        const mealTiming = mealFromMessage ?? {
          mealType: (activeMealRequest?.mealType ?? "lunch") as
            "breakfast" | "lunch" | "dinner",
          targetHour: activeMealRequest?.targetHour ?? 12,
          targetMinute: activeMealRequest?.targetMinute ?? 0,
          targetTimeSource: "trip_default" as const,
        };
        const departureDateTime = combineTripDateAndClock(
          context.trip.departureDate,
          { hour: depClock.hour, minute: depClock.minute },
        );
        let targetDateTime = combineTripDateAndClock(
          context.trip.departureDate,
          {
            hour: mealTiming.targetHour,
            minute: mealTiming.targetMinute,
          },
        );
        if (targetDateTime <= departureDateTime) {
          targetDateTime = new Date(
            targetDateTime.getTime() + 24 * 60 * 60 * 1000,
          );
        }

        mealLocalClockLabel = formatLocalClock(targetDateTime);

        const mealPosition = await resolveTripPositionAtTime({
          tripId: input.tripId,
          userId: params.userId,
          departureDateTime,
          targetDateTime,
          leg: activeMealRequest?.leg ?? legForOccasion,
        });

        if (mealPosition) {
          targetProgressKm = mealPosition.routeProgressKm;
          mealPositionNearestCity = mealPosition.nearestCity;
          if (activeMealRequest) {
            activeMealRequest = {
              ...activeMealRequest,
              regionHint: mealPosition.nearestCity,
              targetLocalTime:
                mealLocalClockLabel ?? activeMealRequest.targetLocalTime,
              mealDate: targetDateTime.toISOString().slice(0, 10),
            };
          }
          mealPositionJson = JSON.stringify({
            targetLocalTime: mealLocalClockLabel,
            mealTypeFr: mealTypeLabelFr(mealTiming.mealType),
            departureLocalTime: formatLocalClock(departureDateTime),
            departureSource: depClock.source,
            mealSource: mealTiming.targetTimeSource,
            restaurantPreferenceForCurrentRequest: restaurantStyle,
            requestId: activeMealRequest?.requestId ?? null,
            estimatedPosition: {
              latitude: mealPosition.latitude,
              longitude: mealPosition.longitude,
              nearestCity: mealPosition.nearestCity,
              routeProgressKm: mealPosition.routeProgressKm,
              routeProgressRatio: mealPosition.routeProgressRatio,
              confidence: mealPosition.confidence,
              elapsedDrivingMinutes: mealPosition.elapsedDrivingMinutes,
              elapsedStopMinutes: mealPosition.elapsedStopMinutes,
            },
            allowedSearchRadiusKm: RESTAURANT_SEARCH_DEFAULT_RADIUS_KM,
            maximumDetourMinutes: RESTAURANT_SEARCH_MAX_DETOUR_MINUTES,
            searchWindowMinutes: RESTAURANT_SEARCH_TIME_TOLERANCE_MINUTES,
            style: restaurantStyle,
            styleLabel: restaurantStyleLabel(restaurantStyle),
            proposedMealDurationMinutes:
              defaultMealDurationMinutes(restaurantStyle),
            instruction:
              "Rechercher uniquement près de estimatedPosition. Ne pas choisir une autre ville du corridor. restaurantPreferenceForCurrentRequest ne s’applique qu’à ce requestId.",
          });

          console.info("[ai] restaurant_meal_position", {
            nearestCity: mealPosition.nearestCity,
            routeProgressKm: mealPosition.routeProgressKm,
            confidence: mealPosition.confidence,
            elapsedDrivingMinutes: mealPosition.elapsedDrivingMinutes,
            departureSource: depClock.source,
            mealType: mealTiming.mealType,
            requestId: activeMealRequest?.requestId,
            style: restaurantStyle,
          });

          try {
            const candidates = await searchRestaurantsNearPosition({
              tripId: input.tripId,
              userId: params.userId,
              latitude: mealPosition.latitude,
              longitude: mealPosition.longitude,
              style: restaurantStyle,
            });
            placesCandidateCount = candidates.length;
            if (candidates.length > 0) {
              restaurantCandidatesJson = JSON.stringify({
                count: candidates.length,
                candidates: candidates.slice(0, 8).map((c) => ({
                  name: c.name,
                  city: c.city,
                  address: c.address,
                  latitude: c.latitude,
                  longitude: c.longitude,
                  rating: c.rating,
                  ratingCount: c.ratingCount,
                  priceLevel: c.priceLevel,
                  websiteUrl: c.websiteUrl,
                  googleMapsUrl: c.googleMapsUrl,
                  primaryType: c.primaryType,
                })),
              });
            }
          } catch {
            placesFailed = true;
          }
        }
      }
    }

    const systemPrompt = buildTripAssistantSystemPrompt({
      knowledgeMode,
      webSearchEnabled: enableWebSearch,
      channel: input.channel,
      usageMode: input.usageMode,
    });
    const userPayload = wrapUserPayload({
      requestType: input.requestType,
      message: effectiveMessage,
      contextJson: JSON.stringify(context),
      routeSearchJson,
      mealPositionJson,
      restaurantCandidatesJson,
      intent: routing.intent,
      knowledgeMode,
      restaurantStyle,
    });

    void (routing.intent as TripAssistantIntent);
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

    let result =
      input.requestType === "analyze"
        ? await provider.analyzeTrip(providerInput)
        : await provider.generateTripAssistantResponse(providerInput);

    // Retry linguistique uniquement hors recherche Web (évite de perdre citations / outils)
    const firstScan = findForbiddenAnglicisms(
      collectTextsForLinguisticScan(result.response),
    );
    if (firstScan.length > 0 && provider.name !== "mock" && !enableWebSearch) {
      console.warn("[ai] linguistic_retry", {
        codes: [...new Set(firstScan.map((i) => i.code))],
      });
      try {
        result = await provider.generateTripAssistantResponse({
          ...providerInput,
          systemPrompt: `${systemPrompt}\n${LINGUISTIC_CORRECTION_INSTRUCTION}`,
          enableWebSearch: false,
          timeoutMs: config.timeoutMs,
        });
      } catch {
        /* conserve la première réponse */
      }
    } else if (firstScan.length > 0) {
      console.warn("[ai] linguistic_normalize_only", {
        codes: [...new Set(firstScan.map((i) => i.code))],
        webSearch: enableWebSearch,
      });
    }

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
      clarification: null,
      pendingRequest:
        routing.intent === "restaurant_recommendation" &&
        restaurantStyle &&
        activeMealRequest
          ? {
              ...activeMealRequest,
              restaurantStyle,
              status: "completed",
              clarificationStep: null,
            }
          : null,
    };

    response = enforceMichelinVerification(response, mergedSources);
    response = await enrichRestaurantRouteImpacts({
      tripId: input.tripId,
      userId: params.userId,
      response,
      routeSearch,
      targetProgressKm,
      mealLocalClockLabel,
    });
    response = filterOpenRestaurantRecommendations(response);

    // Préfixe secteur déterministe si manquant
    if (
      routing.intent === "restaurant_recommendation" &&
      mealPositionNearestCity &&
      !response.answer
        .toLowerCase()
        .includes(mealPositionNearestCity.toLowerCase().slice(0, 8))
    ) {
      const depLabel =
        departureFromMessage != null
          ? `${departureFromMessage.hour} h${departureFromMessage.minute ? ` ${String(departureFromMessage.minute).padStart(2, "0")}` : ""}`
          : "votre heure de départ";
      response = {
        ...response,
        answer: `Selon votre départ à ${depLabel} et les étapes actuellement prévues, vous devriez être dans le secteur de ${mealPositionNearestCity} vers ${mealLocalClockLabel ?? "midi"}.\n\n${response.answer}`,
      };
    }

    if (
      routing.intent === "restaurant_recommendation" &&
      (response.restaurantRecommendations?.length ?? 0) === 0 &&
      !response.clarification?.required
    ) {
      const answerBase =
        placesFailed && !response.webSearchUsed
          ? "Je ne peux pas vérifier les restaurants pour le moment. Votre voyage reste accessible; veuillez réessayer dans quelques instants."
          : "Je n’ai pas trouvé d’établissement dont les heures à midi peuvent être confirmées dans un détour raisonnable.";
      response = {
        ...response,
        status: "incomplete",
        answer: response.answer?.includes("établissement")
          ? response.answer
          : answerBase,
        suggestions:
          response.suggestions.length > 0
            ? response.suggestions
            : buildNoRestaurantResultSuggestions(),
      };
    }

    const linguistic = validateAndNormalizeFrenchResponse(response);
    const completedPending =
      routing.intent === "restaurant_recommendation" &&
      restaurantStyle &&
      activeMealRequest
        ? {
            ...activeMealRequest,
            restaurantStyle,
            status: "completed" as const,
            clarificationStep: null,
          }
        : null;
    response = {
      ...linguistic.response,
      pendingRequest: completedPending,
      restaurantRecommendations: (
        linguistic.response.restaurantRecommendations ?? []
      ).map((r) => ({
        ...r,
        estimatedArrivalTime:
          formatLocalClock(r.estimatedArrivalTime) ??
          mealLocalClockLabel ??
          (typeof r.estimatedArrivalTime === "string" &&
          r.estimatedArrivalTime.includes("T")
            ? mealLocalClockLabel
            : r.estimatedArrivalTime),
      })),
    };

    if (placesCandidateCount > 0) {
      console.info("[ai] restaurant_places_candidates", {
        placesCandidateCount,
        finalCount: response.restaurantRecommendations?.length ?? 0,
        nearestCity: mealPositionNearestCity,
      });
    }

    await appendConversationMessages({
      conversationId: conversationEarly.id,
      userContent: input.message,
      assistantContent: response.answer,
      structured: response,
      model: result.model,
      promptVersion: TRIP_ASSISTANT_PROMPT_VERSION,
    });

    const restaurantCount = response.restaurantRecommendations?.length ?? 0;

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
      sourceCount:
        routing.intent === "restaurant_recommendation"
          ? restaurantCount
          : response.sources.length,
    });
    if (response.webSearchUsed) {
      await recordAiWebSearchConversationUse(
        conversationEarly.id,
        input.tripId,
      );
    }

    return {
      ok: true,
      mode: "personalized",
      response,
      conversationId: conversationEarly.id,
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
