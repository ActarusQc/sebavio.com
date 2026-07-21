import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  mockResolveUserAccess,
  mockAssertFeatureAllowed,
  mockGetOwnedTrip,
  mockProviderGenerate,
  mockRecordUsage,
  mockGetOrCreate,
  mockAppend,
  mockRateLimit,
  mockAcquireLock,
  mockBuildContext,
} = vi.hoisted(() => ({
  mockResolveUserAccess: vi.fn(),
  mockAssertFeatureAllowed: vi.fn(),
  mockGetOwnedTrip: vi.fn(),
  mockProviderGenerate: vi.fn(),
  mockRecordUsage: vi.fn(),
  mockGetOrCreate: vi.fn(),
  mockAppend: vi.fn(),
  mockRateLimit: vi.fn(),
  mockAcquireLock: vi.fn(async () => async () => undefined),
  mockBuildContext: vi.fn(),
}));

vi.mock("@/features/subscriptions/services/access-resolve", () => ({
  resolveUserAccess: mockResolveUserAccess,
  assertFeatureAllowed: mockAssertFeatureAllowed,
}));

vi.mock("@/features/trips/services/trips", () => ({
  getOwnedTripOrThrow: mockGetOwnedTrip,
}));

vi.mock("@/services/ai", () => ({
  getAiRuntimeConfig: () => ({
    enabled: true,
    apiKey: "test-key",
    model: "mock-model",
    timeoutMs: 5000,
    maxMessageChars: 2000,
    rateLimitMax: 30,
    rateLimitWindowSeconds: 3600,
    provider: "mock",
    apiKeyPresent: true,
    baseUrl: null,
    webSearchEnabled: true,
    webSearchDailyLimit: 20,
    webSearchMaxPerConversation: 5,
    webSearchTimeoutMs: 90000,
    routeSearchRadiusKm: 50,
    routeMaxDetourKm: 30,
  }),
  createAiProvider: () => ({
    name: "mock",
    generateTripAssistantResponse: mockProviderGenerate,
    analyzeTrip: mockProviderGenerate,
  }),
  isAiFeatureEnabled: () => true,
}));

vi.mock("@/features/ai/services/usage", () => ({
  recordAiUsage: mockRecordUsage,
}));

vi.mock("@/features/ai/services/conversations", () => ({
  getOrCreateConversation: mockGetOrCreate,
  appendConversationMessages: mockAppend,
  listConversationMessages: vi.fn(),
}));

vi.mock("@/features/ai/services/rate-limit", () => ({
  assertAiRateLimit: mockRateLimit,
  acquireAiRequestLock: mockAcquireLock,
  assertAiWebSearchLimits: vi.fn(),
  recordAiWebSearchConversationUse: vi.fn(),
}));

vi.mock("@/features/ai/services/context-builder", () => ({
  buildTripAssistantContext: mockBuildContext,
}));

import { runTripAssistant } from "@/features/ai/services/trip-assistant";
import { AppError } from "@/lib/errors";
import { DEMO_STATIC_RESPONSE } from "@/features/ai/constants";

describe("runTripAssistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwnedTrip.mockResolvedValue({ id: "trip" });
    mockGetOrCreate.mockResolvedValue({ id: "conv" });
    mockBuildContext.mockResolvedValue({
      trip: { id: "trip" },
      activities: [],
    });
    mockProviderGenerate.mockResolvedValue({
      response: DEMO_STATIC_RESPONSE,
      model: "mock-model",
      inputTokens: 1,
      outputTokens: 2,
      totalTokens: 3,
      rawText: "{}",
      webSearchUsed: false,
      webSearchCallCount: 0,
      citationSources: [],
    });
  });

  it("renvoie une démo sans appeler le provider pour Découverte", async () => {
    mockResolveUserAccess.mockResolvedValue({
      level: "decouverte",
      planSlug: "decouverte",
      entitlements: [
        { key: "ai.planning.enabled", enabled: false },
        { key: "ai.recommendations.enabled", enabled: false },
      ],
    });

    const result = await runTripAssistant({
      userId: "user-1",
      raw: {
        tripId: "00000000-0000-4000-8000-000000000001",
        message: "Analyse mon voyage",
        requestType: "analyze",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe("demo");
      expect(result.response.summary).toContain("démonstration");
    }
    expect(mockProviderGenerate).not.toHaveBeenCalled();
    expect(mockBuildContext).not.toHaveBeenCalled();
  });

  it("appelle le provider pour un forfait payant", async () => {
    mockResolveUserAccess.mockResolvedValue({
      level: "sebavio_plus",
      planSlug: "sebavio-plus",
      entitlements: [
        { key: "ai.planning.enabled", enabled: true },
        { key: "ai.recommendations.enabled", enabled: true },
      ],
    });
    mockAssertFeatureAllowed.mockResolvedValue(undefined);

    const result = await runTripAssistant({
      userId: "user-1",
      raw: {
        tripId: "00000000-0000-4000-8000-000000000001",
        message: "Explique le carburant",
        requestType: "fuel",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mode).toBe("personalized");
    expect(mockProviderGenerate).toHaveBeenCalledOnce();
    expect(mockAppend).toHaveBeenCalledOnce();
  });
});

describe("runTripAssistant — erreurs", () => {
  it("refuse un voyage inexistant", async () => {
    mockResolveUserAccess.mockResolvedValue({
      level: "sebavio_plus",
      planSlug: "sebavio-plus",
      entitlements: [
        { key: "ai.planning.enabled", enabled: true },
        { key: "ai.recommendations.enabled", enabled: true },
      ],
    });
    mockGetOwnedTrip.mockRejectedValue(
      new AppError("TRIP_001", "Voyage introuvable", 404),
    );

    const result = await runTripAssistant({
      userId: "user-1",
      raw: {
        tripId: "00000000-0000-4000-8000-000000000099",
        message: "Hello",
        requestType: "chat",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("TRIP_001");
  });
});
