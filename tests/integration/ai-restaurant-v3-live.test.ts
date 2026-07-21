/**
 * Validation contrôlée v3 — max 3 appels (1 clarification locale + 2 xAI).
 * Usage : npx vitest run tests/integration/ai-restaurant-v3-live.test.ts
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { prisma } from "@/lib/prisma";
import { runTripAssistant } from "@/features/ai/services/trip-assistant";
import { getAiRuntimeConfig } from "@/services/ai/config";

const GASPE_TRIP_ID =
  process.env.E2E_GASPE_TRIP_ID ?? "915d87de-2cc5-4c9d-b20f-2e4524bca537";

const report: Record<string, unknown> = {
  startedAt: new Date().toISOString(),
};

const ANGLICISM_RE = /\boutbound\b|\bfood\b|fuel\s*stop|\bETA\b/i;

describe("Validation live v3 — restaurants FR", () => {
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
      "/tmp/ai-restaurant-v3-live-report.json",
      JSON.stringify(report, null, 2),
    );
    console.log("\n[REPORT]", "/tmp/ai-restaurant-v3-live-report.json");
    await prisma.$disconnect();
  });

  it("1) sans style → clarification locale", async () => {
    const result = await runTripAssistant({
      userId,
      raw: {
        tripId,
        requestType: "chat",
        message:
          "Je quitte pour mon voyage à 7 h. Je veux arrêter manger à midi. Que me suggères-tu comme restaurant?",
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.clarification?.required).toBe(true);
    expect(result.response.clarification?.options).toHaveLength(5);
    expect(result.response.restaurantRecommendations ?? []).toHaveLength(0);
    expect(ANGLICISM_RE.test(result.response.answer)).toBe(false);
    report.step1 = {
      clarification: true,
      answer: result.response.answer,
      model: result.model,
    };
  }, 60_000);

  it("2) familial → restaurants concrets", async () => {
    const result = await runTripAssistant({
      userId,
      raw: {
        tripId,
        requestType: "chat",
        message:
          "Restaurant familial et décontracté. Départ à 7 h, repas à midi.",
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.webSearchUsed).toBe(true);
    expect(ANGLICISM_RE.test(result.response.answer)).toBe(false);
    const recs = result.response.restaurantRecommendations ?? [];
    expect(
      recs.some(
        (r) =>
          r.openingStatus.value === "closed" ||
          r.openingStatus.value === "likely_closed",
      ),
    ).toBe(false);
    report.step2 = {
      webSearchUsed: result.response.webSearchUsed,
      answerPreview: result.response.answer.slice(0, 400),
      restaurants: recs.map((r) => ({
        name: r.name,
        city: r.city,
        opening: r.openingStatus.value,
        detour: r.routeImpact.estimatedDetourMinutes,
      })),
      sources: result.response.sources.slice(0, 5).map((s) => s.domain),
    };
  }, 300_000);

  it("3) haut de gamme → restaurants + sources", async () => {
    const result = await runTripAssistant({
      userId,
      raw: {
        tripId,
        requestType: "chat",
        message: "Restaurant haut de gamme pour le midi, départ à 7 h.",
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.webSearchUsed).toBe(true);
    expect(ANGLICISM_RE.test(result.response.answer)).toBe(false);
    const recs = result.response.restaurantRecommendations ?? [];
    expect(
      recs.some(
        (r) =>
          r.openingStatus.value === "closed" ||
          r.openingStatus.value === "likely_closed",
      ),
    ).toBe(false);
    const stopsAfter = await prisma.tripStop.count({ where: { tripId } });
    expect(stopsAfter).toBe(stopCountBefore);
    report.step3 = {
      webSearchUsed: result.response.webSearchUsed,
      answerPreview: result.response.answer.slice(0, 400),
      restaurants: recs.map((r) => ({
        name: r.name,
        city: r.city,
        opening: r.openingStatus.value,
        detour: r.routeImpact.estimatedDetourMinutes,
      })),
      sources: result.response.sources.slice(0, 5).map((s) => s.domain),
    };
    report.stopsUnchanged = true;
    report.ok = true;
  }, 300_000);
});
