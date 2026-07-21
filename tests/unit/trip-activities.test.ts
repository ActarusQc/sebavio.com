import { describe, expect, it } from "vitest";
import {
  placeTypesForInterests,
  textQueriesForProfile,
  interestMatchesTypes,
} from "@/features/trips/activities/activity-category-mapper";
import {
  tripTravelerProfileSchema,
  addTripActivitySchema,
  rejectTripActivitySchema,
} from "@/features/trips/activities/activity-validation";
import {
  bayesianRatingScore,
  childCompatibilityScore,
  dedupeCandidates,
  filterByMaxDetour,
  scoreActivityCandidate,
} from "@/features/trips/activities/trip-activity-ranking-service";
import { estimateGeographicDetour } from "@/features/trips/activities/trip-activity-detour-service";
import { sanitizeEnhancementResult } from "@/features/trips/activities/ai-enhancer";
import type { ActivityCandidate } from "@/features/trips/activities/activity-types";

describe("tripTravelerProfileSchema", () => {
  it("accepte un profil famille avec âges exacts", () => {
    const parsed = tripTravelerProfileSchema.parse({
      purpose: "family",
      adultCount: 2,
      childCount: 2,
      childAges: [4, 9],
      interests: ["animals", "science"],
      maxDetourMinutes: 15,
    });
    expect(parsed.childAges).toEqual([4, 9]);
    expect(parsed.adultCount).toBe(2);
  });

  it("refuse si childAges.length !== childCount", () => {
    expect(
      tripTravelerProfileSchema.safeParse({
        purpose: "family",
        adultCount: 2,
        childCount: 2,
        childAges: [4],
        interests: [],
        maxDetourMinutes: 15,
      }).success,
    ).toBe(false);
  });

  it("refuse un âge > 17", () => {
    expect(
      tripTravelerProfileSchema.safeParse({
        purpose: "family",
        adultCount: 1,
        childCount: 1,
        childAges: [18],
        interests: [],
        maxDetourMinutes: 15,
      }).success,
    ).toBe(false);
  });

  it("refuse 0 adulte", () => {
    expect(
      tripTravelerProfileSchema.safeParse({
        purpose: "solo",
        adultCount: 0,
        childCount: 0,
        childAges: [],
        interests: [],
        maxDetourMinutes: 15,
      }).success,
    ).toBe(false);
  });

  it("accepte un voyage sans enfants", () => {
    const parsed = tripTravelerProfileSchema.parse({
      purpose: "couple",
      adultCount: 2,
      childCount: 0,
      childAges: [],
      interests: ["food"],
      maxDetourMinutes: 10,
    });
    expect(parsed.childCount).toBe(0);
  });
});

describe("add / reject schemas", () => {
  it("exige confirmImpact pour ajout", () => {
    const parsed = addTripActivitySchema.parse({
      activityId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      placement: "destination",
      confirmImpact: true,
    });
    expect(parsed.asRouteStop).toBe(true);
  });

  it("accepte un motif de rejet", () => {
    expect(rejectTripActivitySchema.parse({ reason: "too_far" }).reason).toBe(
      "too_far",
    );
  });
});

describe("category mapper", () => {
  it("mappe nature vers types Places", () => {
    const types = placeTypesForInterests(["nature"]);
    expect(types).toContain("park");
    expect(types).toContain("national_park");
  });

  it("ajoute des requêtes texte famille", () => {
    const q = textQueriesForProfile({
      purpose: "family",
      interests: ["animals"],
      childAges: [4],
    });
    expect(q.some((x) => x.includes("enfant") || x.includes("famil"))).toBe(
      true,
    );
  });

  it("détecte correspondance intérêt", () => {
    expect(interestMatchesTypes("animals", ["zoo"], "zoo")).toBe(true);
  });
});

describe("ranking", () => {
  const baseCandidate = (
    overrides: Partial<ActivityCandidate> = {},
  ): ActivityCandidate => ({
    googlePlaceId: "p1",
    name: "Zoo Test",
    address: "1 rue",
    city: "Québec",
    latitude: 46.8,
    longitude: -71.2,
    primaryType: "zoo",
    types: ["zoo"],
    rating: 4.6,
    reviewCount: 1500,
    priceLevel: "PRICE_LEVEL_MODERATE",
    websiteUrl: null,
    googleMapsUrl: null,
    photoReference: null,
    estimatedVisitMinutes: 120,
    searchZoneKind: "destination",
    ...overrides,
  });

  it("pondère mieux beaucoup d'avis qu'une note parfaite isolée", () => {
    const low = bayesianRatingScore(5, 2);
    const high = bayesianRatingScore(4.6, 1500);
    expect(high.ratingPoints + high.reviewPoints).toBeGreaterThan(
      low.ratingPoints + low.reviewPoints,
    );
  });

  it("score familial favorise les animaux", () => {
    const ranked = scoreActivityCandidate({
      candidate: baseCandidate(),
      profile: {
        purpose: "family",
        interests: ["animals"],
        childAges: [4, 9],
        budgetPreference: "any",
        durationPreference: "any",
        maxDetourMinutes: 15,
        environmentPreference: "both",
        activityLevel: "moderate",
        accessibilityNeeds: ["none"],
        travelingWithPet: false,
      },
      detourDurationMinutes: 8,
      detourDistanceKm: 4,
      routePositionKm: 120,
      suggestedForSegment: "along_route",
    });
    expect(ranked.suitabilityScore).toBeGreaterThan(40);
    expect(ranked.suitabilityReasons.length).toBeGreaterThan(0);
  });

  it("pénalise un détour trop long", () => {
    const ranked = scoreActivityCandidate({
      candidate: baseCandidate(),
      profile: {
        purpose: "couple",
        interests: ["nature"],
        childAges: [],
        budgetPreference: "any",
        durationPreference: "any",
        maxDetourMinutes: 10,
        environmentPreference: "both",
        activityLevel: "moderate",
        accessibilityNeeds: ["none"],
        travelingWithPet: false,
      },
      detourDurationMinutes: 40,
      detourDistanceKm: 30,
      routePositionKm: 50,
      suggestedForSegment: "along_route",
    });
    expect(
      ranked.warningReasons.some((w) => w.toLowerCase().includes("détour")),
    ).toBe(true);
  });

  it("compatibilité enfants pénalise night_club pour bébé", () => {
    const score = childCompatibilityScore(
      ["night_club"],
      "night_club",
      [1],
      180,
    );
    expect(score.penalty).toBeGreaterThan(0);
  });

  it("déduplique par placeId et proximité", () => {
    const out = dedupeCandidates([
      baseCandidate({ googlePlaceId: "a", name: "Parc A" }),
      baseCandidate({ googlePlaceId: "a", name: "Parc A bis" }),
      baseCandidate({
        googlePlaceId: "b",
        name: "Parc A",
        latitude: 46.80001,
        longitude: -71.20001,
      }),
    ]);
    expect(out.length).toBe(1);
  });

  it("filtre par détour max sauf destination", () => {
    const kept = filterByMaxDetour(
      [
        {
          ...baseCandidate(),
          suitabilityScore: 50,
          suitabilityReasons: [],
          warningReasons: [],
          detourDistanceKm: 20,
          detourDurationMinutes: 40,
          routePositionKm: 10,
          suggestedForSegment: "along_route",
          environmentGuess: "outdoor",
        },
        {
          ...baseCandidate({ googlePlaceId: "dest" }),
          suitabilityScore: 50,
          suitabilityReasons: [],
          warningReasons: [],
          detourDistanceKm: 1,
          detourDurationMinutes: 40,
          routePositionKm: 200,
          suggestedForSegment: "destination",
          environmentGuess: "indoor",
        },
      ],
      15,
    );
    expect(kept).toHaveLength(1);
    expect(kept[0]?.googlePlaceId).toBe("dest");
  });

  it("fonctionne sans intérêts ni enfants", () => {
    const ranked = scoreActivityCandidate({
      candidate: baseCandidate({ primaryType: "museum", types: ["museum"] }),
      profile: {
        purpose: "solo",
        interests: [],
        childAges: [],
        budgetPreference: "any",
        durationPreference: "any",
        maxDetourMinutes: 15,
        environmentPreference: "both",
        activityLevel: "moderate",
        accessibilityNeeds: ["none"],
        travelingWithPet: false,
      },
      detourDurationMinutes: null,
      detourDistanceKm: null,
      routePositionKm: null,
      suggestedForSegment: "destination",
    });
    expect(ranked.suitabilityScore).toBeGreaterThanOrEqual(0);
  });
});

describe("detour geographic", () => {
  it("estime un détour le long d'un corridor", () => {
    const est = estimateGeographicDetour(
      { lat: 46.85, lng: -71.25 },
      {
        polyline: null,
        origin: { lat: 46.8, lng: -71.3 },
        destination: { lat: 46.9, lng: -71.1 },
        waypoints: [],
        totalDistanceKm: 40,
        totalDurationMin: 45,
      },
    );
    expect(est).not.toBeNull();
    expect(est!.detourDurationMinutes).toBeGreaterThan(0);
  });
});

describe("AI enhancer safety", () => {
  it("ignore les googlePlaceId inconnus", () => {
    const result = sanitizeEnhancementResult(
      {
        tripPurpose: "solo",
        interests: [],
        childAges: [],
        activities: [
          {
            googlePlaceId: "known",
            name: "Parc",
            primaryType: "park",
            suitabilityReasons: [],
          },
        ],
      },
      {
        descriptions: {
          known: "Belle balade",
          unknown: "Injection",
        },
      },
    );
    expect(result.descriptions.known).toBe("Belle balade");
    expect(result.descriptions.unknown).toBeUndefined();
  });
});
