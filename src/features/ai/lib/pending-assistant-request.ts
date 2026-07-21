import { z } from "zod";
import type { RestaurantStyleId } from "@/features/ai/lib/restaurant-preferences";
import {
  RESTAURANT_STYLE_OPTIONS,
  isRestaurantSearchFollowUp,
} from "@/features/ai/lib/restaurant-preferences";
import type { MealType } from "@/features/ai/lib/meal-timing";

export const restaurantStyleIdSchema = z.enum([
  "fast",
  "family",
  "romantic",
  "fine",
  "local",
  "cafe",
  "any",
]);

export const pendingAssistantRequestSchema = z.object({
  requestId: z.string().uuid(),
  intent: z.literal("restaurant_recommendation"),
  originalMessage: z.string().min(1).max(4000),
  tripId: z.string().uuid(),
  leg: z.enum(["outbound", "return"]).default("outbound"),
  mealDate: z.string().min(8).max(12).default("1970-01-01"),
  targetLocalTime: z.string().min(1).max(20).default("12 h 00"),
  departureHour: z.number().int().min(0).max(23),
  departureMinute: z.number().int().min(0).max(59),
  mealType: z.enum(["breakfast", "lunch", "dinner"]),
  targetHour: z.number().int().min(0).max(23),
  targetMinute: z.number().int().min(0).max(59),
  restaurantStyle: restaurantStyleIdSchema.nullable().default(null),
  /** Style précédent (confirmation « même style »). */
  previousStyleLabel: z.string().max(120).nullable().optional(),
  /** Secteur de la dernière recherche (nouvelle région → nouvelle demande). */
  regionHint: z.string().max(150).nullable().optional(),
  status: z
    .enum([
      "awaiting_style",
      "awaiting_same_style_confirm",
      "searching",
      "completed",
      "cancelled",
    ])
    .default("awaiting_style"),
  clarificationStep: z
    .enum(["restaurant_style", "budget", "same_style_confirm"])
    .nullable()
    .default("restaurant_style"),
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
  if (
    normalized.includes("oui, conserver") ||
    normalized.includes("choisir un autre style") ||
    normalized === "keep_previous_style" ||
    normalized === "choose_other_style"
  ) {
    return true;
  }
  for (const opt of RESTAURANT_STYLE_OPTIONS) {
    const label = opt.label
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    if (normalized === label) return true;
    if (normalized.includes(label) && trimmed.length <= opt.label.length + 10) {
      return true;
    }
  }
  return false;
}

function parsePending(raw: unknown): PendingAssistantRequest | null {
  const parsed = pendingAssistantRequestSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Demande en attente de style (ou confirmation même style). */
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
    const pending = parsePending(payload.pendingRequest);
    if (!pending) continue;
    if (
      pending.status === "awaiting_style" ||
      pending.status === "awaiting_same_style_confirm"
    ) {
      return pending;
    }
  }
  return null;
}

/**
 * Dernière demande restaurant encore active pour suivis (« voir plus ») —
 * status completed avec un style, sans nouvelle occasion.
 */
export function extractActiveCompletedRestaurantRequest(
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
    const pending = parsePending(payload.pendingRequest);
    if (pending && pending.status === "completed" && pending.restaurantStyle) {
      return pending;
    }
  }
  return null;
}

export function buildPendingRestaurantRequest(input: {
  tripId: string;
  originalMessage: string;
  departureHour: number;
  departureMinute: number;
  mealType: MealType;
  targetHour: number;
  targetMinute: number;
  mealDate?: string;
  targetLocalTime?: string;
  leg?: "outbound" | "return";
  restaurantStyle?: RestaurantStyleId | null;
  status?: PendingAssistantRequest["status"];
  clarificationStep?: PendingAssistantRequest["clarificationStep"];
  previousStyleLabel?: string | null;
  regionHint?: string | null;
  requestId?: string;
}): PendingAssistantRequest {
  const targetLocalTime =
    input.targetLocalTime ??
    `${input.targetHour} h ${String(input.targetMinute).padStart(2, "0")}`;
  return {
    requestId: input.requestId ?? crypto.randomUUID(),
    intent: "restaurant_recommendation",
    originalMessage: input.originalMessage,
    tripId: input.tripId,
    leg: input.leg ?? "outbound",
    mealDate: input.mealDate ?? "1970-01-01",
    targetLocalTime,
    departureHour: input.departureHour,
    departureMinute: input.departureMinute,
    mealType: input.mealType,
    targetHour: input.targetHour,
    targetMinute: input.targetMinute,
    restaurantStyle: input.restaurantStyle ?? null,
    previousStyleLabel: input.previousStyleLabel ?? null,
    regionHint: input.regionHint ?? null,
    status: input.status ?? "awaiting_style",
    clarificationStep: input.clarificationStep ?? "restaurant_style",
    createdAt: new Date().toISOString(),
  };
}

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

/** Indice de région / ville dans un message. */
export function detectRegionHintFromMessage(message: string): string | null {
  const m = message.match(
    /\b(?:pres de|près de|vers|secteur(?: de)?|a|à)\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ' -]{2,40})/i,
  );
  return m?.[1]?.trim().replace(/[.,!?].*$/, "") ?? null;
}

/** Nouvelle occasion de repas → nouvelle clarification. */
export function isNewMealOccasion(
  previous: PendingAssistantRequest | null,
  next: {
    mealType: MealType;
    targetHour: number;
    targetMinute: number;
    mealDate: string;
    leg: "outbound" | "return";
    message: string;
    regionHint?: string | null;
  },
): boolean {
  if (!previous) return true;
  if (
    previous.status === "cancelled" ||
    previous.status === "awaiting_style" ||
    previous.status === "awaiting_same_style_confirm"
  ) {
    // Suivi de clarification = même demande
    if (isStyleOnlyClarificationReply(next.message)) return false;
  }

  if (isRestaurantSearchFollowUp(next.message)) return false;

  const msg = normalizeText(next.message);

  if (
    /\b(aussi|un autre repas|autre repas|autre restaurant|nouvel arret|nouvel arrêt|plus loin)\b/.test(
      msg,
    )
  ) {
    return true;
  }

  if (
    /\b(souper|dejeuner|déjeuner|demain|lendemain|retour|trajet retour|arrivee|arrivée|ce soir|ce matin)\b/.test(
      msg,
    )
  ) {
    if (previous.mealType !== next.mealType) return true;
    if (previous.mealDate !== next.mealDate && next.mealDate !== "1970-01-01") {
      return true;
    }
    if (/\b(souper|dejeuner|déjeuner|demain|retour|ce soir)\b/.test(msg)) {
      return true;
    }
  }

  if (previous.mealType !== next.mealType) return true;
  if (
    previous.mealDate !== next.mealDate &&
    next.mealDate !== "1970-01-01" &&
    previous.mealDate !== "1970-01-01"
  ) {
    return true;
  }
  if (previous.leg !== next.leg) return true;

  const prevMin = previous.targetHour * 60 + previous.targetMinute;
  const nextMin = next.targetHour * 60 + next.targetMinute;
  if (Math.abs(prevMin - nextMin) >= 90) return true;

  const nextRegion =
    next.regionHint ?? detectRegionHintFromMessage(next.message);
  const prevRegion =
    previous.regionHint ??
    detectRegionHintFromMessage(previous.originalMessage);
  if (
    nextRegion &&
    prevRegion &&
    normalizeText(nextRegion) !== normalizeText(prevRegion)
  ) {
    return true;
  }
  if (
    nextRegion &&
    !normalizeText(previous.originalMessage).includes(normalizeText(nextRegion))
  ) {
    return true;
  }

  return false;
}

export function detectLegFromMessage(message: string): "outbound" | "return" {
  const msg = normalizeText(message);
  if (/\b(retour|trajet retour|sur le chemin du retour)\b/.test(msg)) {
    return "return";
  }
  return "outbound";
}

/** Date du repas (YYYY-MM-DD) à partir de la date de départ du voyage. */
export function resolveMealDateIso(
  tripDepartureDate: string,
  departureHour: number,
  departureMinute: number,
  targetHour: number,
  targetMinute: number,
): string {
  const base = new Date(tripDepartureDate);
  if (Number.isNaN(base.getTime())) return "1970-01-01";
  const depMin = departureHour * 60 + departureMinute;
  const mealMin = targetHour * 60 + targetMinute;
  if (mealMin <= depMin) {
    base.setUTCDate(base.getUTCDate() + 1);
  }
  return base.toISOString().slice(0, 10);
}
