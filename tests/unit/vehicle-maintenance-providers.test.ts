import { describe, expect, it } from "vitest";
import {
  computeDueStatus,
  computeNextDueAfterService,
} from "@/services/maintenance-schedule/due-engine";
import {
  isValidVin,
  normalizeVin,
  validateVinOrThrow,
} from "@/services/maintenance-schedule/vin";
import {
  hashSchedulePayload,
  milesToKm,
  normalizeRawTask,
} from "@/services/maintenance-schedule/normalize";
import {
  resolveUsageCondition,
  taskAppliesToCondition,
} from "@/services/maintenance-schedule/usage-profile";
import { AppError } from "@/lib/errors";
import { normalizeTransportCanadaItem } from "@/services/safety-recalls/normalize";
import { buildMaintenanceCacheKey } from "@/services/maintenance-schedule/cache";
import { MockMaintenanceProvider } from "@/services/maintenance-schedule/mock-provider";
import { ManualFallbackProvider } from "@/services/maintenance-schedule/manual-fallback-provider";
import { createMaintenanceProviderFromEnv } from "@/services/maintenance-schedule";

describe("VIN validation", () => {
  it("normalise et valide un VIN ISO 3779", () => {
    expect(normalizeVin(" jtmabcd1234567890 ")).toBe("JTMABCD1234567890");
    expect(isValidVin("JTMABCD1234567890")).toBe(true);
    expect(isValidVin("JTMABCD123456789")).toBe(false);
    expect(isValidVin("JTMIOQD1234567890")).toBe(false);
  });

  it("lève VIN_001 si invalide", () => {
    expect(() => validateVinOrThrow("ABC")).toThrow(AppError);
  });
});

describe("normalisation fournisseur", () => {
  it("convertit miles → km", () => {
    expect(milesToKm(5000)).toBe(8047);
  });

  it("normalise une tâche et force non-officielle", () => {
    const task = normalizeRawTask(
      {
        title: "Oil change",
        category: "engine_oil",
        actionType: "replace",
        intervalMiles: 5000,
        intervalMonths: 6,
        conditionType: "both",
        priority: "high",
        officialManufacturerRecommendation: true,
      },
      { forceUnofficial: true },
    );
    expect(task.intervalKm).toBe(8047);
    expect(task.officialManufacturerRecommendation).toBe(false);
  });

  it("marque inspect comme inspectionOnly", () => {
    const task = normalizeRawTask({
      title: "Brake inspection",
      category: "brakes",
      actionType: "inspect",
      conditionType: "both",
      priority: "medium",
    });
    expect(task.inspectionOnly).toBe(true);
  });

  it("produit un hash stable", () => {
    const tasks = [
      normalizeRawTask({
        externalId: "a",
        title: "Oil",
        category: "engine_oil",
        actionType: "replace",
        intervalKm: 8000,
        conditionType: "both",
        priority: "high",
      }),
    ];
    expect(hashSchedulePayload("mock", tasks)).toBe(
      hashSchedulePayload("mock", tasks),
    );
  });
});

describe("due engine", () => {
  const today = new Date(Date.UTC(2026, 6, 17));

  it("calcule overdue par km", () => {
    const r = computeDueStatus({
      intervalKm: 8000,
      lastServiceOdometer: 80000,
      lastServiceDate: new Date(Date.UTC(2026, 0, 1)),
      currentOdometer: 90000,
      today,
    });
    expect(r.dueOdometerKm).toBe(88000);
    expect(r.status).toBe("overdue");
  });

  it("calcule due_now par date", () => {
    const r = computeDueStatus({
      intervalMonths: 6,
      lastServiceDate: new Date(Date.UTC(2026, 0, 20)),
      lastServiceOdometer: 10000,
      currentOdometer: 10500,
      today,
    });
    expect(r.status).toBe("due_now");
  });

  it("calcule due_soon", () => {
    const r = computeDueStatus({
      intervalKm: 8000,
      lastServiceOdometer: 80000,
      lastServiceDate: new Date(Date.UTC(2026, 0, 1)),
      currentOdometer: 86500,
      today,
    });
    expect(r.status).toBe("due_soon");
  });

  it("calcule combined km+date → overdue si l’un dépasse", () => {
    const r = computeDueStatus({
      intervalKm: 8000,
      intervalMonths: 12,
      lastServiceOdometer: 80000,
      lastServiceDate: new Date(Date.UTC(2025, 6, 1)),
      currentOdometer: 82000,
      today,
    });
    expect(r.status).toBe("overdue");
  });

  it("recalcule après travail effectué", () => {
    const next = computeNextDueAfterService({
      serviceOdometerKm: 82000,
      serviceDate: new Date(Date.UTC(2026, 6, 1)),
      intervalKm: 8000,
      intervalMonths: 6,
    });
    expect(next.dueOdometerKm).toBe(90000);
    expect(next.dueDate?.toISOString().slice(0, 10)).toBe("2027-01-01");
  });

  it("ne invente pas de km pour inspection seule sans intervalle", () => {
    const r = computeDueStatus({
      inspectionOnly: true,
      currentOdometer: 50000,
      today,
    });
    expect(r.status).toBe("unknown");
    expect(r.dueOdometerKm).toBeNull();
  });
});

describe("conditions normales / sévères", () => {
  it("résout automatic → severe avec facteurs", () => {
    expect(
      resolveUsageCondition({
        profile: "automatic",
        factors: { shortTrips: true, towing: true },
      }),
    ).toBe("severe");
  });

  it("filtre les tâches selon condition", () => {
    expect(taskAppliesToCondition("severe", "normal")).toBe(false);
    expect(taskAppliesToCondition("both", "severe")).toBe(true);
  });
});

describe("rappels TC normalisation", () => {
  it("déduplique via external id et marque vin uncertain", () => {
    const a = normalizeTransportCanadaItem({
      recall_number: "2024-001",
      make_name: "Toyota",
      model_name: "RAV4",
      year: 2021,
      recall_name_en: "Airbag",
    });
    const b = normalizeTransportCanadaItem({
      RecallNumber: "2024-001",
      MakeName: "Toyota",
      ModelName: "RAV4",
      Year: 2021,
      Name: "Airbag",
    });
    expect(a?.externalRecallId).toBe("2024-001");
    expect(a?.vinMatchUncertain).toBe(true);
    expect(b?.externalRecallId).toBe(a?.externalRecallId);
  });
});

describe("cache key", () => {
  it("est stable pour les mêmes entrées", () => {
    const a = buildMaintenanceCacheKey({
      provider: "mock",
      year: 2021,
      make: "Toyota",
      model: "RAV4",
    });
    const b = buildMaintenanceCacheKey({
      provider: "mock",
      year: 2021,
      make: "toyota",
      model: "rav4",
    });
    expect(a).toBe(b);
  });
});

describe("providers", () => {
  it("mock retourne des données clairement non officielles", async () => {
    const provider = new MockMaintenanceProvider();
    const result = await provider.getSchedule({
      year: 2021,
      make: "Toyota",
      model: "RAV4",
    });
    expect(result.sourceType).toBe("mock");
    expect(result.warning).toMatch(/démonstration/i);
    expect(
      result.tasks.every((t) => t.officialManufacturerRecommendation === false),
    ).toBe(true);
  });

  it("manual fallback ne invente pas de calendrier", async () => {
    const provider = new ManualFallbackProvider();
    const result = await provider.getSchedule({
      year: 2020,
      make: "X",
      model: "Y",
    });
    expect(result.tasks).toHaveLength(0);
  });

  it("interdit mock lorsque FORBID_MOCK ou production sans ALLOW", () => {
    const prevProv = process.env.MAINTENANCE_PROVIDER;
    const prevForbid = process.env.MAINTENANCE_FORBID_MOCK;
    process.env.MAINTENANCE_PROVIDER = "mock";
    process.env.MAINTENANCE_FORBID_MOCK = "true";
    expect(() => createMaintenanceProviderFromEnv()).toThrow(AppError);
    process.env.MAINTENANCE_PROVIDER = prevProv;
    process.env.MAINTENANCE_FORBID_MOCK = prevForbid;
  });
});
