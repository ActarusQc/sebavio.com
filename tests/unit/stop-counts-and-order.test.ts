import { describe, expect, it } from "vitest";
import {
  countRouteStopsByKind,
  formatArretsCarburantCount,
  formatEtapesCount,
} from "@/features/trips/lib/stop-counts";
import {
  computeOutboundInsertSequence,
  progressAlongOdAxis,
} from "@/features/trips/services/route-stop-order";

describe("stop-counts", () => {
  it("sépare étapes et accords français", () => {
    expect(formatEtapesCount(0)).toBe("0 étape");
    expect(formatEtapesCount(1)).toBe("1 étape");
    expect(formatEtapesCount(2)).toBe("2 étapes");
    expect(formatArretsCarburantCount(0)).toBe("0 arrêt");
    expect(formatArretsCarburantCount(1)).toBe("1 arrêt");
    expect(formatArretsCarburantCount(2)).toBe("2 arrêts");
  });

  it("une activité augmente routeStopCount sans compter le carburant", () => {
    const counts = countRouteStopsByKind([
      { stopType: "activity" },
      { stopType: "stop" },
    ]);
    expect(counts.routeStopCount).toBe(2);
    expect(counts.activityStopCount).toBe(1);
    expect(counts.manualStopCount).toBe(1);
  });
});

describe("route-stop-order", () => {
  const origin = { lat: 45.47, lng: -73.26 };
  const destination = { lat: 48.16, lng: -65.86 };
  const quebec = { lat: 46.8, lng: -71.22 };

  it("place Québec entre origine et New Richmond", () => {
    const t = progressAlongOdAxis(quebec, origin, destination);
    expect(t).toBeGreaterThan(0.1);
    expect(t).toBeLessThan(0.9);
  });

  it("insère une activité avant une étape plus proche de la destination", () => {
    const nearDest = { latitude: 48.0, longitude: -66.5 };
    const seq = computeOutboundInsertSequence({
      activity: quebec,
      origin,
      destination,
      existingStops: [nearDest],
    });
    expect(seq).toBe(1);
  });
});
