import { describe, expect, it } from "vitest";
import { getAiRuntimeConfig } from "@/services/ai/config";
import { MockAiProvider } from "@/services/ai/mock-provider";
import { tripAssistantResponseSchema } from "@/features/ai/schemas/response";

describe("AiProvider mock", () => {
  it("ne fait aucun appel réseau et renvoie une réponse Zod-valide", async () => {
    const provider = new MockAiProvider();
    const result = await provider.generateTripAssistantResponse({
      systemPrompt: "sys",
      userPayload: "user",
      requestType: "analyze",
      model: "mock",
      timeoutMs: 1000,
    });
    expect(tripAssistantResponseSchema.parse(result.response).status).toBe(
      "ok",
    );
    expect(result.totalTokens).toBe(30);
  });
});

describe("getAiRuntimeConfig", () => {
  it("reste désactivé sans clé même si AI_ENABLED=true", () => {
    const prevEnabled = process.env.AI_ENABLED;
    const prevKey = process.env.OPENAI_API_KEY;
    process.env.AI_ENABLED = "true";
    delete process.env.OPENAI_API_KEY;
    const config = getAiRuntimeConfig();
    expect(config.enabled).toBe(false);
    process.env.AI_ENABLED = prevEnabled;
    if (prevKey != null) process.env.OPENAI_API_KEY = prevKey;
  });
});
