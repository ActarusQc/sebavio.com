export {
  listVehicleFuelLogs,
  getFuelLogById,
  getVehicleFuelStats,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
  getOwnedFuelLogOrThrow,
  recalculateRealAvgConsumption,
} from "./logs";
export { estimateTripFuel } from "./estimate";
export {
  estimateFuelCost,
  type EstimateFuelCostInput,
  type EstimateFuelCostResult,
} from "./fuel-cost-estimation";
export { listRegionalFuelPrices } from "./prices";
export { toFuelLogDto, toFuelStatsDto } from "./mappers";
