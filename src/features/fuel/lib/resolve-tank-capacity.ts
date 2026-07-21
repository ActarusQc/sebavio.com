/**
 * Résolution déterministe de la capacité du réservoir.
 * Aucun fallback arbitraire (ex. 80 L) — capacité inconnue = simulation refusée.
 */

export type TankCapacitySource = "user_manual" | "catalog" | "legacy_model";

export type ResolveTankCapacityInput = {
  /** Saisie / surcharge utilisateur (L). */
  overrideL: number | null | undefined;
  /** Capacité catalogue NRCan enrichie (L). */
  catalogEntryL: number | null | undefined;
  /** Capacité modèle legacy vehicle_models (L). */
  legacyModelL: number | null | undefined;
  /** Source déjà enregistrée si override présent. */
  recordedSource?: string | null;
  maxTankCapacityL?: number;
};

export type ResolveTankCapacityResult =
  | {
      ok: true;
      capacityL: number;
      source: TankCapacitySource;
      confidence: "high" | "medium";
    }
  | {
      ok: false;
      reason: "missing";
    };

function positiveLiters(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v) || v <= 0) return null;
  return v;
}

export function resolveTankCapacity(
  input: ResolveTankCapacityInput,
): ResolveTankCapacityResult {
  const max = input.maxTankCapacityL ?? 500;
  const override = positiveLiters(input.overrideL);
  if (override != null) {
    return {
      ok: true,
      capacityL: Math.min(override, max),
      source:
        input.recordedSource === "catalog" ||
        input.recordedSource === "legacy_model"
          ? (input.recordedSource as TankCapacitySource)
          : "user_manual",
      confidence: "high",
    };
  }

  const catalog = positiveLiters(input.catalogEntryL);
  if (catalog != null) {
    return {
      ok: true,
      capacityL: Math.min(catalog, max),
      source: "catalog",
      confidence: "medium",
    };
  }

  const legacy = positiveLiters(input.legacyModelL);
  if (legacy != null) {
    return {
      ok: true,
      capacityL: Math.min(legacy, max),
      source: "legacy_model",
      confidence: "medium",
    };
  }

  return { ok: false, reason: "missing" };
}

export function tankCapacitySourceLabel(source: TankCapacitySource): string {
  switch (source) {
    case "user_manual":
      return "Saisie manuelle";
    case "catalog":
      return "Catalogue véhicule";
    case "legacy_model":
      return "Catalogue legacy";
    default:
      return source;
  }
}
