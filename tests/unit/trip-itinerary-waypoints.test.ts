import { describe, expect, it } from "vitest";
import {
  buildCanonicalRoutePoints,
  buildRouteSegments,
  buildTripRouteRequest,
  getOrderedRouteStops,
} from "@/features/trips/services/build-trip-route-request";
import { countRouteStopsByKind } from "@/features/trips/lib/stop-counts";
import { computeWaypointsHash } from "@/services/maps/cache";

const montreal = {
  address: "Montréal, QC",
  lat: 45.5017,
  lng: -73.5673,
};
const gaspe = {
  address: "Gaspé, QC",
  lat: 48.8316,
  lng: -64.4869,
};
const saguenay = {
  id: "wp-saguenay",
  name: "Saguenay",
  stopType: "detour",
  sequence: 1,
  latitude: 48.4281,
  longitude: -71.0685,
  direction: "outbound",
  durationMinutes: 60,
};
const quebec = {
  id: "wp-quebec",
  name: "Québec",
  stopType: "pass_through",
  sequence: 1,
  latitude: 46.8139,
  longitude: -71.208,
  direction: "return",
  durationMinutes: 0,
};
const activity = {
  id: "wp-activity",
  name: "Parc national",
  stopType: "activity",
  sequence: 2,
  latitude: 47.5,
  longitude: -70.0,
  direction: "outbound",
  durationMinutes: 120,
};

describe("itinéraire avec détours manuels", () => {
  it("1. Montréal → Gaspé sans détour", () => {
    const req = buildTripRouteRequest({
      origin: montreal.address,
      destination: gaspe.address,
      originLatitude: montreal.lat,
      originLongitude: montreal.lng,
      destinationLatitude: gaspe.lat,
      destinationLongitude: gaspe.lng,
      stops: [],
    });
    expect(req.intermediateWaypoints).toHaveLength(0);
    expect(req.destination.lat).toBe(gaspe.lat);
    const segments = buildRouteSegments({
      origin: montreal.address,
      destination: gaspe.address,
      originLatitude: montreal.lat,
      originLongitude: montreal.lng,
      destinationLatitude: gaspe.lat,
      destinationLongitude: gaspe.lng,
      stops: [],
    });
    expect(segments).toHaveLength(1);
    expect(segments[0]?.fromName).toContain("Montréal");
    expect(segments[0]?.toName).toContain("Gaspé");
  });

  it("2. Montréal → Saguenay → Gaspé", () => {
    const req = buildTripRouteRequest({
      origin: montreal.address,
      destination: gaspe.address,
      originLatitude: montreal.lat,
      originLongitude: montreal.lng,
      destinationLatitude: gaspe.lat,
      destinationLongitude: gaspe.lng,
      stops: [saguenay],
    });
    expect(req.intermediateWaypoints).toHaveLength(1);
    expect(req.intermediateWaypoints[0]?.name).toBe("Saguenay");
    expect(req.destination.lat).toBe(gaspe.lat);

    const points = buildCanonicalRoutePoints(
      {
        originLatitude: montreal.lat,
        originLongitude: montreal.lng,
        destinationLatitude: gaspe.lat,
        destinationLongitude: gaspe.lng,
        stops: [saguenay],
      },
      "outbound",
    );
    expect(points).toHaveLength(3);
    expect(points[1]?.lat).toBeCloseTo(saguenay.latitude, 4);

    const segments = buildRouteSegments(
      {
        origin: montreal.address,
        destination: gaspe.address,
        originLatitude: montreal.lat,
        originLongitude: montreal.lng,
        destinationLatitude: gaspe.lat,
        destinationLongitude: gaspe.lng,
        stops: [saguenay],
      },
      "outbound",
    );
    expect(segments).toHaveLength(2);
    expect(segments[0]?.toName).toBe("Saguenay");
    expect(segments[1]?.fromName).toBe("Saguenay");
    expect(segments[1]?.toName).toContain("Gaspé");
  });

  it("3. deux détours sur le trajet aller", () => {
    const second = {
      ...activity,
      id: "wp-2",
      name: "Rimouski",
      stopType: "detour",
      sequence: 2,
      latitude: 48.45,
      longitude: -68.52,
    };
    const ordered = getOrderedRouteStops(
      {
        origin: montreal.address,
        destination: gaspe.address,
        originLatitude: montreal.lat,
        originLongitude: montreal.lng,
        destinationLatitude: gaspe.lat,
        destinationLongitude: gaspe.lng,
        stops: [saguenay, second],
      },
      "outbound",
    );
    expect(ordered).toHaveLength(2);
    expect(ordered.map((s) => s.name)).toEqual(["Saguenay", "Rimouski"]);
  });

  it("4. un détour uniquement sur le retour", () => {
    const outbound = getOrderedRouteStops(
      {
        origin: montreal.address,
        destination: gaspe.address,
        originLatitude: montreal.lat,
        originLongitude: montreal.lng,
        destinationLatitude: gaspe.lat,
        destinationLongitude: gaspe.lng,
        stops: [quebec],
      },
      "outbound",
    );
    expect(outbound).toHaveLength(0);

    const returnReq = buildTripRouteRequest(
      {
        origin: montreal.address,
        destination: gaspe.address,
        originLatitude: montreal.lat,
        originLongitude: montreal.lng,
        destinationLatitude: gaspe.lat,
        destinationLongitude: gaspe.lng,
        stops: [quebec],
      },
      "return",
    );
    expect(returnReq.origin.lat).toBe(gaspe.lat);
    expect(returnReq.destination.lat).toBe(montreal.lat);
    expect(returnReq.intermediateWaypoints[0]?.name).toBe("Québec");
  });

  it("5. déplacement de l'ordre de deux étapes", () => {
    const a = { ...saguenay, sequence: 1 };
    const b = {
      ...saguenay,
      id: "wp-b",
      name: "Rimouski",
      sequence: 2,
      latitude: 48.45,
      longitude: -68.52,
    };
    // Après reorder simulé : Rimouski avant Saguenay
    const reordered = [
      { ...b, sequence: 1 },
      { ...a, sequence: 2 },
    ];
    const ordered = getOrderedRouteStops(
      {
        origin: montreal.address,
        destination: gaspe.address,
        originLatitude: montreal.lat,
        originLongitude: montreal.lng,
        destinationLatitude: gaspe.lat,
        destinationLongitude: gaspe.lng,
        stops: reordered,
      },
      "outbound",
    );
    expect(ordered.map((s) => s.name)).toEqual(["Rimouski", "Saguenay"]);
  });

  it("6. suppression d'un détour", () => {
    const points = buildCanonicalRoutePoints(
      {
        originLatitude: montreal.lat,
        originLongitude: montreal.lng,
        destinationLatitude: gaspe.lat,
        destinationLongitude: gaspe.lng,
        stops: [],
      },
      "outbound",
    );
    expect(points).toHaveLength(2);
  });

  it("7. activité avec durée sur place", () => {
    expect(activity.durationMinutes).toBe(120);
    const hash = computeWaypointsHash({
      origin: montreal.address,
      destination: gaspe.address,
      stops: [
        {
          sequence: 1,
          address: activity.name,
          latitude: activity.latitude,
          longitude: activity.longitude,
          direction: "outbound",
          durationMinutes: 120,
          stopType: "activity",
        },
      ],
    });
    const hashZero = computeWaypointsHash({
      origin: montreal.address,
      destination: gaspe.address,
      stops: [
        {
          sequence: 1,
          address: activity.name,
          latitude: activity.latitude,
          longitude: activity.longitude,
          direction: "outbound",
          durationMinutes: 0,
          stopType: "activity",
        },
      ],
    });
    expect(hash).not.toBe(hashZero);
  });

  it("8. activité + détour ensemble — destination inchangée", () => {
    const req = buildTripRouteRequest({
      origin: montreal.address,
      destination: gaspe.address,
      originLatitude: montreal.lat,
      originLongitude: montreal.lng,
      destinationLatitude: gaspe.lat,
      destinationLongitude: gaspe.lng,
      stops: [saguenay, activity],
    });
    expect(req.destination.lat).toBe(gaspe.lat);
    expect(req.intermediateWaypoints).toHaveLength(2);
    const counts = countRouteStopsByKind([saguenay, activity]);
    expect(counts.activityStopCount).toBe(1);
    expect(counts.detourStopCount).toBe(1);
    expect(counts.routeStopCount).toBe(2);
  });

  it("9-10. compteurs séparent détours et activités (fuel hors stops)", () => {
    const counts = countRouteStopsByKind([
      saguenay,
      activity,
      { stopType: "detour" },
    ]);
    expect(counts.routeStopCount).toBe(3);
    expect(counts.activityStopCount).toBe(1);
    expect(counts.detourStopCount).toBe(2);
  });

  it("12. aller-retour avec étapes différentes", () => {
    const outboundSeg = buildRouteSegments(
      {
        origin: montreal.address,
        destination: gaspe.address,
        originLatitude: montreal.lat,
        originLongitude: montreal.lng,
        destinationLatitude: gaspe.lat,
        destinationLongitude: gaspe.lng,
        stops: [saguenay, quebec],
      },
      "outbound",
    );
    const returnSeg = buildRouteSegments(
      {
        origin: montreal.address,
        destination: gaspe.address,
        originLatitude: montreal.lat,
        originLongitude: montreal.lng,
        destinationLatitude: gaspe.lat,
        destinationLongitude: gaspe.lng,
        stops: [saguenay, quebec],
      },
      "return",
    );
    expect(outboundSeg).toHaveLength(2);
    expect(returnSeg).toHaveLength(2);
    expect(returnSeg[0]?.fromName).toContain("Gaspé");
    expect(returnSeg[0]?.toName).toBe("Québec");
    expect(returnSeg[1]?.toName).toContain("Montréal");
  });

  it("14. hash waypoints change si détour ajouté (persistance détectable)", () => {
    const without = computeWaypointsHash({
      origin: montreal.address,
      destination: gaspe.address,
      stops: [],
    });
    const withDetour = computeWaypointsHash({
      origin: montreal.address,
      destination: gaspe.address,
      stops: [
        {
          sequence: 1,
          address: "Saguenay",
          latitude: saguenay.latitude,
          longitude: saguenay.longitude,
          direction: "outbound",
          durationMinutes: 60,
          stopType: "detour",
        },
      ],
    });
    expect(without).not.toBe(withDetour);
  });
});
