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
    apiKey: "sk-mock",
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

describe("AI — forfait Découverte (démo)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwnedTrip.mockResolvedValue({ id: "trip" });
    mockResolveUserAccess.mockResolvedValue({
      level: "decouverte",
      planSlug: "decouverte",
      entitlements: [
        { key: "ai.planning.enabled", enabled: false },
        { key: "ai.recommendations.enabled", enabled: false },
      ],
    });
  });

  it("ne transmet aucune donnée voyage au provider", async () => {
    const result = await runTripAssistant({
      userId: "free-user",
      raw: {
        tripId: "00000000-0000-4000-8000-000000000001",
        message: "Analyse mon voyage",
        requestType: "analyze",
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe("demo");
      expect(result.response).toEqual(DEMO_STATIC_RESPONSE);
      expect(result.conversationId).toBeNull();
    }
    expect(mockProviderGenerate).not.toHaveBeenCalled();
    expect(mockBuildContext).not.toHaveBeenCalled();
    expect(mockAppend).not.toHaveBeenCalled();
  });
});

describe("AI — recommandations gated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwnedTrip.mockResolvedValue({ id: "trip" });
    mockResolveUserAccess.mockResolvedValue({
      level: "sebavio_plus",
      planSlug: "sebavio-plus",
      entitlements: [
        { key: "ai.planning.enabled", enabled: true },
        { key: "ai.recommendations.enabled", enabled: false },
      ],
    });
    mockAssertFeatureAllowed.mockImplementation(async (_u, key) => {
      if (key === "ai.recommendations.enabled") {
        throw new AppError(
          "ACCESS_DENIED",
          "Recommandations non incluses",
          403,
        );
      }
    });
    mockAcquireLock.mockResolvedValue(async () => undefined);
  });

  it("refuse suggest_activities sans ai.recommendations.enabled", async () => {
    const result = await runTripAssistant({
      userId: "plus-user",
      raw: {
        tripId: "00000000-0000-4000-8000-000000000001",
        message: "Suggère des activités",
        requestType: "suggest_activities",
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("ACCESS_DENIED");
    expect(mockProviderGenerate).not.toHaveBeenCalled();
  });
});

describe("AI — sécurité rate-limit et lock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwnedTrip.mockResolvedValue({ id: "trip" });
    mockResolveUserAccess.mockResolvedValue({
      level: "sebavio_plus",
      planSlug: "sebavio-plus",
      entitlements: [
        { key: "ai.planning.enabled", enabled: true },
        { key: "ai.recommendations.enabled", enabled: true },
      ],
    });
    mockAssertFeatureAllowed.mockResolvedValue(undefined);
  });

  it("propage AI_RATE_LIMIT", async () => {
    mockRateLimit.mockRejectedValue(
      new AppError("AI_RATE_LIMIT", "Trop de demandes", 429),
    );
    const result = await runTripAssistant({
      userId: "u",
      raw: {
        tripId: "00000000-0000-4000-8000-000000000001",
        message: "Hi",
        requestType: "chat",
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("AI_RATE_LIMIT");
  });

  it("propage lock concurrent AI_007", async () => {
    mockRateLimit.mockResolvedValue(undefined);
    mockAcquireLock.mockRejectedValue(
      new AppError("AI_007", "Analyse déjà en cours", 409),
    );
    const result = await runTripAssistant({
      userId: "u",
      raw: {
        tripId: "00000000-0000-4000-8000-000000000001",
        message: "Hi",
        requestType: "chat",
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("AI_007");
  });
});
