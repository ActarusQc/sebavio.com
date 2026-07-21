import { z } from "zod";
import type { RestaurantStyleId } from "@/features/ai/lib/restaurant-preferences";
import { RESTAURANT_STYLE_OPTIONS } from "@/features/ai/lib/restaurant-preferences";

export const pendingAssistantRequestSchema = z.object({
  requestId: z.string().uuid(),
  intent: z.literal("restaurant_recommendation"),
  originalMessage: z.string().min(1).max(4000),
  tripId: z.string().uuid(),
  leg: z.enum(["outbound", "return"]),
  departureHour: z.number().int().min(0).max(23),
  departureMinute: z.number().int().min(0).max(59),
  mealType: z.enum(["breakfast", "lunch", "dinner"]),
  targetHour: z.number().int().min(0).max(23),
  targetMinute: z.number().int().min(0).max(59),
  restaurantStyle: z
    .enum(["fast", "family", "fine", "local", "any"])
    .nullable(),
  clarificationStep: z.enum(["restaurant_style", "budget"]).nullable(),
  createdAt: z.string().min(1).max(40),
});

export type PendingAssistantRequest = z.infer<
  typeof pendingAssistantRequestSchema
>;

export function isStyleOnlyClarificationReply(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length > 120) return false;
  const normalized = trimmed
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  for (const opt of RESTAURANT_STYLE_OPTIONS) {
    if (
      normalized ===
      opt.label.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
    ) {
      return true;
    }
    if (
      normalized.includes(
        opt.label.toLowerCase().normalize("NFD").replace(/\p{M}/gu, ""),
      )
    ) {
      // bouton exact ou quasi
      if (trimmed.length <= opt.label.length + 10) return true;
    }
  }
  return false;
}

export function extractPendingRestaurantRequest(
  messages: Array<{
    role: string;
    content: string;
    structuredPayload?: unknown;
  }>,
): PendingAssistantRequest | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || m.role !== "assistant") continue;
    const structured = m.structuredPayload;
    if (!structured || typeof structured !== "object") continue;
    const payload = structured as Record<string, unknown>;
    const pending = payload.pendingRequest;
    if (!pending) continue;
    const parsed = pendingAssistantRequestSchema.safeParse(pending);
    if (
      parsed.success &&
      parsed.data.clarificationStep === "restaurant_style"
    ) {
      return parsed.data;
    }
    // aussi via clarification.required
    const clar = payload.clarification as { required?: boolean } | null;
    if (clar?.required && parsed.success) return parsed.data;
  }
  return null;
}

export function buildPendingRestaurantRequest(input: {
  tripId: string;
  originalMessage: string;
  departureHour: number;
  departureMinute: number;
  mealType: "breakfast" | "lunch" | "dinner";
  targetHour: number;
  targetMinute: number;
  restaurantStyle?: RestaurantStyleId | null;
}): PendingAssistantRequest {
  return {
    requestId: crypto.randomUUID(),
    intent: "restaurant_recommendation",
    originalMessage: input.originalMessage,
    tripId: input.tripId,
    leg: "outbound",
    departureHour: input.departureHour,
    departureMinute: input.departureMinute,
    mealType: input.mealType,
    targetHour: input.targetHour,
    targetMinute: input.targetMinute,
    restaurantStyle: input.restaurantStyle ?? null,
    clarificationStep: "restaurant_style",
    createdAt: new Date().toISOString(),
  };
}
