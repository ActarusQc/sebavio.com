export { syncVehicleCatalog } from "./application/sync-service";
export {
  listCatalogYears,
  listCatalogMakes,
  listCatalogModels,
  listCatalogConfigurations,
  getCatalogEntryById,
  invalidateCatalogSearchCache,
} from "./application/search-service";
export { getCatalogStats } from "./infrastructure/repository";
export {
  normalizeFuelType,
  normalizeSearchText,
  parseLocaleNumber,
  buildSourceKey,
  fuelTypeLabelFr,
  formatConfigurationLabel,
} from "./domain/normalize";
export { validateCatalogRow } from "./domain/validate";
export { mapHeaders } from "./domain/columns";
export { getVehicleCatalogEnv, SOURCE_NAME } from "./infrastructure/config";
