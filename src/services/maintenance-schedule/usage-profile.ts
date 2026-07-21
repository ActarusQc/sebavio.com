import type { UsageFactorFlags, UsageProfile } from "./types";

const SEVERE_KEYS: (keyof UsageFactorFlags)[] = [
  "shortTrips",
  "urbanDriving",
  "towing",
  "heavyVehicle",
  "dustyRoads",
  "coldWeather",
  "commercialUse",
  "highAnnualKm",
  "mountainDriving",
];

/**
 * Résout le profil d’usage effectif.
 * Ne modifie jamais une recommandation officielle — le caller doit signaler
 * « Conseil préventif Sebavio » vs « Recommandation du fabricant ».
 */
export function resolveUsageCondition(params: {
  profile: UsageProfile;
  factors?: UsageFactorFlags | null;
  annualEstimatedKm?: number | null;
  vehicleType?: string | null;
}): "normal" | "severe" {
  if (params.profile === "normal") return "normal";
  if (params.profile === "severe") return "severe";

  const factors: UsageFactorFlags = { ...(params.factors ?? {}) };

  if (params.annualEstimatedKm != null && params.annualEstimatedKm >= 25000) {
    factors.highAnnualKm = true;
  }

  const vt = (params.vehicleType ?? "").toLowerCase();
  if (
    vt.includes("motorhome") ||
    vt.includes("rv") ||
    vt.includes("camping") ||
    vt.includes("truck") ||
    vt.includes("bus")
  ) {
    factors.heavyVehicle = true;
  }

  const severeCount = SEVERE_KEYS.filter((k) => factors[k] === true).length;
  return severeCount >= 2 ? "severe" : "normal";
}

export function taskAppliesToCondition(
  taskCondition: "normal" | "severe" | "both",
  effective: "normal" | "severe",
): boolean {
  if (taskCondition === "both") return true;
  return taskCondition === effective;
}
