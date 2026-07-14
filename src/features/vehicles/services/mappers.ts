import type {
  CatalogModelSummaryDto,
  UserVehicleDocumentDto,
  UserVehicleDto,
  VehiclePhotoDto,
  VehicleSettingsDto,
} from "@/features/vehicles/types";

function decimalToString(
  value: { toString(): string } | null | undefined,
): string | null {
  if (value == null) return null;
  return value.toString();
}

function dateToIsoDate(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

export function clampPageSize(pageSize: number, max: number): number {
  if (!Number.isFinite(pageSize) || pageSize < 1) return 1;
  return Math.min(pageSize, max);
}

export function buildDisplayName(row: {
  nickname: string | null;
  isManualEntry: boolean;
  manualManufacturerName: string | null;
  manualModelName: string | null;
  manualYear: number | null;
  model: {
    modelName: string;
    year: number;
    manufacturer: { name: string };
  } | null;
}): string {
  if (row.nickname?.trim()) return row.nickname.trim();
  if (row.model) {
    return `${row.model.manufacturer.name} ${row.model.modelName} (${row.model.year})`;
  }
  if (row.manualManufacturerName && row.manualModelName) {
    const year = row.manualYear ? ` (${row.manualYear})` : "";
    return `${row.manualManufacturerName} ${row.manualModelName}${year}`;
  }
  return "Véhicule";
}

type ModelInclude = {
  id: string;
  manufacturerId: string;
  modelName: string;
  trim: string;
  year: number;
  category: string;
  fuelType: string | null;
  avgConsumption: { toString(): string } | null;
  fuelCapacityL: { toString(): string } | null;
  manufacturer: { name: string };
};

export function toCatalogModelSummary(
  model: ModelInclude,
): CatalogModelSummaryDto {
  return {
    id: model.id,
    manufacturerId: model.manufacturerId,
    manufacturerName: model.manufacturer.name,
    modelName: model.modelName,
    trim: model.trim,
    year: model.year,
    category: model.category,
    fuelType: model.fuelType,
    avgConsumption: decimalToString(model.avgConsumption),
    fuelCapacityL: decimalToString(model.fuelCapacityL),
  };
}

export function toVehicleDto(row: {
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
  purchaseDate: Date | null;
  purchasePrice: { toString(): string } | null;
  currentOdometer: number;
  realAvgConsumption: { toString(): string } | null;
  tankCapacityOverride: { toString(): string } | null;
  primaryVehicle: boolean;
  createdAt: Date;
  updatedAt: Date;
  model: ModelInclude | null;
}): UserVehicleDto {
  return {
    id: row.id,
    userId: row.userId,
    modelId: row.modelId,
    isManualEntry: row.isManualEntry,
    manualManufacturerName: row.manualManufacturerName,
    manualModelName: row.manualModelName,
    manualYear: row.manualYear,
    manualCategory: row.manualCategory,
    manualTrim: row.manualTrim,
    nickname: row.nickname,
    vin: row.vin,
    licensePlate: row.licensePlate,
    purchaseDate: dateToIsoDate(row.purchaseDate),
    purchasePrice: decimalToString(row.purchasePrice),
    currentOdometer: row.currentOdometer,
    realAvgConsumption: decimalToString(row.realAvgConsumption),
    tankCapacityOverride: decimalToString(row.tankCapacityOverride),
    primaryVehicle: row.primaryVehicle,
    displayName: buildDisplayName(row),
    model: row.model ? toCatalogModelSummary(row.model) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toPhotoDto(row: {
  id: string;
  vehicleId: string;
  photoUrl: string;
  caption: string | null;
  displayOrder: number;
  createdAt: Date;
}): VehiclePhotoDto {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    photoUrl: row.photoUrl,
    caption: row.caption,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toDocumentDto(row: {
  id: string;
  vehicleId: string;
  type: string;
  title: string;
  fileUrl: string;
  expiryDate: Date | null;
  createdAt: Date;
}): UserVehicleDocumentDto {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    type: row.type,
    title: row.title,
    fileUrl: row.fileUrl,
    expiryDate: dateToIsoDate(row.expiryDate),
    createdAt: row.createdAt.toISOString(),
  };
}

export function toSettingsDto(row: {
  vehicleId: string;
  preferredFuelType: string | null;
  winterMode: boolean;
  avoidUnpavedRoads: boolean;
  tollPreference: string | null;
  updatedAt: Date;
}): VehicleSettingsDto {
  return {
    vehicleId: row.vehicleId,
    preferredFuelType: row.preferredFuelType,
    winterMode: row.winterMode,
    avoidUnpavedRoads: row.avoidUnpavedRoads,
    tollPreference: row.tollPreference,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function estimateRangeKm(input: {
  tankCapacityOverride: { toString(): string } | null;
  realAvgConsumption: { toString(): string } | null;
  model: {
    fuelCapacityL: { toString(): string } | null;
    avgConsumption: { toString(): string } | null;
  } | null;
}): number | null {
  const tank =
    Number(input.tankCapacityOverride?.toString() ?? NaN) ||
    Number(input.model?.fuelCapacityL?.toString() ?? NaN);
  const consumption =
    Number(input.realAvgConsumption?.toString() ?? NaN) ||
    Number(input.model?.avgConsumption?.toString() ?? NaN);
  if (
    !Number.isFinite(tank) ||
    !Number.isFinite(consumption) ||
    consumption <= 0
  ) {
    return null;
  }
  return Math.round((tank / consumption) * 100);
}
