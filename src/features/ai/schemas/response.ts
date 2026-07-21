import { z } from "zod";
import { proposedTripActionSchema } from "@/features/ai/schemas/actions";
import {
  aiKnowledgeModeSchema,
  aiSourceSchema,
  assistantClarificationSchema,
  restaurantRecommendationSchema,
} from "@/features/ai/schemas/sources";

export const tripAssistantWarningSchema = z.object({
  code: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  severity: z.enum(["info", "warning", "important"]),
});

export const tripAssistantSuggestionSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum([
    "activity",
    "schedule",
    "pause",
    "weather",
    "fuel_explanation",
    "route_suggestion",
  ]),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  reason: z.string().min(1).max(2000),
  estimatedDurationMinutes: z.number().int().min(0).max(10_080).nullable(),
  estimatedAdditionalDistanceKm: z.number().min(0).max(50_000).nullable(),
  estimatedDelayMinutes: z.number().int().min(0).max(10_080).nullable(),
  weatherCompatibility: z.enum(["good", "mixed", "poor", "unknown"]),
  requiresVerification: z.boolean(),
  proposedAction: proposedTripActionSchema.nullable(),
  /** Sections d’analyse visuelle (optionnel). */
  section: z
    .enum(["ok", "watch", "suggestions", "missing"])
    .nullable()
    .optional(),
});

export const tripAssistantResponseSchema = z.object({
  summary: z.string().min(1).max(2000),
  answer: z.string().min(1).max(12_000),
  status: z.enum(["ok", "warning", "incomplete"]),
  warnings: z.array(tripAssistantWarningSchema).max(20),
  suggestions: z.array(tripAssistantSuggestionSchema).max(20),
  missingInformation: z.array(z.string().max(500)).max(30),
  analysis: z
    .object({
      ok: z.array(z.string().max(500)).max(15).default([]),
      watch: z.array(z.string().max(500)).max(15).default([]),
      suggestions: z.array(z.string().max(500)).max(15).default([]),
      missing: z.array(z.string().max(500)).max(15).default([]),
    })
    .nullable()
    .optional(),
  knowledgeMode: aiKnowledgeModeSchema.default("trip_context"),
  webSearchUsed: z.boolean().default(false),
  sources: z.array(aiSourceSchema).max(30).default([]),
  restaurantRecommendations: z
    .array(restaurantRecommendationSchema)
    .max(10)
    .optional()
    .default([]),
  clarification: assistantClarificationSchema
    .nullable()
    .optional()
    .default(null),
});

export type TripAssistantResponse = z.infer<typeof tripAssistantResponseSchema>;
export type TripAssistantSuggestion = z.infer<
  typeof tripAssistantSuggestionSchema
>;
export type TripAssistantWarning = z.infer<typeof tripAssistantWarningSchema>;

export type {
  AiKnowledgeMode,
  AiSource,
  RestaurantRecommendation,
  AssistantClarification,
} from "@/features/ai/schemas/sources";
