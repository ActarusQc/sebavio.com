import { AppError } from "@/lib/errors";
import { fdeMetricInc, logFdeEvent } from "@/integrations/fde";
import { getFuelSimulationConfig } from "@/features/fuel/config/simulation";
import { selectBestFuelPlan } from "@/features/fuel/lib/fuel-strategy-selector";
import type { FuelStopCandidate } from "@/features/fuel/lib/trip-fuel-types";
import {
  lookupFuelPriceReference,
  type FuelPriceReference,
} from "@/services/fuel-prices/fde";

export type EstimateFuelCostInput = {
  distanceKm: number;
  consumptionLPer100Km: number;
  fuelType: string;
  referencePosition: {
    latitude: number;
    longitude: number;
  };
  radiusKm?: number;
  bypassCache?: boolean;
  regionHint?: string;
  /** Capacité réservoir (L) — obligatoire pour une simulation fiable. */
  tankCapacityL?: number;
};

export type EstimateFuelCostResult = {
  distanceKm: number;
  consumptionLPer100Km: number;
  estimatedLitres: number;
  priceCadPerLitre: number;
  estimatedCostCad: number;
  currency: "CAD";
  fuelType: string;
  pricingMethod: string;
  fallbackUsed: boolean;
  stationCount: number;
  observedAt: string;
  freshness: string;
  source: string;
  attribution?: string;
  selectedStationId?: string;
  granularity: "station" | "regional";
  warnings: string[];
  priceReference: FuelPriceReference;
  /** Litres consommés (≠ litres achetés si plein initial non facturé). */
  consumedLitres: number;
  litersPurchased: number;
  remainingFuelL: number;
  suggestedStopCount: number;
  naiveCostAtDeparturePrice: number;
  estimatedSavingsVsNaive: number | null;
};

const MAX_DISTANCE_KM = 20_000;
const MAX_CONSUMPTION = 100;

function assertPositiveFinite(
  value: number,
  code: "FUEL_004" | "FUEL_007",
  message: string,
): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new AppError(code, message, 400);
  }
}

/**
 * Orchestrateur : prix FDE + simulation réservoir (zone unique au départ en mode libre).
 * Pour un plan multi-zones, utiliser estimateTripFuel (itinéraire).
 */
export async function estimateFuelCost(
  input: EstimateFuelCostInput,
): Promise<EstimateFuelCostResult> {
  assertPositiveFinite(input.distanceKm, "FUEL_004", "Distance invalide");
  assertPositiveFinite(
    input.consumptionLPer100Km,
    "FUEL_004",
    "Consommation invalide",
  );
  if (input.distanceKm > MAX_DISTANCE_KM) {
    throw new AppError("FUEL_004", "Distance hors limites raisonnables", 400);
  }
  if (input.consumptionLPer100Km > MAX_CONSUMPTION) {
    throw new AppError(
      "FUEL_004",
      "Consommation hors limites raisonnables",
      400,
    );
  }

  try {
    const priceReference = await lookupFuelPriceReference({
      latitude: input.referencePosition.latitude,
      longitude: input.referencePosition.longitude,
      fuelType: input.fuelType,
      radiusKm: input.radiusKm,
      bypassCache: input.bypassCache,
      regionHint: input.regionHint,
    });

    const config = getFuelSimulationConfig();
    if (
      input.tankCapacityL == null ||
      !(input.tankCapacityL > 0) ||
      input.tankCapacityL < config.minTankCapacityL ||
      input.tankCapacityL > config.maxTankCapacityL
    ) {
      throw new AppError(
        "VEHICLE_TANK_CAPACITY_REQUIRED",
        "Capacité du réservoir requise pour l'estimation (pas de défaut silencieux).",
        422,
      );
    }
    const tankCapacityL = Math.min(
      input.tankCapacityL,
      config.maxTankCapacityL,
    );

    const candidate: FuelStopCandidate = {
      id: "departure",
      distanceFromStartKm: 0,
      detourKm: 0,
      pricePerLiter: priceReference.priceCadPerLitre,
      label: priceReference.regionLabel
        ? `Départ — ${priceReference.regionLabel}`
        : "Départ",
      regionLabel: priceReference.regionLabel ?? null,
      granularity: priceReference.granularity,
      source: priceReference.source,
      observedAt: priceReference.observedAt,
      attribution: priceReference.attribution ?? null,
      isStationLevel:
        priceReference.granularity === "station" &&
        !priceReference.fallbackUsed,
    };

    // Zones espacées au même prix pour permettre les arrêts sur long trajet
    const usableRange =
      ((tankCapacityL * (1 - config.reserveFraction)) /
        input.consumptionLPer100Km) *
      100;
    const candidates: FuelStopCandidate[] = [candidate];
    if (usableRange > 0 && input.distanceKm > usableRange) {
      let d = usableRange * 0.85;
      let i = 1;
      while (d < input.distanceKm - 1 && i < 40) {
        candidates.push({
          ...candidate,
          id: `waypoint-${i}`,
          distanceFromStartKm: Math.round(d * 10) / 10,
          label: `Zone km ${Math.round(d)} (prix départ)`,
        });
        d += usableRange * 0.85;
        i += 1;
      }
    }

    const selection = selectBestFuelPlan({
      totalDistanceKm: input.distanceKm,
      consumptionL100: input.consumptionLPer100Km,
      tankCapacityL,
      candidates,
      departurePricePerLiter: priceReference.priceCadPerLitre,
      config,
    });
    const simulation = selection.selected;

    fdeMetricInc("estimatesOk");
    logFdeEvent("estimate_ok", {
      pricingMethod: priceReference.pricingMethod,
      stationCount: priceReference.stationCount,
      fallbackUsed: priceReference.fallbackUsed,
      freshness: priceReference.freshness,
      stopCount: simulation.suggestedStopCount,
    });

    const warnings = [
      ...priceReference.warnings,
      ...simulation.warnings,
      "Mode libre : un seul point de prix (départ). Pour des prix par zone, estimez via un voyage avec itinéraire.",
    ];

    return {
      distanceKm: input.distanceKm,
      consumptionLPer100Km: input.consumptionLPer100Km,
      estimatedLitres: simulation.litersPurchased,
      priceCadPerLitre: priceReference.priceCadPerLitre,
      estimatedCostCad: simulation.totalCostPurchased,
      currency: "CAD",
      fuelType: priceReference.fuelType,
      pricingMethod: priceReference.pricingMethod,
      fallbackUsed: priceReference.fallbackUsed,
      stationCount: priceReference.stationCount,
      observedAt: priceReference.observedAt,
      freshness: priceReference.freshness,
      source: priceReference.source,
      attribution: priceReference.attribution,
      selectedStationId: priceReference.selectedStationId,
      granularity: priceReference.granularity,
      warnings,
      priceReference,
      consumedLitres: simulation.totalConsumptionL,
      litersPurchased: simulation.litersPurchased,
      remainingFuelL: simulation.remainingFuelL,
      suggestedStopCount: simulation.suggestedStopCount,
      naiveCostAtDeparturePrice: simulation.naiveCostAtDeparturePrice,
      estimatedSavingsVsNaive: simulation.estimatedSavingsVsNaive,
    };
  } catch (error) {
    fdeMetricInc("estimatesFailed");
    throw error;
  }
}
