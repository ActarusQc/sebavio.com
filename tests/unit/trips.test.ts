import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertContiguousSequences,
  buildContiguousAssignments,
} from "@/features/trips/services/sequences";
import {
  stopCreateSchema,
  tripCreateSchema,
  tripUpdateSchema,
} from "@/features/trips/schemas";
import { AppError } from "@/lib/errors";

const vehicleId = "11111111-1111-4111-8111-111111111111";
const otherVehicleId = "22222222-2222-4222-8222-222222222222";
const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherUserId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const tripId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const findFirstTrip = vi.fn();
const findFirstVehicle = vi.fn();
const writeAuditLog = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trip: {
      findFirst: (...args: unknown[]) => findFirstTrip(...args),
    },
    userVehicle: {
      findFirst: (...args: unknown[]) => findFirstVehicle(...args),
    },
  },
}));

vi.mock("@/features/auth/services/audit", () => ({
  writeAuditLog: (...args: unknown[]) => writeAuditLog(...args),
}));

describe("trip schemas", () => {
  it("accepte un voyage valide", () => {
    const parsed = tripCreateSchema.parse({
      vehicleId,
      title: "Gaspésie",
      origin: "Montréal",
      destination: "Percé",
      departureDate: "2026-08-01",
      returnDate: "2026-08-10",
      plannedBudget: 1200,
    });
    expect(parsed.title).toBe("Gaspésie");
  });

  it("refuse return_date < departure_date", () => {
    const result = tripCreateSchema.safeParse({
      vehicleId,
      title: "Court",
      origin: "A",
      destination: "B",
      departureDate: "2026-08-10",
      returnDate: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });

  it("exige un véhicule", () => {
    const result = tripCreateSchema.safeParse({
      title: "Sans véhicule",
      origin: "A",
      destination: "B",
      departureDate: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });

  it("refuse departure_time < arrival_time sur une étape", () => {
    const result = stopCreateSchema.safeParse({
      name: "Pause",
      arrivalTime: "2026-08-02T14:00:00.000Z",
      departureTime: "2026-08-02T12:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("refuse status completed ou cancelled via update schema", () => {
    expect(tripUpdateSchema.safeParse({ status: "completed" }).success).toBe(
      false,
    );
    expect(tripUpdateSchema.safeParse({ status: "cancelled" }).success).toBe(
      false,
    );
  });
});

describe("transitions de statut", () => {
  it("autorise planned → in_progress, complete et cancel", async () => {
    const { assertCanStart, assertCanComplete, assertCanCancel } =
      await import("@/features/trips/services/transitions");
    expect(() => assertCanStart("planned")).not.toThrow();
    expect(() => assertCanComplete("planned")).not.toThrow();
    expect(() => assertCanCancel("planned")).not.toThrow();
  });

  it("autorise in_progress → complete et cancel, pas start", async () => {
    const { assertCanStart, assertCanComplete, assertCanCancel } =
      await import("@/features/trips/services/transitions");
    expect(() => assertCanComplete("in_progress")).not.toThrow();
    expect(() => assertCanCancel("in_progress")).not.toThrow();
    expect(() => assertCanStart("in_progress")).toThrow(AppError);
  });

  it("bloque mutations sur completed et cancelled (TRIP_005)", async () => {
    const {
      assertWritableStatus,
      assertCanStart,
      assertCanComplete,
      assertCanCancel,
    } = await import("@/features/trips/services/transitions");

    for (const status of ["completed", "cancelled"] as const) {
      expect(() => assertWritableStatus(status)).toThrow(
        expect.objectContaining({ code: "TRIP_005" }),
      );
      expect(() => assertCanStart(status)).toThrow(
        expect.objectContaining({ code: "TRIP_005" }),
      );
      expect(() => assertCanComplete(status)).toThrow(
        expect.objectContaining({ code: "TRIP_005" }),
      );
      expect(() => assertCanCancel(status)).toThrow(
        expect.objectContaining({ code: "TRIP_005" }),
      );
    }
  });
});

describe("sequences", () => {
  it("accepte 1..n contigu", () => {
    expect(() => assertContiguousSequences([1, 2, 3])).not.toThrow();
    expect(buildContiguousAssignments(["a", "b"])).toEqual([
      { id: "a", sequence: 1 },
      { id: "b", sequence: 2 },
    ]);
  });

  it("refuse doublons et trous", () => {
    expect(() => assertContiguousSequences([1, 1, 2])).toThrow(AppError);
    expect(() => assertContiguousSequences([1, 3])).toThrow(AppError);
  });
});

describe("isolation propriétaire / véhicule", () => {
  beforeEach(() => {
    vi.resetModules();
    findFirstTrip.mockReset();
    findFirstVehicle.mockReset();
    writeAuditLog.mockReset();
  });

  it("retourne TRIP_001 (404) pour un voyage d’autrui", async () => {
    findFirstTrip.mockResolvedValue(null);
    const { getOwnedTripOrThrow } =
      await import("@/features/trips/services/trips");
    await expect(getOwnedTripOrThrow(userId, tripId)).rejects.toMatchObject({
      code: "TRIP_001",
      status: 404,
    });
    expect(findFirstTrip).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId, id: tripId, deletedAt: null }),
      }),
    );
  });

  it("refuse un vehicle_id appartenant à un autre utilisateur", async () => {
    findFirstVehicle.mockResolvedValue(null);
    const { assertOwnedVehicle, createTrip } =
      await import("@/features/trips/services/trips");

    await expect(
      assertOwnedVehicle(userId, otherVehicleId),
    ).rejects.toMatchObject({
      code: "TRIP_003",
      status: 404,
    });

    // createTrip appelle assertOwnedVehicle avant toute écriture
    findFirstVehicle.mockResolvedValue(null);
    await expect(
      createTrip(userId, {
        vehicleId: otherVehicleId,
        title: "Intrusion",
        origin: "A",
        destination: "B",
        departureDate: "2026-08-01",
      }),
    ).rejects.toMatchObject({
      code: "TRIP_003",
      status: 404,
    });

    // Le filtre Prisma doit toujours inclure userId du propriétaire du voyage
    expect(findFirstVehicle).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: otherVehicleId,
          userId,
          deletedAt: null,
        }),
      }),
    );
    expect(otherUserId).not.toBe(userId);
  });
});
