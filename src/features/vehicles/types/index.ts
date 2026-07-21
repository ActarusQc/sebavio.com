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
  catalogEntryId: string | null;
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
  customConsumptionL100: string | null;
  fuelType: string | null;
  manufacturerFuelType: string | null;
  customFuelType: string | null;
  officialCityConsumptionL100: string | null;
  officialHighwayConsumptionL100: string | null;
  officialCombinedConsumptionL100: string | null;
  consumptionDataSource: string | null;
  tankCapacityOverride: string | null;
  manufacturerTankCapacityL: string | null;
  specOverrides: {
    lengthM?: number | null;
    widthM?: number | null;
    heightM?: number | null;
    weightKg?: number | null;
    electricRangeKm?: number | null;
    batteryCapacityKwh?: number | null;
  } | null;
  engine: string | null;
  /** Valeurs effectives pour l’UI (constructeur vs personnalisé). */
  effectiveSpecs: {
    consumptionLPer100Km: number | null;
    consumptionSource: string;
    manufacturerConsumptionL100: number | null;
    tankCapacityLiters: number | null;
    tankCapacitySource: string;
    manufacturerTankCapacityL: number | null;
    fuelType: string | null;
    fuelTypeSource: string;
    manufacturerFuelType: string | null;
    electricRangeKm: number | null;
    batteryCapacityKwh: number | null;
    lengthM: number | null;
    widthM: number | null;
    heightM: number | null;
    weightKg: number | null;
  };
  primaryVehicle: boolean;
  displayName: string;
  model: CatalogModelSummaryDto | null;
  catalogElectricRangeKm: number | null;
  catalogBatteryHintKwh: number | null;
  /** Libellé catalogue NRCan (marque / modèle / année). */
  catalogLabel: string | null;
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
