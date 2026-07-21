import type { NormalizedCatalogRow, RowValidationIssue } from "./types";

const MIN_YEAR = 1995;
const MAX_YEAR = new Date().getFullYear() + 2;
/** Seuil L/100 km clairement aberrant pour un véhicule léger. */
const MAX_L100 = 60;
const MAX_KWH = 80;

export function validateCatalogRow(
  row: NormalizedCatalogRow,
  rowNumber: number,
): RowValidationIssue | null {
  if (
    !Number.isInteger(row.modelYear) ||
    row.modelYear < MIN_YEAR ||
    row.modelYear > MAX_YEAR
  ) {
    return {
      reason: "Année invalide",
      rowNumber,
      year: row.modelYear,
      make: row.make,
      model: row.model,
    };
  }
  if (!row.make.trim()) {
    return { reason: "Marque vide", rowNumber };
  }
  if (!row.model.trim()) {
    return { reason: "Modèle vide", rowNumber, make: row.make };
  }

  const isElectric =
    row.normalizedFuelType === "electric" ||
    row.normalizedFuelType === "plugin_hybrid";

  const consumptions = [
    row.cityConsumptionL100Km,
    row.highwayConsumptionL100Km,
    row.combinedConsumptionL100Km,
  ];
  const hasThermal = consumptions.some((v) => v != null && v > 0);
  const hasElectric =
    (row.electricConsumptionKwh100Km != null &&
      row.electricConsumptionKwh100Km > 0) ||
    (row.electricRangeKm != null && row.electricRangeKm > 0);

  if (!isElectric && !hasThermal) {
    return {
      reason: "Aucune consommation thermique",
      rowNumber,
      make: row.make,
      model: row.model,
      year: row.modelYear,
    };
  }

  if (isElectric && !hasThermal && !hasElectric) {
    return {
      reason: "Aucune consommation/autonomie électrique",
      rowNumber,
      make: row.make,
      model: row.model,
      year: row.modelYear,
    };
  }

  for (const v of consumptions) {
    if (v != null && (v < 0 || v > MAX_L100)) {
      return {
        reason: "Consommation L/100 aberrante",
        rowNumber,
        make: row.make,
        model: row.model,
        year: row.modelYear,
      };
    }
  }

  if (
    row.electricConsumptionKwh100Km != null &&
    (row.electricConsumptionKwh100Km < 0 ||
      row.electricConsumptionKwh100Km > MAX_KWH)
  ) {
    return {
      reason: "Consommation kWh aberrante",
      rowNumber,
      make: row.make,
      model: row.model,
      year: row.modelYear,
    };
  }

  if (!row.normalizedFuelType) {
    return {
      reason: "Type de carburant non interprétable",
      rowNumber,
      make: row.make,
      model: row.model,
      year: row.modelYear,
    };
  }

  return null;
}
