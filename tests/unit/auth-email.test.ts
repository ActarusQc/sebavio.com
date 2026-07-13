import { describe, expect, it, vi, afterEach } from "vitest";

describe("sendAuthEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("journalise le lien en développement", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { sendAuthEmail } = await import("@/services/email");
    await sendAuthEmail({
      to: "a@b.co",
      kind: "verify-email",
      link: "http://localhost/verify-email?token=abc",
    });
    expect(info).toHaveBeenCalled();
    expect(String(info.mock.calls[0]?.[0])).toContain("token=abc");
  });

  it("n'écrit pas le lien en production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { sendAuthEmail } = await import("@/services/email");
    await sendAuthEmail({
      to: "a@b.co",
      kind: "reset-password",
      link: "http://localhost/reset-password?token=secret",
    });
    expect(info).not.toHaveBeenCalled();
  });
});
