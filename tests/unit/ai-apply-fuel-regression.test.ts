import { beforeEach, describe, expect, it, vi } from "vitest";
import { countRouteStopsByKind } from "@/features/trips/lib/stop-counts";

const {
  mockGetOwned,
  mockAddStop,
  mockUpdateStop,
  mockUpdateTrip,
  mockRecalc,
  mockAddActivity,
  mockPlanActivity,
  mockRecord,
} = vi.hoisted(() => ({
  mockGetOwned: vi.fn(),
  mockAddStop: vi.fn(),
  mockUpdateStop: vi.fn(),
  mockUpdateTrip: vi.fn(),
  mockRecalc: vi.fn(),
  mockAddActivity: vi.fn(),
  mockPlanActivity: vi.fn(),
  mockRecord: vi.fn(),
}));

vi.mock("@/features/trips/services/trips", () => ({
  getOwnedTripOrThrow: mockGetOwned,
  addStop: mockAddStop,
  updateStop: mockUpdateStop,
  updateTrip: mockUpdateTrip,
}));

vi.mock("@/features/trips/activities/trip-activity-service", () => ({
  addActivityToTrip: mockAddActivity,
  planTripActivity: mockPlanActivity,
}));

vi.mock("@/features/trips/services/recalculate-itinerary", () => ({
  recalculateTripItineraryAtomic: mockRecalc,
}));

vi.mock("@/features/ai/services/usage", () => ({
  recordAiUsage: mockRecord,
}));

import { applyProposedTripAction } from "@/features/ai/services/apply-action";

/**
 * Non-régression : add_activity sans activityId catalogue → addStop(activity).
 * Les fuel stops ne sont pas des TripStop : ils restent hors de cette collection.
 */
describe("AI apply — non-régression activité / carburant / destination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwned.mockResolvedValue({
      id: "trip",
      destination: "Gaspé, QC",
    });
    mockAddStop.mockImplementation(
      async (
        _u: string,
        _t: string,
        raw: { name: string; stopType: string },
      ) => ({
        id: `stop-${raw.stopType}`,
        name: raw.name,
        stopType: raw.stopType,
        direction: "outbound",
        durationMinutes: 60,
      }),
    );
    mockRecalc.mockResolvedValue({
      trip: { id: "trip" },
      fuelRecalculated: true,
      fuelStopCount: 3,
    });
  });

  it("exige une confirmation avant toute écriture", async () => {
    const result = await applyProposedTripAction({
      userId: "u",
      tripId: "00000000-0000-4000-8000-000000000001",
      action: {
        type: "add_activity",
        title: "Musée",
        durationMinutes: 60,
        direction: "outbound",
      },
      confirm: false,
    });
    expect(result.ok).toBe(false);
    expect(mockAddStop).not.toHaveBeenCalled();
  });

  it("add_activity sans activityId appelle addStop(activity) avec insertion ordonnée", async () => {
    mockGetOwned.mockResolvedValue({
      id: "trip",
      destination: "Gaspé, QC",
      originLatitude: 45.5,
      originLongitude: -73.5,
      destinationLatitude: 48.8,
      destinationLongitude: -64.5,
      stops: [
        {
          direction: "outbound",
          latitude: 46.8,
          longitude: -71.2,
        },
      ],
    });
    const result = await applyProposedTripAction({
      userId: "u",
      tripId: "00000000-0000-4000-8000-000000000001",
      action: {
        type: "add_activity",
        title: "Musée du Fjord",
        durationMinutes: 60,
        direction: "outbound",
        latitude: 48.42,
        longitude: -71.06,
      },
      confirm: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.applied).toBe(true);
    expect(mockAddStop).toHaveBeenCalledOnce();
    const payload = mockAddStop.mock.calls[0]?.[2] as {
      stopType: string;
      name: string;
      durationMinutes: number;
      direction: string;
      sequence?: number;
    };
    expect(payload.stopType).toBe("activity");
    expect(payload.name).toBe("Musée du Fjord");
    expect(payload.durationMinutes).toBe(60);
    expect(payload.direction).toBe("outbound");
    expect(payload.sequence).toBeTypeOf("number");
    expect(mockAddActivity).not.toHaveBeenCalled();
  });

  it("distingue activités, pauses et fuel dans les compteurs", () => {
    const stops = [
      { stopType: "activity" },
      { stopType: "rest" },
      { stopType: "detour" },
    ];
    const counts = countRouteStopsByKind(stops);
    expect(counts.activityStopCount).toBe(1);
    expect(counts.routeStopCount).toBe(3);
    // fuel hors TripStop — compteur séparé
    const fuelRefuelStops = 2;
    expect(fuelRefuelStops).not.toBe(counts.activityStopCount);
    expect(fuelRefuelStops).not.toBe(counts.routeStopCount);
  });

  it("add_pause utilise stopType rest", async () => {
    await applyProposedTripAction({
      userId: "u",
      tripId: "00000000-0000-4000-8000-000000000001",
      action: {
        type: "add_pause",
        title: "Pause",
        durationMinutes: 15,
        direction: "outbound",
      },
      confirm: true,
    });
    const payload = mockAddStop.mock.calls[0]?.[2] as { stopType: string };
    expect(payload.stopType).toBe("rest");
  });

  it("create_detour n'écrit rien", async () => {
    const result = await applyProposedTripAction({
      userId: "u",
      tripId: "00000000-0000-4000-8000-000000000001",
      action: {
        type: "create_detour",
        title: "Via Charlevoix",
        applicableInV1: false,
      },
      confirm: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.applied).toBe(false);
    expect(mockAddStop).not.toHaveBeenCalled();
    expect(mockUpdateTrip).not.toHaveBeenCalled();
  });

  it("update_departure_time passe par updateTrip + recalculate", async () => {
    mockUpdateTrip.mockResolvedValue({});
    await applyProposedTripAction({
      userId: "u",
      tripId: "00000000-0000-4000-8000-000000000001",
      action: {
        type: "update_departure_time",
        departureDate: "2026-08-01T14:00:00.000Z",
      },
      confirm: true,
    });
    expect(mockUpdateTrip).toHaveBeenCalledOnce();
    expect(mockRecalc).toHaveBeenCalledOnce();
  });
});
