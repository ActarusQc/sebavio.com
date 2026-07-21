import { AppError } from "@/lib/errors";
import { isFdeEnabled } from "@/integrations/fde";
import type {
  FuelPriceLookupInput,
  FuelPriceProvider,
  FuelPriceQuote,
} from "../types";
import { lookupFuelPriceReference } from "./fuel-price-service";
import { requireMappedFdeFuel } from "./mapping";

/**
 * Provider prix via FDE — point d'entrée pour la chaîne composite.
 * Position de référence : premier point du trajet (départ).
 */
export class FdeFuelPriceProvider implements FuelPriceProvider {
  async getPricePerLiter(input: FuelPriceLookupInput): Promise<FuelPriceQuote> {
    if (!isFdeEnabled()) {
      throw new AppError("FDE_001", "Intégration FDE désactivée", 503);
    }

    const mapped = requireMappedFdeFuel(input.vehicleFuelType);
    if (mapped === "not_applicable") {
      return {
        pricePerLiter: 0,
        source: "not_applicable",
        sampleCount: 0,
        currency: "CAD",
        label: "Carburant non applicable (électrique / PHEV)",
      };
    }

    const point = input.points?.[0];
    if (!point) {
      throw new AppError(
        "FUEL_007",
        "Position de référence manquante pour le prix carburant",
        422,
      );
    }

    const ref = await lookupFuelPriceReference({
      latitude: point.lat,
      longitude: point.lng,
      fuelType: input.vehicleFuelType,
      regionHint: input.regions?.[0],
    });

    return {
      pricePerLiter: ref.priceCadPerLitre,
      source: ref.fallbackUsed ? "fde_regional" : "fde_station",
      sampleCount: ref.stationCount,
      currency: "CAD",
      regionLabel: ref.regionLabel,
      capturedAt: ref.observedAt,
      label: buildLabel(ref),
      pricingMethod: ref.pricingMethod,
      freshness: ref.freshness,
      attribution: ref.attribution,
      fallbackUsed: ref.fallbackUsed,
      warnings: ref.warnings,
      selectedStationId: ref.selectedStationId,
    };
  }
}

function buildLabel(ref: {
  pricingMethod: string;
  stationCount: number;
  source: string;
  freshness: string;
  fallbackUsed: boolean;
}): string {
  if (ref.fallbackUsed) {
    return `Moyenne régionale (${ref.source}) — fraîcheur ${ref.freshness}`;
  }
  if (ref.pricingMethod === "selected-station") {
    return `1 station à proximité (${ref.source}) — fraîcheur ${ref.freshness}`;
  }
  return `Médiane de ${ref.stationCount} stations (${ref.source}) — fraîcheur ${ref.freshness}`;
}

export async function tryFdeQuote(
  input: FuelPriceLookupInput,
): Promise<FuelPriceQuote | null> {
  if (!isFdeEnabled()) return null;
  try {
    return await new FdeFuelPriceProvider().getPricePerLiter(input);
  } catch (error) {
    // Carburant non supporté : erreur métier claire (pas de repli silencieux).
    if (error instanceof AppError && error.code === "FUEL_006") {
      throw error;
    }
    // Position manquante / FDE KO → repli chaîne (moyenne personnelle).
    return null;
  }
}
