import "server-only";

import { AppError } from "@/lib/errors";
import { getAiRuntimeConfig } from "@/services/ai/config";
import { MockAiProvider } from "@/services/ai/mock-provider";
import { OpenAiResponsesProvider } from "@/services/ai/openai-provider";
import { XaiAiProvider } from "@/services/ai/xai-provider";
import type { AiProvider } from "@/services/ai/types";

let overrideProvider: AiProvider | null = null;

/** Injection de tests uniquement. */
export function setAiProviderForTests(provider: AiProvider | null): void {
  overrideProvider = provider;
}

/**
 * Fabrique centrale multi-fournisseurs.
 * AI_PROVIDER=xai | openai | mock
 */
export function createAiProvider(): AiProvider {
  if (overrideProvider) return overrideProvider;

  const config = getAiRuntimeConfig();

  switch (config.provider) {
    case "mock":
      return new MockAiProvider();

    case "xai": {
      if (!config.apiKey || !config.model || !config.baseUrl) {
        throw new AppError(
          "AI_CONFIGURATION",
          "L’Assistant Sebavio ne peut pas répondre pour le moment. Veuillez réessayer dans quelques instants.",
          503,
        );
      }
      return new XaiAiProvider({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
        timeoutMs: config.timeoutMs,
      });
    }

    case "openai": {
      if (!config.apiKey) {
        throw new AppError(
          "AI_CONFIGURATION",
          "L’Assistant Sebavio ne peut pas répondre pour le moment. Veuillez réessayer dans quelques instants.",
          503,
        );
      }
      return new OpenAiResponsesProvider(config.apiKey, config.model);
    }

    default:
      throw new AppError(
        "AI_CONFIGURATION",
        "L’Assistant Sebavio ne peut pas répondre pour le moment. Veuillez réessayer dans quelques instants.",
        503,
      );
  }
}

export type { AiProvider } from "@/services/ai/types";
export type { AiProviderName, AiRuntimeConfig } from "@/services/ai/config";
export {
  getAiRuntimeConfig,
  isAiFeatureEnabled,
  getAiProviderDisplayName,
} from "@/services/ai/config";
export { MockAiProvider } from "@/services/ai/mock-provider";
export { OpenAiResponsesProvider } from "@/services/ai/openai-provider";
export { XaiAiProvider } from "@/services/ai/xai-provider";
