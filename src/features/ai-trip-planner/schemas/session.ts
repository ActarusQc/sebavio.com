import { z } from "zod";

export const plannerMessageSchema = z.object({
  id: z.string().min(1).max(80),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
  createdAt: z.string().datetime({ offset: true }).or(z.string().min(10)),
  quickReplies: z.array(z.string().max(80)).max(12).optional(),
});

export const plannerMessagesSchema = z.array(plannerMessageSchema).max(200);

export type PlannerMessageStored = z.infer<typeof plannerMessageSchema>;

export const sendMessageBodySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, { error: "Message requis" })
    .max(4000, { error: "Message trop long" }),
});

export const createSessionBodySchema = z.object({
  forceNew: z.boolean().optional().default(false),
});

export const createTripBodySchema = z.object({
  confirm: z.literal(true, {
    error: "Confirmation explicite requise",
  }),
});
