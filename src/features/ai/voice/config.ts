import "server-only";

import { z } from "zod";
import { AppError } from "@/lib/errors";
import type {
  VoiceClientPlatform,
  VoiceProviderName,
} from "@/features/ai/voice/types";

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envTrim(name: string): string | null {
  const raw = process.env[name]?.trim();
  return raw ? raw : null;
}

const voiceProviderSchema = z.enum(["openai_realtime", "pipeline", "mock"]);

const DEFAULT_UNAVAILABLE =
  "L’agent vocal n’est pas disponible pour le moment. Utilisez le chat texte.";

export type VoiceRuntimeConfig = {
  enabled: boolean;
  webEnabled: boolean;
  mobileEnabled: boolean;
  androidAutoEnabled: boolean;
  carplayEnabled: boolean;
  /** Fournisseur demandé via env. */
  configuredProvider: VoiceProviderName;
  /** Fournisseur effectif (openai_realtime sans clé → désactivé). */
  provider: VoiceProviderName;
  realtimeUsable: boolean;
  apiKeyPresent: boolean;
  realtimeModel: string;
  realtimeVoice: string;
  maxSessionSeconds: number;
  maxMonthlySeconds: number;
  maxConcurrentSessions: number;
  sessionRateLimitMax: number;
  sessionRateLimitWindowSeconds: number;
  transcriptRetentionEnabled: boolean;
  defaultLanguage: string;
  unavailableMessage: string;
};

export type VoicePublicConfig = {
  enabled: boolean;
  webEnabled: boolean;
  mobileEnabled: boolean;
  androidAutoEnabled: boolean;
  carplayEnabled: boolean;
  provider: VoiceProviderName;
  realtimeModel: string | null;
  realtimeVoice: string | null;
  maxSessionSeconds: number;
  maxMonthlySeconds: number;
  defaultLanguage: string;
  unavailableMessage: string;
  apiKeyPresent: boolean;
};

function resolveConfiguredProvider(): VoiceProviderName {
  const raw = envTrim("VOICE_AGENT_PROVIDER");
  if (!raw) return "pipeline";
  const parsed = voiceProviderSchema.safeParse(raw.toLowerCase());
  if (!parsed.success) {
    throw new AppError(
      "VOICE_CONFIGURATION",
      "Configuration vocale invalide (VOICE_AGENT_PROVIDER).",
      500,
    );
  }
  return parsed.data;
}

/**
 * Configuration vocale serveur. OPENAI_API_KEY jamais exposée.
 */
export function getVoiceRuntimeConfig(): VoiceRuntimeConfig {
  const enabled = envBool("VOICE_AGENT_ENABLED", false);
  const configuredProvider = resolveConfiguredProvider();
  const apiKey = envTrim("OPENAI_API_KEY");
  const apiKeyPresent = Boolean(apiKey);
  const realtimeUsable =
    enabled && configuredProvider === "openai_realtime" && apiKeyPresent;

  let provider: VoiceProviderName = configuredProvider;
  if (configuredProvider === "openai_realtime" && !apiKeyPresent) {
    provider = "pipeline";
  }

  return {
    enabled,
    webEnabled: envBool("VOICE_AGENT_WEB_ENABLED", true),
    mobileEnabled: envBool("VOICE_AGENT_MOBILE_ENABLED", false),
    androidAutoEnabled: envBool("VOICE_AGENT_ANDROID_AUTO_ENABLED", false),
    carplayEnabled: envBool("VOICE_AGENT_CARPLAY_ENABLED", false),
    configuredProvider,
    provider: enabled ? provider : configuredProvider,
    realtimeUsable,
    apiKeyPresent,
    realtimeModel:
      envTrim("OPENAI_REALTIME_MODEL") ?? "gpt-4o-realtime-preview",
    realtimeVoice: envTrim("OPENAI_REALTIME_VOICE") ?? "alloy",
    maxSessionSeconds: envInt("VOICE_MAX_SESSION_SECONDS", 600),
    maxMonthlySeconds: envInt("VOICE_MAX_MONTHLY_SECONDS", 3600),
    maxConcurrentSessions: envInt("VOICE_MAX_CONCURRENT_SESSIONS", 1),
    sessionRateLimitMax: envInt("VOICE_SESSION_RATE_LIMIT_MAX", 10),
    sessionRateLimitWindowSeconds: envInt(
      "VOICE_SESSION_RATE_LIMIT_WINDOW_SECONDS",
      3600,
    ),
    transcriptRetentionEnabled: envBool(
      "VOICE_TRANSCRIPT_RETENTION_ENABLED",
      true,
    ),
    defaultLanguage: envTrim("VOICE_DEFAULT_LANGUAGE") ?? "fr-CA",
    unavailableMessage:
      envTrim("VOICE_UNAVAILABLE_MESSAGE") ?? DEFAULT_UNAVAILABLE,
  };
}

/** Config publique sûre (pas de secret). */
export function getVoicePublicConfig(): VoicePublicConfig {
  const c = getVoiceRuntimeConfig();
  return {
    enabled: c.enabled,
    webEnabled: c.webEnabled,
    mobileEnabled: c.mobileEnabled,
    androidAutoEnabled: c.androidAutoEnabled,
    carplayEnabled: c.carplayEnabled,
    provider: c.realtimeUsable ? "openai_realtime" : c.provider,
    realtimeModel: c.realtimeUsable ? c.realtimeModel : null,
    realtimeVoice: c.realtimeUsable ? c.realtimeVoice : null,
    maxSessionSeconds: c.maxSessionSeconds,
    maxMonthlySeconds: c.maxMonthlySeconds,
    defaultLanguage: c.defaultLanguage,
    unavailableMessage: c.unavailableMessage,
    apiKeyPresent: c.apiKeyPresent,
  };
}

export function isVoiceAgentEnabled(): boolean {
  return getVoiceRuntimeConfig().enabled;
}

/** Clé OpenAI serveur — uniquement pour tokens éphémères Realtime. */
export function getOpenAiApiKeyForRealtime(): string | null {
  return envTrim("OPENAI_API_KEY");
}

export function isPlatformVoiceEnabled(platform: VoiceClientPlatform): boolean {
  const c = getVoiceRuntimeConfig();
  switch (platform) {
    case "web":
      return c.webEnabled;
    case "mobile":
      return c.mobileEnabled;
    case "android_auto":
      return c.androidAutoEnabled;
    case "carplay":
      return c.carplayEnabled;
    default:
      return false;
  }
}

export function resolveEffectiveVoiceProvider(): VoiceProviderName {
  const c = getVoiceRuntimeConfig();
  if (!c.enabled) return c.configuredProvider;
  if (c.configuredProvider === "openai_realtime") {
    if (!c.apiKeyPresent) {
      throw new AppError(
        "VOICE_CONFIGURATION",
        "L’agent vocal Realtime n’est pas configuré (clé API manquante).",
        503,
      );
    }
    return "openai_realtime";
  }
  return c.provider;
}
