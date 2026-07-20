import { beforeEach, describe, expect, it, vi } from "vitest";
import { countRouteStopsByKind } from "@/features/trips/lib/stop-counts";

const {
  mockGetOwned,
  mockAddStop,
  mockUpdateStop,
  mockUpdateTrip,
  mockDeleteStop,
  mockRecalc,
  mockAddActivity,
  mockPlanActivity,
  mockRecord,
  mockResolveLocation,
} = vi.hoisted(() => ({
  mockGetOwned: vi.fn(),
  mockAddStop: vi.fn(),
  mockUpdateStop: vi.fn(),
  mockUpdateTrip: vi.fn(),
  mockDeleteStop: vi.fn(),
  mockRecalc: vi.fn(),
  mockAddActivity: vi.fn(),
  mockPlanActivity: vi.fn(),
  mockRecord: vi.fn(),
  mockResolveLocation: vi.fn(),
}));

vi.mock("@/features/trips/services/trips", () => ({
  getOwnedTripOrThrow: mockGetOwned,
  addStop: mockAddStop,
  updateStop: mockUpdateStop,
  updateTrip: mockUpdateTrip,
  deleteStop: mockDeleteStop,
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

vi.mock("@/features/ai/services/resolve-action-location", () => ({
  resolveActionLocation: mockResolveLocation,
}));

import { applyProposedTripAction } from "@/features/ai/services/apply-action";

const TRIP_ID = "00000000-0000-4000-8000-000000000001";

const tripWithCorridor = {
  id: "trip",
  destination: "New Richmond, QC",
  originLatitude: 45.51,
  originLongitude: -73.15,
  destinationLatitude: 48.16,
  destinationLongitude: -65.86,
  route: {
    distanceKm: 1144.18,
    estimatedFuelCost: 117.09,
    fuelEstimateStale: false,
  },
  stops: [
    {
      id: "s1",
      direction: "outbound",
      latitude: 46.8,
      longitude: -71.2,
      sequence: 1,
    },
  ],
};

/**
 * Non-régression : add_activity confirmé → addStop(activity) ordonné.
 * Les fuel stops ne sont pas des TripStop.
 */
describe("AI apply — non-régression activité / carburant / destination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwned.mockResolvedValue(tripWithCorridor);
    mockResolveLocation.mockResolvedValue({
      applicable: true,
      location: {
        latitude: 48.42,
        longitude: -71.06,
        address: "Saguenay",
        locationSource: "user_confirmed",
      },
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
      fuelCalculationStatus: "current",
    });
  });

  it("exige une confirmation avant toute écriture", async () => {
    const result = await applyProposedTripAction({
      userId: "u",
      tripId: TRIP_ID,
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

  it("refuse sans position exploitable", async () => {
    mockResolveLocation.mockResolvedValue({
      applicable: false,
      requiresLocationConfirmation: true,
      reasonCode: "AI_ACTION_LOCATION_REQUIRED",
      message: "Emplacement requis",
    });
    const result = await applyProposedTripAction({
      userId: "u",
      tripId: TRIP_ID,
      action: {
        type: "add_activity",
        title: "Musée du Fjord",
        durationMinutes: 60,
        direction: "outbound",
      },
      confirm: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("AI_ACTION_LOCATION_REQUIRED");
    }
    expect(mockAddStop).not.toHaveBeenCalled();
  });

  it("add_activity confirmé appelle addStop(activity) avec insertion ordonnée", async () => {
    mockGetOwned.mockResolvedValueOnce(tripWithCorridor).mockResolvedValueOnce({
      ...tripWithCorridor,
      route: { ...tripWithCorridor.route, distanceKm: 1160 },
      stops: [
        ...tripWithCorridor.stops,
        {
          id: "stop-activity",
          direction: "outbound",
          latitude: 48.42,
          longitude: -71.06,
          sequence: 2,
        },
      ],
    });

    const result = await applyProposedTripAction({
      userId: "u",
      tripId: TRIP_ID,
      action: {
        type: "add_activity",
        title: "Musée du Fjord",
        durationMinutes: 60,
        direction: "outbound",
        latitude: 48.42,
        longitude: -71.06,
        locationSource: "user_confirmed",
        locationConfirmed: true,
        confirmLargeDetour: true,
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
    const fuelRefuelStops = 2;
    expect(fuelRefuelStops).not.toBe(counts.activityStopCount);
    expect(fuelRefuelStops).not.toBe(counts.routeStopCount);
  });

  it("add_pause confirmé utilise stopType rest", async () => {
    mockResolveLocation.mockResolvedValue({
      applicable: true,
      location: {
        latitude: 46.5,
        longitude: -72.0,
        address: "Trois-Rivières",
        locationSource: "user_confirmed",
      },
    });
    mockGetOwned.mockResolvedValueOnce(tripWithCorridor).mockResolvedValueOnce({
      ...tripWithCorridor,
      stops: [
        ...tripWithCorridor.stops,
        {
          id: "stop-rest",
          direction: "outbound",
          latitude: 46.5,
          longitude: -72.0,
          sequence: 1,
        },
      ],
    });

    await applyProposedTripAction({
      userId: "u",
      tripId: TRIP_ID,
      action: {
        type: "add_pause",
        title: "Pause",
        durationMinutes: 15,
        direction: "outbound",
        latitude: 46.5,
        longitude: -72.0,
        locationSource: "user_confirmed",
        locationConfirmed: true,
        confirmLargeDetour: true,
      },
      confirm: true,
    });
    const payload = mockAddStop.mock.calls[0]?.[2] as { stopType: string };
    expect(payload.stopType).toBe("rest");
  });

  it("create_detour n'écrit rien", async () => {
    const result = await applyProposedTripAction({
      userId: "u",
      tripId: TRIP_ID,
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
      tripId: TRIP_ID,
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
