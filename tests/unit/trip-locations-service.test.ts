import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const findFirstTrip = vi.fn();
const findFirstLocation = vi.fn();
const findManyLocation = vi.fn();
const createLocation = vi.fn();
const deleteManyLocation = vi.fn();
const executeRaw = vi.fn();
const transaction = vi.fn();
const writeAuditLog = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trip: { findFirst: (...args: unknown[]) => findFirstTrip(...args) },
    tripLocation: {
      findFirst: (...args: unknown[]) => findFirstLocation(...args),
      findMany: (...args: unknown[]) => findManyLocation(...args),
      create: (...args: unknown[]) => createLocation(...args),
      deleteMany: (...args: unknown[]) => deleteManyLocation(...args),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
    $executeRaw: (...args: unknown[]) => executeRaw(...args),
  },
}));

vi.mock("@/features/auth/services/audit", () => ({
  writeAuditLog: (...args: unknown[]) => writeAuditLog(...args),
}));

import {
  assertOwnedTripForLocations,
  cleanupStaleTripLocations,
  listTripLocations,
  purgeTripLocations,
  recordTripLocations,
} from "@/features/trips/services/trip-locations";

const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherUserId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const tripId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const pointId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function point(overrides: Record<string, unknown> = {}) {
  return {
    clientPointId: pointId,
    latitude: 45.5,
    longitude: -73.5,
    accuracyM: 15,
    heading: 90,
    speedMps: 10,
    recordedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("assertOwnedTripForLocations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("404 si voyage absent", async () => {
    findFirstTrip.mockResolvedValue(null);
    await expect(
      assertOwnedTripForLocations(userId, tripId),
    ).rejects.toMatchObject({ code: "TRIP_001", status: 404 });
  });

  it("403 si autre propriétaire", async () => {
    findFirstTrip.mockResolvedValue({
      id: tripId,
      status: "in_progress",
      userId: otherUserId,
    });
    await expect(
      assertOwnedTripForLocations(userId, tripId),
    ).rejects.toMatchObject({ code: "AUTH_006", status: 403 });
  });
});

describe("recordTripLocations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirstTrip.mockResolvedValue({
      id: tripId,
      status: "in_progress",
      userId,
    });
  });

  it("409 si voyage non in_progress", async () => {
    findFirstTrip.mockResolvedValue({
      id: tripId,
      status: "planned",
      userId,
    });
    await expect(
      recordTripLocations(userId, tripId, { points: [point()] }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("insère un point et retourne latest", async () => {
    const created = {
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      tripId,
      clientPointId: pointId,
      latitude: new Prisma.Decimal(45.5),
      longitude: new Prisma.Decimal(-73.5),
      accuracyM: new Prisma.Decimal(15),
      heading: new Prisma.Decimal(90),
      speedMps: new Prisma.Decimal(10),
      recordedAt: new Date(),
      createdAt: new Date(),
    };

    transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          $executeRaw: vi.fn().mockResolvedValue(undefined),
          tripLocation: {
            findFirst: vi
              .fn()
              .mockResolvedValueOnce(null)
              .mockResolvedValueOnce(created),
            create: vi.fn().mockResolvedValue(created),
          },
        };
        return fn(tx);
      },
    );

    const result = await recordTripLocations(userId, tripId, {
      points: [point()],
    });
    expect(result.accepted).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.duplicates).toBe(0);
    expect(result.latest?.latitude).toBe(45.5);
  });

  it("compte les doublons clientPointId (P2002)", async () => {
    transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          $executeRaw: vi.fn().mockResolvedValue(undefined),
          tripLocation: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockRejectedValue(
              new Prisma.PrismaClientKnownRequestError("dup", {
                code: "P2002",
                clientVersion: "test",
              }),
            ),
          },
        };
        return fn(tx);
      },
    );

    const result = await recordTripLocations(userId, tripId, {
      points: [point()],
    });
    expect(result.accepted).toBe(0);
    expect(result.duplicates).toBe(1);
  });

  it("ignore les points trop rapprochés (rate-limit 10 s)", async () => {
    const lastAt = new Date();
    const tooSoon = new Date(lastAt.getTime() + 3_000);
    transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          $executeRaw: vi.fn().mockResolvedValue(undefined),
          tripLocation: {
            findFirst: vi
              .fn()
              .mockResolvedValueOnce({ recordedAt: lastAt })
              .mockResolvedValueOnce(null),
            create: vi.fn(),
          },
        };
        return fn(tx);
      },
    );

    const result = await recordTripLocations(userId, tripId, {
      points: [point({ recordedAt: tooSoon.toISOString() })],
    });
    expect(result.accepted).toBe(0);
    expect(result.skipped).toBe(1);
  });
});

describe("listTripLocations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirstTrip.mockResolvedValue({
      id: tripId,
      status: "in_progress",
      userId,
    });
  });

  it("ordonne par recordedAt ASC puis id", async () => {
    findManyLocation.mockResolvedValue([]);
    await listTripLocations(userId, tripId, { limit: 10 });
    expect(findManyLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ recordedAt: "asc" }, { id: "asc" }],
        take: 10,
      }),
    );
  });
});

describe("purgeTripLocations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supprime et crée un audit unique", async () => {
    deleteManyLocation.mockResolvedValue({ count: 3 });
    const n = await purgeTripLocations(tripId, userId, "completed");
    expect(n).toBe(3);
    expect(writeAuditLog).toHaveBeenCalledTimes(1);
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "purge_locations",
        entity: "trip_locations",
      }),
    );
  });
});

describe("cleanupStaleTripLocations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("purge les voyages non in_progress", async () => {
    findManyLocation.mockResolvedValue([{ tripId, userId }]);
    deleteManyLocation.mockResolvedValue({ count: 2 });
    const result = await cleanupStaleTripLocations();
    expect(result.tripsProcessed).toBe(1);
    expect(result.pointsDeleted).toBe(2);
  });
});

describe("validation batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findFirstTrip.mockResolvedValue({
      id: tripId,
      status: "in_progress",
      userId,
    });
    findFirstLocation.mockResolvedValue(null);
  });

  it("refuse un batch vide", async () => {
    await expect(
      recordTripLocations(userId, tripId, { points: [] }),
    ).rejects.toBeInstanceOf(Error);
  });

  it("refuse une latitude hors bornes", async () => {
    await expect(
      recordTripLocations(userId, tripId, {
        points: [point({ latitude: 200 })],
      }),
    ).rejects.toBeInstanceOf(Error);
  });
});
