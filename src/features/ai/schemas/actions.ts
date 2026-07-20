import { z } from "zod";

const directionSchema = z.enum(["outbound", "return"]);

export const locationSourceSchema = z.enum([
  "catalog",
  "user_confirmed",
  "geocoded",
  "ai_suggested",
]);

export type LocationSource = z.infer<typeof locationSourceSchema>;

const locationFields = {
  address: z.string().max(500).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  /** Source de la position — ai_suggested exige confirmation utilisateur. */
  locationSource: locationSourceSchema.optional(),
  /** true si l'utilisateur a confirmé l'emplacement dans l'UI. */
  locationConfirmed: z.boolean().optional(),
  /** Étape existante ciblée (coords du stop). */
  targetStopId: z.string().uuid().nullable().optional(),
  /** Confirmation renforcée pour détour important. */
  confirmLargeDetour: z.boolean().optional(),
};

export const proposedTripActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("add_activity"),
    title: z.string().min(1).max(150),
    description: z.string().max(2000).nullable().optional(),
    durationMinutes: z.number().int().min(15).max(720),
    direction: directionSchema.optional().default("outbound"),
    /** Si présent : activité catalogue Sebavio. */
    activityId: z.string().uuid().nullable().optional(),
    placement: z
      .enum(["outbound", "destination", "return", "day"])
      .optional()
      .default("outbound"),
    estimatedImpact: z.string().max(500).nullable().optional(),
    ...locationFields,
  }),
  z.object({
    type: z.literal("add_pause"),
    title: z.string().min(1).max(150),
    durationMinutes: z.number().int().min(5).max(240),
    direction: directionSchema.optional().default("outbound"),
    estimatedImpact: z.string().max(500).nullable().optional(),
    ...locationFields,
  }),
  z.object({
    type: z.literal("update_activity_duration"),
    stopId: z.string().uuid(),
    tripActivityId: z.string().uuid().nullable().optional(),
    durationMinutes: z.number().int().min(0).max(1440),
    previousDurationMinutes: z
      .number()
      .int()
      .min(0)
      .max(1440)
      .nullable()
      .optional(),
    stopName: z.string().max(150).nullable().optional(),
    estimatedImpact: z.string().max(500).nullable().optional(),
  }),
  z.object({
    type: z.literal("update_departure_time"),
    departureDate: z.string().min(1).max(40),
    previousDepartureDate: z.string().max(40).nullable().optional(),
    estimatedImpact: z.string().max(500).nullable().optional(),
  }),
  z.object({
    type: z.literal("create_detour"),
    title: z.string().min(1).max(150),
    description: z.string().max(2000).nullable().optional(),
    estimatedImpact: z.string().max(500).nullable().optional(),
    applicableInV1: z.literal(false).default(false),
  }),
  z.object({
    type: z.literal("other"),
    title: z.string().min(1).max(150),
    description: z.string().max(2000).nullable().optional(),
    estimatedImpact: z.string().max(500).nullable().optional(),
    applicableInV1: z.literal(false).default(false),
  }),
]);

export type ProposedTripAction = z.infer<typeof proposedTripActionSchema>;

export const applyProposedActionInputSchema = z.object({
  tripId: z.string().uuid(),
  action: proposedTripActionSchema,
  confirm: z.literal(true),
});

export type ApplyProposedActionInput = z.infer<
  typeof applyProposedActionInputSchema
>;
