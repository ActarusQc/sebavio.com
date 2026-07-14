import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  memberCreateSchema,
  petCreateSchema,
  travelGroupCreateSchema,
} from "@/features/travel-groups/schemas";

const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherUserId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const groupId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const otherGroupId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const tripId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const vehicleId = "11111111-1111-4111-8111-111111111111";

const findFirstGroup = vi.fn();
const findManyTrips = vi.fn();
const findFirstVehicle = vi.fn();
const writeAuditLog = vi.fn();
const groupUpdate = vi.fn();
const groupUpdateMany = vi.fn();
const groupFindFirst = vi.fn();
const transaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    travelGroup: {
      findFirst: (...args: unknown[]) => findFirstGroup(...args),
      update: (...args: unknown[]) => groupUpdate(...args),
      updateMany: (...args: unknown[]) => groupUpdateMany(...args),
    },
    trip: {
      findMany: (...args: unknown[]) => findManyTrips(...args),
      findFirst: vi.fn(),
    },
    userVehicle: {
      findFirst: (...args: unknown[]) => findFirstVehicle(...args),
    },
    $transaction: (fn: (tx: unknown) => unknown) => {
      transaction();
      return fn({
        travelGroup: {
          update: (...args: unknown[]) => groupUpdate(...args),
          updateMany: (...args: unknown[]) => groupUpdateMany(...args),
          findFirst: (...args: unknown[]) => groupFindFirst(...args),
        },
      });
    },
  },
}));

vi.mock("@/features/auth/services/audit", () => ({
  writeAuditLog: (...args: unknown[]) => writeAuditLog(...args),
}));

describe("travel-groups schemas", () => {
  it("accepte un groupe valide", () => {
    const parsed = travelGroupCreateSchema.parse({ name: "Famille" });
    expect(parsed.name).toBe("Famille");
  });

  it("refuse birth_date dans le futur", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = memberCreateSchema.safeParse({
      firstName: "Léa",
      birthDate: future.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
  });

  it("refuse weight_kg <= 0", () => {
    expect(
      petCreateSchema.safeParse({ name: "Rex", weightKg: 0 }).success,
    ).toBe(false);
    expect(
      petCreateSchema.safeParse({ name: "Rex", weightKg: -1 }).success,
    ).toBe(false);
    expect(
      petCreateSchema.safeParse({ name: "Rex", weightKg: 12.5 }).success,
    ).toBe(true);
  });
});

describe("isolation propriétaire groupe", () => {
  beforeEach(() => {
    vi.resetModules();
    findFirstGroup.mockReset();
    findManyTrips.mockReset();
    writeAuditLog.mockReset();
    groupUpdate.mockReset();
    groupUpdateMany.mockReset();
    groupFindFirst.mockReset();
  });

  it("retourne USR_003 (404) pour un groupe d'autrui", async () => {
    findFirstGroup.mockResolvedValue(null);
    const { getOwnedGroupOrThrow } =
      await import("@/features/travel-groups/services/travel-groups");
    await expect(getOwnedGroupOrThrow(userId, groupId)).rejects.toMatchObject({
      code: "USR_003",
      status: 404,
    });
    expect(findFirstGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: groupId,
          ownerUserId: userId,
          deletedAt: null,
        }),
      }),
    );
    expect(otherUserId).not.toBe(userId);
  });

  it("refuse la suppression si voyages actifs (planned/in_progress)", async () => {
    findFirstGroup.mockResolvedValue({
      id: groupId,
      ownerUserId: userId,
      name: "Famille",
      defaultGroup: true,
      members: [],
      pets: [],
      preferences: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    findManyTrips.mockResolvedValue([
      { id: tripId, title: "Gaspésie" },
      { id: "ffffffff-ffff-4fff-8fff-ffffffffffff", title: "Ontario" },
    ]);

    const { deleteTravelGroup } =
      await import("@/features/travel-groups/services/travel-groups");

    await expect(deleteTravelGroup(userId, groupId)).rejects.toMatchObject({
      code: "USR_004",
      status: 409,
      message: expect.stringContaining("Gaspésie"),
    });

    await expect(deleteTravelGroup(userId, groupId)).rejects.toMatchObject({
      message: expect.stringContaining("Ontario"),
    });

    expect(groupUpdate).not.toHaveBeenCalled();
  });

  it("autorise soft-delete si seulement completed/cancelled", async () => {
    findFirstGroup.mockResolvedValue({
      id: groupId,
      ownerUserId: userId,
      name: "Famille",
      defaultGroup: false,
      members: [],
      pets: [],
      preferences: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    findManyTrips.mockResolvedValue([]);
    groupUpdate.mockResolvedValue({});

    const { deleteTravelGroup } =
      await import("@/features/travel-groups/services/travel-groups");

    await deleteTravelGroup(userId, groupId);

    expect(findManyTrips).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          travelGroupId: groupId,
          status: { in: ["planned", "in_progress"] },
        }),
      }),
    );
    expect(groupUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: groupId },
        data: expect.objectContaining({
          defaultGroup: false,
          deletedAt: expect.any(Date),
        }),
      }),
    );
    expect(writeAuditLog).toHaveBeenCalled();
  });
});

describe("lien travel_group_id sur trips", () => {
  beforeEach(() => {
    vi.resetModules();
    findFirstGroup.mockReset();
    findFirstVehicle.mockReset();
  });

  it("refuse un travel_group_id d'autrui (USR_003)", async () => {
    findFirstGroup.mockResolvedValue(null);
    const { assertOwnedTravelGroup } =
      await import("@/features/travel-groups/services/travel-groups");

    await expect(
      assertOwnedTravelGroup(userId, otherGroupId),
    ).rejects.toMatchObject({
      code: "USR_003",
      status: 404,
    });

    findFirstVehicle.mockResolvedValue({ id: vehicleId });
    findFirstGroup.mockResolvedValue(null);

    const { createTrip } = await import("@/features/trips/services/trips");
    await expect(
      createTrip(userId, {
        vehicleId,
        travelGroupId: otherGroupId,
        title: "Intrusion",
        origin: "A",
        destination: "B",
        departureDate: "2026-08-01",
      }),
    ).rejects.toMatchObject({
      code: "USR_003",
      status: 404,
    });
  });

  it("mapper affiche « Groupe archivé » si deletedAt", async () => {
    const { toTripDto } = await import("@/features/trips/services/mappers");
    const dto = toTripDto({
      id: tripId,
      userId,
      vehicleId,
      travelGroupId: groupId,
      title: "Historique",
      status: "completed",
      departureDate: new Date("2026-01-01"),
      returnDate: null,
      origin: "A",
      destination: "B",
      plannedBudget: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      travelGroup: {
        id: groupId,
        name: "Ancien nom",
        deletedAt: new Date(),
      },
      _count: { stops: 0 },
    });
    expect(dto.travelGroup?.name).toBe("Groupe archivé");
    expect(dto.travelGroup?.archived).toBe(true);
  });
});
