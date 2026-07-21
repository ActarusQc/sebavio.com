import { z } from "zod";
import { randomUUID } from "node:crypto";

const nullableString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const nullableNumber = z
  .union([z.number().finite(), z.null()])
  .optional()
  .transform((v) => (v === undefined ? null : v));

export const placeRefSchema = z
  .object({
    name: nullableString(500),
    placeId: nullableString(255),
    latitude: nullableNumber,
    longitude: nullableNumber,
  })
  .transform((p) => ({
    name: p.name ?? null,
    placeId: p.placeId ?? null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
  }));

export const stopCategorySchema = z.enum([
  "activity",
  "detour",
  "lodging",
  "meal",
  "fuel",
  "rest",
  "other",
]);

export const stopDraftSchema = z
  .object({
    id: z.string().min(1).max(80).optional(),
    name: z.string().trim().min(1).max(200),
    category: stopCategorySchema.default("activity"),
    justification: nullableString(500),
    durationMinutes: z
      .number()
      .int()
      .min(0)
      .max(24 * 60)
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    latitude: nullableNumber,
    longitude: nullableNumber,
    placeId: nullableString(255),
    address: nullableString(2000),
    accepted: z.boolean().optional().default(true),
  })
  .transform((s) => ({
    id: s.id ?? randomUUID(),
    name: s.name,
    category: s.category,
    justification: s.justification ?? null,
    durationMinutes: s.durationMinutes,
    latitude: s.latitude ?? null,
    longitude: s.longitude ?? null,
    placeId: s.placeId ?? null,
    address: s.address ?? null,
    accepted: s.accepted ?? true,
  }));

export const suggestionSchema = z
  .object({
    id: z.string().min(1).max(80).optional(),
    name: z.string().trim().min(1).max(200),
    category: z.string().trim().min(1).max(80),
    justification: nullableString(500),
    imageUrl: z
      .string()
      .url()
      .refine((u) => u.startsWith("https://"), {
        message: "URL image invalide",
      })
      .nullable()
      .optional()
      .catch(null)
      .transform((v) => v ?? null),
    accepted: z.boolean().optional().default(true),
  })
  .transform((s) => ({
    id: s.id ?? randomUUID(),
    name: s.name,
    category: s.category,
    justification: s.justification ?? null,
    imageUrl: s.imageUrl,
    accepted: s.accepted ?? true,
  }));

export const budgetLevelSchema = z.enum([
  "low",
  "moderate",
  "comfortable",
  "premium",
]);

export const sessionStatusSchema = z.enum([
  "collecting",
  "proposing",
  "ready_for_confirmation",
  "created",
  "abandoned",
]);

export const tripDraftSchema = z
  .object({
    title: nullableString(150),
    origin: placeRefSchema.default({
      name: null,
      placeId: null,
      latitude: null,
      longitude: null,
    }),
    destination: placeRefSchema.default({
      name: null,
      placeId: null,
      latitude: null,
      longitude: null,
    }),
    departureDate: nullableString(40),
    returnDate: nullableString(40),
    durationDays: z
      .number()
      .int()
      .min(1)
      .max(90)
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    travelerCount: z
      .number()
      .int()
      .min(1)
      .max(50)
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    adults: z
      .number()
      .int()
      .min(0)
      .max(50)
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    children: z
      .number()
      .int()
      .min(0)
      .max(50)
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    vehicleId: z.string().uuid().nullable().optional().catch(null),
    vehicleLabel: nullableString(200),
    travelGroupId: z.string().uuid().nullable().optional().catch(null),
    budgetLevel: budgetLevelSchema.nullable().optional().catch(null),
    travelStyle: z.array(z.string().max(80)).max(20).default([]),
    preferences: z.array(z.string().max(120)).max(30).default([]),
    constraints: z.array(z.string().max(200)).max(30).default([]),
    lodgingType: nullableString(120),
    pace: nullableString(80),
    stops: z.array(stopDraftSchema).max(40).default([]),
    activities: z.array(stopDraftSchema).max(40).default([]),
    suggestions: z.array(suggestionSchema).max(3).default([]),
    estimatedDistanceKm: nullableNumber,
    estimatedDurationMinutes: nullableNumber,
    estimatedFuelStops: nullableNumber,
    softWarnings: z.array(z.string().max(300)).max(10).default([]),
  })
  .transform((d) => ({
    title: d.title ?? null,
    origin: d.origin,
    destination: d.destination,
    departureDate: d.departureDate ?? null,
    returnDate: d.returnDate ?? null,
    durationDays: d.durationDays,
    travelerCount: d.travelerCount,
    adults: d.adults,
    children: d.children,
    vehicleId: d.vehicleId ?? null,
    vehicleLabel: d.vehicleLabel ?? null,
    travelGroupId: d.travelGroupId ?? null,
    budgetLevel: d.budgetLevel ?? null,
    travelStyle: d.travelStyle ?? [],
    preferences: d.preferences ?? [],
    constraints: d.constraints ?? [],
    lodgingType: d.lodgingType ?? null,
    pace: d.pace ?? null,
    stops: d.stops ?? [],
    activities: d.activities ?? [],
    suggestions: d.suggestions ?? [],
    estimatedDistanceKm: d.estimatedDistanceKm ?? null,
    estimatedDurationMinutes: d.estimatedDurationMinutes ?? null,
    estimatedFuelStops: d.estimatedFuelStops ?? null,
    softWarnings: d.softWarnings ?? [],
  }));

export type TripDraftParsed = z.infer<typeof tripDraftSchema>;

export function emptyTripDraft(): TripDraftParsed {
  return tripDraftSchema.parse({});
}

export const tripPlanningAiResponseSchema = z.object({
  sessionStatus: sessionStatusSchema.default("collecting"),
  assistantMessage: z.string().trim().min(1).max(4000),
  missingFields: z.array(z.string().max(80)).max(30).default([]),
  quickReplies: z.array(z.string().max(80)).max(12).default([]),
  tripDraft: tripDraftSchema,
  suggestions: z.array(suggestionSchema).max(3).optional(),
  destinationIdeas: z.array(suggestionSchema).max(4).optional(),
});

export type TripPlanningAiResponse = z.infer<
  typeof tripPlanningAiResponseSchema
>;
