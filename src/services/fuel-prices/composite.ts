import { AppError } from "@/lib/errors";
import { isFdeEnabled } from "@/integrations/fde";
import { PersonalAverageFuelPriceProvider } from "./personal-average";
import { tryRegieQuote } from "./regie-quebec";
import { tryFdeQuote } from "./fde";
import type {
  FuelPriceLookupInput,
  FuelPriceProvider,
  FuelPriceQuote,
} from "./types";

/**
 * Chaîne de prix :
 * - FDE activé : FDE (stations médiane → régional) → moyenne personnelle → défaut
 * - FDE désactivé : Régie locale (< 48 h) → moyenne personnelle → défaut
 *
 * Quand FDE est actif, Sebavio n'appelle plus Régie directement
 * (ingestion locale conservée hors chemin d'estimation).
 */
export class CompositeFuelPriceProvider implements FuelPriceProvider {
  private personal = new PersonalAverageFuelPriceProvider();

  async getPricePerLiter(input: FuelPriceLookupInput): Promise<FuelPriceQuote> {
    if (isFdeEnabled()) {
      try {
        const fde = await tryFdeQuote(input);
        if (fde?.source === "not_applicable") return fde;
        if (
          fde &&
          (fde.source === "fde_station" || fde.source === "fde_regional")
        ) {
          return fde;
        }
      } catch (error) {
        if (
          error instanceof AppError &&
          (error.code === "FUEL_006" ||
            error.code === "FUEL_007" ||
            error.code === "VEHICLE_FUEL_CONSUMPTION_REQUIRED")
        ) {
          throw error;
        }
        // Repli moyenne personnelle
      }
    } else {
      try {
        const regie = await tryRegieQuote(input);
        if (regie?.source === "not_applicable") {
          return regie;
        }
        if (regie && regie.source === "regie_quebec") {
          return regie;
        }
      } catch {
        // Repli silencieux
      }
    }

    try {
      return await this.personal.getPricePerLiter(input);
    } catch (error) {
      if (
        error instanceof AppError &&
        error.code === "EXT_004" &&
        input.defaultPricePerLiter == null
      ) {
        throw error;
      }
      throw error;
    }
  }
}
