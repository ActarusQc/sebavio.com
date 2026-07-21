import { z } from "zod";

export const aiKnowledgeModeSchema = z.enum(["trip_context", "web_grounded"]);
export type AiKnowledgeMode = z.infer<typeof aiKnowledgeModeSchema>;

export const aiSourceTypeSchema = z.enum([
  "official",
  "guide",
  "reservation",
  "tourism",
  "review",
  "maps",
  "michelin",
  "directory",
  "other",
]);

export const aiSourceSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().max(300).nullable(),
  url: z.string().url().max(2000),
  domain: z.string().min(1).max(253),
  supportsClaim: z.string().max(500).nullable(),
  sourceType: aiSourceTypeSchema,
});

export type AiSource = z.infer<typeof aiSourceSchema>;

export const restaurantPriceLevelSchema = z.enum([
  "budget",
  "moderate",
  "premium",
  "upscale",
  "fine_dining",
  "unknown",
]);

export const assistantClarificationSchema = z.object({
  required: z.boolean(),
  type: z.enum([
    "restaurant_style",
    "meal_time",
    "budget",
    "location",
    "other",
  ]),
  question: z.string().min(1).max(500),
  options: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        label: z.string().min(1).max(120),
        description: z.string().max(300).nullable(),
      }),
    )
    .max(10),
});

export type AssistantClarification = z.infer<
  typeof assistantClarificationSchema
>;

export const restaurantRecommendationSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  name: z.string().min(1).max(200),
  city: z.string().min(1).max(150),
  category: z.string().max(120).nullable().optional(),
  shortDescription: z.string().min(1).max(1000),
  recommendationReason: z.string().min(1).max(1000),
  cuisineType: z.string().max(120).nullable(),
  priceLevel: restaurantPriceLevelSchema,
  distinction: z
    .object({
      label: z.string().min(1).max(200),
      verified: z.boolean(),
      sourceId: z.string().max(80).nullable(),
    })
    .nullable(),
  location: z.object({
    address: z.string().max(500).nullable(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    source: z.enum(["official", "maps", "web", "unverified"]),
  }),
  routeImpact: z.object({
    distanceFromMidpointKm: z.number().min(0).max(50_000).nullable(),
    estimatedDetourKm: z.number().min(0).max(50_000).nullable(),
    estimatedDetourMinutes: z.number().int().min(0).max(10_080).nullable(),
    locatedBeforeOrAfterMidpoint: z.enum([
      "before",
      "near",
      "after",
      "unknown",
    ]),
  }),
  estimatedArrivalTime: z.string().max(40).nullable().optional(),
  estimatedMealDurationMinutes: z
    .number()
    .int()
    .min(0)
    .max(600)
    .nullable()
    .optional(),
  openingStatus: z.object({
    value: z.enum([
      "verified_open",
      "likely_open",
      "likely_closed",
      "unknown",
      "closed",
    ]),
    label: z.string().min(1).max(300),
    verifiedAt: z.string().max(40).nullable(),
  }),
  openingHoursText: z.string().max(500).nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  ratingCount: z.number().int().min(0).nullable().optional(),
  reservationRecommended: z.boolean(),
  verificationRequired: z.boolean(),
  verificationNote: z.string().max(500).nullable().optional(),
  sourceIds: z.array(z.string().max(80)).max(20),
});

export type RestaurantRecommendation = z.infer<
  typeof restaurantRecommendationSchema
>;
