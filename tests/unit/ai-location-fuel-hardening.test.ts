import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppError } from "@/lib/errors";
import {
  isValidCoordinatePair,
  isPointInTripCorridor,
  estimateInsertedDetourKm,
  haversineKm,
} from "@/features/ai/lib/location-resolve";
import {
  AI_DISTANCE_WARN_KM,
  AI_DISTANCE_WARN_RATIO,
  AI_DISTANCE_REFUSE_RATIO,
} from "@/features/ai/lib/distance-guards";
import { computeOutboundInsertSequence } from "@/features/trips/services/route-stop-order";
import { actionNeedsLocationConfirmation } from "@/features/ai/services/apply-action-client";

describe("location-resolve utils", () => {
  it("refuse latitude hors plage", () => {
    expect(isValidCoordinatePair(91, -73)).toBe(false);
    expect(isValidCoordinatePair(-91, -73)).toBe(false);
  });

  it("refuse longitude hors plage / NaN / null", () => {
    expect(isValidCoordinatePair(45, 181)).toBe(false);
    expect(isValidCoordinatePair(45, Number.NaN)).toBe(false);
    expect(isValidCoordinatePair(null, -73)).toBe(false);
    expect(isValidCoordinatePair(45, Infinity)).toBe(false);
  });

  it("accepte des coords QC valides", () => {
    expect(isValidCoordinatePair(45.51, -73.15)).toBe(true);
  });

  it("détecte un point hors corridor (autre pays)", () => {
    const inCorridor = isPointInTripCorridor(
      { lat: 47.0, lng: -70.0 },
      {
        origin: { lat: 45.51, lng: -73.15 },
        destination: { lat: 48.16, lng: -65.86 },
        stops: [],
        tripDistanceKm: 1144,
        maxCorridorDetourKm: 150,
      },
    );
    expect(inCorridor).toBe(true);

    const farAway = isPointInTripCorridor(
      { lat: 48.85, lng: 2.35 }, // Paris
      {
        origin: { lat: 45.51, lng: -73.15 },
        destination: { lat: 48.16, lng: -65.86 },
        stops: [],
        tripDistanceKm: 1144,
        maxCorridorDetourKm: 150,
      },
    );
    expect(farAway).toBe(false);
  });

  it("estime un détour d'insertion", () => {
    const detour = estimateInsertedDetourKm({
      point: { lat: 46.8, lng: -71.2 },
      prev: { lat: 45.51, lng: -73.15 },
      next: { lat: 48.16, lng: -65.86 },
    });
    expect(detour).toBeGreaterThan(0);
  });
});

describe("distance guards constants", () => {
  it("expose les seuils centralisés", () => {
    expect(AI_DISTANCE_WARN_KM).toBe(100);
    expect(AI_DISTANCE_WARN_RATIO).toBe(0.2);
    expect(AI_DISTANCE_REFUSE_RATIO).toBe(0.5);
  });
});

describe("computeOutboundInsertSequence — corridor Gaspé", () => {
  const origin = { lat: 45.51, lng: -73.15 };
  const destination = { lat: 48.16, lng: -65.86 };

  it("place une activité proche de l'origine en début", () => {
    const seq = computeOutboundInsertSequence({
      activity: { lat: 45.6, lng: -73.0 },
      origin,
      destination,
      existingStops: [],
    });
    expect(seq).toBe(1);
  });

  it("place une activité proche de la destination en fin (avant dest)", () => {
    const seq = computeOutboundInsertSequence({
      activity: { lat: 48.1, lng: -66.0 },
      origin,
      destination,
      existingStops: [{ latitude: 46.8, longitude: -71.2 }],
    });
    expect(seq).toBe(2);
  });

  it("insère entre deux étapes existantes", () => {
    const seq = computeOutboundInsertSequence({
      activity: { lat: 47.0, lng: -70.5 },
      origin,
      destination,
      existingStops: [
        { latitude: 46.0, longitude: -72.0 },
        { latitude: 47.8, longitude: -68.0 },
      ],
    });
    expect(seq).toBe(2);
  });

  it("ne double pas anormalement la distance haversine OD", () => {
    const od = haversineKm(origin, destination);
    const via =
      haversineKm(origin, { lat: 46.8, lng: -71.2 }) +
      haversineKm({ lat: 46.8, lng: -71.2 }, destination);
    expect(via / od).toBeLessThan(1.5);
  });
});

describe("actionNeedsLocationConfirmation", () => {
  it("exige confirmation sans coords", () => {
    expect(
      actionNeedsLocationConfirmation({
        type: "add_activity",
        title: "X",
        durationMinutes: 60,
        locationSource: "ai_suggested",
        locationConfirmed: false,
        confirmLargeDetour: false,
        direction: "outbound",
        placement: "outbound",
      }),
    ).toBe(true);
  });

  it("exige confirmation pour ai_suggested même avec coords", () => {
    expect(
      actionNeedsLocationConfirmation({
        type: "add_pause",
        title: "Pause",
        durationMinutes: 15,
        latitude: 46.8,
        longitude: -71.2,
        locationSource: "ai_suggested",
        locationConfirmed: false,
        confirmLargeDetour: false,
        direction: "outbound",
      }),
    ).toBe(true);
  });

  it("n'exige pas si user_confirmed", () => {
    expect(
      actionNeedsLocationConfirmation({
        type: "add_activity",
        title: "X",
        durationMinutes: 60,
        latitude: 46.8,
        longitude: -71.2,
        locationSource: "user_confirmed",
        locationConfirmed: true,
        confirmLargeDetour: false,
        direction: "outbound",
        placement: "outbound",
      }),
    ).toBe(false);
  });
});

describe("recalculateTripItineraryAtomic — fuel stale", () => {
  const mockFindUnique = vi.fn();
  const mockUpdate = vi.fn();
  const mockAssert = vi.fn();
  const mockRebuild = vi.fn();
  const mockGetTrip = vi.fn();
  const mockEstimate = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("conserve le coût carburant et marque stale si FDE échoue", async () => {
    mockFindUnique.mockResolvedValue({
      estimatedFuelCost: { toString: () => "117.09" },
      distanceKm: 1144,
    });
    mockUpdate.mockResolvedValue({});
    mockAssert.mockResolvedValue(undefined);
    mockRebuild.mockResolvedValue({});
    mockGetTrip.mockResolvedValue({
      id: "t",
      returnDate: null,
      route: {
        estimatedFuelCost: "117.09",
        fuelEstimateStale: true,
        distanceKm: "1150",
      },
    });
    mockEstimate.mockRejectedValue(
      new AppError("EXT_005", "FDE rate limit", 429),
    );

    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        tripRoute: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      },
    }));
    vi.doMock("@/features/trips/services/access-gate", () => ({
      assertFullTripAccess: mockAssert,
    }));
    vi.doMock("@/features/trips/services/trips", () => ({
      rebuildTripRouteFromCanonicalData: mockRebuild,
      getTripById: mockGetTrip,
    }));
    vi.doMock("@/features/fuel/services/estimate", () => ({
      estimateTripFuel: mockEstimate,
    }));

    const { recalculateTripItineraryAtomic } =
      await import("@/features/trips/services/recalculate-itinerary");

    const result = await recalculateTripItineraryAtomic("u", "t");

    expect(result.fuelRecalculated).toBe(false);
    expect(result.fuelCalculationStatus).toBe("stale");
    expect(result.fuelStopCount).toBe(-1);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fuelEstimateStale: true,
        }),
      }),
    );
    // Ne restaure PAS l'ancienne géométrie — seul le coût fuel est préservé
    expect(mockUpdate.mock.calls[0][0].data.distanceKm).toBeUndefined();
  });

  it("retourne current si le calcul fuel réussit", async () => {
    mockFindUnique.mockResolvedValue({
      estimatedFuelCost: { toString: () => "117.09" },
    });
    mockAssert.mockResolvedValue(undefined);
    mockRebuild.mockResolvedValue({});
    mockGetTrip.mockResolvedValue({ id: "t", returnDate: null });
    mockEstimate.mockResolvedValue({
      calculation: {
        feasible: true,
        outbound: { refuelStops: [{}, {}] },
        returnLeg: null,
      },
    });

    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        tripRoute: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      },
    }));
    vi.doMock("@/features/trips/services/access-gate", () => ({
      assertFullTripAccess: mockAssert,
    }));
    vi.doMock("@/features/trips/services/trips", () => ({
      rebuildTripRouteFromCanonicalData: mockRebuild,
      getTripById: mockGetTrip,
    }));
    vi.doMock("@/features/fuel/services/estimate", () => ({
      estimateTripFuel: mockEstimate,
    }));

    const { recalculateTripItineraryAtomic } =
      await import("@/features/trips/services/recalculate-itinerary");

    const result = await recalculateTripItineraryAtomic("u", "t");
    expect(result.fuelCalculationStatus).toBe("current");
    expect(result.fuelStopCount).toBe(2);
    expect(result.fuelRecalculated).toBe(true);
  });
});
