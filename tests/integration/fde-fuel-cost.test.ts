import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearFdeMemoryCache,
  resetFdeConfigCache,
  setFdeClientForTests,
} from "@/integrations/fde";
import { AppError } from "@/lib/errors";
import { estimateFuelCost } from "@/features/fuel/services/fuel-cost-estimation";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userVehicle: { findFirst: vi.fn() },
    tripRoute: { update: vi.fn() },
  },
}));

vi.mock("@/lib/redis", () => ({
  getRedis: () => {
    throw new Error("redis mocked unavailable");
  },
}));

vi.mock("@/features/auth/services/session", () => ({
  requireActiveUser: vi.fn(async () => ({ id: "user-1", role: "user" })),
}));

vi.mock("@/features/auth/services/audit", () => ({
  writeAuditLog: vi.fn(async () => undefined),
}));

vi.mock("@/services/fuel-prices/fde/rate-limit", () => ({
  assertFdeRateLimit: vi.fn(async () => undefined),
}));

function mockNearbyClient(price: number) {
  const observedAt = new Date().toISOString();
  setFdeClientForTests({
    findNearbyStations: async () => ({
      data: [
        {
          id: "opaque-station-id",
          stableStationCode: "c1",
          name: "A",
          brand: null,
          addressLine: "x",
          city: "Montréal",
          postalCode: null,
          provinceCode: "QC",
          countryCode: "CA",
          administrativeRegionName: "Montréal",
          latitude: 45.5,
          longitude: -73.5,
          isActive: true,
          prices: [
            {
              fuelType: "regular",
              price,
              currency: "CAD",
              unit: "liter",
              observedAt,
              collectedAt: observedAt,
              freshness: {
                observedAt,
                collectedAt: observedAt,
                ageSeconds: 10,
                ageDays: 0,
                freshnessStatus: "current" as const,
              },
              granularity: "station" as const,
              isCurrent: true as const,
            },
          ],
          lastObservedAt: observedAt,
          freshness: null,
          source: "regie-essence-quebec",
          attribution: {
            source: "Régie de l'énergie du Québec",
            dataset: "d",
            productId: "p",
            license: "l",
            attributionRequired: true as const,
            notice: "notice",
            commercialReviewRequired: true as const,
          },
          granularity: "station" as const,
          distanceKm: 1,
        },
      ],
    }),
    getLatestRegionalPrices: async () => ({ data: [] }),
  } as never);
}

describe("intégration estimation FDE", () => {
  beforeEach(() => {
    vi.stubEnv("FDE_ENABLED", "true");
    vi.stubEnv("FDE_API_KEY", "test-key-not-for-production");
    vi.stubEnv("FDE_BASE_URL", "https://fde.monteregia.com");
    resetFdeConfigCache();
  });

  afterEach(() => {
    setFdeClientForTests(null);
    clearFdeMemoryCache();
    resetFdeConfigCache();
    vi.unstubAllEnvs();
  });

  it("estime avec stations mockées (client → service)", async () => {
    mockNearbyClient(1.72);
    const result = await estimateFuelCost({
      distanceKm: 100,
      consumptionLPer100Km: 10,
      fuelType: "regular",
      tankCapacityL: 50,
      referencePosition: { latitude: 45.5017, longitude: -73.5673 },
      bypassCache: true,
    });
    expect(result.consumedLitres).toBe(10);
    expect(result.estimatedLitres).toBe(0);
    expect(result.estimatedCostCad).toBe(0);
    // Stratégie naïve comparable : aussi 0 achat (plein initial suffit)
    expect(result.naiveCostAtDeparturePrice).toBe(0);
    expect(result.estimatedSavingsVsNaive).toBe(0);
    expect(result.pricingMethod).toBe("selected-station");
    expect(JSON.stringify(result)).not.toMatch(
      /test-key|Authorization|Bearer|FDE_API_KEY/,
    );
  });

  it("fallback régional", async () => {
    const observedAt = "2026-06-22T12:30:00.000Z";
    setFdeClientForTests({
      findNearbyStations: async () => ({ data: [] }),
      getLatestRegionalPrices: async () => ({
        data: [
          {
            id: "r1",
            providerId: "statcan",
            sourceId: "statcan-wds",
            countryCode: "CA",
            subdivisionCode: "QC",
            regionName: "Montréal",
            fuelType: "regular",
            price: 1.971,
            currency: "CAD",
            unit: "liter",
            observedAt,
            collectedAt: observedAt,
            freshness: {
              observedAt,
              collectedAt: observedAt,
              ageSeconds: 1000,
              ageDays: 20,
              freshnessStatus: "current" as const,
            },
            attribution: {
              source: "Statistique Canada",
              dataset: "d",
              productId: "p",
              license: "OGL",
              attributionRequired: true as const,
              notice: "Moyenne régionale",
              commercialReviewRequired: true as const,
            },
          },
        ],
      }),
    } as never);

    const result = await estimateFuelCost({
      distanceKm: 100,
      consumptionLPer100Km: 10,
      fuelType: "regular",
      tankCapacityL: 50,
      referencePosition: { latitude: 45.5, longitude: -73.5 },
      bypassCache: true,
      regionHint: "Montréal",
    });
    expect(result.fallbackUsed).toBe(true);
    expect(result.granularity).toBe("regional");
  });

  it("refuse coordonnées invalides", async () => {
    await expect(
      estimateFuelCost({
        distanceKm: 100,
        consumptionLPer100Km: 10,
        fuelType: "regular",
        referencePosition: { latitude: 200, longitude: -73.5 },
        bypassCache: true,
      }),
    ).rejects.toMatchObject({ code: "FUEL_007", status: 400 });
  });

  it("route API libre → JSON sans secret", async () => {
    mockNearbyClient(1.72);
    const { POST } = await import("@/app/api/v1/fuel/cost/estimate/route");
    const res = await POST(
      new Request("http://localhost:3050/api/v1/fuel/cost/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          distanceKm: 100,
          consumptionLPer100Km: 10,
          fuelType: "regular",
          tankCapacityL: 50,
          referencePosition: { latitude: 45.5017, longitude: -73.5673 },
        }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(JSON.stringify(json)).not.toMatch(
      /test-key|Authorization|Bearer|FDE_API_KEY/,
    );
  });

  it("route API refuse FDE désactivé", async () => {
    vi.stubEnv("FDE_ENABLED", "false");
    resetFdeConfigCache();
    const { POST } = await import("@/app/api/v1/fuel/cost/estimate/route");
    const res = await POST(
      new Request("http://localhost:3050/api/v1/fuel/cost/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          distanceKm: 100,
          consumptionLPer100Km: 10,
          fuelType: "regular",
          tankCapacityL: 50,
          referencePosition: { latitude: 45.5, longitude: -73.5 },
        }),
      }),
    );
    expect(res.status).toBe(503);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("FDE_001");
  });
});

describe("erreurs métier FDE", () => {
  it("codes AppError", () => {
    expect(new AppError("FDE_004", "timeout", 504).status).toBe(504);
    expect(
      new AppError("VEHICLE_FUEL_CONSUMPTION_REQUIRED", "x", 422).code,
    ).toBe("VEHICLE_FUEL_CONSUMPTION_REQUIRED");
  });
});
