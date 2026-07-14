import type {
  CatalogDataSource,
  VehicleCategory,
} from "@/features/vehicle-catalog/constants";

export type ManufacturerDto = {
  id: string;
  name: string;
  countryCode: string | null;
  website: string | null;
  supportUrl: string | null;
  logoUrl: string | null;
  active: boolean;
  source: CatalogDataSource | string;
  createdAt: string;
  updatedAt: string;
};

export type VehicleModelDto = {
  id: string;
  manufacturerId: string;
  manufacturerName?: string;
  category: VehicleCategory | string;
  modelName: string;
  trim: string;
  year: number;
  engine: string | null;
  transmission: string | null;
  driveType: string | null;
  fuelType: string | null;
  fuelCapacityL: number | null;
  avgConsumption: number | null;
  lengthM: number | null;
  widthM: number | null;
  heightM: number | null;
  gvwrKg: number | null;
  sleepingCapacity: number | null;
  freshWaterL: number | null;
  greyWaterL: number | null;
  blackWaterL: number | null;
  source: CatalogDataSource | string;
  createdAt: string;
  updatedAt: string;
};

export type VehicleSpecificationsDto = {
  modelId: string;
  engine: string | null;
  transmission: string | null;
  driveType: string | null;
  fuelType: string | null;
  fuelCapacityL: number | null;
  avgConsumption: number | null;
  lengthM: number | null;
  widthM: number | null;
  heightM: number | null;
  gvwrKg: number | null;
  sleepingCapacity: number | null;
  freshWaterL: number | null;
  greyWaterL: number | null;
  blackWaterL: number | null;
};

export type VehicleDocumentDto = {
  id: string;
  modelId: string;
  documentType: string;
  title: string;
  fileUrl: string;
  language: string;
  version: string | null;
  createdAt: string;
};

export type KnownIssueDto = {
  id: string;
  modelId: string;
  title: string;
  description: string;
  severity: string;
  source: string;
  verified: boolean;
  createdAt: string;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ImportLineError = {
  section: "manufacturers" | "models";
  line: number;
  reason: string;
};

export type CatalogImportReport = {
  accepted: {
    manufacturers: number;
    models: number;
  };
  rejected: ImportLineError[];
  totals: {
    manufacturersLines: number;
    modelsLines: number;
    acceptedLines: number;
    rejectedLines: number;
  };
};
