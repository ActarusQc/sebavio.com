/**
 * getPointAlongRoute — position estimée sur polyline.
 */
import { describe, expect, it } from "vitest";
import { getPointAlongRoute } from "@/features/fuel/lib/route-segmentation";

describe("getPointAlongRoute", () => {
  it("retourne le milieu d'un segment droit", () => {
    const path = [
      { lat: 45.0, lng: -73.0 },
      { lat: 46.0, lng: -72.0 },
    ];
    const mid = getPointAlongRoute(path, 50, 100);
    expect(mid).not.toBeNull();
    expect(mid!.lat).toBeCloseTo(45.5, 1);
    expect(mid!.lng).toBeCloseTo(-72.5, 1);
  });

  it("borne au départ et à l'arrivée", () => {
    const path = [
      { lat: 45.0, lng: -73.0 },
      { lat: 46.0, lng: -72.0 },
    ];
    const start = getPointAlongRoute(path, -10, 100);
    const end = getPointAlongRoute(path, 999, 100);
    expect(start!.lat).toBeCloseTo(45.0, 5);
    expect(end!.lat).toBeCloseTo(46.0, 5);
  });
});
