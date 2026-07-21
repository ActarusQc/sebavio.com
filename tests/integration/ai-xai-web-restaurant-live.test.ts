/**
 * Validation contrôlée — 1 appel Web restaurant mi-parcours.
 * Usage : npx vitest run tests/integration/ai-xai-web-restaurant-live.test.ts
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { prisma } from "@/lib/prisma";
import { runTripAssistant } from "@/features/ai/services/trip-assistant";
import { tripAssistantResponseSchema } from "@/features/ai/schemas/response";
import { getAiRuntimeConfig } from "@/services/ai/config";
import { routeTripAssistantRequest } from "@/features/ai/services/intent-router";
import { buildRouteSearchContext } from "@/features/ai/services/route-search-context";

const GASPE_TRIP_ID =
  process.env.E2E_GASPE_TRIP_ID ?? "915d87de-2cc5-4c9d-b20f-2e4524bca537";

const report: Record<string, unknown> = {
  startedAt: new Date().toISOString(),
};

describe("Validation live — restaurant mi-parcours (1 appel)", () => {
  let userId = "";
  let tripId = "";
  let stopCountBefore = 0;

  beforeAll(async () => {
    const config = getAiRuntimeConfig();
    report.config = {
      provider: config.provider,
      enabled: config.enabled,
      webSearchEnabled: config.webSearchEnabled,
      model: config.model,
      apiKeyPresent: config.apiKeyPresent,
    };
    expect(config.provider).toBe("xai");
    expect(config.enabled).toBe(true);
    expect(config.webSearchEnabled).toBe(true);

    const trip = await prisma.trip.findFirst({
      where: { id: GASPE_TRIP_ID, deletedAt: null },
      select: { id: true, userId: true },
    });
    expect(trip).toBeTruthy();
    userId = trip!.userId;
    tripId = trip!.id;
    stopCountBefore = await prisma.tripStop.count({ where: { tripId } });
  }, 60_000);

  afterAll(async () => {
    writeFileSync(
      "/tmp/xai-web-restaurant-validation-report.json",
      JSON.stringify(report, null, 2),
    );
    console.log(
      "\n[REPORT]",
      JSON.stringify({
        path: "/tmp/xai-web-restaurant-validation-report.json",
        ok: report.ok,
      }),
    );
    await prisma.$disconnect();
  });

  it("route vers web_grounded + point médian routier", async () => {
    const routing = routeTripAssistantRequest({
      message:
        "Quel restaurant haut de gamme me suggères-tu à mi-parcours entre Saint-Mathias-sur-Richelieu et Gaspé?",
      requestType: "chat",
    });
    expect(routing.knowledgeMode).toBe("web_grounded");
    expect(routing.intent).toBe("restaurant_recommendation");

    const config = getAiRuntimeConfig();
    const routeSearch = await buildRouteSearchContext({
      tripId,
      userId,
      searchRadiusKm: config.routeSearchRadiusKm,
      maxDetourKm: config.routeMaxDetourKm,
    });
    expect(routeSearch).toBeTruthy();
    expect(routeSearch!.midpoint.routeDistanceFromOriginKm).toBeCloseTo(
      routeSearch!.totalDistanceKm / 2,
      0,
    );
    report.midpoint = routeSearch!.midpoint;
    report.nearbyCities = routeSearch!.midpoint.nearbyCities;
  }, 120_000);

  it("appel réel restaurant mi-parcours", async () => {
    const result = await runTripAssistant({
      userId,
      raw: {
        tripId,
        message:
          "Quel restaurant haut de gamme me suggères-tu à mi-parcours entre Saint-Mathias-sur-Richelieu et Gaspé?",
        requestType: "chat",
      },
    });

    report.result = {
      ok: result.ok,
      code: result.ok ? null : result.code,
      mode: result.ok ? result.mode : null,
      model: result.ok ? result.model : null,
      webSearchUsed: result.ok ? result.response.webSearchUsed : null,
      knowledgeMode: result.ok ? result.response.knowledgeMode : null,
      sourceCount: result.ok ? result.response.sources.length : 0,
      answerPreview: result.ok ? result.response.answer.slice(0, 280) : null,
      restaurants: result.ok
        ? (result.response.restaurantRecommendations ?? []).map((r) => ({
            name: r.name,
            city: r.city,
            distinction: r.distinction,
            routeImpact: r.routeImpact,
          }))
        : [],
      sources: result.ok
        ? result.response.sources.map((s) => ({
            domain: s.domain,
            title: s.title,
            sourceType: s.sourceType,
          }))
        : [],
    };

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.mode).toBe("personalized");
    expect(tripAssistantResponseSchema.safeParse(result.response).success).toBe(
      true,
    );
    expect(result.response.webSearchUsed).toBe(true);
    expect(result.response.knowledgeMode).toBe("web_grounded");
    expect(result.response.answer.toLowerCase()).not.toMatch(
      /aucune donnée de restaurant/,
    );
    expect(result.response.sources.length).toBeGreaterThan(0);

    const stopCountAfter = await prisma.tripStop.count({ where: { tripId } });
    expect(stopCountAfter).toBe(stopCountBefore);

    const usage = await prisma.aiUsage.findFirst({
      where: { userId, tripId, webSearchUsed: true },
      orderBy: { createdAt: "desc" },
    });
    expect(usage?.provider).toBe("xai");
    expect(usage?.intent).toBe("restaurant_recommendation");

    report.ok = true;
    report.noWriteMutation = true;
  }, 300_000);
});
