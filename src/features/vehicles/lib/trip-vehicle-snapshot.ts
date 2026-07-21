import { Prisma } from "@prisma/client";
import {
  getEffectiveVehicleSpecifications,
  hashVehicleFuelSpecs,
  parseSpecOverrides,
  type TripVehicleSnapshot,
} from "@/features/vehicles/lib/effective-specs";

type DecimalLike = { toString(): string } | null | undefined;

function toNum(v: DecimalLike): number | null {
  if (v == null) return null;
  const n = Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

/**
 * Construit le snapshot des specs utilisées pour un calcul / voyage terminé.
 */
export function buildTripVehicleSnapshot(input: {
  vehicleId: string;
  currentOdometer: number;
  manufacturerConsumptionL100?: DecimalLike;
  customConsumptionL100?: DecimalLike;
  realAvgConsumption?: DecimalLike;
  fullFillCount?: number;
  manufacturerTankCapacityL?: DecimalLike;
  tankCapacityOverride?: DecimalLike;
  catalogTankL?: DecimalLike;
  legacyTankL?: DecimalLike;
  manufacturerFuelType?: string | null;
  customFuelType?: string | null;
  fuelType?: string | null;
  calculatedAt?: Date;
}): TripVehicleSnapshot {
  const manufacturerTank =
    toNum(input.manufacturerTankCapacityL) ??
    toNum(input.catalogTankL) ??
    toNum(input.legacyTankL);

  const effective = getEffectiveVehicleSpecifications({
    manufacturerConsumptionL100: toNum(input.manufacturerConsumptionL100),
    customConsumptionL100: toNum(input.customConsumptionL100),
    realAvgConsumption: toNum(input.realAvgConsumption),
    fullFillCount: input.fullFillCount ?? 0,
    manufacturerTankCapacityL: manufacturerTank,
    customTankCapacityL: toNum(input.tankCapacityOverride),
    manufacturerFuelType: input.manufacturerFuelType,
    customFuelType: input.customFuelType,
    fuelType: input.fuelType,
  });

  const calculatedAt = (input.calculatedAt ?? new Date()).toISOString();
  const specsHash = hashVehicleFuelSpecs({
    consumptionLPer100Km: effective.consumptionLPer100Km,
    tankCapacityLiters: effective.tankCapacityLiters,
    fuelType: effective.fuelType,
  });

  return {
    consumptionLPer100Km: effective.consumptionLPer100Km,
    tankCapacityLiters: effective.tankCapacityLiters,
    fuelType: effective.fuelType,
    sourceVehicleId: input.vehicleId,
    currentOdometer: input.currentOdometer,
    calculatedAt,
    specsHash,
  };
}

export function snapshotToJson(
  snapshot: TripVehicleSnapshot,
): Prisma.InputJsonValue {
  return snapshot as unknown as Prisma.InputJsonValue;
}

export function parseTripVehicleSnapshot(
  raw: unknown,
): TripVehicleSnapshot | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.sourceVehicleId !== "string") return null;
  return {
    consumptionLPer100Km:
      typeof o.consumptionLPer100Km === "number"
        ? o.consumptionLPer100Km
        : o.consumptionLPer100Km == null
          ? null
          : Number(o.consumptionLPer100Km),
    tankCapacityLiters:
      typeof o.tankCapacityLiters === "number"
        ? o.tankCapacityLiters
        : o.tankCapacityLiters == null
          ? null
          : Number(o.tankCapacityLiters),
    fuelType: typeof o.fuelType === "string" ? o.fuelType : null,
    sourceVehicleId: o.sourceVehicleId,
    currentOdometer:
      typeof o.currentOdometer === "number" ? o.currentOdometer : null,
    calculatedAt:
      typeof o.calculatedAt === "string"
        ? o.calculatedAt
        : new Date().toISOString(),
    specsHash: typeof o.specsHash === "string" ? o.specsHash : "",
  };
}

export { parseSpecOverrides };
