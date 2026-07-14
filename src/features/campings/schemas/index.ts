import { z } from "zod";
import {
  CAMPGROUND_DATA_SOURCES,
  CAMPGROUND_SERVICES,
  CAMPGROUND_TYPES,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SEARCH_RADIUS_KM,
  MAX_PAGE_SIZE,
  MAX_SEARCH_RADIUS_KM,
} from "@/features/campings/constants";

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));

const optionalDecimal = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") return Number(v);
  return v;
}, z.number().finite().nonnegative().nullable().optional());

const servicesSchema = z
  .array(z.enum(CAMPGROUND_SERVICES))
  .default([])
  .optional();

export const campgroundSearchSchema = z.object({
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
  radiusKm: z.coerce
    .number()
    .finite()
    .positive()
    .max(MAX_SEARCH_RADIUS_KM)
    .default(DEFAULT_SEARCH_RADIUS_KM),
  vehicleId: z.string().uuid({ error: "Identifiant invalide" }).optional(),
  petFriendly: z.preprocess((v) => {
    if (v === "true" || v === true || v === "1") return true;
    if (v === "false" || v === false || v === "0") return false;
    return undefined;
  }, z.boolean().optional()),
  campgroundType: z.enum(CAMPGROUND_TYPES).optional(),
  service: z.enum(CAMPGROUND_SERVICES).optional(),
  q: z.string().trim().max(100).optional(),
  priceMax: z.coerce.number().finite().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

export const campgroundCreateSchema = z.object({
  name: z.string().trim().min(1, { error: "Nom requis" }).max(200),
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
  address: optionalString(300),
  city: optionalString(120),
  region: optionalString(120),
  countryCode: z
    .string()
    .trim()
    .length(2)
    .default("CA")
    .transform((v) => v.toUpperCase()),
  campgroundType: z.enum(CAMPGROUND_TYPES).default("campground"),
  maxLengthM: optionalDecimal,
  services: servicesSchema,
  petFriendly: z.boolean().default(false),
  rating: z.coerce.number().finite().min(0).max(5).nullable().optional(),
  priceMin: optionalDecimal,
  priceMax: optionalDecimal,
  reservationUrl: optionalString(2000),
  source: z.enum(CAMPGROUND_DATA_SOURCES).default("manual"),
});

export const campgroundUpdateSchema = campgroundCreateSchema
  .partial()
  .omit({ source: true });

export const favoriteCreateSchema = z.object({
  campgroundId: z.string().uuid({ error: "Camping invalide" }),
  notes: optionalString(500),
});

export const attachCampgroundSchema = z.object({
  campgroundId: z
    .string()
    .uuid({ error: "Camping invalide" })
    .nullable()
    .optional(),
});

export type CampgroundSearchInput = z.infer<typeof campgroundSearchSchema>;
export type CampgroundCreateInput = z.infer<typeof campgroundCreateSchema>;
export type CampgroundUpdateInput = z.infer<typeof campgroundUpdateSchema>;
export type FavoriteCreateInput = z.infer<typeof favoriteCreateSchema>;
