import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { AppError } from "@/lib/errors";

const {
  mockResolveUserAccess,
  mockGetOwnedTrip,
  mockRedisIncr,
  mockRedisExpire,
  mockSessionCount,
  mockSessionCreate,
  mockSessionFindMany,
  mockSessionFindFirst,
  mockSessionUpdate,
  mockSessionUpdateMany,
  mockUsageCreate,
  mockUsageAggregate,
  mockFetch,
} = vi.hoisted(() => ({
  mockResolveUserAccess: vi.fn(),
  mockGetOwnedTrip: vi.fn(),
  mockRedisIncr: vi.fn(),
  mockRedisExpire: vi.fn(),
  mockSessionCount: vi.fn(),
  mockSessionCreate: vi.fn(),
  mockSessionFindMany: vi.fn(),
  mockSessionFindFirst: vi.fn(),
  mockSessionUpdate: vi.fn(),
  mockSessionUpdateMany: vi.fn(),
  mockUsageCreate: vi.fn(),
  mockUsageAggregate: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock("@/features/subscriptions/services/access-resolve", () => ({
  resolveUserAccess: mockResolveUserAccess,
}));

vi.mock("@/features/trips/services/trips", () => ({
  getOwnedTripOrThrow: mockGetOwnedTrip,
}));

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    status: "ready",
    connect: vi.fn(),
    incr: mockRedisIncr,
    expire: mockRedisExpire,
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aiVoiceSession: {
      count: mockSessionCount,
      create: mockSessionCreate,
      findMany: mockSessionFindMany,
      findFirst: mockSessionFindFirst,
      update: mockSessionUpdate,
      updateMany: mockSessionUpdateMany,
    },
    aiVoiceUsage: {
      create: mockUsageCreate,
      aggregate: mockUsageAggregate,
    },
  },
}));

import {
  createVoiceSession,
  endVoiceSession,
} from "@/features/ai/voice/services/sessions";

describe("ai voice session", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VOICE_AGENT_ENABLED = "true";
    process.env.VOICE_AGENT_WEB_ENABLED = "true";
    process.env.VOICE_AGENT_PROVIDER = "pipeline";
    process.env.VOICE_MAX_MONTHLY_SECONDS = "3600";
    process.env.VOICE_MAX_CONCURRENT_SESSIONS = "1";
    process.env.VOICE_SESSION_RATE_LIMIT_MAX = "10";
    process.env.AUTH_SECRET = "test-secret-for-voice";
    global.fetch = mockFetch as unknown as typeof fetch;

    mockResolveUserAccess.mockResolvedValue({
      level: "subscriber",
      planSlug: "sebavio-plus",
      entitlements: [
        { key: "ai.voice.enabled", enabled: true },
        { key: "ai.planning.enabled", enabled: true },
      ],
    });
    mockGetOwnedTrip.mockResolvedValue({ id: "trip-1" });
    mockRedisIncr.mockResolvedValue(1);
    mockSessionFindMany.mockResolvedValue([]);
    mockSessionCount.mockResolvedValue(0);
    mockUsageAggregate.mockResolvedValue({ _sum: { secondsDelta: 100 } });
    mockSessionCreate.mockResolvedValue({});
    mockUsageCreate.mockResolvedValue({});
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("crée une session pipeline sans clientSecret", async () => {
    const result = await createVoiceSession({
      userId: "11111111-1111-4111-8111-111111111111",
      tripId: "22222222-2222-4222-8222-222222222222",
    });

    expect(result.provider).toBe("pipeline");
    expect(result.clientSecret).toBeUndefined();
    expect(JSON.stringify(result)).not.toMatch(/sk-/);
    expect(result.monthlySecondsUsed).toBe(100);
    expect(mockSessionCreate).toHaveBeenCalled();
  });

  it("refuse si quota mensuel atteint", async () => {
    mockUsageAggregate.mockResolvedValue({ _sum: { secondsDelta: 3600 } });

    await expect(
      createVoiceSession({
        userId: "11111111-1111-4111-8111-111111111111",
        tripId: "22222222-2222-4222-8222-222222222222",
      }),
    ).rejects.toMatchObject({ code: "VOICE_MONTHLY_LIMIT" });
  });

  it("refuse si rate-limit dépassé", async () => {
    mockRedisIncr.mockResolvedValue(99);

    await expect(
      createVoiceSession({
        userId: "11111111-1111-4111-8111-111111111111",
        tripId: "22222222-2222-4222-8222-222222222222",
      }),
    ).rejects.toMatchObject({ code: "VOICE_RATE_LIMIT" });
  });

  it("refuse session concurrente", async () => {
    mockSessionCount.mockResolvedValue(1);

    await expect(
      createVoiceSession({
        userId: "11111111-1111-4111-8111-111111111111",
        tripId: "22222222-2222-4222-8222-222222222222",
      }),
    ).rejects.toMatchObject({ code: "VOICE_CONCURRENT" });
  });

  it("termine une session active", async () => {
    const startedAt = new Date(Date.now() - 30_000);
    mockSessionFindFirst.mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      userId: "11111111-1111-4111-8111-111111111111",
      tripId: "22222222-2222-4222-8222-222222222222",
      status: "active",
      startedAt,
      userAudioSeconds: 0,
      assistantAudioSeconds: 0,
      interruptionCount: 0,
      errorCount: 0,
      provider: "pipeline",
      clientPlatform: "web",
      usageMode: "conversation",
    });
    mockSessionUpdate.mockResolvedValue({});

    await endVoiceSession(
      "33333333-3333-4333-8333-333333333333",
      "11111111-1111-4111-8111-111111111111",
      "user_quit",
    );

    expect(mockSessionUpdate).toHaveBeenCalled();
    expect(mockUsageCreate).toHaveBeenCalled();
  });

  it("openai_realtime sans clé échoue clairement", async () => {
    process.env.VOICE_AGENT_PROVIDER = "openai_realtime";
    delete process.env.OPENAI_API_KEY;

    await expect(
      createVoiceSession({
        userId: "11111111-1111-4111-8111-111111111111",
        tripId: "22222222-2222-4222-8222-222222222222",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
