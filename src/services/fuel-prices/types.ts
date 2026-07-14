/**
 * Abstraction source de prix carburant.
 * Partie 13 : moyenne personnelle.
 * Partie 13bis : Régie Essence Québec + chaîne de repli.
 */

export type FuelPriceSourceKind =
  "regie_quebec" | "personal_average" | "user_default" | "not_applicable";

export type FuelPriceQuote = {
  pricePerLiter: number;
  source: FuelPriceSourceKind;
  sampleCount: number;
  currency: "CAD";
  regionLabel?: string;
  capturedAt?: string;
  /** Libellé UI (ex. source Régie + fraîcheur). */
  label?: string;
};

export type FuelPriceLookupInput = {
  userId: string;
  /** Prix saisi par l'utilisateur si aucun historique (obligatoire alors). */
  defaultPricePerLiter?: number;
  /** Nombre max de pleins récents pour la moyenne (défaut 20). */
  sampleLimit?: number;
  /** Points du trajet (origin / destination / stops) pour régions QC. */
  points?: Array<{ lat: number; lng: number }>;
  regions?: string[];
  vehicleFuelType?: string | null;
};

export interface FuelPriceProvider {
  getPricePerLiter(input: FuelPriceLookupInput): Promise<FuelPriceQuote>;
}
