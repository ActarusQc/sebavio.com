import { AppError } from "@/lib/errors";
import { PersonalAverageFuelPriceProvider } from "./personal-average";
import { tryRegieQuote } from "./regie-quebec";
import type {
  FuelPriceLookupInput,
  FuelPriceProvider,
  FuelPriceQuote,
} from "./types";

/**
 * Chaîne : Régie (< 48 h, région QC) → moyenne personnelle → défaut formulaire.
 * Hors QC / stale / type N/A : jamais d'erreur bloquante sur la branche Régie.
 */
export class CompositeFuelPriceProvider implements FuelPriceProvider {
  private personal = new PersonalAverageFuelPriceProvider();

  async getPricePerLiter(input: FuelPriceLookupInput): Promise<FuelPriceQuote> {
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
