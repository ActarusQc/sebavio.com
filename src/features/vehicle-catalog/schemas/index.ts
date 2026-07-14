import { z } from "zod";
import {
  DEFAULT_PAGE_SIZE,
  DOCUMENT_TYPES,
  DRIVE_TYPES,
  FUEL_TYPES,
  IMPORT_MAX_LINES,
  ISSUE_SEVERITIES,
  MAX_PAGE_SIZE,
  VEHICLE_CATEGORIES,
} from "@/features/vehicle-catalog/constants";

const optionalUrl = z
  .string()
  .trim()
  .url({ error: "URL invalide" })
  .max(2000)
  .nullable()
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));

const optionalInt = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") return Number(v);
  return v;
}, z.number().int().nullable().optional());

const optionalDecimal = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") return Number(v);
  return v;
}, z.number().finite().nullable().optional());

export const manufacturerCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Nom du constructeur requis" })
    .max(150),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, { error: "Code pays invalide (ISO 3166-1)" })
    .nullable()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  website: optionalUrl,
  supportUrl: optionalUrl,
  logoUrl: optionalUrl,
  active: z.boolean().optional().default(true),
});

export const manufacturerUpdateSchema = manufacturerCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    error: "Aucun champ à mettre à jour",
  });

export const vehicleModelCreateSchema = z.object({
  manufacturerId: z.string().uuid({ error: "Constructeur invalide" }),
  category: z.enum(VEHICLE_CATEGORIES, {
    error: "Catégorie invalide",
  }),
  modelName: z
    .string()
    .trim()
    .min(1, { error: "Nom du modèle requis" })
    .max(150),
  trim: z.string().trim().max(150).optional().default(""),
  year: z.coerce
    .number()
    .int({ error: "Année invalide" })
    .min(1950, { error: "Année invalide" })
    .max(2100, { error: "Année invalide" }),
  engine: optionalString(150),
  transmission: optionalString(100),
  driveType: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.enum(DRIVE_TYPES).nullable().optional(),
  ),
  fuelType: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.enum(FUEL_TYPES).nullable().optional(),
  ),
  fuelCapacityL: optionalDecimal,
  avgConsumption: optionalDecimal,
  lengthM: optionalDecimal,
  widthM: optionalDecimal,
  heightM: optionalDecimal,
  gvwrKg: optionalInt,
  sleepingCapacity: optionalInt,
  freshWaterL: optionalInt,
  greyWaterL: optionalInt,
  blackWaterL: optionalInt,
});

export const vehicleModelUpdateSchema = vehicleModelCreateSchema
  .omit({ manufacturerId: true })
  .partial()
  .extend({
    manufacturerId: z.string().uuid().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    error: "Aucun champ à mettre à jour",
  });

export const modelsSearchSchema = z.object({
  manufacturer: z.string().trim().max(150).optional(),
  manufacturerId: z.string().uuid().optional(),
  category: z.enum(VEHICLE_CATEGORIES).optional(),
  year: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.coerce
      .number()
      .int({ error: "Année invalide" })
      .min(1950, { error: "Année invalide" })
      .max(2100, { error: "Année invalide" })
      .optional(),
  ),
  fuelType: z.enum(FUEL_TYPES).optional(),
  engine: z.string().trim().max(150).optional(),
  keyword: z.string().trim().max(150).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .default(DEFAULT_PAGE_SIZE)
    .transform((v) => Math.min(v, MAX_PAGE_SIZE)),
  sort: z
    .enum(["year_desc", "year_asc", "name_asc", "name_desc"])
    .default("year_desc"),
});

export const manufacturersListSchema = z.object({
  keyword: z.string().trim().max(150).optional(),
  active: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      return v === "true" || v === "1";
    }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .default(DEFAULT_PAGE_SIZE)
    .transform((v) => Math.min(v, MAX_PAGE_SIZE)),
});

export const vehicleDocumentSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES, { error: "Type de document invalide" }),
  title: z.string().trim().min(1).max(200),
  // URL saisie uniquement — pas de téléversement (phase storage ultérieure).
  fileUrl: z
    .string()
    .trim()
    .url({ error: "URL du document invalide" })
    .max(2000),
  language: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{2}$/, { error: "Code langue invalide" }),
  version: optionalString(20),
});

export const knownIssueSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  severity: z.enum(ISSUE_SEVERITIES, { error: "Sévérité invalide" }),
  source: z.string().trim().min(1).max(200),
  verified: z.boolean().optional().default(false),
});

/** Ligne d'import constructeur (JSON). */
export const importManufacturerLineSchema = manufacturerCreateSchema.extend({
  type: z.literal("manufacturer").optional(),
});

/** Ligne d'import modèle — manufacturerName résolu côté service. */
export const importModelLineSchema = vehicleModelCreateSchema
  .omit({ manufacturerId: true })
  .extend({
    type: z.literal("model").optional(),
    manufacturerName: z
      .string()
      .trim()
      .min(1, { error: "Nom constructeur requis" })
      .max(150),
  });

export const importPayloadSchema = z.object({
  manufacturers: z
    .array(z.unknown())
    .max(IMPORT_MAX_LINES)
    .optional()
    .default([]),
  models: z.array(z.unknown()).max(IMPORT_MAX_LINES).optional().default([]),
});

export type ManufacturerCreateInput = z.infer<typeof manufacturerCreateSchema>;
export type ManufacturerUpdateInput = z.infer<typeof manufacturerUpdateSchema>;
export type VehicleModelCreateInput = z.infer<typeof vehicleModelCreateSchema>;
export type VehicleModelUpdateInput = z.infer<typeof vehicleModelUpdateSchema>;
export type ModelsSearchInput = z.infer<typeof modelsSearchSchema>;
export type ManufacturersListInput = z.infer<typeof manufacturersListSchema>;
