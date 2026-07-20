import { describe, expect, it, vi, beforeEach } from "vitest";

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

describe("applyProposedTripAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwned.mockResolvedValue({ id: "trip" });
  });

  it("refuse sans confirmation", async () => {
    const result = await applyProposedTripAction({
      userId: "u",
      tripId: "00000000-0000-4000-8000-000000000001",
      action: {
        type: "add_pause",
        title: "Pause",
        durationMinutes: 15,
      },
      confirm: false,
    });
    expect(result.ok).toBe(false);
  });

  it("applique add_pause via addStop", async () => {
    mockAddStop.mockResolvedValue({});
    const result = await applyProposedTripAction({
      userId: "u",
      tripId: "00000000-0000-4000-8000-000000000001",
      action: {
        type: "add_pause",
        title: "Pause café",
        durationMinutes: 15,
        direction: "outbound",
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
      tripId: "00000000-0000-4000-8000-000000000001",
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
      tripId: "00000000-0000-4000-8000-000000000001",
      action: { type: "add_pause", title: "x", durationMinutes: 99999 },
      confirm: true,
    });
    expect(result.ok).toBe(false);
  });
});
