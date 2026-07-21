import "server-only";

import { AppError } from "@/lib/errors";
import {
  resolveUserAccess,
  type UserAccessSnapshot,
} from "@/features/subscriptions/services/access-resolve";
import {
  getVoiceRuntimeConfig,
  isPlatformVoiceEnabled,
  isVoiceAgentEnabled,
} from "@/features/ai/voice/config";
import type { VoiceClientPlatform } from "@/features/ai/voice/types";

/**
 * Capacité produit `voice_agent` ↔ entitlement `ai.voice.enabled`.
 * Les admins contournent l’entitlement (comme pour l’IA planification).
 */

export type VoiceAccess = {
  access: UserAccessSnapshot;
  canUseVoice: boolean;
  canUsePersonalizedAi: boolean;
};

export async function resolveVoiceAccess(userId: string): Promise<VoiceAccess> {
  const access = await resolveUserAccess(userId);
  const voice = access.entitlements.find((e) => e.key === "ai.voice.enabled");
  const planning = access.entitlements.find(
    (e) => e.key === "ai.planning.enabled",
  );

  return {
    access,
    canUseVoice: Boolean(voice?.enabled) || access.level === "admin",
    canUsePersonalizedAi:
      Boolean(planning?.enabled) || access.level === "admin",
  };
}

/**
 * Vérifie flags plateforme + entitlement + feature flag global.
 */
export async function assertVoiceAllowed(
  userId: string,
  platform: VoiceClientPlatform,
): Promise<VoiceAccess> {
  if (!isVoiceAgentEnabled()) {
    const cfg = getVoiceRuntimeConfig();
    throw new AppError("VOICE_DISABLED", cfg.unavailableMessage, 503);
  }

  if (!isPlatformVoiceEnabled(platform)) {
    throw new AppError(
      "VOICE_PLATFORM",
      "L’agent vocal n’est pas disponible sur cette plateforme pour le moment.",
      403,
    );
  }

  const voiceAccess = await resolveVoiceAccess(userId);
  if (!voiceAccess.canUseVoice) {
    throw new AppError(
      "ACCESS_DENIED",
      "L’agent vocal n’est pas inclus dans votre forfait.",
      403,
    );
  }

  if (!voiceAccess.canUsePersonalizedAi) {
    throw new AppError(
      "ACCESS_DENIED",
      "L’assistant personnalisé est requis pour utiliser l’agent vocal.",
      403,
    );
  }

  return voiceAccess;
}
