export type CatalogModelSummaryDto = {
  id: string;
  manufacturerId: string;
  manufacturerName: string;
  modelName: string;
  trim: string;
  year: number;
  category: string;
  fuelType: string | null;
  avgConsumption: string | null;
  fuelCapacityL: string | null;
};

export type VehicleSettingsDto = {
  vehicleId: string;
  preferredFuelType: string | null;
  winterMode: boolean;
  avoidUnpavedRoads: boolean;
  tollPreference: string | null;
  updatedAt: string;
};

export type VehiclePhotoDto = {
  id: string;
  vehicleId: string;
  photoUrl: string;
  caption: string | null;
  displayOrder: number;
  createdAt: string;
};

export type UserVehicleDocumentDto = {
  id: string;
  vehicleId: string;
  type: string;
  title: string;
  fileUrl: string;
  expiryDate: string | null;
  createdAt: string;
};

export type UserVehicleDto = {
  id: string;
  userId: string;
  modelId: string | null;
  isManualEntry: boolean;
  manualManufacturerName: string | null;
  manualModelName: string | null;
  manualYear: number | null;
  manualCategory: string | null;
  manualTrim: string | null;
  nickname: string | null;
  vin: string | null;
  licensePlate: string | null;
  purchaseDate: string | null;
  purchasePrice: string | null;
  currentOdometer: number;
  realAvgConsumption: string | null;
  tankCapacityOverride: string | null;
  primaryVehicle: boolean;
  displayName: string;
  model: CatalogModelSummaryDto | null;
  createdAt: string;
  updatedAt: string;
};

export type UserVehicleDetailDto = UserVehicleDto & {
  photos: VehiclePhotoDto[];
  documents: UserVehicleDocumentDto[];
  settings: VehicleSettingsDto | null;
  stats: {
    photoCount: number;
    documentCount: number;
    estimatedRangeKm: number | null;
  };
};

export type PaginatedVehicles = {
  items: UserVehicleDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
