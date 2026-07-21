import { describe, expect, it } from "vitest";
import { routeTripAssistantRequest } from "@/features/ai/services/intent-router";
import { computeRouteMidpointForTests } from "@/features/ai/services/route-search-context";
import {
  citationsToAiSources,
  extractCitationsFromXaiResponse,
} from "@/features/ai/services/extract-citations";
import { isSafeHttpsUrl } from "@/features/ai/lib/safe-urls";
import { enforceMichelinVerification } from "@/features/ai/services/verify-claims";
import type { TripAssistantResponse } from "@/features/ai/schemas/response";

describe("routeTripAssistantRequest", () => {
  it("analyse → pas de Web", () => {
    const r = routeTripAssistantRequest({
      message: "Analyse mon voyage",
      requestType: "analyze",
    });
    expect(r.knowledgeMode).toBe("trip_context");
    expect(r.intent).toBe("trip_analysis");
  });

  it("carburant → pas de Web", () => {
    const r = routeTripAssistantRequest({
      message: "Explique mon carburant",
      requestType: "fuel",
    });
    expect(r.knowledgeMode).toBe("trip_context");
    expect(r.intent).toBe("fuel_explanation");
  });

  it("météo → contexte interne", () => {
    const r = routeTripAssistantRequest({
      message: "Quelle météo sur mon trajet ?",
      requestType: "weather",
    });
    expect(r.knowledgeMode).toBe("trip_context");
  });

  it("restaurant à mi-parcours → Web", () => {
    const r = routeTripAssistantRequest({
      message:
        "Quel restaurant haut de gamme me suggères-tu à mi-parcours entre Saint-Mathias et Gaspé ?",
      requestType: "chat",
    });
    expect(r.intent).toBe("restaurant_search");
    expect(r.knowledgeMode).toBe("web_grounded");
    expect(r.requiresRecommendationsEntitlement).toBe(true);
  });

  it("hôtel près de l’arrivée → Web", () => {
    const r = routeTripAssistantRequest({
      message: "Quel hôtel près de mon arrivée ?",
      requestType: "chat",
    });
    expect(r.intent).toBe("lodging_search");
    expect(r.knowledgeMode).toBe("web_grounded");
  });

  it("activité touristique → Web", () => {
    const r = routeTripAssistantRequest({
      message: "Quel musée visiter en chemin ?",
      requestType: "chat",
    });
    expect(r.knowledgeMode).toBe("web_grounded");
  });

  it("activité déjà enregistrée → contexte", () => {
    const r = routeTripAssistantRequest({
      message: "Parle-moi de mon activité déjà enregistrée",
      requestType: "chat",
      hasExistingActivitiesInContext: true,
    });
    expect(r.knowledgeMode).toBe("trip_context");
  });
});

describe("computeRouteMidpointForTests", () => {
  it("place le point à 50 % de la distance routière", () => {
    // Points espacés ~111 km (1° lat) — total ≈ 222 km, milieu ≈ 2e point
    const path = [
      { lat: 45, lng: -73 },
      { lat: 46, lng: -73 },
      { lat: 47, lng: -73 },
    ];
    const mid = computeRouteMidpointForTests({
      path,
      totalDistanceKm: 222,
    });
    expect(mid).toBeTruthy();
    expect(mid!.routeDistanceFromOriginKm).toBeCloseTo(111, 0);
    expect(mid!.latitude).toBeCloseTo(46, 0);
  });

  it("conserve un trajet avec détour (waypoints)", () => {
    const path = [
      { lat: 45.5, lng: -73.2 },
      { lat: 46.0, lng: -72.0 },
      { lat: 47.0, lng: -70.0 },
      { lat: 48.1, lng: -65.9 },
    ];
    const mid = computeRouteMidpointForTests({
      path,
      totalDistanceKm: 800,
    });
    expect(mid).toBeTruthy();
    expect(mid!.routeDistanceFromOriginKm).toBeCloseTo(400, 0);
  });
});

describe("citations et URLs", () => {
  it("extrait et déduplique les citations", () => {
    const raw = extractCitationsFromXaiResponse({
      citations: [
        "https://guide.michelin.com/ca/fr/restaurant/narval",
        {
          url: "https://guide.michelin.com/ca/fr/restaurant/narval",
          title: "Narval",
        },
        { url: "https://example.com/resto", title: "Site" },
      ],
      output: [
        {
          content: [
            {
              annotations: [
                {
                  type: "url_citation",
                  url: "https://example.com/resto",
                  title: "1",
                },
              ],
            },
          ],
        },
      ],
    });
    const sources = citationsToAiSources(raw);
    expect(sources.length).toBe(2);
    expect(sources[0]!.domain).toContain("michelin");
  });

  it("refuse les URL dangereuses", () => {
    expect(isSafeHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpsUrl("http://example.com")).toBe(false);
    expect(isSafeHttpsUrl("https://127.0.0.1/x")).toBe(false);
    expect(isSafeHttpsUrl("https://guide.michelin.com/x")).toBe(true);
  });
});

describe("enforceMichelinVerification", () => {
  const base: TripAssistantResponse = {
    summary: "s",
    answer: "Restaurant avec une étoile Michelin.",
    status: "ok",
    warnings: [],
    suggestions: [],
    missingInformation: [],
    knowledgeMode: "web_grounded",
    webSearchUsed: true,
    sources: [],
    restaurantRecommendations: [
      {
        name: "Test",
        city: "Rimouski",
        shortDescription: "x",
        recommendationReason: "y",
        cuisineType: null,
        priceLevel: "fine_dining",
        distinction: {
          label: "1 étoile Michelin",
          verified: true,
          sourceId: "src-1",
        },
        location: {
          address: null,
          latitude: null,
          longitude: null,
          source: "unverified",
        },
        routeImpact: {
          distanceFromMidpointKm: null,
          estimatedDetourKm: null,
          estimatedDetourMinutes: null,
          locatedBeforeOrAfterMidpoint: "unknown",
        },
        openingStatus: {
          value: "unknown",
          label: "Horaire à confirmer",
          verifiedAt: null,
        },
        reservationRecommended: true,
        verificationRequired: false,
        sourceIds: ["src-1"],
      },
    ],
  };

  it("invalide une distinction sans source Michelin officielle", () => {
    const out = enforceMichelinVerification(base, [
      {
        id: "src-1",
        title: "Blog",
        url: "https://example.com/blog",
        domain: "example.com",
        supportsClaim: null,
        sourceType: "review",
      },
    ]);
    expect(out.restaurantRecommendations![0]!.distinction!.verified).toBe(
      false,
    );
    expect(out.answer).toMatch(/n’a pas pu être confirmée/i);
  });
});
