/**
 * Diagnostics carburant réservés aux développeurs (logs serveur / tests).
 * Ne jamais importer ceci dans un composant client affiché en production.
 */

import type { CorridorCoverageStats } from "@/features/fuel/services/route-price-zones";

export type FuelInternalDiagnostics = {
  coverage: CorridorCoverageStats | null;
  rawWarnings: string[];
};

/**
 * Journalise les diagnostics uniquement si FUEL_DEBUG=1 (variable serveur).
 */
export function logFuelInternalDiagnostics(
  label: string,
  diagnostics: FuelInternalDiagnostics,
): void {
  if (process.env.FUEL_DEBUG !== "1") return;
  console.info(`[fuel-debug:${label}]`, {
    coverage: diagnostics.coverage,
    rawWarnings: diagnostics.rawWarnings,
  });
}
