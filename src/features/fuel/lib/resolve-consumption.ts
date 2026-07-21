/**
 * Résolution de la consommation L/100 km pour l'estimation carburant.
 *
 * Ordre :
 * 1. override formulaire ponctuel (estimation voyage)
 * 2. customConsumptionL100 (personnalisation fiche véhicule)
 * 3. moyenne réelle (pleins complets ≥ 2)
 * 4. profil legacy (realAvg sans assez de pleins)
 * 5. consommation catalogue / constructeur
 * 6. défaut applicatif uniquement s'il est explicitement défini
 */

export type ConsumptionSource =
  | "real_avg"
  | "vehicle_profile"
  | "catalog"
  | "app_default"
  | "manual"
  | "user_override";

export type ResolveConsumptionInput = {
  /** Override formulaire (section manuelle). */
  manualL100?: number | null;
  /** user_vehicles.custom_consumption_l100 */
  customConsumptionL100?: number | null;
  /** user_vehicles.real_avg_consumption */
  realAvgConsumption?: number | null;
  /** Nombre de pleins complets (is_full) — ≥ 2 = moyenne réelle exploitable. */
  fullFillCount?: number;
  /** vehicle_models.avg_consumption / officialCombined */
  catalogAvgConsumption?: number | null;
  /**
   * Défaut applicatif (constante / paramètre).
   * `undefined` ou `null` = aucun défaut (ne pas inventer de valeur).
   */
  appDefaultL100?: number | null;
};

export type ResolveConsumptionResult =
  | {
      ok: true;
      consumptionL100: number;
      source: ConsumptionSource;
    }
  | { ok: false; source: null; consumptionL100: null };

function positive(n: unknown): number | null {
  if (n == null) return null;
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  return v;
}

/**
 * Résout la consommation utilisée pour l'estimation.
 */
export function resolveVehicleConsumption(
  input: ResolveConsumptionInput,
): ResolveConsumptionResult {
  const manual = positive(input.manualL100);
  if (manual != null) {
    return { ok: true, consumptionL100: manual, source: "manual" };
  }

  const custom = positive(input.customConsumptionL100);
  if (custom != null) {
    return { ok: true, consumptionL100: custom, source: "user_override" };
  }

  const realAvg = positive(input.realAvgConsumption);
  const fullFills = input.fullFillCount ?? 0;

  if (realAvg != null && fullFills >= 2) {
    return { ok: true, consumptionL100: realAvg, source: "real_avg" };
  }

  if (realAvg != null) {
    return { ok: true, consumptionL100: realAvg, source: "vehicle_profile" };
  }

  const catalog = positive(input.catalogAvgConsumption);
  if (catalog != null) {
    return { ok: true, consumptionL100: catalog, source: "catalog" };
  }

  const appDefault = positive(input.appDefaultL100);
  if (appDefault != null) {
    return { ok: true, consumptionL100: appDefault, source: "app_default" };
  }

  return { ok: false, source: null, consumptionL100: null };
}

export function consumptionSourceLabel(source: ConsumptionSource): string {
  switch (source) {
    case "real_avg":
      return "Moyenne réelle (pleins)";
    case "vehicle_profile":
      return "Profil véhicule";
    case "catalog":
      return "Catalogue";
    case "app_default":
      return "Défaut application";
    case "manual":
      return "Saisie manuelle";
    case "user_override":
      return "Valeur personnalisée";
  }
}
