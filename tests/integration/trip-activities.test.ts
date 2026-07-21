import { beforeEach, describe, expect, it, vi } from "vitest";

const tripId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherUserId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const activityId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const findFirstTrip = vi.fn();
const findUniqueProfile = vi.fn();
const upsertProfile = vi.fn();
const findManyActivities = vi.fn();
const findFirstActivity = vi.fn();
const updateActivity = vi.fn();
const deleteManyActivities = vi.fn();
const createManyActivities = vi.fn();
const updateProfile = vi.fn();
const writeAuditLog = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trip: {
      findFirst: (...args: unknown[]) => findFirstTrip(...args),
    },
    tripTravelerProfile: {
      findUnique: (...args: unknown[]) => findUniqueProfile(...args),
      findUniqueOrThrow: (...args: unknown[]) => findUniqueProfile(...args),
      upsert: (...args: unknown[]) => upsertProfile(...args),
      update: (...args: unknown[]) => updateProfile(...args),
    },
    tripActivity: {
      findMany: (...args: unknown[]) => findManyActivities(...args),
      findFirst: (...args: unknown[]) => findFirstActivity(...args),
      update: (...args: unknown[]) => updateActivity(...args),
      deleteMany: (...args: unknown[]) => deleteManyActivities(...args),
      createMany: (...args: unknown[]) => createManyActivities(...args),
    },
  },
}));

vi.mock("@/features/auth/services/audit", () => ({
  writeAuditLog: (...args: unknown[]) => writeAuditLog(...args),
}));

vi.mock("@/features/trips/activities/trip-activity-cache", () => ({
  acquireGenerationLock: vi.fn(async () => true),
  releaseGenerationLock: vi.fn(async () => undefined),
}));

vi.mock("@/features/trips/activities/trip-activity-search-service", () => ({
  searchAndRankTripActivities: vi.fn(async () => ({
    ranked: [
      {
        googlePlaceId: "mock_place_1",
        name: "Aquarium mock",
        address: "1 rue",
        city: "Québec",
        latitude: 46.8,
        longitude: -71.2,
        primaryType: "aquarium",
        types: ["aquarium"],
        rating: 4.5,
        reviewCount: 100,
        priceLevel: "PRICE_LEVEL_MODERATE",
        websiteUrl: null,
        googleMapsUrl: "https://maps.google.com",
        photoReference: null,
        estimatedVisitMinutes: 90,
        searchZoneKind: "destination",
        suitabilityScore: 72,
        suitabilityReasons: ["Test"],
        warningReasons: [],
        detourDistanceKm: 2,
        detourDurationMinutes: 5,
        routePositionKm: 200,
        suggestedForSegment: "destination",
        environmentGuess: "indoor",
      },
    ],
    meta: {
      tripId,
      searchZoneCount: 1,
      rawCandidateCount: 1,
      deduplicatedCount: 1,
      rankedCount: 1,
      returnedCount: 1,
      cacheHit: false,
      durationMs: 12,
      provider: "mock",
      detourCalculations: 1,
      filteredByDetour: 0,
    },
  })),
}));

vi.mock("@/features/trips/services/trips", () => ({
  getOwnedTripOrThrow: vi.fn(async (uid: string, tid: string) => {
    if (uid !== userId || tid !== tripId) {
      const { AppError } = await import("@/lib/errors");
      throw new AppError("TRIP_001", "Voyage introuvable", 404);
    }
    return {
      id: tripId,
      userId,
      status: "planned",
      originLatitude: 46.8,
      originLongitude: -71.3,
      destinationLatitude: 46.9,
      destinationLongitude: -71.1,
      stops: [],
      route: {
        polyline: null,
        distanceKm: 40,
        estimatedDurationMin: 45,
        waypointsHash: "hash-before",
      },
    };
  }),
  addStop: vi.fn(async () => ({
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    name: "Aquarium mock",
  })),
  optimizeTrip: vi.fn(async () => ({
    id: tripId,
    stops: [{ id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" }],
    route: {
      waypointsHash: "hash-after",
      distanceKm: "45.00",
      estimatedDurationMin: 55,
    },
  })),
  rebuildTripRouteFromCanonicalData: vi.fn(async () => ({
    id: tripId,
    stops: [{ id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" }],
    route: {
      waypointsHash: "hash-after",
      distanceKm: "45.00",
      estimatedDurationMin: 55,
    },
  })),
  deleteStop: vi.fn(async () => undefined),
}));

vi.mock("@/features/fuel/services/estimate", () => ({
  estimateTripFuel: vi.fn(async () => ({
    calculation: {
      outbound: {
        refuelStops: [{ id: "fuel-1" }, { id: "fuel-2" }],
      },
    },
  })),
}));

vi.mock("@/features/trips/services/transitions", () => ({
  assertWritableStatus: vi.fn(),
}));

import {
  addActivityToTrip,
  generateTripActivitySuggestions,
  getTravelerProfile,
  rejectTripActivity,
  restoreTripActivity,
  upsertTravelerProfile,
} from "@/features/trips/activities/trip-activity-service";
import { AppError } from "@/lib/errors";

describe("trip activities integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueProfile.mockResolvedValue(null);
    upsertProfile.mockImplementation(
      async ({ create }: { create: object }) => ({
        id: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
        tripId,
        suggestionsGeneratedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deferred: false,
        travelingWithPet: false,
        accessibilityNeeds: ["none"],
        childAges: [],
        interests: ["nature"],
        budgetPreference: "any",
        durationPreference: "any",
        environmentPreference: "both",
        activityLevel: "moderate",
        maxDetourMinutes: 15,
        adultCount: 2,
        childCount: 0,
        purpose: "couple",
        ...create,
      }),
    );
    findManyActivities.mockResolvedValue([]);
    updateProfile.mockResolvedValue({});
    createManyActivities.mockResolvedValue({ count: 1 });
    deleteManyActivities.mockResolvedValue({ count: 0 });
  });

  it("crée un profil voyageurs", async () => {
    const profile = await upsertTravelerProfile(userId, tripId, {
      purpose: "family",
      adultCount: 2,
      childCount: 1,
      childAges: [6],
      interests: ["animals"],
      maxDetourMinutes: 15,
    });
    expect(profile.purpose).toBe("family");
    expect(upsertProfile).toHaveBeenCalled();
  });

  it("refuse l'accès à un autre utilisateur", async () => {
    await expect(
      getTravelerProfile(otherUserId, tripId),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("génère des suggestions avec Google mocké", async () => {
    findUniqueProfile.mockResolvedValue({
      id: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
      tripId,
      purpose: "family",
      adultCount: 2,
      childCount: 1,
      childAges: [6],
      interests: ["animals"],
      budgetPreference: "any",
      durationPreference: "any",
      maxDetourMinutes: 15,
      environmentPreference: "both",
      activityLevel: "moderate",
      accessibilityNeeds: ["none"],
      travelingWithPet: false,
      deferred: false,
      suggestionsGeneratedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    findManyActivities.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: activityId,
        tripId,
        googlePlaceId: "mock_place_1",
        status: "suggested",
        name: "Aquarium mock",
        address: "1 rue",
        city: "Québec",
        latitude: 46.8,
        longitude: -71.2,
        primaryType: "aquarium",
        types: ["aquarium"],
        rating: 4.5,
        reviewCount: 100,
        priceLevel: null,
        websiteUrl: null,
        googleMapsUrl: null,
        photoReference: null,
        suggestedForSegment: "destination",
        routePositionKm: null,
        detourDistanceKm: 2,
        detourDurationMinutes: 5,
        estimatedVisitMinutes: 90,
        suitabilityScore: 72,
        suitabilityReasons: ["Test"],
        warningReasons: [],
        rejectReason: null,
        plannedDate: null,
        plannedStartTime: null,
        plannedEndTime: null,
        sequence: null,
        linkedStopId: null,
        insertPlacement: null,
      },
    ]);

    const result = await generateTripActivitySuggestions(userId, tripId, {
      force: true,
    });
    expect(result.activities.length).toBe(1);
    expect(createManyActivities).toHaveBeenCalled();
  });

  it("ajoute une activité avec confirmation d'impact", async () => {
    findFirstActivity.mockResolvedValue({
      id: activityId,
      tripId,
      googlePlaceId: "mock_place_1",
      status: "suggested",
      name: "Aquarium mock",
      address: "1 rue",
      city: "Québec",
      latitude: 46.8,
      longitude: -71.2,
      primaryType: "aquarium",
      types: ["aquarium"],
      rating: 4.5,
      reviewCount: 100,
      priceLevel: null,
      websiteUrl: null,
      googleMapsUrl: null,
      photoReference: null,
      suggestedForSegment: "destination",
      routePositionKm: null,
      detourDistanceKm: 2,
      detourDurationMinutes: 5,
      estimatedVisitMinutes: 90,
      suitabilityScore: 72,
      suitabilityReasons: [],
      warningReasons: [],
      rejectReason: null,
      plannedDate: null,
      plannedStartTime: null,
      plannedEndTime: null,
      sequence: null,
      linkedStopId: null,
      insertPlacement: null,
    });
    updateActivity.mockImplementation(async ({ data }: { data: object }) => ({
      id: activityId,
      tripId,
      googlePlaceId: "mock_place_1",
      status: "added_to_trip",
      name: "Aquarium mock",
      address: "1 rue",
      city: "Québec",
      latitude: 46.8,
      longitude: -71.2,
      primaryType: "aquarium",
      types: ["aquarium"],
      rating: 4.5,
      reviewCount: 100,
      priceLevel: null,
      websiteUrl: null,
      googleMapsUrl: null,
      photoReference: null,
      suggestedForSegment: "destination",
      routePositionKm: null,
      detourDistanceKm: 2,
      detourDurationMinutes: 5,
      estimatedVisitMinutes: 90,
      suitabilityScore: 72,
      suitabilityReasons: [],
      warningReasons: [],
      rejectReason: null,
      plannedDate: null,
      plannedStartTime: null,
      plannedEndTime: null,
      sequence: null,
      linkedStopId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      insertPlacement: "destination",
      ...data,
    }));

    const result = await addActivityToTrip(userId, tripId, {
      activityId,
      placement: "destination",
      asRouteStop: true,
      confirmImpact: true,
      estimatedVisitMinutes: 120,
    });
    expect(result.activity.status).toBe("added_to_trip");
    expect(result.tripRecalculated).toBe(true);
    expect(result.fuelPlanRecalculated).toBe(true);
    expect(result.impact.visitMinutes).toBe(120);
  });

  it("masque puis restaure une activité", async () => {
    findFirstActivity.mockResolvedValue({
      id: activityId,
      tripId,
      googlePlaceId: "mock_place_1",
      status: "suggested",
      name: "Aquarium mock",
      address: null,
      city: null,
      latitude: 46.8,
      longitude: -71.2,
      primaryType: null,
      types: [],
      rating: null,
      reviewCount: null,
      priceLevel: null,
      websiteUrl: null,
      googleMapsUrl: null,
      photoReference: null,
      suggestedForSegment: null,
      routePositionKm: null,
      detourDistanceKm: null,
      detourDurationMinutes: null,
      estimatedVisitMinutes: null,
      suitabilityScore: null,
      suitabilityReasons: [],
      warningReasons: [],
      rejectReason: null,
      plannedDate: null,
      plannedStartTime: null,
      plannedEndTime: null,
      sequence: null,
      linkedStopId: null,
      insertPlacement: null,
    });
    updateActivity.mockImplementation(
      async ({
        data,
      }: {
        data: { status: string; rejectReason?: string | null };
      }) => ({
        id: activityId,
        tripId,
        googlePlaceId: "mock_place_1",
        status: data.status,
        name: "Aquarium mock",
        address: null,
        city: null,
        latitude: 46.8,
        longitude: -71.2,
        primaryType: null,
        types: [],
        rating: null,
        reviewCount: null,
        priceLevel: null,
        websiteUrl: null,
        googleMapsUrl: null,
        photoReference: null,
        suggestedForSegment: null,
        routePositionKm: null,
        detourDistanceKm: null,
        detourDurationMinutes: null,
        estimatedVisitMinutes: null,
        suitabilityScore: null,
        suitabilityReasons: [],
        warningReasons: [],
        rejectReason: data.rejectReason ?? null,
        plannedDate: null,
        plannedStartTime: null,
        plannedEndTime: null,
        sequence: null,
        linkedStopId: null,
        insertPlacement: null,
      }),
    );

    const rejected = await rejectTripActivity(userId, tripId, activityId, {
      reason: "not_my_type",
    });
    expect(rejected.status).toBe("rejected");

    findFirstActivity.mockResolvedValue({
      ...rejected,
      status: "rejected",
    });
    const restored = await restoreTripActivity(userId, tripId, activityId);
    expect(restored.status).toBe("suggested");
  });
});
