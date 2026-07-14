/**
 * Feature `vehicle-catalog` — catalogue constructeurs / modèles (Doc 4 §4, Doc 6 §5).
 */
export {
  listManufacturers,
  getManufacturerById,
  createManufacturer,
  updateManufacturer,
  listModels,
  getModelById,
  getModelSpecifications,
  getModelDocuments,
  getModelKnownIssues,
  getModelMaintenance,
  createModel,
  updateModel,
  importCatalog,
  syncCatalog,
} from "./services";

export {
  CatalogFilters,
  CatalogList,
  ManufacturerCreateForm,
  ModelCreateForm,
  ModelEditForm,
  CatalogImportForm,
} from "./components";

export {
  createManufacturerAction,
  updateManufacturerAction,
  createModelAction,
  updateModelAction,
  importCatalogAction,
} from "./actions";

export type {
  ManufacturerDto,
  VehicleModelDto,
  VehicleSpecificationsDto,
  VehicleDocumentDto,
  KnownIssueDto,
  PaginatedResult,
  CatalogImportReport,
} from "./types";
