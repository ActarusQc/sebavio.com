import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  budgetExceededDedupeKey,
  maintenanceDedupeKey,
  tripUpcomingDedupeKey,
} from "@/features/notifications/constants";

const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const tripId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const findFirstTrip = vi.fn();
const findManyExpenses = vi.fn();
const findFirstNotif = vi.fn();
const createNotif = vi.fn();
const updateManyNotif = vi.fn();
const findUniquePrefs = vi.fn();
const findUniqueUserPrefs = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trip: {
      findFirst: (...args: unknown[]) => findFirstTrip(...args),
    },
    expense: {
      findMany: (...args: unknown[]) => findManyExpenses(...args),
    },
    notification: {
      findFirst: (...args: unknown[]) => findFirstNotif(...args),
      create: (...args: unknown[]) => createNotif(...args),
      updateMany: (...args: unknown[]) => updateManyNotif(...args),
    },
    notificationPreference: {
      findUnique: (...args: unknown[]) => findUniquePrefs(...args),
      create: vi.fn(),
    },
    userPreference: {
      findUnique: (...args: unknown[]) => findUniqueUserPrefs(...args),
    },
  },
}));

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    status: "ready",
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn(),
    del: vi.fn(),
    connect: vi.fn(),
  }),
}));

describe("notifications/constants dedupe keys", () => {
  it("construit les clés anti-doublon", () => {
    expect(maintenanceDedupeKey("sched-1")).toBe("maintenance:sched-1");
    expect(budgetExceededDedupeKey(tripId)).toBe(`budget_exceeded:${tripId}`);
    expect(tripUpcomingDedupeKey(tripId, "2026-08-01")).toBe(
      `trip_upcoming:${tripId}:2026-08-01`,
    );
  });
});

describe("syncBudgetExceededNotification cycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueUserPrefs.mockResolvedValue({ notificationsEnabled: true });
    findUniquePrefs.mockResolvedValue({
      userId,
      inAppMaintenance: true,
      inAppTrip: true,
      inAppBudget: true,
      inAppWeather: true,
      inAppFuel: true,
      emailMaintenance: false,
      emailTrip: false,
      emailBudget: false,
      emailWeather: false,
      emailFuel: false,
    });
    updateManyNotif.mockResolvedValue({ count: 1 });
  });

  it("dépasser → crée; corriger → soft-delete; redépasser → recrée", async () => {
    const { syncBudgetExceededNotification } =
      await import("@/features/notifications/services/budget-sync");

    findFirstTrip.mockResolvedValue({
      id: tripId,
      userId,
      title: "Gaspésie",
      budget: { plannedAmount: { toString: () => "100.00" }, currency: "CAD" },
    });

    findManyExpenses.mockResolvedValueOnce([
      { amount: { toString: () => "150.00" } },
    ]);
    findFirstNotif.mockResolvedValueOnce(null);
    createNotif.mockResolvedValueOnce({
      id: "notif-1",
      userId,
      type: "budget",
      channel: "in_app",
      title: "Budget dépassé",
      body: "…",
      priority: "high",
      dedupeKey: budgetExceededDedupeKey(tripId),
      sourceEntity: "trips",
      sourceId: tripId,
      href: `/dashboard/finance/trips/${tripId}`,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(syncBudgetExceededNotification(userId, tripId)).resolves.toBe(
      "created",
    );

    findManyExpenses.mockResolvedValueOnce([
      { amount: { toString: () => "80.00" } },
    ]);
    await expect(syncBudgetExceededNotification(userId, tripId)).resolves.toBe(
      "cleared",
    );
    expect(updateManyNotif).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dedupeKey: budgetExceededDedupeKey(tripId),
          deletedAt: null,
        }),
      }),
    );

    findManyExpenses.mockResolvedValueOnce([
      { amount: { toString: () => "200.00" } },
    ]);
    findFirstNotif.mockResolvedValueOnce(null);
    createNotif.mockResolvedValueOnce({
      id: "notif-2",
      userId,
      type: "budget",
      channel: "in_app",
      title: "Budget dépassé",
      body: "…",
      priority: "high",
      dedupeKey: budgetExceededDedupeKey(tripId),
      sourceEntity: "trips",
      sourceId: tripId,
      href: `/dashboard/finance/trips/${tripId}`,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(syncBudgetExceededNotification(userId, tripId)).resolves.toBe(
      "created",
    );
    expect(createNotif).toHaveBeenCalledTimes(2);
  });
});

describe("notifications schemas", () => {
  it("valide la liste et les préférences", async () => {
    const { notificationsListSchema, updateNotificationPreferencesSchema } =
      await import("@/features/notifications/schemas");

    expect(
      notificationsListSchema.parse({ page: "2", unreadOnly: "true" }),
    ).toEqual({ page: 2, pageSize: 20, unreadOnly: true });

    const prefs = updateNotificationPreferencesSchema.parse({
      inAppMaintenance: true,
      inAppTrip: false,
      inAppBudget: true,
      inAppWeather: true,
      inAppFuel: true,
      emailMaintenance: false,
      emailTrip: false,
      emailBudget: false,
      emailWeather: false,
      emailFuel: false,
      pushMaintenance: false,
      pushTrip: false,
      pushBudget: false,
      pushWeather: false,
      pushFuel: false,
    });
    expect(prefs.inAppTrip).toBe(false);
  });
});

describe("isolation NOTIF_001", () => {
  it("getNotificationById → 404 pour un autre user", async () => {
    findFirstNotif.mockResolvedValue(null);
    const { getNotificationById } =
      await import("@/features/notifications/services/list");

    await expect(
      getNotificationById(userId, "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"),
    ).rejects.toMatchObject({ code: "NOTIF_001", status: 404 });
  });
});
