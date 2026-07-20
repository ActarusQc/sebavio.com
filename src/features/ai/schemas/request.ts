import { z } from "zod";

export const tripAssistantRequestTypeSchema = z.enum([
  "chat",
  "analyze",
  "suggest_activities",
  "weather",
  "schedule",
  "fuel",
]);

export type TripAssistantRequestType = z.infer<
  typeof tripAssistantRequestTypeSchema
>;

export const tripAssistantMessageInputSchema = z.object({
  tripId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  requestType: tripAssistantRequestTypeSchema.default("chat"),
  /** Inclure position approximative si voyage actif + geo autorisée. */
  includeLiveLocation: z.boolean().optional().default(false),
  liveLatitude: z.number().min(-90).max(90).nullable().optional(),
  liveLongitude: z.number().min(-180).max(180).nullable().optional(),
  clientRequestId: z.string().uuid().nullable().optional(),
});

export type TripAssistantMessageInput = z.infer<
  typeof tripAssistantMessageInputSchema
>;
