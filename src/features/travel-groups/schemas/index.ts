import { z } from "zod";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MOBILITY_LEVELS,
  RELATIONSHIP_OPTIONS,
} from "@/features/travel-groups/constants";

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
}, z.number().finite().nullable().optional());

const optionalDate = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  return v;
}, z.coerce.date().nullable().optional());

const jsonArray = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as unknown;
    } catch {
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return v;
}, z.array(z.string()).nullable().optional());

function refineBirthDateNotFuture(
  data: { birthDate?: Date | null },
  ctx: z.RefinementCtx,
) {
  if (data.birthDate && data.birthDate.getTime() > Date.now()) {
    ctx.addIssue({
      code: "custom",
      message: "La date de naissance ne peut pas être dans le futur",
      path: ["birthDate"],
    });
  }
}

function refineWeightPositive(
  data: { weightKg?: number | null },
  ctx: z.RefinementCtx,
) {
  if (data.weightKg != null && data.weightKg <= 0) {
    ctx.addIssue({
      code: "custom",
      message: "Le poids doit être supérieur à 0",
      path: ["weightKg"],
    });
  }
}

export const travelGroupsListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

export const travelGroupCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Nom du groupe requis" })
    .max(150, { error: "Nom trop long" }),
  defaultGroup: z.boolean().optional(),
});

export const travelGroupUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Nom du groupe requis" })
    .max(150)
    .optional(),
  defaultGroup: z.boolean().optional(),
});

export const memberCreateSchema = z
  .object({
    firstName: z.string().trim().min(1, { error: "Prénom requis" }).max(100),
    birthDate: optionalDate,
    relationship: z.enum(RELATIONSHIP_OPTIONS).nullable().optional(),
    mobilityLevel: z.enum(MOBILITY_LEVELS).nullable().optional(),
    specialNeeds: optionalString(5000),
    notes: optionalString(5000),
  })
  .superRefine(refineBirthDateNotFuture);

export const memberUpdateSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    birthDate: optionalDate,
    relationship: z.enum(RELATIONSHIP_OPTIONS).nullable().optional(),
    mobilityLevel: z.enum(MOBILITY_LEVELS).nullable().optional(),
    specialNeeds: optionalString(5000),
    notes: optionalString(5000),
  })
  .superRefine(refineBirthDateNotFuture);

export const petCreateSchema = z
  .object({
    name: z.string().trim().min(1, { error: "Nom requis" }).max(100),
    species: optionalString(50),
    breed: optionalString(100),
    weightKg: optionalDecimal,
    notes: optionalString(5000),
  })
  .superRefine(refineWeightPositive);

export const petUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    species: optionalString(50),
    breed: optionalString(100),
    weightKg: optionalDecimal,
    notes: optionalString(5000),
  })
  .superRefine(refineWeightPositive);

export const preferencesUpsertSchema = z.object({
  maxDriveHours: optionalDecimal,
  dailyBudget: optionalDecimal,
  preferredCampgroundType: optionalString(50),
  avoidTolls: z.boolean().optional(),
  avoidFerries: z.boolean().optional(),
  preferredActivityTypes: jsonArray,
  foodPreferences: jsonArray,
  accessibilityRequired: z.boolean().optional(),
});

export type TravelGroupCreateInput = z.infer<typeof travelGroupCreateSchema>;
export type TravelGroupUpdateInput = z.infer<typeof travelGroupUpdateSchema>;
export type MemberCreateInput = z.infer<typeof memberCreateSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
export type PetCreateInput = z.infer<typeof petCreateSchema>;
export type PetUpdateInput = z.infer<typeof petUpdateSchema>;
export type PreferencesUpsertInput = z.infer<typeof preferencesUpsertSchema>;
