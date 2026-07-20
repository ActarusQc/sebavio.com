import { describe, expect, it, vi, beforeEach } from "vitest";

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

describe("applyProposedTripAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwned.mockResolvedValue({
      id: "trip",
      destination: "New Richmond, QC",
      originLatitude: 45.5,
      originLongitude: -73.5,
      destinationLatitude: 48.16,
      destinationLongitude: -65.86,
      route: {
        distanceKm: 1144,
        estimatedFuelCost: 100,
        fuelEstimateStale: false,
      },
      stops: [],
    });
    mockRecord.mockResolvedValue(undefined);
  });

  it("refuse sans confirmation", async () => {
    const result = await applyProposedTripAction({
      userId: "u",
      tripId: TRIP_ID,
      action: {
        type: "add_pause",
        title: "Pause",
        durationMinutes: 15,
      },
      confirm: false,
    });
    expect(result.ok).toBe(false);
  });

  it("refuse add_pause sans emplacement confirmé", async () => {
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
        type: "add_pause",
        title: "Pause café",
        durationMinutes: 15,
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

  it("applique add_pause via addStop après confirmation d'emplacement", async () => {
    mockResolveLocation.mockResolvedValue({
      applicable: true,
      location: {
        latitude: 46.8,
        longitude: -71.2,
        address: "Québec",
        locationSource: "user_confirmed",
      },
    });
    mockAddStop.mockResolvedValue({ id: "s1" });
    mockGetOwned
      .mockResolvedValueOnce({
        id: "trip",
        destination: "New Richmond, QC",
        originLatitude: 45.5,
        originLongitude: -73.5,
        destinationLatitude: 48.16,
        destinationLongitude: -65.86,
        route: {
          distanceKm: 1144,
          estimatedFuelCost: 100,
          fuelEstimateStale: false,
        },
        stops: [],
      })
      .mockResolvedValueOnce({
        id: "trip",
        destination: "New Richmond, QC",
        originLatitude: 45.5,
        originLongitude: -73.5,
        destinationLatitude: 48.16,
        destinationLongitude: -65.86,
        route: {
          distanceKm: 1150,
          estimatedFuelCost: 100,
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
      });

    const result = await applyProposedTripAction({
      userId: "u",
      tripId: TRIP_ID,
      action: {
        type: "add_pause",
        title: "Pause café",
        durationMinutes: 15,
        direction: "outbound",
        latitude: 46.8,
        longitude: -71.2,
        locationSource: "user_confirmed",
        locationConfirmed: true,
        confirmLargeDetour: true,
      },
      confirm: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.applied).toBe(true);
    expect(mockAddStop).toHaveBeenCalledOnce();
  });

  it("diffère create_detour en v1", async () => {
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
    if (result.ok) {
      expect(result.applied).toBe(false);
      expect("deferred" in result && result.deferred).toBe(true);
    }
    expect(mockAddStop).not.toHaveBeenCalled();
  });

  it("refuse une action Zod invalide", async () => {
    const result = await applyProposedTripAction({
      userId: "u",
      tripId: TRIP_ID,
      action: { type: "add_pause", title: "x", durationMinutes: 99999 },
      confirm: true,
    });
    expect(result.ok).toBe(false);
  });
});
