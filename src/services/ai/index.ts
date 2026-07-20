import "server-only";

import { getAiRuntimeConfig } from "@/services/ai/config";
import { MockAiProvider } from "@/services/ai/mock-provider";
import { OpenAiResponsesProvider } from "@/services/ai/openai-provider";
import type { AiProvider } from "@/services/ai/types";

let overrideProvider: AiProvider | null = null;

/** Injection de tests uniquement. */
export function setAiProviderForTests(provider: AiProvider | null): void {
  overrideProvider = provider;
}

export function createAiProvider(): AiProvider {
  if (overrideProvider) return overrideProvider;

  const config = getAiRuntimeConfig();
  if (process.env.AI_PROVIDER === "mock") {
    return new MockAiProvider();
  }
  if (!config.apiKey) {
    return new MockAiProvider();
  }
  return new OpenAiResponsesProvider(config.apiKey, config.model);
}

export type { AiProvider } from "@/services/ai/types";
export { getAiRuntimeConfig, isAiFeatureEnabled } from "@/services/ai/config";
export { MockAiProvider } from "@/services/ai/mock-provider";
export { OpenAiResponsesProvider } from "@/services/ai/openai-provider";
