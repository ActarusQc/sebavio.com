import { describe, expect, it } from "vitest";
import {
  buildPendingRestaurantRequest,
  detectRegionHintFromMessage,
  isNewMealOccasion,
  isStyleOnlyClarificationReply,
} from "@/features/ai/lib/pending-assistant-request";
import {
  buildRestaurantStyleClarification,
  buildSameStyleConfirmClarification,
  detectRestaurantStyle,
  detectRestaurantStyleFromHistory,
  isRestaurantSearchFollowUp,
  isSameStyleRequest,
  isStyleChangeWithinRequest,
  restaurantStyleLabel,
} from "@/features/ai/lib/restaurant-preferences";
import { buildRestaurantClarificationResponse } from "@/features/ai/services/restaurant-flow";
import { TRIP_ASSISTANT_PROMPT_VERSION } from "@/features/ai/constants";

describe("préférence restaurant liée au repas (requestId)", () => {
  it("n’utilise plus l’historique pour le style courant (deprecated)", () => {
    const historyStyle = detectRestaurantStyleFromHistory([
      { role: "user", content: "Familial et décontracté" },
      { role: "assistant", content: "Voici des options." },
      {
        role: "user",
        content: "Pour souper à mon arrivée, que me suggères-tu?",
      },
    ]);
    // L’historique peut encore détecter un style passé — ne pas s’en servir
    expect(historyStyle).toBe("family");
    expect(
      detectRestaurantStyle("Pour souper à mon arrivée, que me suggères-tu?"),
    ).toBeNull();
  });

  it("même demande : suivi « voir plus » sans nouvelle clarification", () => {
    const completed = buildPendingRestaurantRequest({
      tripId: "00000000-0000-4000-8000-000000000001",
      originalMessage: "Dîner à midi, restaurant?",
      departureHour: 6,
      departureMinute: 0,
      mealType: "lunch",
      targetHour: 12,
      targetMinute: 0,
      mealDate: "2026-07-23",
      restaurantStyle: "family",
      status: "completed",
      clarificationStep: null,
      regionHint: "Trois-Pistoles",
    });
    expect(isRestaurantSearchFollowUp("En as-tu d’autres?")).toBe(true);
    expect(
      isNewMealOccasion(completed, {
        mealType: "lunch",
        targetHour: 12,
        targetMinute: 0,
        mealDate: "2026-07-23",
        leg: "outbound",
        message: "Voir plus d’options",
      }),
    ).toBe(false);
  });

  it("nouveau souper : ne réutilise pas le familial, clarification + romantique", () => {
    const lunchDone = buildPendingRestaurantRequest({
      tripId: "00000000-0000-4000-8000-000000000001",
      originalMessage: "Dîner à midi",
      departureHour: 6,
      departureMinute: 0,
      mealType: "lunch",
      targetHour: 12,
      targetMinute: 0,
      mealDate: "2026-07-23",
      restaurantStyle: "family",
      status: "completed",
      clarificationStep: null,
      regionHint: "Trois-Pistoles",
    });
    const dinnerMsg = "Pour souper à mon arrivée, que me suggères-tu?";
    expect(
      isNewMealOccasion(lunchDone, {
        mealType: "dinner",
        targetHour: 18,
        targetMinute: 30,
        mealDate: "2026-07-23",
        leg: "outbound",
        message: dinnerMsg,
      }),
    ).toBe(true);
    expect(detectRestaurantStyle(dinnerMsg)).toBeNull();
    const clar = buildRestaurantStyleClarification("dinner");
    expect(clar.question).toMatch(/souper/i);
    expect(clar.options.map((o) => o.id)).toContain("romantic");
    expect(clar.options[0]?.id).toBe("family");
    const pending = buildPendingRestaurantRequest({
      tripId: lunchDone.tripId,
      originalMessage: dinnerMsg,
      departureHour: 6,
      departureMinute: 0,
      mealType: "dinner",
      targetHour: 18,
      targetMinute: 30,
      mealDate: "2026-07-23",
      restaurantStyle: null,
      status: "awaiting_style",
    });
    expect(pending.requestId).not.toBe(lunchDone.requestId);
    expect(pending.restaurantStyle).toBeNull();
    const response = buildRestaurantClarificationResponse(pending, "dinner");
    expect(response.clarification?.options.map((o) => o.label)).toContain(
      "Romantique",
    );
  });

  it("jour suivant : nouvelle clarification obligatoire", () => {
    const day1 = buildPendingRestaurantRequest({
      tripId: "00000000-0000-4000-8000-000000000001",
      originalMessage: "Restaurant familial jour 1",
      departureHour: 8,
      departureMinute: 0,
      mealType: "lunch",
      targetHour: 12,
      targetMinute: 0,
      mealDate: "2026-07-23",
      restaurantStyle: "family",
      status: "completed",
      clarificationStep: null,
    });
    expect(
      isNewMealOccasion(day1, {
        mealType: "lunch",
        targetHour: 12,
        targetMinute: 0,
        mealDate: "2026-07-24",
        leg: "outbound",
        message: "Demain midi, où pourrais-je manger?",
      }),
    ).toBe(true);
  });

  it("style fourni directement : romantique sans clarification", () => {
    const msg = "Je veux un restaurant romantique pour souper.";
    expect(detectRestaurantStyle(msg)).toBe("romantic");
    expect(isStyleOnlyClarificationReply(msg)).toBe(false);
  });

  it("changement de style dans la même demande", () => {
    const active = buildPendingRestaurantRequest({
      tripId: "00000000-0000-4000-8000-000000000001",
      originalMessage: "Dîner à midi",
      departureHour: 6,
      departureMinute: 0,
      mealType: "lunch",
      targetHour: 12,
      targetMinute: 0,
      mealDate: "2026-07-23",
      restaurantStyle: "family",
      status: "completed",
      clarificationStep: null,
    });
    const msg = "Finalement, cherche quelque chose de rapide.";
    expect(isStyleChangeWithinRequest(msg)).toBe(true);
    expect(detectRestaurantStyle(msg)).toBe("fast");
    expect(
      isNewMealOccasion(active, {
        mealType: "lunch",
        targetHour: 12,
        targetMinute: 0,
        mealDate: "2026-07-23",
        leg: "outbound",
        message: msg,
      }),
    ).toBe(false);
  });

  it("nouvelle région : Trois-Pistoles → New Richmond", () => {
    const first = buildPendingRestaurantRequest({
      tripId: "00000000-0000-4000-8000-000000000001",
      originalMessage: "Restaurant près de Trois-Pistoles",
      departureHour: 6,
      departureMinute: 0,
      mealType: "lunch",
      targetHour: 12,
      targetMinute: 0,
      mealDate: "2026-07-23",
      restaurantStyle: "family",
      status: "completed",
      clarificationStep: null,
      regionHint: "Trois-Pistoles",
    });
    const msg = "Près de New Richmond, trouve-moi un restaurant.";
    expect(detectRegionHintFromMessage(msg)).toMatch(/New Richmond/i);
    expect(
      isNewMealOccasion(first, {
        mealType: "lunch",
        targetHour: 12,
        targetMinute: 0,
        mealDate: "2026-07-23",
        leg: "outbound",
        message: msg,
        regionHint: "New Richmond",
      }),
    ).toBe(true);
  });

  it("« même style » : confirmation, pas réutilisation silencieuse", () => {
    expect(
      isSameStyleRequest("Trouve-moi quelque chose du même style pour souper."),
    ).toBe(true);
    const confirm = buildSameStyleConfirmClarification(
      restaurantStyleLabel("family"),
    );
    expect(confirm.question).toContain("Familial et décontracté");
    expect(confirm.options.map((o) => o.id)).toEqual([
      "keep_previous_style",
      "choose_other_style",
    ]);
    expect(isStyleOnlyClarificationReply("Oui, conserver ce style")).toBe(true);
    expect(isStyleOnlyClarificationReply("Choisir un autre style")).toBe(true);
  });

  it("ordre dîner vs souper (visuel seulement)", () => {
    const lunch = buildRestaurantStyleClarification("lunch");
    const dinner = buildRestaurantStyleClarification("dinner");
    expect(lunch.options[0]?.id).toBe("fast");
    expect(dinner.options.map((o) => o.id).indexOf("romantic")).toBeLessThan(
      dinner.options.map((o) => o.id).indexOf("fast"),
    );
  });

  it("prompt versionné meal-scoped", () => {
    expect(TRIP_ASSISTANT_PROMPT_VERSION).toBe(
      "trip-assistant-v5-meal-scoped-style",
    );
  });
});
