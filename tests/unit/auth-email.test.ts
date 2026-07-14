import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EmailProvider, SendEmailResult } from "@/services/email/types";

function mockProvider(
  result: SendEmailResult = { ok: true },
): EmailProvider & { send: ReturnType<typeof vi.fn> } {
  return {
    name: "console",
    send: vi.fn().mockResolvedValue(result),
  };
}

describe("services/email", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(async () => {
    const email = await import("@/services/email");
    email.setEmailProviderForTests(null);
    email.resetEmailSendStats();
    email.resetEmailStartupWarningFlag();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("journalise le lien en console (dev)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("EMAIL_PROVIDER", "console");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { sendAuthEmail, createEmailProviderFromEnv } =
      await import("@/services/email");
    expect(createEmailProviderFromEnv().name).toBe("console");
    await sendAuthEmail({
      to: "a@b.co",
      kind: "verify-email",
      link: "http://localhost:3050/verify-email?token=abc",
    });
    expect(info).toHaveBeenCalled();
    expect(String(info.mock.calls[0]?.[0])).toContain("token=abc");
  });

  it("n'écrit pas le lien via ConsoleEmailProvider en production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_PROVIDER", "console");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { sendAuthEmail } = await import("@/services/email");
    await sendAuthEmail({
      to: "a@b.co",
      kind: "reset-password",
      link: "http://localhost/reset-password?token=secret",
    });
    expect(info).not.toHaveBeenCalled();
    expect(
      error.mock.calls.some((c) =>
        String(c[0]).includes("PRODUCTION SANS SMTP"),
      ),
    ).toBe(true);
  });

  it("soft-fail : exception provider ne remonte pas", async () => {
    const provider = mockProvider();
    provider.send.mockRejectedValue(new Error("boom"));
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { setEmailProviderForTests, sendAuthEmail, emailSendStats } =
      await import("@/services/email");
    setEmailProviderForTests(provider);
    const result = await sendAuthEmail({
      to: "a@b.co",
      kind: "verify-email",
      link: "http://localhost/x?token=t",
    });
    expect(result.ok).toBe(false);
    expect(emailSendStats.failures).toBeGreaterThan(0);
    expect(error).toHaveBeenCalled();
  });

  it("utilise le provider mocké sans SMTP réel", async () => {
    const provider = mockProvider({ ok: true });
    const { setEmailProviderForTests, sendNotificationEmail } =
      await import("@/services/email");
    setEmailProviderForTests(provider);
    const result = await sendNotificationEmail({
      to: "u@sebavio.com",
      title: "Test",
      body: "Corps",
      href: "/dashboard",
    });
    expect(result.ok).toBe(true);
    expect(provider.send).toHaveBeenCalledOnce();
    const arg = provider.send.mock.calls[0]?.[0];
    expect(arg?.subject).toContain("Sebavio");
    expect(arg?.html).toContain("Corps");
  });

  it("createEmailProviderFromEnv → smtp si config complète", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "smtp");
    vi.stubEnv("SMTP_HOST", "mail.smtp2go.com");
    vi.stubEnv("SMTP_PORT", "587");
    vi.stubEnv("SMTP_SECURE", "false");
    vi.stubEnv("SMTP_USER", "user");
    vi.stubEnv("SMTP_PASSWORD", "pass");
    vi.stubEnv("EMAIL_FROM", "Sebavio <no-reply@sebavio.com>");
    const { createEmailProviderFromEnv } = await import("@/services/email");
    expect(createEmailProviderFromEnv().name).toBe("smtp");
  });
});
