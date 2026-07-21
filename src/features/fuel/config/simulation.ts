/**
 * Configuration centralisée de la simulation / optimisation carburant.
 */

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export type InitialTankStrategy = "full_unbilled" | "full_billed";

export type FuelSimulationConfig = {
  searchThresholdFraction: number;
  reserveFraction: number;
  reserveMinKm: number;
  maxDetourKm: number;
  lookAheadKm: number;
  minPriceAdvantagePerLiter: number;
  maxTankCapacityL: number;
  minTankCapacityL: number;
  initialTankStrategy: InitialTankStrategy;
  stationSampleIntervalKm: number;
  maxStationSamples: number;
  corridorRadiusKm: number;
  corridorRadiusSparseKm: number;
  sparseStationThreshold: number;
  /** Achat minimal pour un arrêt facultatif (L). */
  minPurchaseL: number;
  /** Économie nette minimale pour un arrêt facultatif (CAD). */
  minNetSavingsCad: number;
  /** Intervalle minimal entre arrêts facultatifs (km). */
  minOptionalStopIntervalKm: number;
  /** Pas de discrétisation carburant pour le DP (L). */
  dpFuelStepL: number;
  /** Nombre max de stations retenues pour le DP. */
  dpMaxStations: number;
};

const DEFAULTS: FuelSimulationConfig = {
  searchThresholdFraction: 0.25,
  reserveFraction: 0.15,
  reserveMinKm: 75,
  maxDetourKm: 15,
  lookAheadKm: 250,
  minPriceAdvantagePerLiter: 0.03,
  maxTankCapacityL: 500,
  minTankCapacityL: 10,
  initialTankStrategy: "full_unbilled",
  stationSampleIntervalKm: 40,
  maxStationSamples: 30,
  corridorRadiusKm: 5,
  corridorRadiusSparseKm: 10,
  sparseStationThreshold: 3,
  minPurchaseL: 10,
  minNetSavingsCad: 3,
  minOptionalStopIntervalKm: 75,
  dpFuelStepL: 2,
  dpMaxStations: 40,
};

export function getFuelSimulationConfig(
  overrides?: Partial<FuelSimulationConfig>,
): FuelSimulationConfig {
  const fromEnv: FuelSimulationConfig = {
    searchThresholdFraction: envNumber(
      "FUEL_SEARCH_THRESHOLD_FRACTION",
      DEFAULTS.searchThresholdFraction,
    ),
    reserveFraction: envNumber(
      "FUEL_RESERVE_FRACTION",
      DEFAULTS.reserveFraction,
    ),
    reserveMinKm: envNumber("FUEL_RESERVE_MIN_KM", DEFAULTS.reserveMinKm),
    maxDetourKm: envNumber("FUEL_MAX_DETOUR_KM", DEFAULTS.maxDetourKm),
    lookAheadKm: envNumber("FUEL_LOOKAHEAD_KM", DEFAULTS.lookAheadKm),
    minPriceAdvantagePerLiter: envNumber(
      "FUEL_MIN_PRICE_ADVANTAGE",
      DEFAULTS.minPriceAdvantagePerLiter,
    ),
    maxTankCapacityL: envNumber(
      "FUEL_MAX_TANK_CAPACITY_L",
      DEFAULTS.maxTankCapacityL,
    ),
    minTankCapacityL: envNumber(
      "FUEL_MIN_TANK_CAPACITY_L",
      DEFAULTS.minTankCapacityL,
    ),
    initialTankStrategy: DEFAULTS.initialTankStrategy,
    stationSampleIntervalKm: envNumber(
      "FUEL_STATION_SAMPLE_INTERVAL_KM",
      DEFAULTS.stationSampleIntervalKm,
    ),
    maxStationSamples: envNumber(
      "FUEL_MAX_STATION_SAMPLES",
      DEFAULTS.maxStationSamples,
    ),
    corridorRadiusKm: envNumber(
      "FUEL_CORRIDOR_RADIUS_KM",
      DEFAULTS.corridorRadiusKm,
    ),
    corridorRadiusSparseKm: envNumber(
      "FUEL_CORRIDOR_RADIUS_SPARSE_KM",
      DEFAULTS.corridorRadiusSparseKm,
    ),
    sparseStationThreshold: envNumber(
      "FUEL_SPARSE_STATION_THRESHOLD",
      DEFAULTS.sparseStationThreshold,
    ),
    minPurchaseL: envNumber("FUEL_MIN_PURCHASE_L", DEFAULTS.minPurchaseL),
    minNetSavingsCad: envNumber(
      "FUEL_MIN_NET_SAVINGS_CAD",
      DEFAULTS.minNetSavingsCad,
    ),
    minOptionalStopIntervalKm: envNumber(
      "FUEL_MIN_OPTIONAL_STOP_INTERVAL_KM",
      DEFAULTS.minOptionalStopIntervalKm,
    ),
    dpFuelStepL: envNumber("FUEL_DP_FUEL_STEP_L", DEFAULTS.dpFuelStepL),
    dpMaxStations: envNumber("FUEL_DP_MAX_STATIONS", DEFAULTS.dpMaxStations),
  };

  const strategyEnv = process.env.FUEL_INITIAL_TANK_STRATEGY?.trim();
  if (strategyEnv === "full_billed" || strategyEnv === "full_unbilled") {
    fromEnv.initialTankStrategy = strategyEnv;
  }

  return { ...fromEnv, ...overrides };
}

export const FUEL_SIMULATION_DEFAULTS = DEFAULTS;

/** @deprecated Conservé pour compat tests anciens — ne plus utiliser en estimation. */
export const LEGACY_DEFAULT_TANK_CAPACITY_L = 80;
