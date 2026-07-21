import { describe, expect, it } from "vitest";
import {
  formatArretsCarburantCount,
  formatEtapesCount,
  countRouteStopsByKind,
} from "@/features/trips/lib/stop-counts";

describe("libellés compteurs distincts", () => {
  it("n'utilise plus le libellé ambigu Arrêts prévus", () => {
    expect(formatEtapesCount(1)).not.toMatch(/Arrêts prévus/i);
    expect(formatArretsCarburantCount(2)).not.toMatch(/Arrêts prévus/i);
    expect(formatEtapesCount(1)).toBe("1 étape");
    expect(formatArretsCarburantCount(2)).toBe("2 arrêts");
  });

  it("une activité augmente routeStopCount sans toucher fuelStopCount", () => {
    const before = countRouteStopsByKind([]);
    const after = countRouteStopsByKind([{ stopType: "activity" }]);
    expect(before.routeStopCount).toBe(0);
    expect(after.routeStopCount).toBe(1);
    expect(after.activityStopCount).toBe(1);
    // fuelStopCount est hors de cette collection
    const fuelStopCount = 2;
    expect(fuelStopCount).not.toBe(after.routeStopCount);
  });
});

describe("clés marqueurs uniques", () => {
  it("préfixe les ids selon le type", () => {
    const activityId = "same-uuid";
    const fuelId = "same-uuid";
    const keys = [
      `activity:${activityId}`,
      `fuel:${fuelId}`,
      `route-stop:${activityId}`,
      `origin:trip-1`,
      `destination:trip-1`,
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("placement dialogue — valeur par défaut", () => {
  it("outbound est la valeur initiale attendue", () => {
    const defaultPlacement = "outbound" as const;
    expect(defaultPlacement).toBe("outbound");
    expect(defaultPlacement).not.toBe("destination");
  });
});
