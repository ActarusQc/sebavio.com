import { AppError } from "@/lib/errors";

/** Types carburant FDE (stations). */
export const FDE_STATION_FUEL_TYPES = ["regular", "premium", "diesel"] as const;
export type FdeStationFuelType = (typeof FDE_STATION_FUEL_TYPES)[number];

/** Types régionaux FDE (inclut midGrade non mappé depuis Sebavio). */
export const FDE_REGIONAL_FUEL_TYPES = [
  "regular",
  "midGrade",
  "premium",
  "diesel",
] as const;

const NON_FUEL = new Set([
  "electric",
  "pluginhybrid",
  "plug-inhybrid",
  "plug_in_hybrid",
  "plugin_hybrid",
  "phev",
  "bev",
]);

export type FuelMappingResult =
  | {
      kind: "mapped";
      fdeFuelType: FdeStationFuelType;
      /** Si défini, utiliser uniquement les prix régionaux FDE de ce type. */
      regionalFuelType?: (typeof FDE_REGIONAL_FUEL_TYPES)[number];
    }
  | { kind: "not_applicable" }
  | { kind: "unsupported"; reason: string };

/**
 * Mapping explicite Sebavio → FDE.
 * Hybride thermique → carburant thermique configuré (Gasoline → regular).
 * Électrique / PHEV → not_applicable.
 * Propane, E85, hydrogène, midgrade → unsupported.
 */
export function mapSebavioFuelToFde(
  vehicleFuelType: string | null | undefined,
): FuelMappingResult {
  if (!vehicleFuelType?.trim()) {
    return { kind: "mapped", fdeFuelType: "regular" };
  }

  const raw = vehicleFuelType.trim().toLowerCase();
  const key = raw.replace(/[\s_-]+/g, "");

  if (NON_FUEL.has(key) || NON_FUEL.has(raw)) {
    return { kind: "not_applicable" };
  }

  if (key === "diesel") {
    return { kind: "mapped", fdeFuelType: "diesel" };
  }
  if (key === "premium" || key === "super" || key === "essencesuper") {
    return { kind: "mapped", fdeFuelType: "premium" };
  }
  if (
    key === "gasoline" ||
    key === "hybrid" ||
    key === "essence" ||
    key === "essenceordinaire" ||
    key === "regular" ||
    key === "ordinaire"
  ) {
    return { kind: "mapped", fdeFuelType: "regular" };
  }

  if (
    key === "propane" ||
    key === "e85" ||
    key === "ethanol" ||
    key === "naturalgas" ||
    key === "natural_gas" ||
    key === "hydrogen" ||
    key === "hydrogène"
  ) {
    return {
      kind: "unsupported",
      reason: `Type de carburant non supporté par FDE: ${vehicleFuelType}`,
    };
  }

  if (
    key === "midgrade" ||
    key === "intermediate" ||
    key === "essenceintermediaire" ||
    key === "intermediaire"
  ) {
    // midGrade : API régionale FDE uniquement (pas de prix station nearby).
    return {
      kind: "mapped",
      fdeFuelType: "regular",
      regionalFuelType: "midGrade",
    };
  }

  return {
    kind: "unsupported",
    reason: `Type de carburant inconnu: ${vehicleFuelType}`,
  };
}

export function requireMappedFdeFuel(
  vehicleFuelType: string | null | undefined,
): FdeStationFuelType | "not_applicable" {
  const mapped = mapSebavioFuelToFde(vehicleFuelType);
  if (mapped.kind === "mapped") return mapped.fdeFuelType;
  if (mapped.kind === "not_applicable") return "not_applicable";
  throw new AppError("FUEL_006", mapped.reason, 422);
}
