import { describe, expect, it } from "vitest";
import {
  applySafeLinguisticNormalization,
  findForbiddenAnglicisms,
  normalizeFrenchAnglicisms,
} from "@/features/ai/lib/linguistic";
import {
  detectRestaurantStyle,
  buildRestaurantStyleClarification,
  isRestaurantMealRequest,
} from "@/features/ai/lib/restaurant-preferences";
import {
  parseDepartureClockTime,
  parseMealClockTime,
} from "@/features/ai/services/resolve-position-at-time";
import {
  buildRestaurantClarificationResponse,
  filterOpenRestaurantRecommendations,
} from "@/features/ai/services/restaurant-flow";
import { buildPendingRestaurantRequest } from "@/features/ai/lib/pending-assistant-request";
import {
  resolveDepartureTiming,
  resolveMealTiming,
} from "@/features/ai/lib/meal-timing";
import { formatLocalClock } from "@/features/ai/lib/meal-timing";
import { routeTripAssistantRequest } from "@/features/ai/services/intent-router";
import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import { tripAssistantResponseSchema } from "@/features/ai/schemas/response";

describe("français — anglicismes", () => {
  it("normalise outbound / food / fuel stop / ETA / current location", () => {
    const raw =
      "Sur le trajet outbound, activités food près du fuel stop. ETA 12h. current location inconnue.";
    const out = normalizeFrenchAnglicisms(raw);
    expect(out).toContain("trajet aller");
    expect(out).toContain("restauration");
    expect(out).toMatch(/arr[êe]ts? de ravitaillement/);
    expect(out).toContain("heure d’arrivée estimée");
    expect(out).toContain("position actuelle");
    expect(out.toLowerCase()).not.toMatch(/\boutbound\b/);
    expect(out.toLowerCase()).not.toMatch(/\bfuel\s*stop\b/);
  });

  it("détecte les anglicismes interdits", () => {
    const issues = findForbiddenAnglicisms("activités food et outbound");
    expect(issues.map((i) => i.code)).toEqual(
      expect.arrayContaining(["food", "outbound"]),
    );
  });

  it("conserve le nom propre d’un restaurant anglais", () => {
    const response = applySafeLinguisticNormalization({
      summary: "Choix near outbound",
      answer: "Je suggère The Green Spot près du trajet outbound.",
      warnings: [],
      suggestions: [],
      restaurantRecommendations: [
        {
          name: "The Green Spot",
          shortDescription: "Bon food casual",
          recommendationReason: "Près du trajet outbound",
        },
      ],
    });
    expect(response.restaurantRecommendations![0]!.name).toBe("The Green Spot");
    expect(response.answer).toContain("trajet aller");
    expect(response.restaurantRecommendations![0]!.shortDescription).toContain(
      "restauration",
    );
  });
});

describe("clarification restaurant", () => {
  it("détecte une demande de repas", () => {
    expect(
      isRestaurantMealRequest(
        "Je quitte à 7 h. Je veux arrêter manger à midi. Que me suggères-tu comme restaurant?",
      ),
    ).toBe(true);
  });

  it("exige clarification sans style", () => {
    const style = detectRestaurantStyle(
      "Je quitte à 7 h. Je veux manger à midi. Restaurant?",
    );
    expect(style).toBeNull();
    const clar = buildRestaurantStyleClarification();
    expect(clar.required).toBe(true);
    expect(clar.options).toHaveLength(5);
    const pending = buildPendingRestaurantRequest({
      tripId: "00000000-0000-4000-8000-000000000002",
      originalMessage:
        "Je compte partir à 6 h. Je voudrais dîner à midi. Restaurant?",
      departureHour: 6,
      departureMinute: 0,
      mealType: "lunch",
      targetHour: 12,
      targetMinute: 0,
    });
    const response = buildRestaurantClarificationResponse(pending);
    expect(response.clarification?.required).toBe(true);
    expect(response.answer).not.toContain(
      "Quel type de restaurant préférez-vous",
    );
    expect(response.clarification?.question).toContain(
      "Quel type de restaurant",
    );
    expect(response.pendingRequest?.originalMessage).toContain("6 h");
    expect(response.restaurantRecommendations).toHaveLength(0);
    expect(() => tripAssistantResponseSchema.parse(response)).not.toThrow();
  });

  it("détecte familial / aucune préférence / peu importe", () => {
    expect(detectRestaurantStyle("Restaurant familial.")).toBe("family");
    expect(detectRestaurantStyle("Aucune préférence")).toBe("any");
    expect(detectRestaurantStyle("peu importe")).toBe("any");
  });

  it("route vers restaurant_recommendation", () => {
    const r = routeTripAssistantRequest({
      message: "Que me suggères-tu comme restaurant à midi?",
      requestType: "chat",
    });
    expect(r.intent).toBe("restaurant_recommendation");
    expect(r.knowledgeMode).toBe("web_grounded");
  });
});

describe("horaires départ / repas", () => {
  it("parse départ 7 h et repas midi", () => {
    const msg =
      "Je quitte pour mon voyage à 7 h. Je veux arrêter manger à midi.";
    expect(parseDepartureClockTime(msg)).toEqual({ hour: 7, minute: 0 });
    expect(parseMealClockTime(msg)).toEqual({ hour: 12, minute: 0 });
  });

  it("parse souper comme soir", () => {
    expect(parseMealClockTime("Où souper ce soir?")).toEqual({
      hour: 18,
      minute: 30,
    });
  });
});

describe("dîner québécois et horaires", () => {
  it("dîner à midi = lunch 12 h, pas souper", () => {
    const meal = resolveMealTiming(
      "Je compte partir à 6 h. Je voudrais dîner à midi.",
    );
    expect(meal?.mealType).toBe("lunch");
    expect(meal?.targetHour).toBe(12);
    const dep = resolveDepartureTiming(
      "Je compte partir à 6 h. Je voudrais dîner à midi.",
    );
    expect(dep?.hour).toBe(6);
  });

  it("n’affiche pas d’ISO brut", () => {
    expect(formatLocalClock("2026-07-23T16:00:00.000Z")).not.toMatch(/T|Z/);
    expect(formatLocalClock("12 h 05")).toBe("12 h 05");
  });
});

describe("filtrage restaurants fermés", () => {
  const baseRec = {
    name: "Chez Test",
    city: "Rimouski",
    shortDescription: "x",
    recommendationReason: "y",
    cuisineType: null,
    priceLevel: "moderate" as const,
    distinction: null,
    location: {
      address: null,
      latitude: null,
      longitude: null,
      source: "unverified" as const,
    },
    routeImpact: {
      distanceFromMidpointKm: null,
      estimatedDetourKm: null,
      estimatedDetourMinutes: null,
      locatedBeforeOrAfterMidpoint: "unknown" as const,
    },
    reservationRecommended: false,
    verificationRequired: true,
    sourceIds: [],
  };

  it("exclut closed / likely_closed de la liste principale", () => {
    const response: TripAssistantResponse = {
      summary: "s",
      answer: "a",
      status: "ok",
      warnings: [],
      suggestions: [],
      missingInformation: [],
      knowledgeMode: "web_grounded",
      webSearchUsed: true,
      sources: [],
      clarification: null,
      pendingRequest: null,
      restaurantRecommendations: [
        {
          ...baseRec,
          name: "Ouvert",
          openingStatus: {
            value: "verified_open",
            label: "Ouvert",
            verifiedAt: null,
          },
        },
        {
          ...baseRec,
          name: "Fermé midi",
          openingStatus: {
            value: "closed",
            label: "Fermé",
            verifiedAt: null,
          },
        },
        {
          ...baseRec,
          name: "Soir seulement",
          openingStatus: {
            value: "likely_closed",
            label: "Soir",
            verifiedAt: null,
          },
        },
      ],
    };
    const out = filterOpenRestaurantRecommendations(response);
    expect(out.restaurantRecommendations?.map((r) => r.name)).toEqual([
      "Ouvert",
    ]);
  });
});
