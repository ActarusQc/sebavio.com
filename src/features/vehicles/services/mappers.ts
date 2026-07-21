import {
  getEffectiveVehicleSpecifications,
  parseSpecOverrides,
} from "@/features/vehicles/lib/effective-specs";
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

function decimalToNumber(
  value: { toString(): string } | null | undefined,
): number | null {
  if (value == null) return null;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : null;
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
  catalogEntry?: {
    make: string;
    model: string;
    modelYear: number;
  } | null;
}): string {
  if (row.nickname?.trim()) return row.nickname.trim();
  if (row.model) {
    return `${row.model.manufacturer.name} ${row.model.modelName} (${row.model.year})`;
  }
  if (row.catalogEntry?.make && row.catalogEntry?.model) {
    return `${row.catalogEntry.make} ${row.catalogEntry.model} (${row.catalogEntry.modelYear})`;
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
  lengthM?: { toString(): string } | null;
  widthM?: { toString(): string } | null;
  heightM?: { toString(): string } | null;
  gvwrKg?: number | null;
  manufacturer: { name: string };
};

type CatalogEntryInclude = {
  make?: string;
  model?: string;
  modelYear?: number;
  fuelTankCapacityL?: { toString(): string } | null;
  electricRangeKm?: number | null;
  electricConsumptionKwh100Km?: { toString(): string } | null;
  combinedConsumptionL100Km?: { toString(): string } | null;
  normalizedFuelType?: string | null;
} | null;

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
  purchaseDate: Date | null;
  purchasePrice: { toString(): string } | null;
  currentOdometer: number;
  realAvgConsumption: { toString(): string } | null;
  customConsumptionL100?: { toString(): string } | null;
  fuelType: string | null;
  manufacturerFuelType?: string | null;
  customFuelType?: string | null;
  officialCityConsumptionL100: { toString(): string } | null;
  officialHighwayConsumptionL100: { toString(): string } | null;
  officialCombinedConsumptionL100: { toString(): string } | null;
  consumptionDataSource: string | null;
  tankCapacityOverride: { toString(): string } | null;
  manufacturerTankCapacityL?: { toString(): string } | null;
  specOverrides?: unknown;
  engine?: string | null;
  primaryVehicle: boolean;
  createdAt: Date;
  updatedAt: Date;
  model: ModelInclude | null;
  catalogEntry?: CatalogEntryInclude;
}): UserVehicleDto {
  const manufacturerConso =
    decimalToNumber(row.officialCombinedConsumptionL100) ??
    decimalToNumber(row.model?.avgConsumption) ??
    decimalToNumber(row.catalogEntry?.combinedConsumptionL100Km);

  const manufacturerTank =
    decimalToNumber(row.manufacturerTankCapacityL) ??
    decimalToNumber(row.catalogEntry?.fuelTankCapacityL) ??
    decimalToNumber(row.model?.fuelCapacityL);

  const overrides = parseSpecOverrides(row.specOverrides);
  const manufacturerFuel =
    row.manufacturerFuelType ??
    row.catalogEntry?.normalizedFuelType ??
    row.model?.fuelType ??
    null;

  const effective = getEffectiveVehicleSpecifications({
    manufacturerConsumptionL100: manufacturerConso,
    customConsumptionL100: decimalToNumber(row.customConsumptionL100),
    realAvgConsumption: decimalToNumber(row.realAvgConsumption),
    manufacturerTankCapacityL: manufacturerTank,
    customTankCapacityL: decimalToNumber(row.tankCapacityOverride),
    manufacturerFuelType: manufacturerFuel,
    customFuelType: row.customFuelType ?? null,
    fuelType: row.fuelType,
    manufacturerElectricRangeKm: row.catalogEntry?.electricRangeKm ?? null,
    manufacturerLengthM: decimalToNumber(row.model?.lengthM),
    manufacturerWidthM: decimalToNumber(row.model?.widthM),
    manufacturerHeightM: decimalToNumber(row.model?.heightM),
    manufacturerWeightKg: row.model?.gvwrKg ?? null,
    specOverrides: overrides,
  });

  return {
    id: row.id,
    userId: row.userId,
    modelId: row.modelId,
    catalogEntryId: row.catalogEntryId,
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
    customConsumptionL100: decimalToString(row.customConsumptionL100),
    fuelType: effective.fuelType,
    manufacturerFuelType: manufacturerFuel,
    customFuelType: row.customFuelType ?? null,
    officialCityConsumptionL100: decimalToString(
      row.officialCityConsumptionL100,
    ),
    officialHighwayConsumptionL100: decimalToString(
      row.officialHighwayConsumptionL100,
    ),
    officialCombinedConsumptionL100: decimalToString(
      row.officialCombinedConsumptionL100,
    ),
    consumptionDataSource: row.consumptionDataSource,
    tankCapacityOverride: decimalToString(row.tankCapacityOverride),
    manufacturerTankCapacityL:
      manufacturerTank != null ? String(manufacturerTank) : null,
    specOverrides: overrides,
    engine: row.engine ?? null,
    effectiveSpecs: {
      consumptionLPer100Km: effective.consumptionLPer100Km,
      consumptionSource: effective.consumption.source,
      manufacturerConsumptionL100: manufacturerConso,
      tankCapacityLiters: effective.tankCapacityLiters,
      tankCapacitySource: effective.tankCapacity.source,
      manufacturerTankCapacityL: manufacturerTank,
      fuelType: effective.fuelType,
      fuelTypeSource: effective.fuelTypeSpec.source,
      manufacturerFuelType: manufacturerFuel,
      electricRangeKm: effective.electricRangeKm,
      batteryCapacityKwh: effective.batteryCapacityKwh,
      lengthM: effective.lengthM,
      widthM: effective.widthM,
      heightM: effective.heightM,
      weightKg: effective.weightKg,
    },
    primaryVehicle: row.primaryVehicle,
    displayName: buildDisplayName({
      nickname: row.nickname,
      isManualEntry: row.isManualEntry,
      manualManufacturerName: row.manualManufacturerName,
      manualModelName: row.manualModelName,
      manualYear: row.manualYear,
      model: row.model,
      catalogEntry:
        row.catalogEntry?.make &&
        row.catalogEntry?.model &&
        row.catalogEntry?.modelYear != null
          ? {
              make: row.catalogEntry.make,
              model: row.catalogEntry.model,
              modelYear: row.catalogEntry.modelYear,
            }
          : null,
    }),
    model: row.model ? toCatalogModelSummary(row.model) : null,
    catalogElectricRangeKm: row.catalogEntry?.electricRangeKm ?? null,
    catalogBatteryHintKwh: decimalToNumber(
      row.catalogEntry?.electricConsumptionKwh100Km,
    ),
    catalogLabel:
      row.catalogEntry?.make &&
      row.catalogEntry?.model &&
      row.catalogEntry?.modelYear != null
        ? `${row.catalogEntry.make} ${row.catalogEntry.model} (${row.catalogEntry.modelYear})`
        : null,
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
  manufacturerTankCapacityL?: { toString(): string } | null;
  customConsumptionL100?: { toString(): string } | null;
  realAvgConsumption: { toString(): string } | null;
  officialCombinedConsumptionL100?: { toString(): string } | null;
  model: {
    fuelCapacityL: { toString(): string } | null;
    avgConsumption: { toString(): string } | null;
  } | null;
  catalogEntry?: {
    fuelTankCapacityL?: { toString(): string } | null;
  } | null;
}): number | null {
  const effective = getEffectiveVehicleSpecifications({
    manufacturerConsumptionL100:
      decimalToNumber(input.officialCombinedConsumptionL100) ??
      decimalToNumber(input.model?.avgConsumption),
    customConsumptionL100: decimalToNumber(input.customConsumptionL100),
    realAvgConsumption: decimalToNumber(input.realAvgConsumption),
    manufacturerTankCapacityL:
      decimalToNumber(input.manufacturerTankCapacityL) ??
      decimalToNumber(input.catalogEntry?.fuelTankCapacityL) ??
      decimalToNumber(input.model?.fuelCapacityL),
    customTankCapacityL: decimalToNumber(input.tankCapacityOverride),
  });

  const tank = effective.tankCapacityLiters;
  const consumption = effective.consumptionLPer100Km;
  if (tank == null || consumption == null || consumption <= 0) {
    return null;
  }
  return Math.round((tank / consumption) * 100);
}
