import { z } from "zod";

export const aiKnowledgeModeSchema = z.enum(["trip_context", "web_grounded"]);
export type AiKnowledgeMode = z.infer<typeof aiKnowledgeModeSchema>;

export const aiSourceTypeSchema = z.enum([
  "official",
  "guide",
  "reservation",
  "tourism",
  "review",
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
  "moderate",
  "upscale",
  "fine_dining",
  "unknown",
]);

export const restaurantRecommendationSchema = z.object({
  name: z.string().min(1).max(200),
  city: z.string().min(1).max(150),
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
  openingStatus: z.object({
    value: z.enum(["likely_open", "likely_closed", "unknown"]),
    label: z.string().min(1).max(300),
    verifiedAt: z.string().max(40).nullable(),
  }),
  reservationRecommended: z.boolean(),
  verificationRequired: z.boolean(),
  sourceIds: z.array(z.string().max(80)).max(20),
});

export type RestaurantRecommendation = z.infer<
  typeof restaurantRecommendationSchema
>;
