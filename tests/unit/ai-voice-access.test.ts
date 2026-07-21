import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { AppError } from "@/lib/errors";

const { mockResolveUserAccess } = vi.hoisted(() => ({
  mockResolveUserAccess: vi.fn(),
}));

vi.mock("@/features/subscriptions/services/access-resolve", () => ({
  resolveUserAccess: mockResolveUserAccess,
}));

import {
  assertVoiceAllowed,
  resolveVoiceAccess,
} from "@/features/ai/voice/access";

describe("ai voice access", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VOICE_AGENT_ENABLED = "true";
    process.env.VOICE_AGENT_WEB_ENABLED = "true";
    process.env.VOICE_AGENT_MOBILE_ENABLED = "false";
    process.env.VOICE_AGENT_PROVIDER = "pipeline";
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("refuse sans entitlement ai.voice.enabled", async () => {
    mockResolveUserAccess.mockResolvedValue({
      level: "subscriber",
      planSlug: "decouverte",
      entitlements: [
        { key: "ai.voice.enabled", enabled: false },
        { key: "ai.planning.enabled", enabled: false },
      ],
    });

    const access = await resolveVoiceAccess("user-1");
    expect(access.canUseVoice).toBe(false);

    await expect(assertVoiceAllowed("user-1", "web")).rejects.toMatchObject({
      code: "ACCESS_DENIED",
    });
  });

  it("autorise avec entitlement + planning", async () => {
    mockResolveUserAccess.mockResolvedValue({
      level: "subscriber",
      planSlug: "sebavio-plus",
      entitlements: [
        { key: "ai.voice.enabled", enabled: true },
        { key: "ai.planning.enabled", enabled: true },
      ],
    });

    const access = await assertVoiceAllowed("user-1", "web");
    expect(access.canUseVoice).toBe(true);
    expect(access.canUsePersonalizedAi).toBe(true);
  });

  it("autorise admin sans entitlement", async () => {
    mockResolveUserAccess.mockResolvedValue({
      level: "admin",
      planSlug: null,
      entitlements: [],
    });

    const access = await assertVoiceAllowed("admin-1", "web");
    expect(access.canUseVoice).toBe(true);
  });

  it("refuse plateforme mobile désactivée", async () => {
    mockResolveUserAccess.mockResolvedValue({
      level: "subscriber",
      planSlug: "sebavio-plus",
      entitlements: [
        { key: "ai.voice.enabled", enabled: true },
        { key: "ai.planning.enabled", enabled: true },
      ],
    });

    await expect(assertVoiceAllowed("user-1", "mobile")).rejects.toBeInstanceOf(
      AppError,
    );
    await expect(assertVoiceAllowed("user-1", "mobile")).rejects.toMatchObject({
      code: "VOICE_PLATFORM",
    });
  });

  it("refuse si VOICE_AGENT_ENABLED=false", async () => {
    process.env.VOICE_AGENT_ENABLED = "false";
    mockResolveUserAccess.mockResolvedValue({
      level: "subscriber",
      planSlug: "sebavio-plus",
      entitlements: [
        { key: "ai.voice.enabled", enabled: true },
        { key: "ai.planning.enabled", enabled: true },
      ],
    });

    await expect(assertVoiceAllowed("user-1", "web")).rejects.toMatchObject({
      code: "VOICE_DISABLED",
    });
  });
});
