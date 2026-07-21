import { describe, expect, it } from "vitest";
import {
  candidateHasRealStationIdentity,
  positionLabelFromCandidate,
  stationFieldsFromCandidate,
  type FuelStopCandidate,
} from "@/features/fuel/lib/trip-fuel-types";

function candidate(overrides: Partial<FuelStopCandidate>): FuelStopCandidate {
  return {
    id: "st-1",
    distanceFromStartKm: 200,
    detourKm: 2,
    pricePerLiter: 2.037,
    label: "Filgo Saint-Apollinaire",
    granularity: "regional",
    source: "FDE",
    isStationLevel: false,
    sourceType: "regional_estimate",
    isExactForStation: false,
    stationName: "Filgo Saint-Apollinaire",
    address: "100 Route 273",
    city: "Saint-Apollinaire",
    latitude: 46.61,
    longitude: -71.52,
    ...overrides,
  };
}

describe("identité station candidate", () => {
  it("conserve le lieu même si le prix est une estimation régionale", () => {
    const c = candidate({});
    expect(candidateHasRealStationIdentity(c)).toBe(true);
    const loc = stationFieldsFromCandidate(c);
    expect(loc.stationName).toBe("Filgo Saint-Apollinaire");
    expect(loc.city).toBe("Saint-Apollinaire");
    expect(loc.isEstimatedLocation).toBe(false);
    expect(positionLabelFromCandidate(c)).toBe("Filgo Saint-Apollinaire");
  });

  it("rejette les zones de repli sans station réelle", () => {
    const c = candidate({
      id: "zone-200",
      label: "Km 200",
      stationName: null,
      address: null,
      city: null,
      latitude: 46.8,
      longitude: -71.2,
      sourceType: "route_fallback",
    });
    expect(candidateHasRealStationIdentity(c)).toBe(false);
    expect(stationFieldsFromCandidate(c).isEstimatedLocation).toBe(true);
    expect(positionLabelFromCandidate(c)).toMatch(/Zone de ravitaillement/);
  });
});
