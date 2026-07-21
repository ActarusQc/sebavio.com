/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";
import { localizeRefuelStopsOnCalculation } from "@/features/fuel/services/localize-refuel-stops";
import type { TripFuelCalculationResult } from "@/features/fuel/lib/trip-fuel-calculator";
import type { FuelStopCandidate } from "@/features/fuel/lib/trip-fuel-types";

function makeCalc(
  stops: Array<{
    km: number;
    city: string | null;
    lat: number | null;
    lng: number | null;
  }>,
): TripFuelCalculationResult {
  const enRoute = stops.map((s, i) => ({
    id: `outbound-z-${i}`,
    leg: "outbound" as const,
    kind: "en_route" as const,
    order: i + 1,
    distanceFromStartKm: s.km,
    distanceRemainingKm: 794 - s.km,
    positionLabel: `Km ${s.km}`,
    regionLabel: "Montréal",
    pricePerLiter: 1.9,
    priceSource: "regional",
    priceGranularity: "regional" as const,
    pricePeriod: null,
    litersAdded: 16,
    tankLitersBefore: 10,
    tankLitersAfter: 26,
    tankPercentBefore: 20,
    tankPercentAfter: 50,
    cost: 30,
    rangeAfterKm: 300,
    reasonLabel: "test",
    detourKm: 0,
    stationName: null,
    address: null,
    city: s.city,
    latitude: s.lat,
    longitude: s.lng,
    isEstimatedLocation: true,
  }));

  return {
    feasible: true,
    failureMessage: null,
    tankCapacityL: 60,
    consumptionL100: 10,
    reserveLiters: 9,
    usableCapacityL: 51,
    usefulRangeKm: 510,
    initialFuelL: 60,
    fuelAfterDepartureRefillL: 60,
    remainingFuelL: 20,
    outbound: {
      leg: "outbound",
      distanceKm: 794,
      litersConsumed: 79,
      purchaseCost: 60,
      stops: enRoute,
    },
    returnLeg: null,
    totalDistanceKm: 794,
    totalLitersConsumed: 79,
    totalStopCount: enRoute.length,
    departureFillCost: 0,
    enRouteFillCost: 60,
    destinationFillCost: 0,
    finalFillCost: 0,
    moneySpent: 60,
    consumedFuelValue: 50,
    averagePurchasePrice: 1.9,
    refillStrategy: "optimized",
    selectedStrategyLabel: "test",
    warnings: [],
    simulation: null,
    allStops: enRoute,
  } as unknown as TripFuelCalculationResult;
}

function mtlGaspeLikePath() {
  return [
    { lat: 45.5, lng: -73.6 },
    { lat: 46.0, lng: -72.5 },
    { lat: 46.6, lng: -71.5 },
    { lat: 47.2, lng: -70.5 },
    { lat: 47.8, lng: -69.5 },
    { lat: 48.4, lng: -68.5 },
    { lat: 48.8, lng: -67.5 },
    { lat: 48.9, lng: -64.5 },
  ];
}

describe("localizeRefuelStopsOnCalculation — stations réelles", () => {
  it("associe une station Google Places près du routePoint", async () => {
    const path = mtlGaspeLikePath();
    const calc = makeCalc([
      { km: 200, city: "Montréal", lat: 45.5, lng: -73.6 },
    ]);

    const findGasStation = vi.fn(async () => ({
      placeId: "abc123",
      name: "Petro-Canada",
      brand: "Petro-Canada",
      address: "121, rue Principale, Saint-Apollinaire, QC",
      city: "Saint-Apollinaire",
      latitude: 46.61,
      longitude: -71.52,
      googleMapsUrl: "https://maps.google.com/?cid=1",
      pricePerLiter: null,
      priceUpdatedAt: null,
      distanceFromSearchKm: 1.8,
    }));

    await localizeRefuelStopsOnCalculation({
      calculation: calc,
      polyline: null,
      waypoints: path,
      outboundCandidates: [] as FuelStopCandidate[],
      routeStart: path[0]!,
      routeStartCity: "Montréal",
      reverseGeocode: async () => ({
        locality: "Saint-Apollinaire",
        formattedAddress: null,
      }),
      findGasStation,
      discoverFdeStations: async () => [],
    });

    const s = calc.outbound.stops[0]!;
    expect(s.stationName).toBe("Petro-Canada");
    expect(s.address).toMatch(/Principale/);
    expect(s.city).toBe("Saint-Apollinaire");
    expect(s.isEstimatedLocation).toBe(false);
    expect(s.priceGranularity).toBe("regional"); // prix inchangé
    expect(s.googleMapsUrl).toBeTruthy();
    expect(s.distanceFromRouteKm).toBeCloseTo(1.8, 1);
    expect(findGasStation).toHaveBeenCalled();
  });

  it("accepte une station FDE avec prix régional (lieu exact)", async () => {
    const path = mtlGaspeLikePath();
    const calc = makeCalc([{ km: 200, city: null, lat: null, lng: null }]);
    const station: FuelStopCandidate = {
      id: "fde-1",
      distanceFromStartKm: 200,
      detourKm: 3,
      pricePerLiter: 1.85,
      label: "Ultramar (prix régional estimé)",
      granularity: "regional",
      source: "FDE",
      isStationLevel: false,
      stationName: "Ultramar",
      address: "10 route 20",
      city: "Lévis",
      latitude: 46.55,
      longitude: -71.55,
    };

    await localizeRefuelStopsOnCalculation({
      calculation: calc,
      polyline: null,
      waypoints: path,
      outboundCandidates: [station],
      routeStart: path[0]!,
      routeStartCity: "Montréal",
      reverseGeocode: async () => ({ locality: null, formattedAddress: null }),
      findGasStation: async () => null,
      discoverFdeStations: async () => [],
    });

    const s = calc.outbound.stops[0]!;
    // Selon proximité routePoint — station ou Places null → estimé
    if (s.stationName === "Ultramar") {
      expect(s.isEstimatedLocation).toBe(false);
      expect(s.city).toBe("Lévis");
    }
  });

  it("ne laisse pas Montréal comme ville à 200 et 400 km sans Places", async () => {
    const path = mtlGaspeLikePath();
    const calc = makeCalc([
      { km: 200, city: "Montréal", lat: 45.5, lng: -73.6 },
      { km: 400, city: "Montréal", lat: 45.5, lng: -73.6 },
    ]);

    await localizeRefuelStopsOnCalculation({
      calculation: calc,
      polyline: null,
      waypoints: path,
      outboundCandidates: [],
      routeStart: path[0]!,
      routeStartCity: "Montréal",
      reverseGeocode: async ({ latitude }) => ({
        locality: latitude < 47 ? "Drummondville" : "Rimouski",
        formattedAddress: null,
      }),
      findGasStation: async () => null,
      discoverFdeStations: async () => [],
    });

    expect(calc.outbound.stops[0]!.city).not.toBe("Montréal");
    expect(calc.outbound.stops[1]!.city).not.toBe("Montréal");
    expect(calc.outbound.stops[0]!.isEstimatedLocation).toBe(true);
  });
});
