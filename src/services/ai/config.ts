import "server-only";

import {
  AI_MAX_MESSAGE_CHARS_DEFAULT,
  AI_RATE_LIMIT_MAX_DEFAULT,
  AI_RATE_LIMIT_WINDOW_SECONDS_DEFAULT,
  AI_REQUEST_TIMEOUT_MS_DEFAULT,
} from "@/lib/constants";

export type AiRuntimeConfig = {
  enabled: boolean;
  apiKey: string | null;
  model: string;
  timeoutMs: number;
  maxMessageChars: number;
  rateLimitMax: number;
  rateLimitWindowSeconds: number;
};

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

/**
 * Configuration IA centralisée (clé jamais exposée au client).
 */
export function getAiRuntimeConfig(): AiRuntimeConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim() || null;
  const enabled = envBool("AI_ENABLED", false) && Boolean(apiKey);

  return {
    enabled,
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
    timeoutMs: envInt("AI_REQUEST_TIMEOUT_MS", AI_REQUEST_TIMEOUT_MS_DEFAULT),
    maxMessageChars: envInt(
      "AI_MAX_MESSAGE_CHARS",
      AI_MAX_MESSAGE_CHARS_DEFAULT,
    ),
    rateLimitMax: envInt("AI_RATE_LIMIT_MAX", AI_RATE_LIMIT_MAX_DEFAULT),
    rateLimitWindowSeconds: envInt(
      "AI_RATE_LIMIT_WINDOW_SECONDS",
      AI_RATE_LIMIT_WINDOW_SECONDS_DEFAULT,
    ),
  };
}

export function isAiFeatureEnabled(): boolean {
  return getAiRuntimeConfig().enabled;
}
