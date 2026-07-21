import { describe, expect, it } from "vitest";
import {
  buildCanonicalRoutePoints,
  buildTripRouteRequest,
  computeActivityPlacement,
  coordinatesApproximatelyEqual,
  evaluateRouteIntegrity,
  getOrderedRouteStops,
  MAX_DESTINATION_ACTIVITY_RADIUS_KM,
} from "@/features/trips/services/build-trip-route-request";

const origin = {
  address: "68 Rue Soupras, Saint-Mathias-sur-Richelieu, QC",
  lat: 45.47337,
  lng: -73.26119,
};
const destination = {
  address: "New Richmond, QC",
  lat: 48.16211,
  lng: -65.85675,
};
const plaines = {
  id: "stop-plaines",
  name: "Plaines d'Abraham",
  stopType: "activity",
  sequence: 1,
  latitude: 46.8004085,
  longitude: -71.220291,
};

describe("buildTripRouteRequest", () => {
  it("conserve la destination du Trip et place l'activité en waypoint", () => {
    const req = buildTripRouteRequest({
      origin: origin.address,
      destination: destination.address,
      originLatitude: origin.lat,
      originLongitude: origin.lng,
      destinationLatitude: destination.lat,
      destinationLongitude: destination.lng,
      stops: [plaines],
    });
    expect(req.destination.lat).toBe(destination.lat);
    expect(req.destination.lng).toBe(destination.lng);
    expect(req.destination.address).toBe(destination.address);
    expect(req.intermediateWaypoints).toHaveLength(1);
    expect(req.intermediateWaypoints[0]?.name).toBe("Plaines d'Abraham");
  });

  it("ne traite jamais le dernier TripStop comme destination", () => {
    const points = buildCanonicalRoutePoints({
      originLatitude: origin.lat,
      originLongitude: origin.lng,
      destinationLatitude: destination.lat,
      destinationLongitude: destination.lng,
      stops: [plaines],
    });
    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ lat: origin.lat, lng: origin.lng });
    expect(points[1]?.lat).toBeCloseTo(plaines.latitude, 5);
    expect(points[2]).toEqual({ lat: destination.lat, lng: destination.lng });
  });

  it("exclut les stops origin/destination du tableau intermédiaire", () => {
    const ordered = getOrderedRouteStops({
      origin: origin.address,
      destination: destination.address,
      originLatitude: origin.lat,
      originLongitude: origin.lng,
      destinationLatitude: destination.lat,
      destinationLongitude: destination.lng,
      stops: [
        { ...plaines, stopType: "origin" },
        { ...plaines, id: "real", stopType: "activity" },
      ],
    });
    expect(ordered).toHaveLength(1);
    expect(ordered[0]?.id).toBe("real");
  });
});

describe("route integrity", () => {
  it("exige legCount = waypoints + 1 et destination concordante", () => {
    const ok = evaluateRouteIntegrity({
      requestDestination: destination,
      responseFinalDestination: destination,
      intermediateWaypointCount: 1,
      actualLegCount: 2,
      totalDistanceKm: 823.6,
      polylinePresent: true,
    });
    expect(ok.passed).toBe(true);

    const badDest = evaluateRouteIntegrity({
      requestDestination: destination,
      responseFinalDestination: {
        lat: plaines.latitude,
        lng: plaines.longitude,
      },
      intermediateWaypointCount: 1,
      actualLegCount: 2,
      totalDistanceKm: 250,
      polylinePresent: true,
    });
    expect(badDest.passed).toBe(false);
    expect(badDest.failureReasons).toContain("destination_mismatch");

    const badLegs = evaluateRouteIntegrity({
      requestDestination: destination,
      responseFinalDestination: destination,
      intermediateWaypointCount: 2,
      actualLegCount: 2,
      totalDistanceKm: 900,
      polylinePresent: true,
    });
    expect(badLegs.passed).toBe(false);
  });

  it("deux waypoints → trois legs attendus", () => {
    const check = evaluateRouteIntegrity({
      requestDestination: destination,
      responseFinalDestination: destination,
      intermediateWaypointCount: 2,
      actualLegCount: 3,
      totalDistanceKm: 900,
      polylinePresent: true,
    });
    expect(check.passed).toBe(true);
    expect(check.actualLegCount).toBe(3);
  });
});

describe("computeActivityPlacement", () => {
  it("reclasse Québec loin de New Richmond comme outbound", () => {
    const placement = computeActivityPlacement({
      activity: { lat: plaines.latitude, lng: plaines.longitude },
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      maxDestinationRadiusKm: MAX_DESTINATION_ACTIVITY_RADIUS_KM,
    });
    expect(placement).toBe("outbound");
  });

  it("détecte near_destination dans le rayon", () => {
    const placement = computeActivityPlacement({
      activity: {
        lat: destination.lat + 0.05,
        lng: destination.lng + 0.05,
      },
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
    });
    expect(placement).toBe("near_destination");
  });
});

describe("coordinatesApproximatelyEqual", () => {
  it("accepte New Richmond vs fin de polyline proche", () => {
    expect(
      coordinatesApproximatelyEqual(destination, {
        lat: 48.16211,
        lng: -65.85675,
      }),
    ).toBe(true);
    expect(
      coordinatesApproximatelyEqual(destination, {
        lat: plaines.latitude,
        lng: plaines.longitude,
      }),
    ).toBe(false);
  });
});
