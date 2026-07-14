export {
  listVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateOdometer,
  setPrimaryVehicle,
  addVehiclePhoto,
  addVehicleDocument,
  listVehicleMaintenance,
} from "@/features/vehicles/services";

export {
  createVehicleAction,
  updateVehicleAction,
  deleteVehicleAction,
  setPrimaryVehicleAction,
  updateOdometerAction,
  addPhotoAction,
  addDocumentAction,
} from "@/features/vehicles/actions";

export {
  VehiclesList,
  VehicleForm,
  VehicleDetailPanels,
} from "@/features/vehicles/components";

export type {
  UserVehicleDto,
  UserVehicleDetailDto,
  PaginatedVehicles,
} from "@/features/vehicles/types";
