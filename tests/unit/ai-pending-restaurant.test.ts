import { describe, expect, it } from "vitest";
import {
  buildPendingRestaurantRequest,
  extractPendingRestaurantRequest,
  isStyleOnlyClarificationReply,
} from "@/features/ai/lib/pending-assistant-request";
import { buildRestaurantClarificationResponse } from "@/features/ai/services/restaurant-flow";
import { resolveMealTiming } from "@/features/ai/lib/meal-timing";

describe("pending restaurant + clarification unique", () => {
  it("détecte une réponse style seule", () => {
    expect(isStyleOnlyClarificationReply("Familial et décontracté")).toBe(true);
    expect(
      isStyleOnlyClarificationReply(
        "Je compte partir à 6 h. Je voudrais dîner à midi. Restaurant?",
      ),
    ).toBe(false);
  });

  it("conserve la demande originale dans pending", () => {
    const original =
      "Je compte partir à 6 h. Je voudrais dîner à midi. Que me suggères-tu comme restaurant?";
    const meal = resolveMealTiming(original);
    expect(meal?.mealType).toBe("lunch");
    const pending = buildPendingRestaurantRequest({
      tripId: "00000000-0000-4000-8000-000000000099",
      originalMessage: original,
      departureHour: 6,
      departureMinute: 0,
      mealType: "lunch",
      targetHour: 12,
      targetMinute: 0,
    });
    const response = buildRestaurantClarificationResponse(pending);
    const questionOccurrences =
      [response.answer, response.clarification?.question ?? ""]
        .join("\n")
        .split(/Quel type de restaurant recherchez-vous/).length - 1;
    expect(questionOccurrences).toBe(1);

    const extracted = extractPendingRestaurantRequest([
      {
        role: "assistant",
        content: response.answer,
        structuredPayload: response,
      },
    ]);
    expect(extracted?.originalMessage).toBe(original);
    expect(extracted?.departureHour).toBe(6);
    expect(extracted?.targetHour).toBe(12);
  });
});
