/**
 * Scénario 6 h → midi familial — validation live contrôlée (max 2 appels xAI).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { prisma } from "@/lib/prisma";
import { runTripAssistant } from "@/features/ai/services/trip-assistant";
import { getAiRuntimeConfig } from "@/services/ai/config";
import { clearTripAssistantConversation } from "@/features/ai/services/conversations";

const GASPE_TRIP_ID =
  process.env.E2E_GASPE_TRIP_ID ?? "915d87de-2cc5-4c9d-b20f-2e4524bca537";

const report: Record<string, unknown> = { startedAt: new Date().toISOString() };

describe("Live — 6 h départ, dîner midi, familial", () => {
  let userId = "";
  let tripId = "";
  let stopsBefore = 0;

  beforeAll(async () => {
    const config = getAiRuntimeConfig();
    expect(config.provider).toBe("xai");
    expect(config.enabled).toBe(true);
    const trip = await prisma.trip.findFirst({
      where: { id: GASPE_TRIP_ID, deletedAt: null },
      select: { id: true, userId: true },
    });
    expect(trip).toBeTruthy();
    userId = trip!.userId;
    tripId = trip!.id;
    await clearTripAssistantConversation(userId, tripId);
    stopsBefore = await prisma.tripStop.count({ where: { tripId } });
  }, 60_000);

  afterAll(async () => {
    writeFileSync(
      "/tmp/ai-restaurant-6h-midi-report.json",
      JSON.stringify(report, null, 2),
    );
    console.log("\n[REPORT]", "/tmp/ai-restaurant-6h-midi-report.json");
    await prisma.$disconnect();
  });

  it("clarification une fois + reprise auto sans Québec/Lévis derrière", async () => {
    const q1 = await runTripAssistant({
      userId,
      raw: {
        tripId,
        requestType: "chat",
        message:
          "Je compte partir à 6 h. Je voudrais dîner à midi. Que me suggères-tu comme restaurant? À quel endroit devrais-je être rendu à cette heure?",
      },
    });
    expect(q1.ok).toBe(true);
    if (!q1.ok) return;
    expect(q1.response.clarification?.required).toBe(true);
    expect(q1.response.pendingRequest?.departureHour).toBe(6);
    expect(q1.response.pendingRequest?.targetHour).toBe(12);
    const joined = `${q1.response.answer}\n${q1.response.clarification?.question}`;
    expect(
      joined.split("Quel type de restaurant préférez-vous").length - 1,
    ).toBe(1);

    const q2 = await runTripAssistant({
      userId,
      raw: {
        tripId,
        requestType: "chat",
        message: "Familial et décontracté",
      },
    });
    expect(q2.ok).toBe(true);
    if (!q2.ok) return;
    expect(q2.response.clarification?.required).not.toBe(true);
    expect(q2.response.answer.toLowerCase()).not.toMatch(
      /je note votre préférence/,
    );
    const recs = q2.response.restaurantRecommendations ?? [];
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.length).toBeLessThanOrEqual(3);
    // Places et/ou web_search — au moins une source de recherche
    expect(q2.response.webSearchUsed || recs.length > 0).toBe(true);

    report.step2 = {
      webSearchUsed: q2.response.webSearchUsed,
      answerPreview: q2.response.answer.slice(0, 500),
      restaurants: recs.map((r) => ({
        name: r.name,
        city: r.city,
        arrival: r.estimatedArrivalTime,
        detour: r.routeImpact.estimatedDetourMinutes,
      })),
    };

    for (const r of recs) {
      expect(String(r.estimatedArrivalTime ?? "")).not.toMatch(/T\d{2}:|Z$/);
      const city = r.city.toLowerCase();
      // Trois-Pistoles secteur : Québec/Lévis ne doivent pas être le choix
      expect(["québec", "quebec", "lévis", "levis"]).not.toContain(city);
    }

    const stopsAfter = await prisma.tripStop.count({ where: { tripId } });
    expect(stopsAfter).toBe(stopsBefore);
    report.ok = true;
    report.stopsUnchanged = true;
  }, 360_000);
});
