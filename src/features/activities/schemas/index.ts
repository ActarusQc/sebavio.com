import { z } from "zod";
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_DATA_SOURCES,
  ACTIVITY_KINDS,
  ACTIVITY_SEASONS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SEARCH_RADIUS_KM,
  MAX_PAGE_SIZE,
  MAX_SEARCH_RADIUS_KM,
} from "@/features/activities/constants";

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

const seasonArraySchema = z
  .array(z.enum(ACTIVITY_SEASONS))
  .default([])
  .optional();

/** Accepte `summer` ou `summer,fall` ou JSON array depuis query. */
const seasonFilterSchema = z.preprocess(
  (v) => {
    if (v == null || v === "") return undefined;
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed.startsWith("[")) {
        try {
          return JSON.parse(trimmed) as unknown;
        } catch {
          return trimmed.split(",").map((s) => s.trim());
        }
      }
      return trimmed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return v;
  },
  z.array(z.enum(ACTIVITY_SEASONS)).optional(),
);

export const activitySearchSchema = z.object({
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
  radiusKm: z.coerce
    .number()
    .finite()
    .positive()
    .max(MAX_SEARCH_RADIUS_KM)
    .default(DEFAULT_SEARCH_RADIUS_KM),
  kind: z.enum(ACTIVITY_KINDS).optional(),
  category: z.enum(ACTIVITY_CATEGORIES).optional(),
  petFriendly: z.preprocess((v) => {
    if (v === "true" || v === true || v === "1") return true;
    if (v === "false" || v === false || v === "0") return false;
    return undefined;
  }, z.boolean().optional()),
  season: seasonFilterSchema,
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

export const activityCreateSchema = z.object({
  name: z.string().trim().min(1, { error: "Nom requis" }).max(200),
  kind: z.enum(ACTIVITY_KINDS).default("activity"),
  category: z.enum(ACTIVITY_CATEGORIES).default("autre"),
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
  familyScore: z.coerce.number().int().min(0).max(100).nullable().optional(),
  petFriendly: z.boolean().default(false),
  estimatedDurationMin: z.coerce
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  priceIndicative: optionalDecimal,
  season: seasonArraySchema,
  description: optionalString(5000),
  rating: z.coerce.number().finite().min(0).max(5).nullable().optional(),
  website: optionalString(2000),
  source: z.enum(ACTIVITY_DATA_SOURCES).default("manual"),
});

export const activityUpdateSchema = activityCreateSchema
  .partial()
  .omit({ source: true });

export const favoriteCreateSchema = z.object({
  activityId: z.string().uuid({ error: "Activité invalide" }),
  notes: optionalString(500),
});

export const attachActivitySchema = z.object({
  activityId: z.string().uuid({ error: "Activité invalide" }),
  notes: optionalString(500),
});

export type ActivitySearchInput = z.infer<typeof activitySearchSchema>;
export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
export type ActivityUpdateInput = z.infer<typeof activityUpdateSchema>;
export type FavoriteCreateInput = z.infer<typeof favoriteCreateSchema>;
