import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildExternalKey,
  mapVehicleFuelToRegie,
  MISSING_STREAK_SOFT_DELETE,
  parseCentsPrice,
} from "@/services/fuel-prices/regie-quebec/constants";
import { parseRegieXlsx } from "@/services/fuel-prices/regie-quebec/parse";

const fixturePath = resolve(
  process.cwd(),
  "tests/fixtures/regie-essence-sample.xlsx",
);

describe("parseCentsPrice", () => {
  it("convertit 179.9¢ en $/L", () => {
    expect(parseCentsPrice("179.9¢")).toBe(1.799);
  });

  it("traite N/D et vide", () => {
    expect(parseCentsPrice("N/D")).toBeNull();
    expect(parseCentsPrice("")).toBeNull();
    expect(parseCentsPrice(null)).toBeNull();
  });
});

describe("mapVehicleFuelToRegie", () => {
  it("mappe Gasoline / Diesel / Hybrid", () => {
    expect(mapVehicleFuelToRegie("Gasoline")).toBe("regular");
    expect(mapVehicleFuelToRegie("Diesel")).toBe("diesel");
    expect(mapVehicleFuelToRegie("Hybrid")).toBe("regular");
  });

  it("marque Electric / PHEV non applicable", () => {
    expect(mapVehicleFuelToRegie("Electric")).toBe("not_applicable");
    expect(mapVehicleFuelToRegie("PHEV")).toBe("not_applicable");
    expect(mapVehicleFuelToRegie("PlugInHybrid")).toBe("not_applicable");
  });

  it("Propane → null (repli chaîne)", () => {
    expect(mapVehicleFuelToRegie("Propane")).toBeNull();
  });
});

describe("parseRegieXlsx fixture", () => {
  it("parse le fichier échantillon sans téléchargement", () => {
    const buffer = readFileSync(fixturePath);
    const result = parseRegieXlsx(buffer);
    expect(result.sheetName).toContain("Régie");
    expect(result.stations.length).toBeGreaterThanOrEqual(3);
    expect(result.skipped.some((s) => s.reason === "empty_row")).toBe(true);
    // Fixture : ligne vide + station sans région tolérée si adresse/coords OK
    expect(result.skipped.length).toBeGreaterThanOrEqual(1);

    const withNd = result.stations.find((s) => s.name === "Station A");
    expect(withNd?.prices.regular).toBe(1.799);
    expect(withNd?.prices.diesel).toBeUndefined();

    const noRegion = result.stations.find((s) => s.name === "Station C");
    expect(noRegion?.region).toBeNull();
  });

  it("produit des external_key stables", () => {
    const a = buildExternalKey({
      name: "Station A",
      address: "1 rue Test, Montréal",
    });
    const b = buildExternalKey({
      name: "Station A",
      address: "1 rue Test, Montréal",
    });
    expect(a).toBe(b);
    expect(a).toHaveLength(32);
  });
});

describe("soft-delete policy", () => {
  it("exige 3 absences consécutives", () => {
    expect(MISSING_STREAK_SOFT_DELETE).toBe(3);
    let streak = 0;
    const absences = [1, 2, 3];
    const deletedAt: number[] = [];
    for (const n of absences) {
      streak += 1;
      if (streak >= MISSING_STREAK_SOFT_DELETE) deletedAt.push(n);
    }
    expect(deletedAt).toEqual([3]);
  });
});
