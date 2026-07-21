/**
 * Flux restaurant mock — clarification puis recherche simulée (aucun xAI réel).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/features/ai/services/access", () => ({
  resolveTripAssistantAccess: vi.fn(async () => ({
    canUsePersonalizedAi: true,
    canUseRecommendations: true,
    access: { planSlug: "sebavio-plus" },
  })),
  assertTripAssistantEntitlements: vi.fn(async () => undefined),
}));

vi.mock("@/features/ai/services/rate-limit", () => ({
  assertAiRateLimit: vi.fn(async () => undefined),
  acquireAiRequestLock: vi.fn(async () => async () => undefined),
  assertAiWebSearchLimits: vi.fn(async () => undefined),
  recordAiWebSearchConversationUse: vi.fn(async () => undefined),
}));

vi.mock("@/features/trips/services/trips", () => ({
  getOwnedTripOrThrow: vi.fn(async () => ({ id: "trip-1" })),
}));

vi.mock("@/features/ai/services/context-builder", () => ({
  buildTripAssistantContext: vi.fn(async () => ({
    trip: {
      id: "trip-1",
      title: "Gaspé",
      status: "planned",
      origin: "Saint-Mathias-sur-Richelieu",
      destination: "New Richmond",
      departureDate: "2026-07-15T12:00:00.000Z",
      returnDate: null,
      originCity: "Saint-Mathias-sur-Richelieu",
      destinationCity: "New Richmond",
    },
    route: {
      distanceKm: 800,
      estimatedDurationMin: 600,
      returnDistanceKm: null,
      returnEstimatedDurationMin: null,
      estimatedFuelCost: 120,
      isStale: false,
      fuelEstimateStale: false,
      dataKind: "calculated",
    },
    stops: [],
    activities: [],
    vehicle: null,
    fuel: null,
    weather: {
      dataKind: "observed_or_forecast",
      available: false,
      message: null,
      locations: [],
    },
  })),
}));

vi.mock("@/features/ai/services/conversations", () => ({
  getOrCreateConversation: vi.fn(async () => ({ id: "conv-1" })),
  listConversationMessages: vi.fn(async () => ({
    id: "conv-1",
    messages: [],
  })),
  appendConversationMessages: vi.fn(async () => undefined),
}));

vi.mock("@/features/ai/services/usage", () => ({
  recordAiUsage: vi.fn(async () => undefined),
}));

vi.mock("@/services/ai", () => ({
  getAiRuntimeConfig: vi.fn(() => ({
    enabled: true,
    provider: "mock",
    model: "mock",
    webSearchEnabled: true,
    webSearchTimeoutMs: 90_000,
    timeoutMs: 45_000,
    maxMessageChars: 2000,
    routeSearchRadiusKm: 50,
    routeMaxDetourKm: 30,
  })),
  createAiProvider: vi.fn(() => ({
    name: "mock",
    generateTripAssistantResponse: vi.fn(async () => ({
      response: {
        summary: "Secteur estimé",
        answer:
          "Selon votre départ à 7 h, vous devriez être près de Rimouski vers midi. Voici des options familiales.",
        status: "ok",
        warnings: [],
        suggestions: [],
        missingInformation: [],
        analysis: null,
        knowledgeMode: "web_grounded",
        webSearchUsed: true,
        sources: [
          {
            id: "src-1",
            title: "Site",
            url: "https://example.com/resto",
            domain: "example.com",
            supportsClaim: null,
            sourceType: "other",
          },
        ],
        clarification: null,
        restaurantRecommendations: [
          {
            name: "Chez Ouvert",
            city: "Rimouski",
            category: "Familial",
            shortDescription: "Repas assis",
            recommendationReason: "Ouvert à midi, faible détour",
            cuisineType: "Québécoise",
            priceLevel: "moderate",
            distinction: null,
            location: {
              address: "1 rue Test",
              latitude: 48.45,
              longitude: -68.52,
              source: "maps",
            },
            routeImpact: {
              distanceFromMidpointKm: 2,
              estimatedDetourKm: 4,
              estimatedDetourMinutes: 8,
              locatedBeforeOrAfterMidpoint: "near",
            },
            estimatedArrivalTime: "12 h 05",
            estimatedMealDurationMinutes: 60,
            openingStatus: {
              value: "verified_open",
              label: "Ouvert à midi : vérifié",
              verifiedAt: null,
            },
            reservationRecommended: false,
            verificationRequired: false,
            sourceIds: ["src-1"],
          },
          {
            name: "Soirée Seulement",
            city: "Rimouski",
            category: "Familial",
            shortDescription: "Ferme le midi",
            recommendationReason: "Ne pas recommander",
            cuisineType: null,
            priceLevel: "moderate",
            distinction: null,
            location: {
              address: null,
              latitude: 48.46,
              longitude: -68.5,
              source: "web",
            },
            routeImpact: {
              distanceFromMidpointKm: 3,
              estimatedDetourKm: 5,
              estimatedDetourMinutes: 10,
              locatedBeforeOrAfterMidpoint: "near",
            },
            openingStatus: {
              value: "closed",
              label: "Fermé le midi",
              verifiedAt: null,
            },
            reservationRecommended: false,
            verificationRequired: true,
            sourceIds: [],
          },
        ],
      },
      model: "mock",
      inputTokens: 10,
      outputTokens: 20,
      totalTokens: 30,
      webSearchUsed: true,
      webSearchCallCount: 1,
      citationSources: [],
    })),
    analyzeTrip: vi.fn(),
  })),
}));

vi.mock("@/features/ai/services/route-search-context", () => ({
  buildRouteSearchContext: vi.fn(async () => ({
    midpoint: { latitude: 48.4, longitude: -68.5, nearestCity: "Rimouski" },
  })),
}));

vi.mock("@/features/ai/services/resolve-position-at-time", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/ai/services/resolve-position-at-time")
  >("@/features/ai/services/resolve-position-at-time");
  return {
    ...actual,
    resolveTripPositionAtTime: vi.fn(async () => ({
      latitude: 48.45,
      longitude: -68.52,
      nearestCity: "Rimouski",
      estimatedArrivalAtPoint: new Date().toISOString(),
      elapsedDrivingMinutes: 300,
      elapsedStopMinutes: 0,
      confidence: "high",
      routeDistanceFromOriginKm: 450,
    })),
  };
});

vi.mock("@/features/ai/services/search-restaurants-near", () => ({
  RESTAURANT_SEARCH_DEFAULT_RADIUS_KM: 15,
  RESTAURANT_SEARCH_MAX_DETOUR_MINUTES: 20,
  RESTAURANT_SEARCH_TIME_TOLERANCE_MINUTES: 30,
  searchRestaurantsNearPosition: vi.fn(async () => [
    {
      name: "Chez Ouvert",
      address: "1 rue Test",
      city: "Rimouski",
      latitude: 48.45,
      longitude: -68.52,
      rating: 4.5,
      ratingCount: 120,
      priceLevel: "PRICE_LEVEL_MODERATE",
      websiteUrl: "https://example.com/resto",
      googleMapsUrl: null,
      primaryType: "restaurant",
    },
  ]),
}));

vi.mock("@/features/ai/services/enrich-route-impact", () => ({
  enrichRestaurantRouteImpacts: vi.fn(async ({ response }) => response),
}));

import { runTripAssistant } from "@/features/ai/services/trip-assistant";
import { appendConversationMessages } from "@/features/ai/services/conversations";
import { createAiProvider } from "@/services/ai";

describe("flux restaurant mock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("demande clarification sans style — aucun provider", async () => {
    const result = await runTripAssistant({
      userId: "00000000-0000-4000-8000-000000000001",
      raw: {
        tripId: "00000000-0000-4000-8000-000000000002",
        message:
          "Je quitte pour mon voyage à 7 h. Je veux arrêter manger à midi. Que me suggères-tu comme restaurant?",
        requestType: "chat",
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.clarification?.required).toBe(true);
    expect(result.response.clarification?.options).toHaveLength(5);
    expect(result.response.restaurantRecommendations).toHaveLength(0);
    expect(createAiProvider).not.toHaveBeenCalled();
    expect(appendConversationMessages).toHaveBeenCalled();
  });

  it("avec style familial — recherche et exclut fermé", async () => {
    const result = await runTripAssistant({
      userId: "00000000-0000-4000-8000-000000000001",
      raw: {
        tripId: "00000000-0000-4000-8000-000000000002",
        message: "Restaurant familial vers midi, départ à 7 h.",
        requestType: "chat",
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.clarification?.required).not.toBe(true);
    expect(
      result.response.restaurantRecommendations?.map((r) => r.name),
    ).toEqual(["Chez Ouvert"]);
    expect(result.response.answer.toLowerCase()).not.toMatch(/\boutbound\b/);
  });
});
