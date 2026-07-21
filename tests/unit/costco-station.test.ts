import { describe, expect, it } from "vitest";
import {
  excludeCostcoStations,
  isCostcoStation,
} from "@/features/fuel/lib/costco-station";

describe("isCostcoStation", () => {
  it("détecte Costco dans le nom ou la marque", () => {
    expect(isCostcoStation("Costco Lévis")).toBe(true);
    expect(isCostcoStation("COSTCO Wholesale")).toBe(true);
    expect(isCostcoStation("Ultramar", "Costco")).toBe(true);
    expect(isCostcoStation("Petro-Canada")).toBe(false);
    expect(isCostcoStation(null, undefined, "")).toBe(false);
  });
});

describe("excludeCostcoStations", () => {
  const stations = [
    { stationName: "Costco Rimouski", label: "Costco Rimouski" },
    { stationName: "Couche-Tard", label: "Couche-Tard" },
    { name: "Costco Québec", brand: "Costco" },
    { stationName: "Esso", brand: "Esso" },
  ];

  it("conserve Costco si membre", () => {
    expect(excludeCostcoStations(stations, true)).toHaveLength(4);
  });

  it("exclut Costco si non membre", () => {
    const filtered = excludeCostcoStations(stations, false);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((s) => s.stationName ?? s.name)).toEqual([
      "Couche-Tard",
      "Esso",
    ]);
  });
});
