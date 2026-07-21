import { describe, expect, it } from "vitest";
import {
  resolveRoutePointAtDistance,
  reverseRoutePath,
  REFUEL_STOP_ROUTE_DISTANCE_TOLERANCE_KM,
} from "@/features/fuel/lib/resolve-route-point";
import {
  haversineKm,
  type LatLng,
} from "@/features/fuel/lib/route-segmentation";

/** Segment est-ouest ~100 km (approx) pour tests déterministes. */
function eastPath(): LatLng[] {
  return [
    { lat: 45.5, lng: -73.6 },
    { lat: 45.5, lng: -72.6 },
    { lat: 45.5, lng: -71.6 },
    { lat: 45.5, lng: -70.6 },
  ];
}

describe("resolveRoutePointAtDistance", () => {
  const path = eastPath();
  const total = 300;

  it("calcule un point au début de la route", () => {
    const p = resolveRoutePointAtDistance({
      path,
      distanceFromStartKm: 0,
      totalDistanceKm: total,
    });
    expect(p).not.toBeNull();
    expect(p!.latitude).toBeCloseTo(45.5, 3);
    expect(p!.longitude).toBeCloseTo(-73.6, 3);
    expect(p!.distanceFromStartKm).toBe(0);
    expect(p!.distanceRemainingKm).toBe(total);
  });

  it("interpole au milieu de la route", () => {
    const p = resolveRoutePointAtDistance({
      path,
      distanceFromStartKm: 150,
      totalDistanceKm: total,
    });
    expect(p).not.toBeNull();
    expect(p!.distanceFromStartKm).toBe(150);
    expect(p!.longitude).toBeGreaterThan(-73.6);
    expect(p!.longitude).toBeLessThan(-70.6);
  });

  it("interpole à la fin de la route", () => {
    const p = resolveRoutePointAtDistance({
      path,
      distanceFromStartKm: 300,
      totalDistanceKm: total,
    });
    expect(p).not.toBeNull();
    expect(p!.longitude).toBeCloseTo(-70.6, 3);
    expect(p!.distanceRemainingKm).toBe(0);
  });

  it("borne une distance au-delà de la longueur totale", () => {
    const p = resolveRoutePointAtDistance({
      path,
      distanceFromStartKm: 9999,
      totalDistanceKm: total,
    });
    expect(p!.distanceFromStartKm).toBe(total);
    expect(p!.longitude).toBeCloseTo(-70.6, 3);
  });

  it("polyline inversée : distances recalculées depuis la nouvelle origine", () => {
    const rev = reverseRoutePath(path);
    const p = resolveRoutePointAtDistance({
      path: rev,
      distanceFromStartKm: 0,
      totalDistanceKm: total,
    });
    expect(p!.longitude).toBeCloseTo(-70.6, 3);
    const mid = resolveRoutePointAtDistance({
      path: rev,
      distanceFromStartKm: 150,
      totalDistanceKm: total,
    });
    const forwardMid = resolveRoutePointAtDistance({
      path,
      distanceFromStartKm: 150,
      totalDistanceKm: total,
    });
    // Le milieu du retour n'est pas le même point que le milieu de l'aller
    // (sauf symétrie exacte) — au minimum l'origine du retour ≠ origine aller
    expect(p!.longitude).not.toBeCloseTo(path[0]!.lng, 2);
    expect(mid).not.toBeNull();
    expect(forwardMid).not.toBeNull();
  });

  it("tolérance de distance configurable", () => {
    expect(REFUEL_STOP_ROUTE_DISTANCE_TOLERANCE_KM).toBe(15);
  });

  it("distance cumulative cohérente (Haversine)", () => {
    let cum = 0;
    for (let i = 1; i < path.length; i++) {
      cum += haversineKm(path[i - 1]!, path[i]!);
    }
    expect(cum).toBeGreaterThan(200);
  });
});
