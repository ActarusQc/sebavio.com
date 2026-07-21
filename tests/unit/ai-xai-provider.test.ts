import { describe, expect, it, afterEach, vi } from "vitest";
import { APIError } from "openai";
import { AppError } from "@/lib/errors";
import { getAiRuntimeConfig } from "@/services/ai/config";
import { createAiProvider } from "@/services/ai";
import { MockAiProvider } from "@/services/ai/mock-provider";
import { XaiAiProvider } from "@/services/ai/xai-provider";
import type { XaiResponsesTransport } from "@/services/ai/xai-client";
import { tripAssistantResponseSchema } from "@/features/ai/schemas/response";

const VALID_RESPONSE = {
  summary: "Analyse du voyage",
  answer: "Votre trajet vers le Gaspé semble cohérent.",
  status: "ok" as const,
  warnings: [],
  suggestions: [],
  missingInformation: [],
  analysis: {
    ok: ["Itinéraire défini"],
    watch: [],
    suggestions: [],
    missing: [],
  },
  knowledgeMode: "trip_context" as const,
  webSearchUsed: false,
  sources: [],
  restaurantRecommendations: [],
  clarification: null,
};

function makeTransport(
  impl: XaiResponsesTransport["responses"]["create"],
): XaiResponsesTransport {
  return { responses: { create: impl } };
}

const baseInput = {
  systemPrompt: "trip-assistant-v1 system",
  userPayload: '{"trip":"gaspé"}',
  requestType: "analyze" as const,
  model: "grok-4.3",
  timeoutMs: 5000,
};

describe("getAiRuntimeConfig — xAI", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("active xai avec clé et modèle présents", () => {
    process.env.AI_PROVIDER = "xai";
    process.env.AI_ENABLED = "true";
    process.env.XAI_API_KEY = "xai-test-key";
    process.env.XAI_MODEL = "grok-4.3";
    delete process.env.OPENAI_API_KEY;

    const config = getAiRuntimeConfig();
    expect(config.provider).toBe("xai");
    expect(config.enabled).toBe(true);
    expect(config.model).toBe("grok-4.3");
    expect(config.baseUrl).toBe("https://api.x.ai/v1");
    expect(config.apiKeyPresent).toBe(true);
  });

  it("reste désactivé sans clé xAI", () => {
    process.env.AI_PROVIDER = "xai";
    process.env.AI_ENABLED = "true";
    delete process.env.XAI_API_KEY;
    process.env.XAI_MODEL = "grok-4.3";

    const config = getAiRuntimeConfig();
    expect(config.enabled).toBe(false);
    expect(config.apiKeyPresent).toBe(false);
  });

  it("reste désactivé sans modèle xAI", () => {
    process.env.AI_PROVIDER = "xai";
    process.env.AI_ENABLED = "true";
    process.env.XAI_API_KEY = "xai-test-key";
    delete process.env.XAI_MODEL;

    const config = getAiRuntimeConfig();
    expect(config.enabled).toBe(false);
    expect(config.model).toBe("");
  });

  it("utilise XAI_BASE_URL par défaut", () => {
    process.env.AI_PROVIDER = "xai";
    delete process.env.XAI_BASE_URL;
    const config = getAiRuntimeConfig();
    expect(config.baseUrl).toBe("https://api.x.ai/v1");
  });

  it("n'exige pas OPENAI_API_KEY quand AI_PROVIDER=xai", () => {
    process.env.AI_PROVIDER = "xai";
    process.env.AI_ENABLED = "true";
    process.env.XAI_API_KEY = "xai-test-key";
    process.env.XAI_MODEL = "grok-4.3";
    delete process.env.OPENAI_API_KEY;

    const config = getAiRuntimeConfig();
    expect(config.provider).toBe("xai");
    expect(config.enabled).toBe(true);
  });
});

describe("XaiAiProvider", () => {
  it("appelle Responses API avec store:false et modèle dynamique", async () => {
    const create = vi.fn(async (params) => {
      expect(params.store).toBe(false);
      expect(params.model).toBe("grok-4.5");
      expect(params.text).toEqual({ format: { type: "json_object" } });
      expect(params.input[0]?.role).toBe("system");
      expect(params.input[0]?.content).toContain("trip-assistant-v1");
      expect(params.input[1]?.content).toContain("gaspé");
      return {
        output_text: JSON.stringify(VALID_RESPONSE),
        usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
      };
    });

    const provider = new XaiAiProvider({
      apiKey: "xai-test-key",
      model: "grok-4.3",
      baseUrl: "https://api.x.ai/v1",
      timeoutMs: 60000,
      transport: makeTransport(create),
    });

    const result = await provider.generateTripAssistantResponse({
      ...baseInput,
      model: "grok-4.5",
    });

    expect(create).toHaveBeenCalledOnce();
    expect(result.model).toBe("grok-4.5");
    expect(result.inputTokens).toBe(100);
    expect(result.outputTokens).toBe(50);
    expect(result.totalTokens).toBe(150);
    expect(tripAssistantResponseSchema.parse(result.response).status).toBe(
      "ok",
    );
  });

  it("rejette une réponse structurée invalide", async () => {
    const provider = new XaiAiProvider({
      apiKey: "xai-test-key",
      model: "grok-4.3",
      baseUrl: "https://api.x.ai/v1",
      timeoutMs: 60000,
      transport: makeTransport(async () => ({
        output_text: JSON.stringify({ invalid: true }),
      })),
    });

    await expect(
      provider.generateTripAssistantResponse(baseInput),
    ).rejects.toMatchObject({ code: "AI_INVALID_RESPONSE" });
  });

  it("normalise rate limit xAI", async () => {
    const provider = new XaiAiProvider({
      apiKey: "xai-test-key",
      model: "grok-4.3",
      baseUrl: "https://api.x.ai/v1",
      timeoutMs: 60000,
      transport: makeTransport(async () => {
        throw new APIError(429, undefined, "rate limit", undefined);
      }),
    });

    await expect(provider.analyzeTrip(baseInput)).rejects.toMatchObject({
      code: "AI_RATE_LIMIT",
    });
  });

  it("normalise clé invalide", async () => {
    const provider = new XaiAiProvider({
      apiKey: "xai-test-key",
      model: "grok-4.3",
      baseUrl: "https://api.x.ai/v1",
      timeoutMs: 60000,
      transport: makeTransport(async () => {
        throw new APIError(401, undefined, "invalid api key", undefined);
      }),
    });

    await expect(provider.analyzeTrip(baseInput)).rejects.toMatchObject({
      code: "AI_CONFIGURATION",
    });
  });

  it("normalise modèle non accessible", async () => {
    const provider = new XaiAiProvider({
      apiKey: "xai-test-key",
      model: "grok-4.3",
      baseUrl: "https://api.x.ai/v1",
      timeoutMs: 60000,
      transport: makeTransport(async () => {
        throw new APIError(
          404,
          undefined,
          "model grok-unknown not found",
          undefined,
        );
      }),
    });

    await expect(provider.analyzeTrip(baseInput)).rejects.toMatchObject({
      code: "AI_CONFIGURATION",
    });
  });

  it("normalise quota insuffisant", async () => {
    const provider = new XaiAiProvider({
      apiKey: "xai-test-key",
      model: "grok-4.3",
      baseUrl: "https://api.x.ai/v1",
      timeoutMs: 60000,
      transport: makeTransport(async () => {
        throw new APIError(402, undefined, "insufficient credits", undefined);
      }),
    });

    await expect(provider.analyzeTrip(baseInput)).rejects.toMatchObject({
      code: "AI_003",
    });
  });

  it("normalise timeout", async () => {
    const provider = new XaiAiProvider({
      apiKey: "xai-test-key",
      model: "grok-4.3",
      baseUrl: "https://api.x.ai/v1",
      timeoutMs: 60000,
      transport: makeTransport(async () => {
        throw new Error("Request timed out");
      }),
    });

    await expect(provider.analyzeTrip(baseInput)).rejects.toMatchObject({
      code: "AI_005",
    });
  });
  it("ajoute tools web_search uniquement si enableWebSearch", async () => {
    const create = vi.fn(async (params) => {
      expect(params.store).toBe(false);
      expect(params.tools).toEqual([{ type: "web_search" }]);
      expect(params.tool_choice).toBe("required");
      return {
        output_text: JSON.stringify(VALID_RESPONSE),
        citations: ["https://guide.michelin.com/ca/fr/restaurant/test"],
        usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        server_side_tool_usage: { web_search: 2 },
      };
    });

    const provider = new XaiAiProvider({
      apiKey: "xai-test-key",
      model: "grok-4.3",
      baseUrl: "https://api.x.ai/v1",
      timeoutMs: 60000,
      transport: makeTransport(create),
    });

    const result = await provider.generateTripAssistantResponse({
      ...baseInput,
      enableWebSearch: true,
      knowledgeMode: "web_grounded",
    });

    expect(result.webSearchUsed).toBe(true);
    expect(result.webSearchCallCount).toBe(2);
    expect(result.citationSources.length).toBe(1);
    expect(result.citationSources[0]!.domain).toContain("michelin");
  });

  it("n'envoie pas tools sans enableWebSearch", async () => {
    const create = vi.fn(async (params) => {
      expect(params.tools).toBeUndefined();
      expect(params.store).toBe(false);
      return {
        output_text: JSON.stringify(VALID_RESPONSE),
        usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
      };
    });

    const provider = new XaiAiProvider({
      apiKey: "xai-test-key",
      model: "grok-4.3",
      baseUrl: "https://api.x.ai/v1",
      timeoutMs: 60000,
      transport: makeTransport(create),
    });

    const result = await provider.generateTripAssistantResponse(baseInput);
    expect(result.webSearchUsed).toBe(false);
    expect(result.webSearchCallCount).toBe(0);
  });
});

describe("Contrat AiProvider — Mock vs xAI", () => {
  const contractCases = [
    {
      name: "MockAiProvider",
      factory: () => new MockAiProvider(),
    },
    {
      name: "XaiAiProvider",
      factory: () =>
        new XaiAiProvider({
          apiKey: "xai-test-key",
          model: "grok-4.3",
          baseUrl: "https://api.x.ai/v1",
          timeoutMs: 60000,
          transport: makeTransport(async () => ({
            output_text: JSON.stringify(VALID_RESPONSE),
            usage: { input_tokens: 1, output_tokens: 2, total_tokens: 3 },
          })),
        }),
    },
  ] as const;

  for (const { name, factory } of contractCases) {
    it(`${name} respecte TripAssistantResponse`, async () => {
      const provider = factory();
      const result = await provider.generateTripAssistantResponse(baseInput);
      expect(
        tripAssistantResponseSchema.safeParse(result.response).success,
      ).toBe(true);
      expect(typeof result.model).toBe("string");
      expect(result.model.length).toBeGreaterThan(0);
    });
  }
});

describe("createAiProvider", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("retourne MockAiProvider pour AI_PROVIDER=mock", () => {
    process.env.AI_PROVIDER = "mock";
    const provider = createAiProvider();
    expect(provider.name).toBe("mock");
  });

  it("lève AI_CONFIGURATION si xai sans clé", () => {
    process.env.AI_PROVIDER = "xai";
    process.env.XAI_MODEL = "grok-4.3";
    delete process.env.XAI_API_KEY;

    expect(() => createAiProvider()).toThrow(AppError);
    try {
      createAiProvider();
    } catch (error) {
      expect(error).toMatchObject({ code: "AI_CONFIGURATION" });
    }
  });
});
