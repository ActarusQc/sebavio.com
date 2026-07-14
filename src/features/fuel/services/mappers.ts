import type { FuelLog } from "@prisma/client";
import type { FuelLogDto, FuelStatsDto } from "@/features/fuel/types";
import type { ConsumptionStats } from "@/features/fuel/lib/consumption";

function decimalToString(value: { toString(): string } | null): string | null {
  return value == null ? null : value.toString();
}

export function toFuelLogDto(row: FuelLog): FuelLogDto {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    filledAt: row.filledAt.toISOString().slice(0, 10),
    odometerKm: row.odometerKm,
    liters: row.liters.toString(),
    pricePerLiter: row.pricePerLiter.toString(),
    totalCost: row.totalCost.toString(),
    isFull: row.isFull,
    fuelType: row.fuelType,
    stationName: row.stationName,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toFuelStatsDto(input: {
  consumption: ConsumptionStats;
  fullFillCount: number;
  totalFillCount: number;
  avgPricePerLiter: number | null;
  totalSpent: number;
}): FuelStatsDto {
  return {
    realAvgConsumption:
      input.consumption.realAvgConsumption != null
        ? input.consumption.realAvgConsumption.toFixed(2)
        : null,
    fullFillCount: input.fullFillCount,
    totalFillCount: input.totalFillCount,
    segmentCount: input.consumption.segmentCount,
    totalDistanceKm: input.consumption.totalDistanceKm,
    totalLitersInSegments: input.consumption.totalLitersInSegments,
    avgPricePerLiter:
      input.avgPricePerLiter != null ? input.avgPricePerLiter.toFixed(3) : null,
    totalSpent: input.totalSpent.toFixed(2),
    segments: input.consumption.segments.map((s) => ({
      fromOdometer: s.fromOdometer,
      toOdometer: s.toOdometer,
      distanceKm: s.distanceKm,
      liters: s.liters.toFixed(3),
      litersPer100Km: s.litersPer100Km.toFixed(2),
    })),
  };
}

export { decimalToString };
