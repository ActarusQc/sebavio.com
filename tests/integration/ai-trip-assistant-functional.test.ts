/**
 * Validation fonctionnelle IA — provider mock, voyage MTL→Gaspé.
 * Aucun appel OpenAI payant.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.AI_PROVIDER = "mock";
process.env.AI_ENABLED = "true";
process.env.OPENAI_API_KEY = "sk-mock-validation-not-a-real-key";
process.env.OPENAI_MODEL = "mock-model";

import { prisma } from "@/lib/prisma";
import { MockAiProvider, setAiProviderForTests } from "@/services/ai";
import { tripAssistantResponseSchema } from "@/features/ai/schemas/response";
import { runTripAssistant } from "@/features/ai/services/trip-assistant";
import { applyProposedTripAction } from "@/features/ai/services/apply-action";
import { getTripById, deleteStop } from "@/features/trips/services/trips";
import { estimateTripFuel } from "@/features/fuel/services/estimate";
import { countRouteStopsByKind } from "@/features/trips/lib/stop-counts";
import { resolveUserAccess } from "@/features/subscriptions/services/access-resolve";

const GASPE_TRIP_ID =
  process.env.E2E_GASPE_TRIP_ID ?? "915d87de-2cc5-4c9d-b20f-2e4524bca537";

type Snap = {
  distanceKm: string | null;
  durationMin: number | null;
  totalDurationMin: number | null;
  departureDate: string;
  destination: string;
  stopCount: number;
  activityStopCount: number;
  restStopCount: number;
  fuelRefuelStops: number;
  litersNeeded: string | null;
  estimatedCost: string | null;
  stops: Array<{
    id: string;
    name: string;
    type: string;
    dir: string;
    dur: number;
  }>;
};

const createdStopIds: string[] = [];
let userId = "";
let tripId = "";
const report: Record<string, unknown> = {};

async function snap(label: string): Promise<Snap> {
  const trip = await getTripById(userId, tripId);
  const counts = countRouteStopsByKind(trip.stops);
  let fuelRefuelStops = 0;
  let litersNeeded: string | null = null;
  let estimatedCost: string | null = null;
  try {
    const est = await estimateTripFuel(userId, tripId, {
      includeReturnTrip: Boolean(trip.returnDate),
    });
    fuelRefuelStops =
      (est.calculation?.outbound?.refuelStops?.length ?? 0) +
      (est.calculation?.returnLeg?.refuelStops?.length ?? 0);
    litersNeeded = est.litersNeeded;
    estimatedCost = est.estimatedCost;
  } catch (e) {
    report[`${label}_fuel_error`] = e instanceof Error ? e.message : String(e);
  }
  const s: Snap = {
    distanceKm: trip.route?.distanceKm ?? null,
    durationMin: trip.route?.estimatedDurationMin ?? null,
    totalDurationMin: trip.totalDurationMin,
    departureDate: trip.departureDate,
    destination: trip.destination,
    stopCount: trip.stops.length,
    activityStopCount: counts.activityStopCount,
    restStopCount: trip.stops.filter((x) => x.stopType === "rest").length,
    fuelRefuelStops,
    litersNeeded,
    estimatedCost,
    stops: trip.stops.map((x) => ({
      id: x.id,
      name: x.name,
      type: x.stopType,
      dir: x.direction,
      dur: x.durationMinutes,
    })),
  };
  report[label] = s;
  return s;
}

describe("Validation fonctionnelle AI trip assistant (mock)", () => {
  beforeAll(async () => {
    setAiProviderForTests(new MockAiProvider());
    const trip = await prisma.trip.findFirst({
      where: { id: GASPE_TRIP_ID, deletedAt: null },
      include: { vehicle: true },
    });
    if (!trip) {
      throw new Error(`Voyage Gaspé introuvable: ${GASPE_TRIP_ID}`);
    }
    userId = trip.userId;
    tripId = trip.id;

    if (
      trip.vehicle.customConsumptionL100 == null &&
      trip.vehicle.realAvgConsumption == null
    ) {
      await prisma.userVehicle.update({
        where: { id: trip.vehicleId },
        data: { customConsumptionL100: 12.5 },
      });
    }
    if (trip.vehicle.tankCapacityOverride == null) {
      await prisma.userVehicle.update({
        where: { id: trip.vehicleId },
        data: {
          tankCapacityOverride: 80,
          tankCapacitySource: "user_manual",
        },
      });
    }

    report.scenario = {
      tripId,
      userId,
      title: trip.title,
      origin: trip.origin,
      destination: trip.destination,
      provider: "mock",
      fakeKeyOnly: true,
    };
  }, 60_000);

  afterAll(async () => {
    // Nettoyage des stops de validation IA
    for (const id of createdStopIds) {
      try {
        await deleteStop(userId, tripId, id);
      } catch {
        /* best-effort */
      }
    }
    const fs = await import("node:fs/promises");
    await fs.writeFile(
      "/tmp/ai-trip-assistant-validation-report.json",
      JSON.stringify(report, null, 2),
      "utf8",
    );
    console.log(
      "\n[AI VALIDATION REPORT written to /tmp/ai-trip-assistant-validation-report.json]",
    );
    setAiProviderForTests(null);
    await prisma.$disconnect();
  }, 120_000);

  it("état initial + analyse sans mutation", async () => {
    const before = await snap("before_analyze");
    expect(before.destination.toLowerCase()).toMatch(/richmond|gasp/);

    const analyze = await runTripAssistant({
      userId,
      raw: {
        tripId,
        message: "Analyse mon voyage de façon structurée",
        requestType: "analyze",
      },
    });
    expect(analyze.ok).toBe(true);
    if (analyze.ok) {
      expect(tripAssistantResponseSchema.parse(analyze.response).status).toBe(
        "ok",
      );
      expect(["personalized", "demo"]).toContain(analyze.mode);
    }

    const after = await snap("after_analyze");
    expect(after.distanceKm).toBe(before.distanceKm);
    expect(after.stopCount).toBe(before.stopCount);
    expect(after.fuelRefuelStops).toBe(before.fuelRefuelStops);

    const conv = await prisma.aiConversation.findUnique({
      where: { userId_tripId: { userId, tripId } },
      include: { messages: true },
    });
    if (analyze.ok && analyze.mode === "personalized") {
      expect(conv?.messages.length).toBeGreaterThanOrEqual(2);
      const usage = await prisma.aiUsage.findFirst({
        where: { userId, tripId, requestType: "analyze", success: true },
        orderBy: { createdAt: "desc" },
      });
      expect(usage).toBeTruthy();
      expect(usage?.model).toBeTruthy();
    }
  }, 180_000);

  it("ajoute une activité intermédiaire sans perdre les arrêts carburant", async () => {
    const before = await snap("before_activity");

    const denied = await applyProposedTripAction({
      userId,
      tripId,
      action: {
        type: "add_activity",
        title: "IA Validation — Musée du Fjord",
        durationMinutes: 60,
        direction: "outbound",
        latitude: 48.4268,
        longitude: -71.0687,
        address: "Saguenay, QC",
      },
      confirm: false,
    });
    expect(denied.ok).toBe(false);

    const applied = await applyProposedTripAction({
      userId,
      tripId,
      action: {
        type: "add_activity",
        title: "IA Validation — Musée du Fjord",
        description: "Étape intermédiaire aller",
        durationMinutes: 60,
        direction: "outbound",
        latitude: 48.4268,
        longitude: -71.0687,
        address: "Saguenay, QC",
      },
      confirm: true,
    });
    expect(applied.ok).toBe(true);
    if (applied.ok) expect(applied.applied).toBe(true);

    const after = await snap("after_activity");
    expect(after.destination).toBe(before.destination);
    expect(after.activityStopCount).toBe(before.activityStopCount + 1);

    const activity = after.stops.find((s) =>
      s.name.includes("IA Validation — Musée du Fjord"),
    );
    expect(activity).toBeTruthy();
    expect(activity?.type).toBe("activity");
    expect(activity?.dir).toBe("outbound");
    expect(activity?.dur).toBe(60);
    if (activity) createdStopIds.push(activity.id);

    // Destination inchangée ; activité ≠ destination
    expect(after.destination.toLowerCase()).not.toContain("fjord");

    // Fuel stops : ne doivent pas disparaître s'ils existaient
    if (before.fuelRefuelStops > 0) {
      expect(after.fuelRefuelStops).toBeGreaterThan(0);
    }

    // Insertion intermédiaire : ne doit pas doubler le trajet (ancien bug fin de liste)
    const beforeKm = Number(before.distanceKm);
    const afterKm = Number(after.distanceKm);
    if (Number.isFinite(beforeKm) && beforeKm > 0 && Number.isFinite(afterKm)) {
      expect(afterKm).toBeLessThan(beforeKm * 1.5);
    }

    const returnBefore = before.stops.filter((s) => s.dir === "return").length;
    const returnAfter = after.stops.filter((s) => s.dir === "return").length;
    expect(returnAfter).toBe(returnBefore);

    // Relecture réelle
    const reloaded = await getTripById(userId, tripId);
    expect(reloaded.stops.some((s) => s.name.includes("Musée du Fjord"))).toBe(
      true,
    );
  }, 300_000);

  it("ajoute une pause sans remplacer activité ni fuel", async () => {
    const before = await snap("before_pause");
    const applied = await applyProposedTripAction({
      userId,
      tripId,
      action: {
        type: "add_pause",
        title: "IA Validation — Pause Rimouski",
        durationMinutes: 20,
        direction: "outbound",
        latitude: 48.4488,
        longitude: -68.524,
        address: "Rimouski, QC",
      },
      confirm: true,
    });
    expect(applied.ok).toBe(true);

    const after = await snap("after_pause");
    expect(after.restStopCount).toBe(before.restStopCount + 1);
    expect(after.activityStopCount).toBe(before.activityStopCount);
    expect(after.destination).toBe(before.destination);
    const pause = after.stops.find((s) =>
      s.name.includes("IA Validation — Pause Rimouski"),
    );
    expect(pause?.type).toBe("rest");
    expect(pause?.dir).toBe("outbound");
    if (pause) createdStopIds.push(pause.id);

    if (before.fuelRefuelStops > 0) {
      expect(after.fuelRefuelStops).toBeGreaterThan(0);
    }
  }, 300_000);

  it("modifie la durée d'une activité ciblée", async () => {
    const before = await snap("before_duration");
    const target = before.stops.find((s) =>
      s.name.includes("IA Validation — Musée du Fjord"),
    );
    expect(target).toBeTruthy();
    if (!target) return;

    const applied = await applyProposedTripAction({
      userId,
      tripId,
      action: {
        type: "update_activity_duration",
        stopId: target.id,
        durationMinutes: 90,
        previousDurationMinutes: target.dur,
        stopName: target.name,
      },
      confirm: true,
    });
    expect(applied.ok).toBe(true);

    const after = await snap("after_duration");
    const updated = after.stops.find((s) => s.id === target.id);
    expect(updated?.dur).toBe(90);
    expect(after.activityStopCount).toBe(before.activityStopCount);
    if (before.fuelRefuelStops > 0) {
      expect(after.fuelRefuelStops).toBeGreaterThan(0);
    }
  }, 300_000);

  it("modifie l'heure de départ sans changer la destination", async () => {
    const before = await snap("before_departure");
    const current = new Date(before.departureDate);
    const next = new Date(current.getTime() + 2 * 60 * 60 * 1000);

    const applied = await applyProposedTripAction({
      userId,
      tripId,
      action: {
        type: "update_departure_time",
        departureDate: next.toISOString(),
        previousDepartureDate: before.departureDate,
      },
      confirm: true,
    });
    expect(applied.ok).toBe(true);

    const after = await snap("after_departure");
    expect(after.departureDate).not.toBe(before.departureDate);
    expect(after.destination).toBe(before.destination);
    // Restaurer le départ d'origine
    await applyProposedTripAction({
      userId,
      tripId,
      action: {
        type: "update_departure_time",
        departureDate: before.departureDate,
        previousDepartureDate: after.departureDate,
      },
      confirm: true,
    });
  }, 300_000);

  it("détour : proposition sans écriture", async () => {
    const before = await snap("before_detour");
    const result = await applyProposedTripAction({
      userId,
      tripId,
      action: {
        type: "create_detour",
        title: "Via Charlevoix",
        description: "Détour scenic",
        applicableInV1: false,
      },
      confirm: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.applied).toBe(false);
      expect("deferred" in result && result.deferred).toBe(true);
    }
    const after = await snap("after_detour");
    expect(after.stopCount).toBe(before.stopCount);
  }, 180_000);

  it("sécurité : non-propriétaire, inexistant, message long", async () => {
    const other = await prisma.user.findFirst({
      where: { id: { not: userId }, deletedAt: null },
      select: { id: true },
    });
    expect(other).toBeTruthy();
    if (other) {
      const stolen = await runTripAssistant({
        userId: other.id,
        raw: { tripId, message: "Hack", requestType: "chat" },
      });
      expect(stolen.ok).toBe(false);
      if (!stolen.ok) expect(stolen.code).toBe("TRIP_001");

      const cross = await applyProposedTripAction({
        userId: other.id,
        tripId,
        action: {
          type: "add_pause",
          title: "Hack pause",
          durationMinutes: 10,
        },
        confirm: true,
      });
      expect(cross.ok).toBe(false);
    }

    const missing = await runTripAssistant({
      userId,
      raw: {
        tripId: "00000000-0000-4000-8000-000000000099",
        message: "Hello",
        requestType: "chat",
      },
    });
    expect(missing.ok).toBe(false);

    const tooLong = await runTripAssistant({
      userId,
      raw: {
        tripId,
        message: "x".repeat(5000),
        requestType: "chat",
      },
    });
    expect(tooLong.ok).toBe(false);
  }, 60_000);

  it("forfaits : entitlements sans hardcode de slugs dans les actions", async () => {
    const access = await resolveUserAccess(userId);
    report.ownerAccess = {
      level: access.level,
      planSlug: access.planSlug,
      planning: access.entitlements.find((e) => e.key === "ai.planning.enabled")
        ?.enabled,
      recommendations: access.entitlements.find(
        (e) => e.key === "ai.recommendations.enabled",
      )?.enabled,
    };
    // Les clés métier sont des entitlements, pas des noms Stripe
    expect(
      access.entitlements.some((e) => e.key === "ai.planning.enabled"),
    ).toBe(true);

    // Découverte : user seed
    const free = await prisma.user.findFirst({
      where: { email: "user@sebavio.local", deletedAt: null },
    });
    if (free) {
      const freeAccess = await resolveUserAccess(free.id);
      report.freeAccess = {
        level: freeAccess.level,
        planning: freeAccess.entitlements.find(
          (e) => e.key === "ai.planning.enabled",
        )?.enabled,
      };
    }
  }, 30_000);
});
