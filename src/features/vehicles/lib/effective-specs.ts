/**
 * Valeurs effectives véhicule = personnalisation utilisateur ?? constructeur / catalogue.
 * Tous les modules de calcul doivent passer par cette fonction.
 */

export type SpecSource =
  "user_override" | "manufacturer" | "real_avg" | "missing";

export type EffectiveSpecNumber = {
  manufacturerValue: number | null;
  customValue: number | null;
  effectiveValue: number | null;
  source: SpecSource;
};

export type EffectiveSpecString = {
  manufacturerValue: string | null;
  customValue: string | null;
  effectiveValue: string | null;
  source: SpecSource;
};

export type VehicleSpecOverrides = {
  lengthM?: number | null;
  widthM?: number | null;
  heightM?: number | null;
  weightKg?: number | null;
  electricRangeKm?: number | null;
  batteryCapacityKwh?: number | null;
};

export type EffectiveVehicleSpecificationsInput = {
  /** Cote constructeur / NRCan (L/100 km). */
  manufacturerConsumptionL100?: number | null;
  /** Override explicite utilisateur (L/100 km). */
  customConsumptionL100?: number | null;
  /** Moyenne issue des pleins (≥ 2). */
  realAvgConsumption?: number | null;
  fullFillCount?: number;
  /** Capacité constructeur (catalogue / legacy). */
  manufacturerTankCapacityL?: number | null;
  /** Override réservoir utilisateur. */
  customTankCapacityL?: number | null;
  manufacturerFuelType?: string | null;
  customFuelType?: string | null;
  /** Fallback historique si manufacturerFuelType absent. */
  fuelType?: string | null;
  manufacturerElectricRangeKm?: number | null;
  manufacturerBatteryCapacityKwh?: number | null;
  manufacturerLengthM?: number | null;
  manufacturerWidthM?: number | null;
  manufacturerHeightM?: number | null;
  manufacturerWeightKg?: number | null;
  specOverrides?: VehicleSpecOverrides | null;
};

export type EffectiveVehicleSpecifications = {
  consumptionLPer100Km: number | null;
  consumption: EffectiveSpecNumber;
  tankCapacityLiters: number | null;
  tankCapacity: EffectiveSpecNumber;
  fuelType: string | null;
  fuelTypeSpec: EffectiveSpecString;
  electricRangeKm: number | null;
  electricRange: EffectiveSpecNumber;
  batteryCapacityKwh: number | null;
  batteryCapacity: EffectiveSpecNumber;
  lengthM: number | null;
  widthM: number | null;
  heightM: number | null;
  weightKg: number | null;
};

function positiveNumber(n: unknown): number | null {
  if (n == null) return null;
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  return v;
}

function nonEmptyString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function buildNumberSpec(
  manufacturer: number | null,
  custom: number | null,
  preferRealAvg?: { value: number | null; enabled: boolean },
): EffectiveSpecNumber {
  if (custom != null) {
    return {
      manufacturerValue: manufacturer,
      customValue: custom,
      effectiveValue: custom,
      source: "user_override",
    };
  }
  if (preferRealAvg?.enabled && preferRealAvg.value != null) {
    return {
      manufacturerValue: manufacturer,
      customValue: null,
      effectiveValue: preferRealAvg.value,
      source: "real_avg",
    };
  }
  if (manufacturer != null) {
    return {
      manufacturerValue: manufacturer,
      customValue: null,
      effectiveValue: manufacturer,
      source: "manufacturer",
    };
  }
  return {
    manufacturerValue: null,
    customValue: null,
    effectiveValue: null,
    source: "missing",
  };
}

function buildStringSpec(
  manufacturer: string | null,
  custom: string | null,
): EffectiveSpecString {
  if (custom != null) {
    return {
      manufacturerValue: manufacturer,
      customValue: custom,
      effectiveValue: custom,
      source: "user_override",
    };
  }
  if (manufacturer != null) {
    return {
      manufacturerValue: manufacturer,
      customValue: null,
      effectiveValue: manufacturer,
      source: "manufacturer",
    };
  }
  return {
    manufacturerValue: null,
    customValue: null,
    effectiveValue: null,
    source: "missing",
  };
}

/**
 * Parse un nombre décimal saisi (virgule ou point).
 * Ex. "6,5" → 6.5 ; "6.5" → 6.5
 */
export function parseDecimalInput(raw: unknown): number | null {
  if (raw === "" || raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : null;
  }
  const normalized = String(raw).trim().replace(/\s/g, "").replace(",", ".");
  if (normalized === "") return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/**
 * Arrondit à 2 décimales (consommation / volumes).
 */
export function roundSpecDecimal(value: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export function parseSpecOverrides(raw: unknown): VehicleSpecOverrides | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const out: VehicleSpecOverrides = {};
  const keys = [
    "lengthM",
    "widthM",
    "heightM",
    "weightKg",
    "electricRangeKm",
    "batteryCapacityKwh",
  ] as const;
  let any = false;
  for (const key of keys) {
    if (key in o) {
      const n = parseDecimalInput(o[key]);
      out[key] = n;
      any = true;
    }
  }
  return any ? out : null;
}

/**
 * Fonction centralisée — valeurs réellement utilisées par les calculs.
 */
export function getEffectiveVehicleSpecifications(
  vehicle: EffectiveVehicleSpecificationsInput,
): EffectiveVehicleSpecifications {
  const manufacturerConso = positiveNumber(vehicle.manufacturerConsumptionL100);
  const customConso = positiveNumber(vehicle.customConsumptionL100);
  const realAvg = positiveNumber(vehicle.realAvgConsumption);
  const fullFills = vehicle.fullFillCount ?? 0;

  const consumption = buildNumberSpec(manufacturerConso, customConso, {
    value: realAvg,
    enabled: fullFills >= 2,
  });

  // Sans override ni moyenne réelle : profil saisi anciennement dans realAvg (< 2 pleins)
  // reste utilisable comme valeur effective (compatibilité).
  let consumptionFinal = consumption;
  if (consumption.source === "missing" && realAvg != null && fullFills < 2) {
    consumptionFinal = {
      manufacturerValue: manufacturerConso,
      customValue: null,
      effectiveValue: realAvg,
      source: "manufacturer",
    };
  }

  const manufacturerTank = positiveNumber(vehicle.manufacturerTankCapacityL);
  const customTank = positiveNumber(vehicle.customTankCapacityL);
  const tankCapacity = buildNumberSpec(manufacturerTank, customTank);

  const manufacturerFuel =
    nonEmptyString(vehicle.manufacturerFuelType) ??
    nonEmptyString(vehicle.fuelType);
  const customFuel = nonEmptyString(vehicle.customFuelType);
  // Si customFuelType absent mais fuelType ≠ manufacturer → fuelType est l'override historique
  const fuelTypeSpec =
    customFuel != null
      ? buildStringSpec(manufacturerFuel, customFuel)
      : vehicle.manufacturerFuelType != null &&
          vehicle.fuelType != null &&
          vehicle.fuelType !== vehicle.manufacturerFuelType
        ? buildStringSpec(
            nonEmptyString(vehicle.manufacturerFuelType),
            nonEmptyString(vehicle.fuelType),
          )
        : buildStringSpec(manufacturerFuel, null);

  const overrides = vehicle.specOverrides ?? null;

  const electricRange = buildNumberSpec(
    positiveNumber(vehicle.manufacturerElectricRangeKm),
    positiveNumber(overrides?.electricRangeKm),
  );
  const batteryCapacity = buildNumberSpec(
    positiveNumber(vehicle.manufacturerBatteryCapacityKwh),
    positiveNumber(overrides?.batteryCapacityKwh),
  );

  const lengthM =
    positiveNumber(overrides?.lengthM) ??
    positiveNumber(vehicle.manufacturerLengthM);
  const widthM =
    positiveNumber(overrides?.widthM) ??
    positiveNumber(vehicle.manufacturerWidthM);
  const heightM =
    positiveNumber(overrides?.heightM) ??
    positiveNumber(vehicle.manufacturerHeightM);
  const weightKg =
    positiveNumber(overrides?.weightKg) ??
    positiveNumber(vehicle.manufacturerWeightKg);

  return {
    consumptionLPer100Km: consumptionFinal.effectiveValue,
    consumption: consumptionFinal,
    tankCapacityLiters: tankCapacity.effectiveValue,
    tankCapacity,
    fuelType: fuelTypeSpec.effectiveValue,
    fuelTypeSpec,
    electricRangeKm: electricRange.effectiveValue,
    electricRange,
    batteryCapacityKwh: batteryCapacity.effectiveValue,
    batteryCapacity,
    lengthM,
    widthM,
    heightM,
    weightKg,
  };
}

/** Hash stable des specs influant le calcul carburant (détection de péremption). */
export function hashVehicleFuelSpecs(specs: {
  consumptionLPer100Km: number | null;
  tankCapacityLiters: number | null;
  fuelType: string | null;
}): string {
  const c =
    specs.consumptionLPer100Km != null
      ? roundSpecDecimal(specs.consumptionLPer100Km).toFixed(2)
      : "";
  const t =
    specs.tankCapacityLiters != null
      ? roundSpecDecimal(specs.tankCapacityLiters).toFixed(2)
      : "";
  const f = specs.fuelType ?? "";
  return `${c}|${t}|${f}`;
}

export type TripVehicleSnapshot = {
  consumptionLPer100Km: number | null;
  tankCapacityLiters: number | null;
  fuelType: string | null;
  sourceVehicleId: string;
  currentOdometer: number | null;
  calculatedAt: string;
  specsHash: string;
};
