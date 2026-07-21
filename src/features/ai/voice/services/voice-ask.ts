import "server-only";

import { runTripAssistant } from "@/features/ai/services/trip-assistant";
import { buildVoiceSpokenText } from "@/features/ai/voice/services/voice-summary";
import type { VoiceUsageMode } from "@/features/ai/voice/types";
import type { TripAssistantResponse } from "@/features/ai/schemas/response";

export type VoiceAskResult =
  | {
      ok: true;
      spokenText: string;
      displayAnswer: string;
      structured: TripAssistantResponse;
      conversationId: string | null;
      confirmationRequired: boolean;
      proposedAction: unknown | null;
      mode: "personalized" | "demo";
    }
  | { ok: false; message: string; code: string };

/**
 * Pont vocal → même cerveau que le chat texte (`runTripAssistant`).
 */
export async function runVoiceAsk(params: {
  userId: string;
  tripId: string;
  message: string;
  usageMode?: VoiceUsageMode;
  includeLiveLocation?: boolean;
  liveLatitude?: number | null;
  liveLongitude?: number | null;
}): Promise<VoiceAskResult> {
  const usageMode = params.usageMode ?? "conversation";

  const result = await runTripAssistant({
    userId: params.userId,
    raw: {
      tripId: params.tripId,
      message: params.message,
      requestType: "chat",
      includeLiveLocation: params.includeLiveLocation ?? false,
      liveLatitude: params.liveLatitude ?? null,
      liveLongitude: params.liveLongitude ?? null,
      channel: "voice",
      usageMode,
    },
  });

  if (!result.ok) {
    return { ok: false, message: result.message, code: result.code };
  }

  const { spokenText, confirmationRequired, proposedAction } =
    buildVoiceSpokenText(result.response, usageMode);

  return {
    ok: true,
    spokenText,
    displayAnswer: result.response.answer || result.response.summary,
    structured: result.response,
    conversationId: result.conversationId,
    confirmationRequired,
    proposedAction,
    mode: result.mode,
  };
}
