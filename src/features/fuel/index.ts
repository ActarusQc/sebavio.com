/**
 * Feature `fuel` — API publique du module.
 */
export {
  listVehicleFuelLogs,
  getFuelLogById,
  getVehicleFuelStats,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
  estimateTripFuel,
  recalculateRealAvgConsumption,
} from "./services";
export {
  createFuelLogAction,
  deleteFuelLogAction,
  estimateTripFuelAction,
} from "./actions";
export type { FuelActionResult } from "./actions";
export {
  FuelLogsPanel,
  TripFuelEstimatePanel,
  VehicleFuelStatsSummary,
} from "./components";
export type {
  FuelLogDto,
  FuelStatsDto,
  FuelEstimateDto,
  FuelRefuelPlanDto,
  FuelRefuelStopDto,
  PaginatedFuelLogs,
} from "./types";
