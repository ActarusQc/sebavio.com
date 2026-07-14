import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FUEL_AMOUNT_TOLERANCE,
  relativeDiscrepancy,
  resolveFuelAmounts,
} from "@/features/fuel/lib/amounts";
import {
  computeConsumptionStats,
  estimateTripFuelCost,
  resolveRealAvgAfterRecalc,
} from "@/features/fuel/lib/consumption";
import { fuelLogCreateSchema } from "@/features/fuel/schemas";
import { assertOdometerNotDecreasing } from "@/features/vehicles/services/odometer";
import { AppError } from "@/lib/errors";

const findFirstFuelLog = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    fuelLog: {
      findFirst: (...args: unknown[]) => findFirstFuelLog(...args),
    },
  },
}));

describe("resolveFuelAmounts", () => {
  it("calcule le total depuis litres × prix", () => {
    const r = resolveFuelAmounts({ liters: 40, pricePerLiter: 1.5 });
    expect(r.totalCost).toBe(60);
    expect(r.liters).toBe(40);
    expect(r.pricePerLiter).toBe(1.5);
  });

  it("calcule le prix depuis litres et total", () => {
    const r = resolveFuelAmounts({ liters: 50, totalCost: 82.5 });
    expect(r.pricePerLiter).toBe(1.65);
  });

  it("calcule les litres depuis prix et total", () => {
    const r = resolveFuelAmounts({ pricePerLiter: 1.65, totalCost: 66 });
    expect(r.liters).toBe(40);
  });

  it("accepte un écart ≤ 2 % sur les trois valeurs", () => {
    const r = resolveFuelAmounts({
      liters: 40,
      pricePerLiter: 1.5,
      totalCost: 60.5,
    });
    expect(r.totalCost).toBe(60.5);
  });

  it("refuse un écart > 2 %", () => {
    expect(() =>
      resolveFuelAmounts({
        liters: 40,
        pricePerLiter: 1.5,
        totalCost: 70,
      }),
    ).toThrow(/Écart > 2/);
  });

  it("refuse moins de deux valeurs", () => {
    expect(() => resolveFuelAmounts({ liters: 40 })).toThrow(/deux valeurs/);
  });

  it("relativeDiscrepancy respecte la tolérance", () => {
    expect(relativeDiscrepancy(100, 102)).toBeLessThanOrEqual(
      FUEL_AMOUNT_TOLERANCE,
    );
    expect(relativeDiscrepancy(100, 103)).toBeGreaterThan(
      FUEL_AMOUNT_TOLERANCE,
    );
  });
});

describe("computeConsumptionStats", () => {
  it("premier plein : pas de conso", () => {
    const stats = computeConsumptionStats([
      { odometerKm: 10000, liters: 50, isFull: true },
    ]);
    expect(stats.realAvgConsumption).toBeNull();
    expect(stats.segmentCount).toBe(0);
  });

  it("calcule L/100 km entre deux pleins complets", () => {
    const stats = computeConsumptionStats([
      { odometerKm: 10000, liters: 40, isFull: true },
      { odometerKm: 10500, liters: 50, isFull: true },
    ]);
    expect(stats.realAvgConsumption).toBe(10);
    expect(stats.segmentCount).toBe(1);
  });

  it("ignore les pleins partiels dans la conso", () => {
    const stats = computeConsumptionStats([
      { odometerKm: 10000, liters: 40, isFull: true },
      { odometerKm: 10200, liters: 20, isFull: false },
      { odometerKm: 10500, liters: 50, isFull: true },
    ]);
    expect(stats.realAvgConsumption).toBe(10);
    expect(stats.segmentCount).toBe(1);
  });

  it("exclut les segments à odomètre identique", () => {
    const stats = computeConsumptionStats([
      { odometerKm: 10000, liters: 40, isFull: true },
      { odometerKm: 10000, liters: 50, isFull: true },
      { odometerKm: 10500, liters: 50, isFull: true },
    ]);
    expect(stats.segmentCount).toBe(1);
    expect(stats.realAvgConsumption).toBe(10);
  });

  it("véhicule sans plein → null", () => {
    const stats = computeConsumptionStats([]);
    expect(stats.realAvgConsumption).toBeNull();
  });

  it("moins de 2 pleins complets → null (après suppression)", () => {
    const afterDelete = computeConsumptionStats([
      { odometerKm: 10000, liters: 40, isFull: true },
    ]);
    expect(afterDelete.realAvgConsumption).toBeNull();
  });

  it("resolveRealAvgAfterRecalc force null si < 2 pleins complets", () => {
    expect(resolveRealAvgAfterRecalc(0, 12.5)).toBeNull();
    expect(resolveRealAvgAfterRecalc(1, 12.5)).toBeNull();
    expect(resolveRealAvgAfterRecalc(2, 12.5)).toBe(12.5);
    expect(resolveRealAvgAfterRecalc(2, null)).toBeNull();
  });

  it("moyenne pondérée sur plusieurs segments", () => {
    const stats = computeConsumptionStats([
      { odometerKm: 0, liters: 0, isFull: true },
      { odometerKm: 500, liters: 50, isFull: true },
      { odometerKm: 1500, liters: 80, isFull: true },
    ]);
    expect(stats.realAvgConsumption).toBe(8.67);
  });
});

describe("estimateTripFuelCost", () => {
  it("estime litres et coût", () => {
    const r = estimateTripFuelCost({
      distanceKm: 1000,
      consumptionL100: 12,
      pricePerLiter: 1.5,
    });
    expect(r.litersNeeded).toBe(120);
    expect(r.estimatedCost).toBe(180);
  });
});

describe("fuelLogCreateSchema", () => {
  it("refuse une date future", () => {
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 5);
    const result = fuelLogCreateSchema.safeParse({
      vehicleId: "11111111-1111-4111-8111-111111111111",
      filledAt: future.toISOString().slice(0, 10),
      odometerKm: 10000,
      liters: 40,
      pricePerLiter: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("exige au moins deux montants", () => {
    const result = fuelLogCreateSchema.safeParse({
      vehicleId: "11111111-1111-4111-8111-111111111111",
      filledAt: "2026-07-01",
      odometerKm: 10000,
      liters: 40,
    });
    expect(result.success).toBe(false);
  });
});

describe("isolation odomètre / accès", () => {
  it("assertOdometerNotDecreasing refuse une baisse", () => {
    expect(() => assertOdometerNotDecreasing(10000, 9999, "FUEL_002")).toThrow(
      AppError,
    );
    try {
      assertOdometerNotDecreasing(10000, 9999, "FUEL_002");
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).code).toBe("FUEL_002");
    }
  });

  it("assertOdometerNotDecreasing accepte égal ou supérieur", () => {
    expect(() => assertOdometerNotDecreasing(10000, 10000)).not.toThrow();
    expect(() => assertOdometerNotDecreasing(10000, 10001)).not.toThrow();
  });
});

describe("isolation fuel_logs", () => {
  beforeEach(() => {
    findFirstFuelLog.mockReset();
  });

  it("retourne FUEL_001 (404) pour un plein d’autrui", async () => {
    findFirstFuelLog.mockResolvedValue(null);
    const { getOwnedFuelLogOrThrow } =
      await import("@/features/fuel/services/logs");
    await expect(
      getOwnedFuelLogOrThrow(
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      ),
    ).rejects.toMatchObject({
      code: "FUEL_001",
      status: 404,
    });
    expect(findFirstFuelLog).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          deletedAt: null,
          vehicle: expect.objectContaining({
            userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            deletedAt: null,
          }),
        }),
      }),
    );
  });
});
