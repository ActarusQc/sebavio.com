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

const baseTrip = {
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
  stops: [] as Array<{
    id: string;
    direction: string;
    latitude: number | null;
    longitude: number | null;
    sequence: number;
  }>,
};

describe("applyProposedTripAction — garde-fous emplacement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwned.mockResolvedValue(baseTrip);
    mockRecord.mockResolvedValue(undefined);
  });

  it("refuse add_activity sans coordonnées (AI_ACTION_LOCATION_REQUIRED)", async () => {
    mockResolveLocation.mockResolvedValue({
      applicable: false,
      requiresLocationConfirmation: true,
      reasonCode: "AI_ACTION_LOCATION_REQUIRED",
      message: "Sebavio doit confirmer l’emplacement",
    });

    const result = await applyProposedTripAction({
      userId: "u",
      tripId: TRIP_ID,
      action: {
        type: "add_activity",
        title: "Musée",
        durationMinutes: 60,
      },
      confirm: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("AI_ACTION_LOCATION_REQUIRED");
      expect(result.requiresLocationConfirmation).toBe(true);
      expect(result.applicable).toBe(false);
    }
    expect(mockAddStop).not.toHaveBeenCalled();
  });

  it("refuse add_pause sans coordonnées", async () => {
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
        title: "Pause",
        durationMinutes: 15,
      },
      confirm: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reasonCode).toBe("AI_ACTION_LOCATION_REQUIRED");
    }
    expect(mockAddStop).not.toHaveBeenCalled();
  });

  it("refuse coords IA non confirmées", async () => {
    mockResolveLocation.mockResolvedValue({
      applicable: false,
      requiresLocationConfirmation: true,
      reasonCode: "AI_ACTION_LOCATION_REQUIRED",
      message: "Confirmation requise",
    });

    const result = await applyProposedTripAction({
      userId: "u",
      tripId: TRIP_ID,
      action: {
        type: "add_activity",
        title: "Belvédère",
        durationMinutes: 45,
        latitude: 47.5,
        longitude: -70.1,
        locationSource: "ai_suggested",
        locationConfirmed: false,
      },
      confirm: true,
    });

    expect(result.ok).toBe(false);
    expect(mockAddStop).not.toHaveBeenCalled();
  });

  it("applique après confirmation utilisateur avec coords valides", async () => {
    mockResolveLocation.mockResolvedValue({
      applicable: true,
      location: {
        latitude: 46.81,
        longitude: -71.21,
        address: "Québec, QC",
        locationSource: "user_confirmed",
      },
    });
    mockAddStop.mockResolvedValue({
      id: "stop-1",
      name: "Musée",
      stopType: "activity",
    });
    mockGetOwned.mockResolvedValueOnce(baseTrip).mockResolvedValueOnce({
      ...baseTrip,
      route: { ...baseTrip.route, distanceKm: 1150 },
      stops: [
        {
          id: "stop-1",
          direction: "outbound",
          latitude: 46.81,
          longitude: -71.21,
          sequence: 1,
        },
      ],
    });

    const result = await applyProposedTripAction({
      userId: "u",
      tripId: TRIP_ID,
      action: {
        type: "add_activity",
        title: "Musée",
        durationMinutes: 60,
        latitude: 46.81,
        longitude: -71.21,
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
      latitude: number;
      longitude: number;
      sequence: number;
    };
    expect(payload.latitude).toBe(46.81);
    expect(payload.longitude).toBe(-71.21);
    expect(payload.sequence).toBeTypeOf("number");
  });

  it("diffère create_detour sans écriture", async () => {
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
    expect(mockResolveLocation).not.toHaveBeenCalled();
  });
});
