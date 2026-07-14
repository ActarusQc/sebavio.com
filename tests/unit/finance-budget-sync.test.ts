import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import {
  assertBudgetMirrorConsistent,
  upsertTripBudgetAmount,
} from "@/features/finance/services/budget";

const tripId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

describe("upsertTripBudgetAmount (source de vérité)", () => {
  it("upsert trip_budgets puis miroir trips.planned_budget", async () => {
    const upsert = vi.fn().mockResolvedValue({
      id: "budget-1",
      tripId,
      plannedAmount: new Prisma.Decimal("1200.00"),
      currency: "CAD",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const tripUpdate = vi.fn().mockResolvedValue({});
    const deleteMany = vi.fn();

    const tx = {
      tripBudget: { upsert, deleteMany },
      trip: { update: tripUpdate },
    };

    const row = await upsertTripBudgetAmount(tx as never, tripId, 1200, "CAD");

    expect(row?.plannedAmount.toString()).toBe("1200");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tripId },
        create: expect.objectContaining({
          tripId,
          currency: "CAD",
        }),
        update: expect.objectContaining({ currency: "CAD" }),
      }),
    );
    expect(tripUpdate).toHaveBeenCalledWith({
      where: { id: tripId },
      data: { plannedBudget: expect.any(Prisma.Decimal) },
    });
    const mirrored = tripUpdate.mock.calls[0][0].data.plannedBudget;
    expect(mirrored.toFixed(2)).toBe("1200.00");
  });

  it("null → supprime trip_budgets et planned_budget", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const tripUpdate = vi.fn().mockResolvedValue({});
    const upsert = vi.fn();

    const tx = {
      tripBudget: { upsert, deleteMany },
      trip: { update: tripUpdate },
    };

    const row = await upsertTripBudgetAmount(tx as never, tripId, null);
    expect(row).toBeNull();
    expect(deleteMany).toHaveBeenCalledWith({ where: { tripId } });
    expect(tripUpdate).toHaveBeenCalledWith({
      where: { id: tripId },
      data: { plannedBudget: null },
    });
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("assertBudgetMirrorConsistent", () => {
  it("détecte la cohérence et l'incohérence", async () => {
    const findUniqueBudget = vi.fn();
    const findUniqueTrip = vi.fn();
    const tx = {
      tripBudget: { findUnique: findUniqueBudget },
      trip: { findUnique: findUniqueTrip },
    };

    findUniqueBudget.mockResolvedValue({
      plannedAmount: new Prisma.Decimal("500.00"),
    });
    findUniqueTrip.mockResolvedValue({
      plannedBudget: new Prisma.Decimal("500.00"),
    });
    await expect(
      assertBudgetMirrorConsistent(tx as never, tripId),
    ).resolves.toMatchObject({ consistent: true });

    findUniqueTrip.mockResolvedValue({
      plannedBudget: new Prisma.Decimal("499.99"),
    });
    await expect(
      assertBudgetMirrorConsistent(tx as never, tripId),
    ).resolves.toMatchObject({ consistent: false });

    findUniqueBudget.mockResolvedValue(null);
    findUniqueTrip.mockResolvedValue({ plannedBudget: null });
    await expect(
      assertBudgetMirrorConsistent(tx as never, tripId),
    ).resolves.toMatchObject({
      consistent: true,
      budgetAmount: null,
      tripPlannedBudget: null,
    });
  });
});

describe("chemins d'écriture budget → miroir cohérent", () => {
  const tripCreate = vi.fn();
  const tripUpdate = vi.fn();
  const tripFindUniqueOrThrow = vi.fn();
  const tripFindFirst = vi.fn();
  const vehicleFindFirst = vi.fn();
  const tripBudgetUpsert = vi.fn();
  const tripBudgetDeleteMany = vi.fn();
  const tripBudgetFindUnique = vi.fn();
  const writeAuditLog = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    vehicleFindFirst.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      deletedAt: null,
    });

    const tripRow = {
      id: tripId,
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      vehicleId: "11111111-1111-4111-8111-111111111111",
      travelGroupId: null,
      title: "Gaspésie",
      status: "planned",
      departureDate: new Date("2026-08-01T12:00:00.000Z"),
      returnDate: new Date("2026-08-10T12:00:00.000Z"),
      origin: "Montréal",
      destination: "Percé",
      plannedBudget: new Prisma.Decimal("1200.00"),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      vehicle: {
        id: "11111111-1111-4111-8111-111111111111",
        displayName: "Van",
        model: { name: "Transit", manufacturer: { name: "Ford" } },
      },
      travelGroup: null,
      stops: [],
      route: null,
      _count: { stops: 0 },
    };

    tripCreate.mockImplementation(async ({ data }: { data: unknown }) => ({
      ...tripRow,
      plannedBudget: null,
      ...(typeof data === "object" && data ? data : {}),
    }));

    tripFindUniqueOrThrow.mockResolvedValue(tripRow);
    tripFindFirst.mockResolvedValue(tripRow);
    tripUpdate.mockResolvedValue(tripRow);

    tripBudgetUpsert.mockImplementation(
      async ({
        create,
        update,
      }: {
        create: { plannedAmount: Prisma.Decimal; currency: string };
        update: { plannedAmount: Prisma.Decimal; currency: string };
      }) => ({
        id: "budget-1",
        tripId,
        plannedAmount: create?.plannedAmount ?? update.plannedAmount,
        currency: create?.currency ?? update.currency,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    tripBudgetFindUnique.mockResolvedValue({
      id: "budget-1",
      tripId,
      plannedAmount: new Prisma.Decimal("1200.00"),
      currency: "CAD",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
          fn({
            trip: {
              create: tripCreate,
              update: tripUpdate,
              findUniqueOrThrow: tripFindUniqueOrThrow,
              findFirst: tripFindFirst,
            },
            tripBudget: {
              upsert: tripBudgetUpsert,
              deleteMany: tripBudgetDeleteMany,
              findUnique: tripBudgetFindUnique,
            },
            userVehicle: { findFirst: vehicleFindFirst },
          }),
        trip: {
          create: tripCreate,
          update: tripUpdate,
          findUniqueOrThrow: tripFindUniqueOrThrow,
          findFirst: tripFindFirst,
        },
        tripBudget: {
          upsert: tripBudgetUpsert,
          deleteMany: tripBudgetDeleteMany,
          findUnique: tripBudgetFindUnique,
        },
        userVehicle: { findFirst: vehicleFindFirst },
      },
    }));

    vi.doMock("@/features/auth/services/audit", () => ({
      writeAuditLog: (...args: unknown[]) => writeAuditLog(...args),
    }));
  });

  it("création voyage avec budget → miroir cohérent", async () => {
    const { createTrip } = await import("@/features/trips/services/trips");
    const { assertBudgetMirrorConsistent: assertMirror } =
      await import("@/features/finance/services/budget");

    // Simule l'état post-sync pour assertMirror
    tripBudgetFindUnique.mockResolvedValue({
      plannedAmount: new Prisma.Decimal("1200.00"),
    });
    tripFindUniqueOrThrow.mockResolvedValue({
      id: tripId,
      plannedBudget: new Prisma.Decimal("1200.00"),
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      vehicleId: "11111111-1111-4111-8111-111111111111",
      travelGroupId: null,
      title: "Gaspésie",
      status: "planned",
      departureDate: new Date("2026-08-01T12:00:00.000Z"),
      returnDate: new Date("2026-08-10T12:00:00.000Z"),
      origin: "Montréal",
      destination: "Percé",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      vehicle: {
        id: "11111111-1111-4111-8111-111111111111",
        displayName: "Van",
        model: { name: "Transit", manufacturer: { name: "Ford" } },
      },
      travelGroup: null,
      stops: [],
      route: null,
      _count: { stops: 0 },
    });

    await createTrip("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", {
      vehicleId: "11111111-1111-4111-8111-111111111111",
      title: "Gaspésie",
      origin: "Montréal",
      destination: "Percé",
      departureDate: "2026-08-01",
      returnDate: "2026-08-10",
      plannedBudget: 1200,
    });

    expect(tripBudgetUpsert).toHaveBeenCalled();
    expect(tripUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plannedBudget: expect.any(Prisma.Decimal),
        }),
      }),
    );

    const mirror = await assertMirror(
      {
        tripBudget: { findUnique: tripBudgetFindUnique },
        trip: { findUnique: tripFindUniqueOrThrow },
      } as never,
      tripId,
    );
    expect(mirror.consistent).toBe(true);
    expect(mirror.budgetAmount).toBe("1200.00");
    expect(mirror.tripPlannedBudget).toBe("1200.00");
  });

  it("PUT budget (upsertTripBudget) → miroir cohérent", async () => {
    const { upsertTripBudget } =
      await import("@/features/finance/services/summary");

    tripFindFirst.mockResolvedValue({
      id: tripId,
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      vehicleId: "11111111-1111-4111-8111-111111111111",
      travelGroupId: null,
      title: "Gaspésie",
      status: "planned",
      departureDate: new Date("2026-08-01T12:00:00.000Z"),
      returnDate: new Date("2026-08-10T12:00:00.000Z"),
      origin: "Montréal",
      destination: "Percé",
      plannedBudget: new Prisma.Decimal("800.00"),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      vehicle: {
        id: "11111111-1111-4111-8111-111111111111",
        displayName: "Van",
        model: { name: "Transit", manufacturer: { name: "Ford" } },
      },
      travelGroup: null,
      stops: [],
      route: null,
      _count: { stops: 0 },
    });

    // Après sync : trip.findUniqueOrThrow pour toBudgetDto
    tripFindUniqueOrThrow.mockResolvedValue({
      plannedBudget: new Prisma.Decimal("800.00"),
    });

    const budget = await upsertTripBudget(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      tripId,
      { plannedAmount: 800, currency: "CAD" },
    );

    expect(budget.plannedAmount).toBe("800.00");
    expect(budget.mirroredPlannedBudget).toBe("800.00");
    expect(tripBudgetUpsert).toHaveBeenCalled();
  });

  it("modification voyage (plannedBudget) → miroir cohérent", async () => {
    const { updateTrip } = await import("@/features/trips/services/trips");

    tripFindFirst.mockResolvedValue({
      id: tripId,
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      vehicleId: "11111111-1111-4111-8111-111111111111",
      travelGroupId: null,
      title: "Gaspésie",
      status: "planned",
      departureDate: new Date("2026-08-01T12:00:00.000Z"),
      returnDate: new Date("2026-08-10T12:00:00.000Z"),
      origin: "Montréal",
      destination: "Percé",
      plannedBudget: new Prisma.Decimal("1000.00"),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      vehicle: {
        id: "11111111-1111-4111-8111-111111111111",
        displayName: "Van",
        model: { name: "Transit", manufacturer: { name: "Ford" } },
      },
      travelGroup: null,
      stops: [],
      route: null,
      _count: { stops: 0 },
    });

    tripFindUniqueOrThrow.mockResolvedValue({
      id: tripId,
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      vehicleId: "11111111-1111-4111-8111-111111111111",
      travelGroupId: null,
      title: "Gaspésie",
      status: "planned",
      departureDate: new Date("2026-08-01T12:00:00.000Z"),
      returnDate: new Date("2026-08-10T12:00:00.000Z"),
      origin: "Montréal",
      destination: "Percé",
      plannedBudget: new Prisma.Decimal("1500.00"),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      vehicle: {
        id: "11111111-1111-4111-8111-111111111111",
        displayName: "Van",
        model: { name: "Transit", manufacturer: { name: "Ford" } },
      },
      travelGroup: null,
      stops: [],
      route: null,
      _count: { stops: 0 },
    });

    await updateTrip("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", tripId, {
      plannedBudget: 1500,
    });

    expect(tripBudgetUpsert).toHaveBeenCalled();
    const syncCall = tripUpdate.mock.calls.find(
      (c) => c[0]?.data?.plannedBudget != null,
    );
    expect(syncCall).toBeTruthy();
    expect(syncCall![0].data.plannedBudget.toFixed(2)).toBe("1500.00");
  });
});
