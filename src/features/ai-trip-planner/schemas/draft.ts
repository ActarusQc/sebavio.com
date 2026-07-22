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
    /** Alias éventuel du modèle pour name. */
    label: nullableString(500).optional(),
    placeId: nullableString(255),
    latitude: nullableNumber,
    longitude: nullableNumber,
    city: nullableString(120),
    province: nullableString(120),
    postalCode: nullableString(20),
    country: nullableString(2),
    isHome: z.boolean().optional().default(false),
  })
  .transform((p) => ({
    name: p.name ?? p.label ?? null,
    placeId: p.placeId ?? null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    city: p.city ?? null,
    province: p.province ?? null,
    postalCode: p.postalCode ?? null,
    country: p.country ?? null,
    isHome: Boolean(p.isHome),
  }));

const emptyPlace = {
  name: null,
  placeId: null,
  latitude: null,
  longitude: null,
  city: null,
  province: null,
  postalCode: null,
  country: null,
  isHome: false,
};

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

export const accommodationTypeSchema = z.enum([
  "bed_and_breakfast",
  "inn",
  "hotel",
  "motel",
  "vacation_rental",
  "campground",
  "hostel",
  "other",
]);

export const lodgingOptionSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(1).max(200),
  address: nullableString(2000),
  city: nullableString(120),
  placeId: nullableString(255),
  latitude: nullableNumber,
  longitude: nullableNumber,
  rating: nullableNumber,
  ratingCount: nullableNumber,
  googleMapsUrl: nullableString(2000),
  primaryType: nullableString(80),
});

export const lodgingSelectionSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    placeId: nullableString(255),
    address: nullableString(2000),
    city: nullableString(120),
    latitude: nullableNumber,
    longitude: nullableNumber,
    rating: nullableNumber,
    googleMapsUrl: nullableString(2000),
  })
  .nullable()
  .optional()
  .transform((v) => v ?? null);

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
    origin: placeRefSchema.default(emptyPlace),
    destination: placeRefSchema.default(emptyPlace),
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
    accommodationType: accommodationTypeSchema
      .nullable()
      .optional()
      .catch(null)
      .transform((v) => v ?? null),
    lodgingRequested: z.boolean().optional().default(false),
    lodgingOptions: z.array(lodgingOptionSchema).max(8).default([]),
    lodgingSelection: lodgingSelectionSchema,
    pace: nullableString(80),
    stops: z.array(stopDraftSchema).max(40).default([]),
    activities: z.array(stopDraftSchema).max(40).default([]),
    suggestions: z.array(suggestionSchema).max(3).default([]),
    estimatedDistanceKm: nullableNumber,
    estimatedDurationMinutes: nullableNumber,
    estimatedFuelStops: nullableNumber,
    softWarnings: z.array(z.string().max(300)).max(10).default([]),
    /** known = destination choisie ; suggest = idées dans un rayon. */
    destinationMode: z
      .enum(["known", "suggest"])
      .nullable()
      .optional()
      .catch(null)
      .transform((v) => v ?? null),
    maxDriveMinutes: z
      .number()
      .int()
      .min(15)
      .max(24 * 60)
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    maxDistanceKm: z
      .number()
      .int()
      .min(10)
      .max(5000)
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    proposalConfirmed: z.boolean().optional().default(false),
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
    accommodationType: d.accommodationType ?? null,
    lodgingRequested: Boolean(d.lodgingRequested),
    lodgingOptions: d.lodgingOptions ?? [],
    lodgingSelection: d.lodgingSelection ?? null,
    pace: d.pace ?? null,
    stops: d.stops ?? [],
    activities: d.activities ?? [],
    suggestions: d.suggestions ?? [],
    estimatedDistanceKm: d.estimatedDistanceKm ?? null,
    estimatedDurationMinutes: d.estimatedDurationMinutes ?? null,
    estimatedFuelStops: d.estimatedFuelStops ?? null,
    softWarnings: d.softWarnings ?? [],
    destinationMode: d.destinationMode ?? null,
    maxDriveMinutes: d.maxDriveMinutes ?? null,
    maxDistanceKm: d.maxDistanceKm ?? null,
    proposalConfirmed: Boolean(d.proposalConfirmed),
  }));

export type TripDraftParsed = z.infer<typeof tripDraftSchema>;

export function emptyTripDraft(): TripDraftParsed {
  return tripDraftSchema.parse({});
}

export const plannerStepSchema = z.enum([
  "trip_type",
  "origin",
  "destination_mode",
  "destination_radius",
  "destination",
  "dates",
  "travelers",
  "vehicle",
  "preferences",
  "lodging",
  "itinerary_proposal",
  "proposal",
  "confirmation",
  "created",
]);

export const requestedInputSchema = z
  .object({
    type: z.enum(["text", "address", "date", "choice", "number", "vehicle"]),
    field: z
      .enum([
        "origin",
        "destination",
        "activity",
        "detour",
        "lodging",
        "stop",
        "departureDate",
        "returnDate",
        "travelers",
        "vehicleId",
        "other",
      ])
      .optional()
      .default("other"),
    placeholder: nullableString(200),
    countryBias: z.string().trim().max(2).optional().default("CA"),
    regionBias: z.string().trim().max(10).optional().default("QC"),
  })
  .optional()
  .nullable()
  .transform((v) => v ?? null);

/** Patch partiel (objet libre normalisé ensuite). */
export const tripDraftPatchSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .nullable()
  .transform((v) => v ?? undefined);

export const tripPlanningAiResponseSchema = z.object({
  sessionStatus: sessionStatusSchema.default("collecting"),
  assistantMessage: z.string().trim().min(1).max(4000),
  currentStep: plannerStepSchema.optional().nullable().catch(null),
  missingFields: z.array(z.string().max(80)).max(30).default([]),
  quickReplies: z.array(z.string().max(80)).max(12).default([]),
  requestedInput: requestedInputSchema,
  /** Complet (rétrocompat) ou absent si tripDraftPatch est fourni. */
  tripDraft: tripDraftSchema.optional().catch(undefined),
  tripDraftPatch: tripDraftPatchSchema,
  suggestions: z.array(suggestionSchema).max(3).optional(),
  destinationIdeas: z.array(suggestionSchema).max(4).optional(),
});

export type TripPlanningAiResponse = z.infer<
  typeof tripPlanningAiResponseSchema
>;
export type RequestedInput = NonNullable<
  TripPlanningAiResponse["requestedInput"]
>;
