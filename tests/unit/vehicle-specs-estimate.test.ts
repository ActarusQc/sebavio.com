import { describe, expect, it } from "vitest";
import {
  buildSpecsEstimateCacheKey,
  normalizeSpecToken,
} from "@/features/vehicles/lib/specs-estimate-cache-key";
import {
  vehicleSpecsEstimateAiPayloadSchema,
  vehicleSpecsEstimateRequestSchema,
  vehicleSpecsEstimateResultSchema,
} from "@/features/vehicles/schemas";

describe("buildSpecsEstimateCacheKey", () => {
  it("normalise make/model/year/config", () => {
    expect(
      buildSpecsEstimateCacheKey({
        make: "  Toyota ",
        model: "RAV4",
        year: 2020,
        configuration: "XLE AWD",
      }),
    ).toBe("toyota|rav4|2020|xle awd");
  });

  it("priorise catalogEntryId", () => {
    expect(
      buildSpecsEstimateCacheKey({
        catalogEntryId: "11111111-1111-4111-8111-111111111111",
        make: "Toyota",
        model: "RAV4",
        year: 2020,
      }),
    ).toBe("catalog:11111111-1111-4111-8111-111111111111");
  });
});

describe("normalizeSpecToken", () => {
  it("compresse les espaces", () => {
    expect(normalizeSpecToken("  Foo   Bar ")).toBe("foo bar");
  });
});

describe("vehicleSpecsEstimateRequestSchema", () => {
  it("accepte catalogEntryId seul", () => {
    const result = vehicleSpecsEstimateRequestSchema.safeParse({
      catalogEntryId: "11111111-1111-4111-8111-111111111111",
    });
    expect(result.success).toBe(true);
  });

  it("exige marque/modèle/année sans catalogue", () => {
    expect(
      vehicleSpecsEstimateRequestSchema.safeParse({
        make: "Toyota",
      }).success,
    ).toBe(false);
    expect(
      vehicleSpecsEstimateRequestSchema.safeParse({
        make: "Toyota",
        model: "RAV4",
        year: 2020,
      }).success,
    ).toBe(true);
  });
});

describe("vehicleSpecsEstimateAiPayloadSchema", () => {
  it("refuse hors bornes", () => {
    expect(
      vehicleSpecsEstimateAiPayloadSchema.safeParse({
        consumptionL100: 0.5,
        tankCapacityL: 54,
      }).success,
    ).toBe(false);
    expect(
      vehicleSpecsEstimateAiPayloadSchema.safeParse({
        consumptionL100: 8.5,
        tankCapacityL: 5,
      }).success,
    ).toBe(false);
  });

  it("accepte payload valide", () => {
    const result = vehicleSpecsEstimateAiPayloadSchema.safeParse({
      consumptionL100: 8.5,
      tankCapacityL: 54,
      confidence: "high",
      isFullyElectric: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("vehicleSpecsEstimateResultSchema", () => {
  it("accepte résultat partiel", () => {
    expect(
      vehicleSpecsEstimateResultSchema.safeParse({
        consumptionL100: 8.5,
        tankCapacityL: null,
        sources: { consumption: "nrcan", tankCapacity: null },
        confidence: "high",
      }).success,
    ).toBe(true);
  });
});
