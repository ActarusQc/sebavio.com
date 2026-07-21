import { z } from "zod";
import {
  ACCESSIBILITY_NEEDS,
  ACTIVITY_INTERESTS,
  ACTIVITY_LEVELS,
  BUDGET_PREFERENCES,
  DURATION_PREFERENCES,
  ENVIRONMENT_PREFERENCES,
  INSERT_PLACEMENTS,
  MAX_DETOUR_OPTIONS,
  REJECT_REASONS,
  TRIP_PURPOSES,
} from "@/features/trips/activities/activity-types";

const childAgeSchema = z.coerce.number().int().min(0).max(17);

export const tripTravelerProfileSchema = z
  .object({
    purpose: z.enum(TRIP_PURPOSES),
    adultCount: z.coerce.number().int().min(1).max(20),
    childCount: z.coerce.number().int().min(0).max(20),
    childAges: z.array(childAgeSchema).default([]),
    interests: z.array(z.enum(ACTIVITY_INTERESTS)).max(18).default([]),
    budgetPreference: z.enum(BUDGET_PREFERENCES).nullable().optional(),
    durationPreference: z.enum(DURATION_PREFERENCES).nullable().optional(),
    maxDetourMinutes: z.coerce
      .number()
      .int()
      .min(0)
      .max(60)
      .default(15)
      .refine((v) => (MAX_DETOUR_OPTIONS as readonly number[]).includes(v), {
        message: "Détour maximal non supporté",
      }),
    environmentPreference: z
      .enum(ENVIRONMENT_PREFERENCES)
      .nullable()
      .optional(),
    activityLevel: z.enum(ACTIVITY_LEVELS).nullable().optional(),
    accessibilityNeeds: z.array(z.enum(ACCESSIBILITY_NEEDS)).default(["none"]),
    travelingWithPet: z.boolean().default(false),
    deferred: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.deferred) return;
    if (data.childAges.length !== data.childCount) {
      ctx.addIssue({
        code: "custom",
        message: "Le nombre d'âges doit correspondre au nombre d'enfants",
        path: ["childAges"],
      });
    }
  });

export const tripTravelerProfileUpdateSchema = tripTravelerProfileSchema;

export const deferredProfileSchema = z.object({
  deferred: z.literal(true),
});

export const addTripActivitySchema = z.object({
  activityId: z.string().uuid({ error: "Activité invalide" }),
  placement: z.enum(INSERT_PLACEMENTS),
  plannedDate: z.coerce.date().nullable().optional(),
  plannedStartTime: z.coerce.date().nullable().optional(),
  plannedEndTime: z.coerce.date().nullable().optional(),
  estimatedVisitMinutes: z.coerce
    .number()
    .int()
    .min(15)
    .max(12 * 60)
    .nullable()
    .optional(),
  asRouteStop: z.boolean().default(true),
  confirmImpact: z.boolean().default(false),
});

export const planTripActivitySchema = z.object({
  plannedDate: z.coerce.date().nullable().optional(),
  plannedStartTime: z.coerce.date().nullable().optional(),
  plannedEndTime: z.coerce.date().nullable().optional(),
  estimatedVisitMinutes: z.coerce
    .number()
    .int()
    .min(15)
    .max(12 * 60)
    .nullable()
    .optional(),
  sequence: z.coerce.number().int().positive().nullable().optional(),
});

export const rejectTripActivitySchema = z.object({
  reason: z.enum(REJECT_REASONS).optional(),
});

export const generateSuggestionsSchema = z.object({
  force: z.boolean().optional().default(false),
});

export type TripTravelerProfileInput = z.infer<
  typeof tripTravelerProfileSchema
>;
export type AddTripActivityInput = z.infer<typeof addTripActivitySchema>;
export type PlanTripActivityInput = z.infer<typeof planTripActivitySchema>;
