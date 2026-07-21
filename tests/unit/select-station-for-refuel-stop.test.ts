import { describe, expect, it } from "vitest";
import {
  isRefuelStopLocationSuspicious,
  selectStationForRefuelStop,
  stationSelectionKey,
} from "@/features/fuel/lib/select-station-for-refuel-stop";
import type { FuelStopCandidate } from "@/features/fuel/lib/trip-fuel-types";
import type { RoutePointAtDistance } from "@/features/fuel/lib/resolve-route-point";

function candidate(
  partial: Partial<FuelStopCandidate> & Pick<FuelStopCandidate, "id">,
): FuelStopCandidate {
  return {
    distanceFromStartKm: 200,
    detourKm: 2,
    pricePerLiter: 1.8,
    label: "Station",
    granularity: "station",
    source: "test",
    isStationLevel: true,
    stationName: "Ultramar",
    address: "1 rue",
    city: "Lévis",
    latitude: 46.8,
    longitude: -71.2,
    ...partial,
  };
}

const routePoint: RoutePointAtDistance = {
  latitude: 46.8,
  longitude: -71.2,
  distanceFromStartKm: 200,
  distanceRemainingKm: 594,
  routeSegmentIndex: 10,
};

describe("selectStationForRefuelStop", () => {
  it("sélectionne la station la plus proche du routePoint", () => {
    const near = candidate({
      id: "near",
      latitude: 46.81,
      longitude: -71.21,
      pricePerLiter: 2.0,
    });
    const farCheap = candidate({
      id: "far",
      latitude: 45.5,
      longitude: -73.6,
      distanceFromStartKm: 0,
      pricePerLiter: 1.2,
    });
    const selected = selectStationForRefuelStop({
      routePoint,
      stationCandidates: [farCheap, near],
      previousSelectedStationIds: new Set(),
    });
    expect(selected?.id).toBe("near");
  });

  it("rejette une station trop éloignée du routePoint", () => {
    const far = candidate({
      id: "far",
      latitude: 45.5,
      longitude: -73.6,
      distanceFromStartKm: 0,
    });
    const selected = selectStationForRefuelStop({
      routePoint,
      stationCandidates: [far],
      previousSelectedStationIds: new Set(),
      maxRoutePointDistanceKm: 25,
    });
    expect(selected).toBeNull();
  });

  it("rejette une station avec trop de détour", () => {
    const detour = candidate({
      id: "d",
      latitude: 46.85,
      longitude: -71.25,
      detourKm: 40,
    });
    const selected = selectStationForRefuelStop({
      routePoint,
      stationCandidates: [detour],
      previousSelectedStationIds: new Set(),
      maxDetourKm: 15,
      maxRoutePointDistanceKm: 10,
    });
    expect(selected).toBeNull();
  });

  it("prévient les doublons de station", () => {
    const a = candidate({ id: "a", latitude: 46.8, longitude: -71.2 });
    const key = stationSelectionKey({
      id: a.id,
      name: a.stationName,
      latitude: a.latitude!,
      longitude: a.longitude!,
    });
    const selected = selectStationForRefuelStop({
      routePoint,
      stationCandidates: [a],
      previousSelectedStationIds: new Set([key]),
    });
    expect(selected).toBeNull();
  });
});

describe("isRefuelStopLocationSuspicious", () => {
  it("détecte coords = départ alors que distance élevée", () => {
    expect(
      isRefuelStopLocationSuspicious({
        latitude: 45.5,
        longitude: -73.6,
        city: "Montréal",
        distanceFromStartKm: 200,
        routeStart: { lat: 45.5, lng: -73.6 },
        routeStartCity: "Montréal",
        routePoint,
      }),
    ).toBe(true);
  });

  it("détecte ville Montréal à 200 km avec coords corrects", () => {
    expect(
      isRefuelStopLocationSuspicious({
        latitude: 46.8,
        longitude: -71.2,
        city: "Montréal",
        distanceFromStartKm: 200,
        routeStart: { lat: 45.5, lng: -73.6 },
        routeStartCity: "Saint-Mathias-sur-Richelieu",
        routePoint,
      }),
    ).toBe(true);
  });

  it("accepte un arrêt cohérent", () => {
    expect(
      isRefuelStopLocationSuspicious({
        latitude: 46.8,
        longitude: -71.2,
        city: "Lévis",
        distanceFromStartKm: 200,
        routeStart: { lat: 45.5, lng: -73.6 },
        routeStartCity: "Montréal",
        routePoint,
      }),
    ).toBe(false);
  });
});
