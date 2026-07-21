export const NORMALIZED_FUEL_TYPES = [
  "regular",
  "premium",
  "diesel",
  "ethanol",
  "natural_gas",
  "electric",
  "hybrid",
  "plugin_hybrid",
] as const;

export type NormalizedFuelType = (typeof NORMALIZED_FUEL_TYPES)[number];

export type CatalogResourceKind = "conventional" | "bev" | "phev" | "unknown";

export type OfficialCatalogResource = {
  id: string;
  name: string;
  url: string;
  format: string;
  language: "en" | "fr" | "unknown";
  kind: CatalogResourceKind;
  lastModified: Date | null;
  size: number | null;
};

export type NormalizedCatalogRow = {
  sourceKey: string;
  modelYear: number;
  make: string;
  makeNormalized: string;
  model: string;
  modelNormalized: string;
  configuration: string | null;
  vehicleClass: string | null;
  engineSizeLitres: number | null;
  cylinders: number | null;
  transmission: string | null;
  transmissionCode: string | null;
  fuelType: string | null;
  normalizedFuelType: NormalizedFuelType | null;
  cityConsumptionL100Km: number | null;
  highwayConsumptionL100Km: number | null;
  combinedConsumptionL100Km: number | null;
  combinedMpg: number | null;
  co2EmissionsGKm: number | null;
  co2Rating: number | null;
  smogRating: number | null;
  electricConsumptionKwh100Km: number | null;
  electricRangeKm: number | null;
  sourceName: string;
  sourceDataset: string | null;
  sourceResourceUrl: string | null;
  sourceYear: number | null;
  rawData: Record<string, string>;
};

export type RowValidationIssue = {
  reason: string;
  rowNumber: number;
  make?: string;
  model?: string;
  year?: number;
};

export type SyncResourceReport = {
  resourceId: string;
  name: string;
  url: string;
  checksum: string;
  skippedUnchanged: boolean;
  recordsRead: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsUnchanged: number;
  recordsRejected: number;
  rejectionSamples: RowValidationIssue[];
};

export type VehicleCatalogSyncReport = {
  status: "success" | "partial" | "failed" | "skipped";
  syncId: string;
  startedAt: string;
  completedAt: string | null;
  resources: SyncResourceReport[];
  totals: {
    recordsRead: number;
    recordsCreated: number;
    recordsUpdated: number;
    recordsUnchanged: number;
    recordsRejected: number;
  };
  errorMessage: string | null;
};

export type CatalogMakeOption = { value: string; label: string };
export type CatalogModelOption = { value: string; label: string };

export type CatalogConfigurationOption = {
  id: string;
  label: string;
  engineSizeLitres: number | null;
  transmission: string | null;
  fuelType: string | null;
  combinedConsumptionL100Km: number | null;
  cityConsumptionL100Km: number | null;
  highwayConsumptionL100Km: number | null;
  electricRangeKm: number | null;
  vehicleClass: string | null;
};
