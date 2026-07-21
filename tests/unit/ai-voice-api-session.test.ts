import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  mockRequireActiveUser,
  mockCreateVoiceSession,
  mockEndVoiceSession,
  mockHeartbeat,
} = vi.hoisted(() => ({
  mockRequireActiveUser: vi.fn(),
  mockCreateVoiceSession: vi.fn(),
  mockEndVoiceSession: vi.fn(),
  mockHeartbeat: vi.fn(),
}));

vi.mock("@/features/auth/services/session", () => ({
  requireActiveUser: mockRequireActiveUser,
}));

vi.mock("@/features/ai/voice/services/sessions", () => ({
  createVoiceSession: mockCreateVoiceSession,
  endVoiceSession: mockEndVoiceSession,
  heartbeatVoiceSession: mockHeartbeat,
  getActiveVoiceSession: vi.fn(),
}));

import { POST as postSession } from "@/app/api/ai/voice/session/route";
import {
  DELETE as deleteSession,
  PATCH as patchSession,
} from "@/app/api/ai/voice/session/[sessionId]/route";

describe("ai voice api session routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuse non authentifié", async () => {
    const { AppError } = await import("@/lib/errors");
    mockRequireActiveUser.mockRejectedValue(
      new AppError("AUTH_001", "Non authentifié.", 401),
    );

    const res = await postSession(
      new Request("http://localhost/api/ai/voice/session", {
        method: "POST",
        body: JSON.stringify({
          tripId: "22222222-2222-4222-8222-222222222222",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("crée une session et n’expose pas de clé API", async () => {
    mockRequireActiveUser.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
    });
    mockCreateVoiceSession.mockResolvedValue({
      sessionId: "33333333-3333-4333-8333-333333333333",
      provider: "pipeline",
      expiresAt: new Date().toISOString(),
      language: "fr-CA",
      askPath: "/api/ai/voice/ask",
      endPath: "/api/ai/voice/session/33333333-3333-4333-8333-333333333333",
      heartbeatPath:
        "/api/ai/voice/session/33333333-3333-4333-8333-333333333333",
      monthlySecondsUsed: 0,
      monthlySecondsLimit: 3600,
      usageMode: "conversation",
      clientPlatform: "web",
    });

    const res = await postSession(
      new Request("http://localhost/api/ai/voice/session", {
        method: "POST",
        body: JSON.stringify({
          tripId: "22222222-2222-4222-8222-222222222222",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.sessionId).toBeTruthy();
    expect(JSON.stringify(body)).not.toMatch(/OPENAI_API_KEY|sk-/);
  });

  it("termine une session via DELETE", async () => {
    mockRequireActiveUser.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
    });
    mockEndVoiceSession.mockResolvedValue(undefined);

    const res = await deleteSession(
      new Request(
        "http://localhost/api/ai/voice/session/33333333-3333-4333-8333-333333333333",
        {
          method: "DELETE",
          body: JSON.stringify({ reason: "user_quit" }),
          headers: { "Content-Type": "application/json" },
        },
      ),
      {
        params: Promise.resolve({
          sessionId: "33333333-3333-4333-8333-333333333333",
        }),
      },
    );

    expect(res.status).toBe(200);
    expect(mockEndVoiceSession).toHaveBeenCalled();
  });

  it("heartbeat via PATCH", async () => {
    mockRequireActiveUser.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
    });
    mockHeartbeat.mockResolvedValue({
      expiresAt: new Date().toISOString(),
      status: "active",
    });

    const res = await patchSession(
      new Request(
        "http://localhost/api/ai/voice/session/33333333-3333-4333-8333-333333333333",
        {
          method: "PATCH",
          body: JSON.stringify({ secondsDelta: 5 }),
          headers: { "Content-Type": "application/json" },
        },
      ),
      {
        params: Promise.resolve({
          sessionId: "33333333-3333-4333-8333-333333333333",
        }),
      },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("active");
  });
});
