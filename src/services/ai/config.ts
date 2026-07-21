import "server-only";

import { z } from "zod";
import {
  AI_MAX_MESSAGE_CHARS_DEFAULT,
  AI_RATE_LIMIT_MAX_DEFAULT,
  AI_RATE_LIMIT_WINDOW_SECONDS_DEFAULT,
  AI_REQUEST_TIMEOUT_MS_DEFAULT,
  AI_ROUTE_MAX_DETOUR_KM_DEFAULT,
  AI_ROUTE_SEARCH_RADIUS_KM_DEFAULT,
  AI_WEB_SEARCH_DAILY_LIMIT_DEFAULT,
  AI_WEB_SEARCH_MAX_PER_CONVERSATION_DEFAULT,
  AI_WEB_SEARCH_TIMEOUT_MS_DEFAULT,
} from "@/lib/constants";
import { AppError } from "@/lib/errors";

export const AI_PROVIDER_NAMES = ["xai", "openai", "mock"] as const;
export type AiProviderName = (typeof AI_PROVIDER_NAMES)[number];

const XAI_BASE_URL_DEFAULT = "https://api.x.ai/v1";
const XAI_REQUEST_TIMEOUT_MS_DEFAULT = 60_000;

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

const aiProviderNameSchema = z.enum(AI_PROVIDER_NAMES);

export type AiRuntimeConfig = {
  enabled: boolean;
  provider: AiProviderName;
  /** Clé serveur — jamais exposer au client ni aux logs. */
  apiKey: string | null;
  apiKeyPresent: boolean;
  model: string;
  baseUrl: string | null;
  timeoutMs: number;
  maxMessageChars: number;
  rateLimitMax: number;
  rateLimitWindowSeconds: number;
  webSearchEnabled: boolean;
  webSearchDailyLimit: number;
  webSearchMaxPerConversation: number;
  webSearchTimeoutMs: number;
  routeSearchRadiusKm: number;
  routeMaxDetourKm: number;
};

function resolveProviderName(): AiProviderName {
  const raw = envTrim("AI_PROVIDER");
  if (raw) {
    const parsed = aiProviderNameSchema.safeParse(raw.toLowerCase());
    if (!parsed.success) {
      throw new AppError(
        "AI_CONFIGURATION",
        "Configuration IA invalide (AI_PROVIDER).",
        500,
      );
    }
    return parsed.data;
  }
  if (envTrim("XAI_API_KEY")) return "xai";
  if (envTrim("OPENAI_API_KEY")) return "openai";
  return "mock";
}

function webSearchExtras() {
  return {
    webSearchEnabled: envBool("AI_WEB_SEARCH_ENABLED", true),
    webSearchDailyLimit: envInt(
      "AI_WEB_SEARCH_DAILY_LIMIT",
      AI_WEB_SEARCH_DAILY_LIMIT_DEFAULT,
    ),
    webSearchMaxPerConversation: envInt(
      "AI_WEB_SEARCH_MAX_PER_CONVERSATION",
      AI_WEB_SEARCH_MAX_PER_CONVERSATION_DEFAULT,
    ),
    webSearchTimeoutMs: envInt(
      "AI_WEB_SEARCH_TIMEOUT_MS",
      AI_WEB_SEARCH_TIMEOUT_MS_DEFAULT,
    ),
    routeSearchRadiusKm: envInt(
      "AI_ROUTE_SEARCH_RADIUS_KM",
      AI_ROUTE_SEARCH_RADIUS_KM_DEFAULT,
    ),
    routeMaxDetourKm: envInt(
      "AI_ROUTE_MAX_DETOUR_KM",
      AI_ROUTE_MAX_DETOUR_KM_DEFAULT,
    ),
  };
}

/**
 * Configuration IA centralisée (clé jamais exposée au client).
 */
export function getAiRuntimeConfig(): AiRuntimeConfig {
  const provider = resolveProviderName();
  const aiEnabledFlag = envBool("AI_ENABLED", false);
  const extras = webSearchExtras();

  const maxMessageChars = envInt(
    "AI_MAX_MESSAGE_CHARS",
    AI_MAX_MESSAGE_CHARS_DEFAULT,
  );
  const rateLimitMax = envInt("AI_RATE_LIMIT_MAX", AI_RATE_LIMIT_MAX_DEFAULT);
  const rateLimitWindowSeconds = envInt(
    "AI_RATE_LIMIT_WINDOW_SECONDS",
    AI_RATE_LIMIT_WINDOW_SECONDS_DEFAULT,
  );

  if (provider === "mock") {
    return {
      enabled: aiEnabledFlag,
      provider,
      apiKey: null,
      apiKeyPresent: false,
      model: "mock-model",
      baseUrl: null,
      timeoutMs: envInt("AI_REQUEST_TIMEOUT_MS", AI_REQUEST_TIMEOUT_MS_DEFAULT),
      maxMessageChars,
      rateLimitMax,
      rateLimitWindowSeconds,
      ...extras,
    };
  }

  if (provider === "xai") {
    const apiKey = envTrim("XAI_API_KEY");
    const model = envTrim("XAI_MODEL");
    const baseUrl = envTrim("XAI_BASE_URL") ?? XAI_BASE_URL_DEFAULT;
    const timeoutMs = envInt(
      "XAI_REQUEST_TIMEOUT_MS",
      envInt("AI_REQUEST_TIMEOUT_MS", XAI_REQUEST_TIMEOUT_MS_DEFAULT),
    );
    const enabled = aiEnabledFlag && Boolean(apiKey) && Boolean(model);

    return {
      enabled,
      provider,
      apiKey,
      apiKeyPresent: Boolean(apiKey),
      model: model ?? "",
      baseUrl,
      timeoutMs,
      maxMessageChars,
      rateLimitMax,
      rateLimitWindowSeconds,
      ...extras,
    };
  }

  const apiKey = envTrim("OPENAI_API_KEY");
  const model = envTrim("OPENAI_MODEL") ?? "gpt-4.1-mini";
  const timeoutMs = envInt(
    "AI_REQUEST_TIMEOUT_MS",
    AI_REQUEST_TIMEOUT_MS_DEFAULT,
  );
  const enabled = aiEnabledFlag && Boolean(apiKey);

  return {
    enabled,
    provider,
    apiKey,
    apiKeyPresent: Boolean(apiKey),
    model,
    baseUrl: null,
    timeoutMs,
    maxMessageChars,
    rateLimitMax,
    rateLimitWindowSeconds,
    ...extras,
  };
}

export function isAiFeatureEnabled(): boolean {
  return getAiRuntimeConfig().enabled;
}

export function getAiProviderDisplayName(provider: AiProviderName): string {
  switch (provider) {
    case "xai":
      return "xAI";
    case "openai":
      return "OpenAI";
    case "mock":
      return "Mock";
  }
}
