import { describe, expect, it } from "vitest";
import {
  assertKnownEntitlementKey,
  ENTITLEMENT_CATEGORY_LABELS,
  ENTITLEMENT_DEFINITIONS,
  getEntitlementDefinition,
  listEntitlementsByCategory,
  PLAN_ENTITLEMENT_KEYS,
  type PlanEntitlementKey,
} from "@/features/plans/lib/entitlement-registry";
import {
  getRemainingUsage,
  isWithinLimit,
  resolveEntitlementFromRows,
} from "@/features/plans/lib/entitlement-resolve";

describe("plan entitlements — registry", () => {
  it("contient toutes les clés attendues, sans doublon", () => {
    const expected = [
      "trips.max",
      "vehicles.max",
      "campings.max",
      "activities.max",
      "ai.planning.enabled",
      "ai.recommendations.enabled",
      "weather.forecast_days",
      "fuel.optimization.enabled",
      "fuel.live_prices.enabled",
      "trip.sharing.enabled",
      "trip.export_pdf.enabled",
      "notifications.enabled",
      "support.priority",
    ];
    expect([...PLAN_ENTITLEMENT_KEYS]).toEqual(expected);
    expect(new Set(PLAN_ENTITLEMENT_KEYS).size).toBe(
      PLAN_ENTITLEMENT_KEYS.length,
    );
  });

  it("rejette une clé inconnue via assertKnownEntitlementKey", () => {
    expect(() => assertKnownEntitlementKey("nope")).toThrow(
      /clé d'entitlement inconnue/i,
    );
    expect(() => assertKnownEntitlementKey("trips.max")).not.toThrow();
  });

  it("les définitions couvrent exactement toutes les clés, sans doublon ni manque", () => {
    const defKeys = ENTITLEMENT_DEFINITIONS.map((d) => d.key);
    expect(defKeys).toHaveLength(PLAN_ENTITLEMENT_KEYS.length);
    expect(new Set(defKeys).size).toBe(PLAN_ENTITLEMENT_KEYS.length);
    for (const key of PLAN_ENTITLEMENT_KEYS) {
      expect(defKeys).toContain(key);
      const def = getEntitlementDefinition(key);
      expect(def.key).toBe(key);
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
    }
  });

  it("assigne le bon valueType selon la clé", () => {
    expect(getEntitlementDefinition("trips.max").valueType).toBe("limit");
    expect(getEntitlementDefinition("vehicles.max").valueType).toBe("limit");
    expect(getEntitlementDefinition("campings.max").valueType).toBe("limit");
    expect(getEntitlementDefinition("activities.max").valueType).toBe("limit");
    expect(getEntitlementDefinition("weather.forecast_days").valueType).toBe(
      "limit",
    );
    expect(getEntitlementDefinition("ai.planning.enabled").valueType).toBe(
      "boolean",
    );
    expect(
      getEntitlementDefinition("fuel.optimization.enabled").valueType,
    ).toBe("boolean");
    expect(getEntitlementDefinition("support.priority").valueType).toBe(
      "string",
    );
  });

  it("groupe les entitlements par catégorie dans un ordre stable", () => {
    const grouped = listEntitlementsByCategory();
    const categories = grouped.map((g) => g.category);
    expect(categories).toEqual([
      "trips",
      "vehicles",
      "fuel",
      "weather",
      "activities",
      "ai",
      "sharing",
      "support",
    ]);

    const allKeys = grouped.flatMap((g) => g.definitions.map((d) => d.key));
    expect(new Set(allKeys).size).toBe(PLAN_ENTITLEMENT_KEYS.length);
    expect(allKeys).toHaveLength(PLAN_ENTITLEMENT_KEYS.length);
    for (const key of PLAN_ENTITLEMENT_KEYS) {
      expect(allKeys).toContain(key);
    }

    expect(
      grouped
        .find((g) => g.category === "trips")
        ?.definitions.map((d) => d.key),
    ).toEqual(["trips.max"]);
    expect(
      grouped
        .find((g) => g.category === "activities")
        ?.definitions.map((d) => d.key),
    ).toEqual(["campings.max", "activities.max"]);
    expect(
      grouped
        .find((g) => g.category === "sharing")
        ?.definitions.map((d) => d.key),
    ).toEqual([
      "trip.sharing.enabled",
      "trip.export_pdf.enabled",
      "notifications.enabled",
    ]);
  });

  it("expose les libellés français des catégories", () => {
    expect(ENTITLEMENT_CATEGORY_LABELS.trips).toBe("Voyages");
    expect(ENTITLEMENT_CATEGORY_LABELS.vehicles).toBe("Véhicules");
    expect(ENTITLEMENT_CATEGORY_LABELS.fuel).toBe("Carburant");
    expect(ENTITLEMENT_CATEGORY_LABELS.weather).toBe("Météo");
    expect(ENTITLEMENT_CATEGORY_LABELS.activities).toBe(
      "Activités et campings",
    );
    expect(ENTITLEMENT_CATEGORY_LABELS.ai).toBe("Intelligence artificielle");
    expect(ENTITLEMENT_CATEGORY_LABELS.sharing).toBe("Partage et exportation");
    expect(ENTITLEMENT_CATEGORY_LABELS.support).toBe("Assistance");
  });
});

describe("plan entitlements — resolve", () => {
  it("résout correctement une ligne configurée", () => {
    const e = resolveEntitlementFromRows(
      [
        {
          key: "trips.max",
          enabled: true,
          limit: 5,
          value: null,
        },
      ],
      "trips.max",
    );
    expect(e).toEqual({
      key: "trips.max",
      enabled: true,
      limit: 5,
      value: null,
    });
  });

  it("ligne absente → défaut désactivé (sécurisé)", () => {
    const e = resolveEntitlementFromRows([], "vehicles.max");
    expect(e).toEqual({
      key: "vehicles.max",
      enabled: false,
      limit: null,
      value: null,
    });
  });

  it("ignore les lignes à clé inconnue lors de la résolution d'une clé connue", () => {
    const e = resolveEntitlementFromRows(
      [
        { key: "unknown.feature", enabled: true, limit: 99, value: "x" },
        {
          key: "weather.forecast_days",
          enabled: true,
          limit: 7,
          value: null,
        },
      ],
      "weather.forecast_days",
    );
    expect(e).toEqual({
      key: "weather.forecast_days",
      enabled: true,
      limit: 7,
      value: null,
    });
  });

  it("enabled=false bloque même avec une limite", () => {
    const e = resolveEntitlementFromRows(
      [{ key: "trips.max", enabled: false, limit: 10, value: null }],
      "trips.max",
    );
    expect(e.enabled).toBe(false);
    expect(isWithinLimit(0, e)).toBe(false);
    expect(isWithinLimit(5, e)).toBe(false);
  });

  it("enabled=true limit=null → illimité", () => {
    const e = resolveEntitlementFromRows(
      [{ key: "trips.max", enabled: true, limit: null, value: null }],
      "trips.max",
    );
    expect(isWithinLimit(999, e)).toBe(true);
    expect(getRemainingUsage(999, e)).toBeNull();
  });

  it("usage sous la limite autorisé", () => {
    const e = resolveEntitlementFromRows(
      [{ key: "trips.max", enabled: true, limit: 2, value: null }],
      "trips.max",
    );
    expect(isWithinLimit(1, e)).toBe(true);
  });

  it("usage égal à la limite refusé", () => {
    const e = resolveEntitlementFromRows(
      [{ key: "trips.max", enabled: true, limit: 2, value: null }],
      "trips.max",
    );
    expect(isWithinLimit(2, e)).toBe(false);
  });

  it("usage au-delà de la limite refusé", () => {
    const e = resolveEntitlementFromRows(
      [{ key: "trips.max", enabled: true, limit: 2, value: null }],
      "trips.max",
    );
    expect(isWithinLimit(3, e)).toBe(false);
  });

  it("getRemainingUsage renvoie le reste", () => {
    const e = resolveEntitlementFromRows(
      [{ key: "trips.max", enabled: true, limit: 10, value: null }],
      "trips.max",
    );
    expect(getRemainingUsage(3, e)).toBe(7);
    expect(getRemainingUsage(10, e)).toBe(0);
    expect(getRemainingUsage(15, e)).toBe(0);
  });

  it("getRemainingUsage renvoie 0 si désactivé", () => {
    const e = resolveEntitlementFromRows(
      [{ key: "trips.max", enabled: false, limit: 10, value: null }],
      "trips.max",
    );
    expect(getRemainingUsage(0, e)).toBe(0);
  });

  it("rejette une limite négative", () => {
    expect(() =>
      resolveEntitlementFromRows(
        [{ key: "trips.max", enabled: true, limit: -1, value: null }],
        "trips.max",
      ),
    ).toThrow(/limite négative/i);
  });

  it("rejette un usage négatif ou décimal", () => {
    const e = resolveEntitlementFromRows(
      [{ key: "trips.max", enabled: true, limit: 5, value: null }],
      "trips.max",
    );
    expect(() => isWithinLimit(-1, e)).toThrow(/usage/i);
    expect(() => isWithinLimit(1.5, e)).toThrow(/usage/i);
    expect(() => getRemainingUsage(-1, e)).toThrow(/usage/i);
    expect(() => getRemainingUsage(2.2, e)).toThrow(/usage/i);
  });

  it("rejette les lignes en doublon pour la même clé", () => {
    expect(() =>
      resolveEntitlementFromRows(
        [
          { key: "trips.max", enabled: true, limit: 1, value: null },
          { key: "trips.max", enabled: true, limit: 2, value: null },
        ],
        "trips.max",
      ),
    ).toThrow(/doublon|plusieurs|duplicate/i);
  });

  it("ne mute pas l'entitlement passé à isWithinLimit / getRemainingUsage", () => {
    const e = resolveEntitlementFromRows(
      [{ key: "trips.max", enabled: true, limit: 5, value: null }],
      "trips.max",
    );
    const snapshot = { ...e };
    isWithinLimit(1, e);
    getRemainingUsage(1, e);
    expect(e).toEqual(snapshot);
  });

  it("accepte une clé connue typée PlanEntitlementKey", () => {
    const key: PlanEntitlementKey = "support.priority";
    const e = resolveEntitlementFromRows(
      [{ key, enabled: true, limit: null, value: "high" }],
      key,
    );
    expect(e.value).toBe("high");
  });
});
