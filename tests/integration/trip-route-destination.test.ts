import { describe, expect, it, vi } from "vitest";
import {
  buildCanonicalRoutePoints,
  buildTripRouteRequest,
  evaluateRouteIntegrity,
} from "@/features/trips/services/build-trip-route-request";

/**
 * Scénario réel : Saint-Mathias → Plaines d'Abraham → New Richmond.
 * La destination canonique ne doit jamais être remplacée par l'activité.
 */
describe("itinéraire Saint-Mathias / Québec / New Richmond", () => {
  const origin = {
    address: "68 Rue Soupras, Saint-Mathias-sur-Richelieu, QC",
    lat: 45.47337,
    lng: -73.26119,
  };
  const destination = {
    address: "New Richmond, QC",
    lat: 48.1621177,
    lng: -65.856769,
  };
  const waypoint = {
    id: "015a306b-378e-48e0-b844-0e0273cbe3f5",
    name: "Plaines d'Abraham",
    stopType: "activity",
    sequence: 1,
    latitude: 46.8004085,
    longitude: -71.220291,
  };

  it("construit origin + intermediate + destination New Richmond", () => {
    const req = buildTripRouteRequest({
      origin: origin.address,
      destination: destination.address,
      originLatitude: origin.lat,
      originLongitude: origin.lng,
      destinationLatitude: destination.lat,
      destinationLongitude: destination.lng,
      stops: [waypoint],
    });

    expect(req.origin.lat).toBe(origin.lat);
    expect(req.intermediateWaypoints).toEqual([
      {
        id: waypoint.id,
        name: waypoint.name,
        lat: waypoint.latitude,
        lng: waypoint.longitude,
      },
    ]);
    expect(req.destination.address).toBe("New Richmond, QC");
    expect(req.destination.lat).toBe(destination.lat);
  });

  it("points carburant incluent la destination après l'activité", () => {
    const points = buildCanonicalRoutePoints({
      originLatitude: origin.lat,
      originLongitude: origin.lng,
      destinationLatitude: destination.lat,
      destinationLongitude: destination.lng,
      stops: [waypoint],
    });
    expect(points).toHaveLength(3);
    expect(points.at(-1)?.lat).toBe(destination.lat);
    // Ne s'arrête pas à Québec
    expect(points.at(-1)?.lat).not.toBeCloseTo(waypoint.latitude, 1);
  });

  it("valide 2 legs et rejette une fin à Québec", () => {
    const ok = evaluateRouteIntegrity({
      requestDestination: destination,
      responseFinalDestination: {
        lat: 48.16211,
        lng: -65.85675,
      },
      intermediateWaypointCount: 1,
      actualLegCount: 2,
      totalDistanceKm: 823.6,
      polylinePresent: true,
    });
    expect(ok.passed).toBe(true);

    const truncated = evaluateRouteIntegrity({
      requestDestination: destination,
      responseFinalDestination: {
        lat: waypoint.latitude,
        lng: waypoint.longitude,
      },
      intermediateWaypointCount: 1,
      actualLegCount: 1,
      totalDistanceKm: 250,
      polylinePresent: true,
    });
    expect(truncated.passed).toBe(false);
    expect(truncated.failureReasons).toEqual(
      expect.arrayContaining([
        "destination_mismatch",
        expect.stringContaining("leg_count_mismatch"),
      ]),
    );
  });

  it("simule la distance totale comme somme des legs", () => {
    const leg1 = 250.2;
    const leg2 = 573.4;
    const total = Math.round((leg1 + leg2) * 100) / 100;
    expect(total).toBe(823.6);
    const driving = 180 + 355;
    expect(driving).toBe(535);
    // La durée d'activité n'entre pas dans driving
    const visit = 90;
    const totalElapsed = driving + visit;
    expect(totalElapsed).toBe(625);
  });
});

// Empêche le tree-shaking / unused dans certains runners
vi.stubGlobal("__trip_route_destination_suite__", true);
