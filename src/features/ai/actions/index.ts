"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/features/auth";
import { isAppError } from "@/lib/errors";
import {
  loadTripAssistantHistory,
  runTripAssistant,
} from "@/features/ai/services/trip-assistant";
import { applyProposedTripAction } from "@/features/ai/services/apply-action";
import { resolveTripAssistantAccess } from "@/features/ai/services/access";
import { clearTripAssistantConversation } from "@/features/ai/services/conversations";
import { DEMO_STATIC_RESPONSE, QUICK_ACTIONS } from "@/features/ai/constants";
import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import type { AiConversationDto } from "@/features/ai/services/conversations";
import { getRedis } from "@/lib/redis";

export type AiActionResult<T = unknown> =
  | { ok: true; data: T }
  | {
      ok: false;
      message: string;
      code?: string;
      estimatedAddedKm?: number;
      requiresLocationConfirmation?: boolean;
      requiresLargeDetourConfirmation?: boolean;
    };

export async function getTripAssistantBootstrapAction(tripId: string): Promise<
  AiActionResult<{
    canUsePersonalizedAi: boolean;
    canUseRecommendations: boolean;
    aiEnabled: boolean;
    quickActions: typeof QUICK_ACTIONS;
    conversation: AiConversationDto | null;
    demoResponse: TripAssistantResponse;
  }>
> {
  try {
    const user = await requireActiveUser();
    const access = await resolveTripAssistantAccess(user.id);
    const { isAiFeatureEnabled } = await import("@/services/ai");
    const conversation = access.canUsePersonalizedAi
      ? await loadTripAssistantHistory(user.id, tripId)
      : null;

    return {
      ok: true,
      data: {
        canUsePersonalizedAi: access.canUsePersonalizedAi,
        canUseRecommendations: access.canUseRecommendations,
        aiEnabled: isAiFeatureEnabled(),
        quickActions: QUICK_ACTIONS,
        conversation,
        demoResponse: DEMO_STATIC_RESPONSE,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: isAppError(error)
        ? error.message
        : "Impossible de charger l’assistant.",
      code: isAppError(error) ? error.code : "INTERNAL_ERROR",
    };
  }
}

export async function sendTripAssistantMessageAction(raw: {
  tripId: string;
  message: string;
  requestType?: string;
  includeLiveLocation?: boolean;
  liveLatitude?: number | null;
  liveLongitude?: number | null;
}): Promise<
  AiActionResult<{
    mode: "personalized" | "demo";
    response: TripAssistantResponse;
    conversationId: string | null;
    promptVersion: string;
    model: string | null;
  }>
> {
  try {
    const user = await requireActiveUser();
    const result = await runTripAssistant({ userId: user.id, raw });
    if (!result.ok) {
      return { ok: false, message: result.message, code: result.code };
    }
    return {
      ok: true,
      data: {
        mode: result.mode,
        response: result.response,
        conversationId: result.conversationId,
        promptVersion: result.promptVersion,
        model: result.model,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: isAppError(error)
        ? error.message
        : "L’assistant est temporairement indisponible.",
      code: isAppError(error) ? error.code : "AI_003",
    };
  }
}

export async function applyTripAssistantActionAction(raw: {
  tripId: string;
  action: unknown;
  confirm: boolean;
}): Promise<AiActionResult<{ message: string; applied: boolean }>> {
  try {
    const user = await requireActiveUser();
    const access = await resolveTripAssistantAccess(user.id);
    if (!access.canUsePersonalizedAi) {
      return {
        ok: false,
        message: "Passez à un forfait payant pour appliquer des suggestions.",
        code: "ACCESS_DENIED",
      };
    }

    const result = await applyProposedTripAction({
      userId: user.id,
      tripId: raw.tripId,
      action: raw.action,
      confirm: raw.confirm === true,
      planSlug: access.access.planSlug,
    });

    if (!result.ok) {
      return {
        ok: false,
        message: result.message,
        code: result.code,
        estimatedAddedKm: result.estimatedAddedKm,
        requiresLocationConfirmation: result.requiresLocationConfirmation,
        requiresLargeDetourConfirmation: result.requiresLargeDetourConfirmation,
      };
    }

    if (result.applied) {
      revalidatePath(`/dashboard/trips/${raw.tripId}`);
    }

    return {
      ok: true,
      data: {
        message: result.message,
        applied: result.applied,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: isAppError(error)
        ? error.message
        : "Impossible d’appliquer la suggestion.",
      code: isAppError(error) ? error.code : "AI_003",
    };
  }
}

export async function clearTripAssistantConversationAction(
  tripId: string,
): Promise<AiActionResult<{ cleared: boolean }>> {
  try {
    const user = await requireActiveUser();
    const access = await resolveTripAssistantAccess(user.id);
    if (!access.canUsePersonalizedAi) {
      return {
        ok: false,
        message: "Conversation personnalisée non disponible.",
        code: "ACCESS_DENIED",
      };
    }

    const result = await clearTripAssistantConversation(user.id, tripId);

    if (result.conversationId) {
      try {
        const redis = getRedis();
        if (redis.status !== "ready") await redis.connect();
        await redis.del(`ai:web:conv:${result.conversationId}`);
        await redis.del(`ai:web:conv:${tripId}`);
      } catch {
        /* best-effort */
      }
    }

    return { ok: true, data: { cleared: result.cleared } };
  } catch (error) {
    return {
      ok: false,
      message: isAppError(error)
        ? error.message
        : "Impossible d’effacer la conversation.",
      code: isAppError(error) ? error.code : "INTERNAL_ERROR",
    };
  }
}
