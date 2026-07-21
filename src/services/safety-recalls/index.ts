export {
  syncVehicleSafetyRecalls,
  listVehicleSafetyRecalls,
  updateVehicleSafetyRecall,
} from "./sync";
export { fetchTransportCanadaRecalls } from "./transport-canada";
export { normalizeTransportCanadaItem } from "./normalize";
export type { NormalizedSafetyRecall, RecallSearchInput } from "./types";
