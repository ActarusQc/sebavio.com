import { describe, expect, it } from "vitest";
import { estimateTripFuelCost } from "@/features/fuel/lib/consumption";
import {
  consumptionSourceLabel,
  resolveVehicleConsumption,
} from "@/features/fuel/lib/resolve-consumption";
import { mapSebavioFuelToFde } from "@/services/fuel-prices/fde/mapping";

describe("resolveVehicleConsumption", () => {
  it("priorise la moyenne réelle (pleins ≥ 2)", () => {
    const r = resolveVehicleConsumption({
      realAvgConsumption: 9.4,
      fullFillCount: 3,
      catalogAvgConsumption: 11,
      appDefaultL100: 10,
    });
    expect(r).toEqual({
      ok: true,
      consumptionL100: 9.4,
      source: "real_avg",
    });
  });

  it("utilise le profil véhicule si conso saisie sans historique suffisant", () => {
    const r = resolveVehicleConsumption({
      realAvgConsumption: 8.5,
      fullFillCount: 1,
      catalogAvgConsumption: 11,
    });
    expect(r).toEqual({
      ok: true,
      consumptionL100: 8.5,
      source: "vehicle_profile",
    });
  });

  it("utilise le catalogue si pas de conso véhicule", () => {
    const r = resolveVehicleConsumption({
      realAvgConsumption: null,
      fullFillCount: 0,
      catalogAvgConsumption: 12.2,
    });
    expect(r).toEqual({
      ok: true,
      consumptionL100: 12.2,
      source: "catalog",
    });
  });

  it("utilise le défaut applicatif seulement s'il est défini", () => {
    const withDefault = resolveVehicleConsumption({
      appDefaultL100: 10,
    });
    expect(withDefault.source).toBe("app_default");
    expect(withDefault.ok && withDefault.consumptionL100).toBe(10);

    const without = resolveVehicleConsumption({});
    expect(without.ok).toBe(false);
  });

  it("signale aucune consommation disponible", () => {
    const r = resolveVehicleConsumption({
      realAvgConsumption: 0,
      catalogAvgConsumption: null,
      appDefaultL100: undefined,
    });
    expect(r.ok).toBe(false);
  });

  it("override manuel prioritaire", () => {
    const r = resolveVehicleConsumption({
      manualL100: 7.1,
      realAvgConsumption: 9.4,
      fullFillCount: 5,
    });
    expect(r).toEqual({
      ok: true,
      consumptionL100: 7.1,
      source: "manual",
    });
  });

  it("ignore les chaînes / valeurs invalides", () => {
    const r = resolveVehicleConsumption({
      realAvgConsumption: Number("abc"),
      catalogAvgConsumption: -1,
    });
    expect(r.ok).toBe(false);
  });
});

describe("libellés source consommation", () => {
  it("expose des libellés FR", () => {
    expect(consumptionSourceLabel("real_avg")).toMatch(/réelle/i);
    expect(consumptionSourceLabel("vehicle_profile")).toMatch(/profil/i);
    expect(consumptionSourceLabel("catalog")).toMatch(/catalogue/i);
    expect(consumptionSourceLabel("user_override")).toMatch(/personnalisée/i);
  });
});

describe("override utilisateur conso", () => {
  it("priorise customConsumptionL100 sur moyenne réelle et catalogue", () => {
    const r = resolveVehicleConsumption({
      customConsumptionL100: 6.5,
      realAvgConsumption: 9.4,
      fullFillCount: 5,
      catalogAvgConsumption: 8,
    });
    expect(r).toEqual({
      ok: true,
      consumptionL100: 6.5,
      source: "user_override",
    });
  });
});

describe("mapping carburant Sebavio → FDE", () => {
  it("essence ordinaire → regular", () => {
    expect(mapSebavioFuelToFde("essence ordinaire")).toEqual({
      kind: "mapped",
      fdeFuelType: "regular",
    });
    expect(mapSebavioFuelToFde("Gasoline")).toEqual({
      kind: "mapped",
      fdeFuelType: "regular",
    });
  });

  it("essence super → premium", () => {
    expect(mapSebavioFuelToFde("essence super")).toEqual({
      kind: "mapped",
      fdeFuelType: "premium",
    });
  });

  it("diesel → diesel", () => {
    expect(mapSebavioFuelToFde("diesel")).toEqual({
      kind: "mapped",
      fdeFuelType: "diesel",
    });
  });
});

describe("calcul estimation 60,24 km", () => {
  it("calcule litres et coût avec arrondis", () => {
    const r = estimateTripFuelCost({
      distanceKm: 60.24,
      consumptionL100: 9.4,
      pricePerLiter: 1.971,
    });
    // litres = 60.24 * 9.4 / 100 = 5.66256 → 5.663
    expect(r.litersNeeded).toBe(5.663);
    // coût = 5.663 * 1.971 = 11.161773 → 11.16
    expect(r.estimatedCost).toBe(11.16);
  });

  it("recalcule si véhicule / conso / prix changent", () => {
    const a = estimateTripFuelCost({
      distanceKm: 60.24,
      consumptionL100: 9.4,
      pricePerLiter: 1.971,
    });
    const b = estimateTripFuelCost({
      distanceKm: 60.24,
      consumptionL100: 12,
      pricePerLiter: 1.971,
    });
    expect(b.litersNeeded).toBeGreaterThan(a.litersNeeded);
    expect(b.estimatedCost).toBeGreaterThan(a.estimatedCost);
  });
});

describe("absence de clé FDE côté navigateur", () => {
  it("aucune constante NEXT_PUBLIC_FDE dans le module résolution", async () => {
    const mod = await import("@/features/fuel/lib/resolve-consumption");
    const dumped = JSON.stringify(mod);
    expect(dumped).not.toMatch(/FDE_API_KEY/);
    expect(dumped).not.toMatch(/NEXT_PUBLIC_FDE/);
  });
});
