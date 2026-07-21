import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearFdeMemoryCache,
  loadFdeConfig,
  resetFdeConfigCache,
  resetFdeMetrics,
  setFdeClientForTests,
} from "@/integrations/fde";
import {
  mapSebavioFuelToFde,
  median,
  selectReferencePrice,
  isPriceFreshEnough,
} from "@/services/fuel-prices/fde";
import { estimateTripFuelCost } from "@/features/fuel/lib/consumption";
import { estimateFuelCost } from "@/features/fuel/services/fuel-cost-estimation";
import { AppError } from "@/lib/errors";
import { FdeFuelPricesUnauthorizedError } from "@/integrations/fde";

describe("mapSebavioFuelToFde", () => {
  it("mappe essence ordinaire → regular", () => {
    expect(mapSebavioFuelToFde("Gasoline")).toEqual({
      kind: "mapped",
      fdeFuelType: "regular",
    });
    expect(mapSebavioFuelToFde("regular").kind).toBe("mapped");
  });

  it("mappe premium / super → premium", () => {
    expect(mapSebavioFuelToFde("premium")).toEqual({
      kind: "mapped",
      fdeFuelType: "premium",
    });
    expect(mapSebavioFuelToFde("super")).toEqual({
      kind: "mapped",
      fdeFuelType: "premium",
    });
  });

  it("mappe diesel → diesel", () => {
    expect(mapSebavioFuelToFde("Diesel")).toEqual({
      kind: "mapped",
      fdeFuelType: "diesel",
    });
  });

  it("hybride → regular (thermique)", () => {
    expect(mapSebavioFuelToFde("Hybrid")).toEqual({
      kind: "mapped",
      fdeFuelType: "regular",
    });
  });

  it("électrique → not_applicable", () => {
    expect(mapSebavioFuelToFde("Electric").kind).toBe("not_applicable");
    expect(mapSebavioFuelToFde("PHEV").kind).toBe("not_applicable");
  });

  it("propane / E85 → unsupported", () => {
    expect(mapSebavioFuelToFde("Propane").kind).toBe("unsupported");
    expect(mapSebavioFuelToFde("E85").kind).toBe("unsupported");
  });
});

describe("median / selectReferencePrice", () => {
  it("médiane impair", () => {
    expect(median([1.5, 1.7, 1.9])).toBe(1.7);
  });

  it("médiane pair", () => {
    expect(median([1.6, 1.8])).toBe(1.7);
  });

  it("plusieurs stations → médiane (pas le min)", () => {
    const r = selectReferencePrice([1.2, 1.7, 1.8, 1.9, 2.5]);
    expect(r?.pricingMethod).toBe("nearby-station-median");
    expect(r?.priceCadPerLitre).toBe(1.8);
    expect(r?.priceCadPerLitre).not.toBe(1.2);
  });

  it("une station → selected-station + lowCoverage", () => {
    const r = selectReferencePrice([1.72]);
    expect(r?.pricingMethod).toBe("selected-station");
    expect(r?.lowCoverage).toBe(true);
    expect(r?.stationCount).toBe(1);
  });

  it("aucune station → null", () => {
    expect(selectReferencePrice([])).toBeNull();
  });

  it("ignore valeurs extrêmes invalides", () => {
    expect(selectReferencePrice([-1, 0, 99, 1.7])?.priceCadPerLitre).toBe(1.7);
  });
});

describe("isPriceFreshEnough", () => {
  it("accepte un prix récent", () => {
    const now = Date.parse("2026-07-16T18:00:00Z");
    expect(isPriceFreshEnough("2026-07-16T12:00:00Z", 24, now)).toBe(true);
  });

  it("refuse un prix périmé", () => {
    const now = Date.parse("2026-07-16T18:00:00Z");
    expect(isPriceFreshEnough("2026-07-10T12:00:00Z", 24, now)).toBe(false);
  });
});

describe("calcul litres / coût", () => {
  it("formule litres exacte", () => {
    const { litersNeeded } = estimateTripFuelCost({
      distanceKm: 500,
      consumptionL100: 10,
      pricePerLiter: 1.72,
    });
    expect(litersNeeded).toBe(50);
  });

  it("coût arrondi à 2 décimales", () => {
    const { estimatedCost } = estimateTripFuelCost({
      distanceKm: 500,
      consumptionL100: 10,
      pricePerLiter: 1.72,
    });
    expect(estimatedCost).toBe(86);
  });
});

describe("loadFdeConfig", () => {
  afterEach(() => {
    resetFdeConfigCache();
  });

  it("refuse production sans clé si activé", () => {
    expect(() =>
      loadFdeConfig({
        NODE_ENV: "production",
        FDE_ENABLED: "true",
        FDE_API_KEY: "",
        FDE_BASE_URL: "https://fde.monteregia.com",
      }),
    ).toThrow(AppError);
  });

  it("refuse HTTP hors domaine en production", () => {
    expect(() =>
      loadFdeConfig({
        NODE_ENV: "production",
        FDE_ENABLED: "true",
        FDE_API_KEY: "fde_test",
        FDE_BASE_URL: "http://evil.example.com",
      }),
    ).toThrow(/HTTPS|domaine/i);
  });
});

describe("estimateFuelCost avec client mock", () => {
  afterEach(() => {
    setFdeClientForTests(null);
    clearFdeMemoryCache();
    resetFdeMetrics();
    resetFdeConfigCache();
    vi.unstubAllEnvs();
  });

  it("médiane nearby + calcul coût", async () => {
    vi.stubEnv("FDE_ENABLED", "true");
    vi.stubEnv("FDE_API_KEY", "test-key");
    vi.stubEnv("FDE_BASE_URL", "https://fde.monteregia.com");
    resetFdeConfigCache();

    const observedAt = new Date().toISOString();
    setFdeClientForTests({
      findNearbyStations: async () => ({
        data: [1.7, 1.72, 1.74].map((price, i) => ({
          id: `station-${i}`,
          stableStationCode: `code-${i}`,
          name: `S${i}`,
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
                ageSeconds: 60,
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
            source: "Régie",
            dataset: "d",
            productId: "p",
            license: "l",
            attributionRequired: true as const,
            notice: "notice",
            commercialReviewRequired: true as const,
          },
          granularity: "station" as const,
          distanceKm: i + 1,
        })),
      }),
      getLatestRegionalPrices: async () => ({ data: [] }),
    } as never);

    const result = await estimateFuelCost({
      distanceKm: 100,
      consumptionLPer100Km: 10,
      fuelType: "regular",
      tankCapacityL: 50,
      referencePosition: { latitude: 45.5017, longitude: -73.5673 },
      bypassCache: true,
    });

    expect(result.consumedLitres).toBe(10);
    expect(result.estimatedLitres).toBe(0); // plein initial non facturé
    expect(result.litersPurchased).toBe(0);
    expect(result.priceCadPerLitre).toBe(1.72);
    expect(result.estimatedCostCad).toBe(0);
    expect(result.naiveCostAtDeparturePrice).toBe(0);
    expect(result.pricingMethod).toBe("nearby-station-median");
    expect(result.fallbackUsed).toBe(false);
    expect(result.stationCount).toBe(3);
    expect(JSON.stringify(result)).not.toMatch(/test-key|FDE_API_KEY|Bearer/);
  });

  it("fallback régional si aucune station", async () => {
    vi.stubEnv("FDE_ENABLED", "true");
    vi.stubEnv("FDE_API_KEY", "test-key");
    vi.stubEnv("FDE_BASE_URL", "https://fde.monteregia.com");
    resetFdeConfigCache();

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
      fuelType: "Gasoline",
      tankCapacityL: 50,
      referencePosition: { latitude: 45.5017, longitude: -73.5673 },
      bypassCache: true,
      regionHint: "Montréal",
    });

    expect(result.fallbackUsed).toBe(true);
    expect(result.pricingMethod).toBe("regional-fallback");
    expect(result.priceCadPerLitre).toBe(1.971);
    expect(result.estimatedCostCad).toBe(0); // 100 km couverts par le plein initial
    expect(result.naiveCostAtDeparturePrice).toBe(0);
    expect(result.granularity).toBe("regional");
  });

  it("mappe 401 sans exposer la clé", async () => {
    vi.stubEnv("FDE_ENABLED", "true");
    vi.stubEnv("FDE_API_KEY", "secret-key-should-not-leak");
    vi.stubEnv("FDE_BASE_URL", "https://fde.monteregia.com");
    resetFdeConfigCache();

    setFdeClientForTests({
      findNearbyStations: async () => {
        throw new FdeFuelPricesUnauthorizedError({ message: "Unauthorized" });
      },
      getLatestRegionalPrices: async () => {
        throw new FdeFuelPricesUnauthorizedError({ message: "Unauthorized" });
      },
    } as never);

    await expect(
      estimateFuelCost({
        distanceKm: 100,
        consumptionLPer100Km: 10,
        fuelType: "regular",
        referencePosition: { latitude: 45.5, longitude: -73.5 },
        bypassCache: true,
      }),
    ).rejects.toMatchObject({ code: "FDE_005", status: 502 });
  });

  it("conserve un ID opaque", async () => {
    vi.stubEnv("FDE_ENABLED", "true");
    vi.stubEnv("FDE_API_KEY", "test-key");
    vi.stubEnv("FDE_BASE_URL", "https://fde.monteregia.com");
    resetFdeConfigCache();
    const observedAt = new Date().toISOString();
    const opaqueId = "bf3417e8-af57-4ce6-b971-0028a307c998";

    setFdeClientForTests({
      findNearbyStations: async () => ({
        data: [
          {
            id: opaqueId,
            stableStationCode: "req-legacy-1",
            name: "Test",
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
                price: 1.8,
                currency: "CAD",
                unit: "liter",
                observedAt,
                collectedAt: observedAt,
                freshness: {
                  observedAt,
                  collectedAt: observedAt,
                  ageSeconds: 1,
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
              source: "Régie",
              dataset: "d",
              productId: "p",
              license: "l",
              attributionRequired: true as const,
              notice: "n",
              commercialReviewRequired: true as const,
            },
            granularity: "station" as const,
            distanceKm: 1,
          },
        ],
      }),
      getLatestRegionalPrices: async () => ({ data: [] }),
    } as never);

    const result = await estimateFuelCost({
      distanceKm: 50,
      consumptionLPer100Km: 10,
      fuelType: "regular",
      tankCapacityL: 50,
      referencePosition: { latitude: 45.5, longitude: -73.5 },
      bypassCache: true,
    });

    expect(result.selectedStationId).toBe(opaqueId);
    expect(result.selectedStationId?.startsWith("fst_")).toBe(false);
  });
});
