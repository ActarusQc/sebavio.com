import type { Prisma } from "@prisma/client";
import type {
  ManufacturerDto,
  VehicleDocumentDto,
  VehicleModelDto,
  VehicleSpecificationsDto,
  KnownIssueDto,
} from "@/features/vehicle-catalog/types";

type DecimalLike = Prisma.Decimal | number | null | undefined;

export function decimalToNumber(value: DecimalLike): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

export function toManufacturerDto(row: {
  id: string;
  name: string;
  countryCode: string | null;
  website: string | null;
  supportUrl: string | null;
  logoUrl: string | null;
  active: boolean;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}): ManufacturerDto {
  return {
    id: row.id,
    name: row.name,
    countryCode: row.countryCode,
    website: row.website,
    supportUrl: row.supportUrl,
    logoUrl: row.logoUrl,
    active: row.active,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toVehicleModelDto(row: {
  id: string;
  manufacturerId: string;
  category: string;
  modelName: string;
  trim: string;
  year: number;
  engine: string | null;
  transmission: string | null;
  driveType: string | null;
  fuelType: string | null;
  fuelCapacityL: DecimalLike;
  avgConsumption: DecimalLike;
  lengthM: DecimalLike;
  widthM: DecimalLike;
  heightM: DecimalLike;
  gvwrKg: number | null;
  sleepingCapacity: number | null;
  freshWaterL: number | null;
  greyWaterL: number | null;
  blackWaterL: number | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  manufacturer?: { name: string } | null;
}): VehicleModelDto {
  return {
    id: row.id,
    manufacturerId: row.manufacturerId,
    manufacturerName: row.manufacturer?.name,
    category: row.category,
    modelName: row.modelName,
    trim: row.trim,
    year: row.year,
    engine: row.engine,
    transmission: row.transmission,
    driveType: row.driveType,
    fuelType: row.fuelType,
    fuelCapacityL: decimalToNumber(row.fuelCapacityL),
    avgConsumption: decimalToNumber(row.avgConsumption),
    lengthM: decimalToNumber(row.lengthM),
    widthM: decimalToNumber(row.widthM),
    heightM: decimalToNumber(row.heightM),
    gvwrKg: row.gvwrKg,
    sleepingCapacity: row.sleepingCapacity,
    freshWaterL: row.freshWaterL,
    greyWaterL: row.greyWaterL,
    blackWaterL: row.blackWaterL,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toSpecificationsDto(row: {
  id: string;
  engine: string | null;
  transmission: string | null;
  driveType: string | null;
  fuelType: string | null;
  fuelCapacityL: DecimalLike;
  avgConsumption: DecimalLike;
  lengthM: DecimalLike;
  widthM: DecimalLike;
  heightM: DecimalLike;
  gvwrKg: number | null;
  sleepingCapacity: number | null;
  freshWaterL: number | null;
  greyWaterL: number | null;
  blackWaterL: number | null;
}): VehicleSpecificationsDto {
  return {
    modelId: row.id,
    engine: row.engine,
    transmission: row.transmission,
    driveType: row.driveType,
    fuelType: row.fuelType,
    fuelCapacityL: decimalToNumber(row.fuelCapacityL),
    avgConsumption: decimalToNumber(row.avgConsumption),
    lengthM: decimalToNumber(row.lengthM),
    widthM: decimalToNumber(row.widthM),
    heightM: decimalToNumber(row.heightM),
    gvwrKg: row.gvwrKg,
    sleepingCapacity: row.sleepingCapacity,
    freshWaterL: row.freshWaterL,
    greyWaterL: row.greyWaterL,
    blackWaterL: row.blackWaterL,
  };
}

export function toDocumentDto(row: {
  id: string;
  modelId: string;
  documentType: string;
  title: string;
  fileUrl: string;
  language: string;
  version: string | null;
  createdAt: Date;
}): VehicleDocumentDto {
  return {
    id: row.id,
    modelId: row.modelId,
    documentType: row.documentType,
    title: row.title,
    fileUrl: row.fileUrl,
    language: row.language,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toKnownIssueDto(row: {
  id: string;
  modelId: string;
  title: string;
  description: string;
  severity: string;
  source: string;
  verified: boolean;
  createdAt: Date;
}): KnownIssueDto {
  return {
    id: row.id,
    modelId: row.modelId,
    title: row.title,
    description: row.description,
    severity: row.severity,
    source: row.source,
    verified: row.verified,
    createdAt: row.createdAt.toISOString(),
  };
}

export function clampPageSize(requested: number, max: number): number {
  if (!Number.isFinite(requested) || requested < 1) return 1;
  return Math.min(Math.floor(requested), max);
}
