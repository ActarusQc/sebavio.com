import { beforeEach, describe, expect, it, vi } from "vitest";

const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const findFirstNotif = vi.fn();
const createNotif = vi.fn();
const findUniquePrefs = vi.fn();
const findUniqueUserPrefs = vi.fn();
const findFirstUser = vi.fn();
const sendNotificationEmailMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      findFirst: (...args: unknown[]) => findFirstNotif(...args),
      create: (...args: unknown[]) => createNotif(...args),
    },
    notificationPreference: {
      findUnique: (...args: unknown[]) => findUniquePrefs(...args),
      create: vi.fn(),
    },
    userPreference: {
      findUnique: (...args: unknown[]) => findUniqueUserPrefs(...args),
    },
    user: {
      findFirst: (...args: unknown[]) => findFirstUser(...args),
    },
  },
}));

vi.mock("@/services/email", () => ({
  sendNotificationEmail: (...args: unknown[]) =>
    sendNotificationEmailMock(...args),
}));

describe("dispatchEmailChannel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueUserPrefs.mockResolvedValue({ notificationsEnabled: true });
    findUniquePrefs.mockResolvedValue({
      userId,
      emailMaintenance: true,
      emailTrip: false,
      emailBudget: false,
      emailWeather: false,
      emailFuel: false,
    });
    findFirstNotif.mockResolvedValue(null);
    findFirstUser.mockResolvedValue({ email: "u@example.com" });
    sendNotificationEmailMock.mockResolvedValue({ ok: true });
    createNotif.mockResolvedValue({ id: "n1" });
  });

  it("n'envoie pas si préférence email inactive", async () => {
    findUniquePrefs.mockResolvedValue({
      userId,
      emailMaintenance: false,
      emailTrip: false,
      emailBudget: false,
      emailWeather: false,
      emailFuel: false,
    });
    const { dispatchEmailChannel } =
      await import("@/features/notifications/services/email-channel");
    const result = await dispatchEmailChannel({
      userId,
      type: "maintenance",
      title: "T",
      body: "B",
      dedupeKey: "maintenance:s1",
    });
    expect(result).toBe("skipped_prefs");
    expect(sendNotificationEmailMock).not.toHaveBeenCalled();
  });

  it("envoie et persiste channel=email", async () => {
    const { dispatchEmailChannel } =
      await import("@/features/notifications/services/email-channel");
    const result = await dispatchEmailChannel({
      userId,
      type: "maintenance",
      title: "Entretien",
      body: "À faire",
      dedupeKey: "maintenance:s1",
      href: "/dashboard/maintenance",
    });
    expect(result).toBe("sent");
    expect(sendNotificationEmailMock).toHaveBeenCalledOnce();
    expect(createNotif).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ channel: "email" }),
      }),
    );
  });

  it("échec SMTP → failed sans exception", async () => {
    sendNotificationEmailMock.mockResolvedValue({
      ok: false,
      reason: "timeout",
    });
    const { dispatchEmailChannel } =
      await import("@/features/notifications/services/email-channel");
    const result = await dispatchEmailChannel({
      userId,
      type: "maintenance",
      title: "T",
      body: "B",
      dedupeKey: "maintenance:s1",
    });
    expect(result).toBe("failed");
    expect(createNotif).not.toHaveBeenCalled();
  });
});
