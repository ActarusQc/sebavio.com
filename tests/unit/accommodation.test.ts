import { describe, expect, it } from "vitest";
import {
  parseAccommodationRequest,
  lodgingSelectionComplete,
} from "@/features/ai-trip-planner/lib/accommodation";
import { isDraftReadyForCreation } from "@/features/ai-trip-planner/lib/missing-fields";
import { resolveCurrentStep } from "@/features/ai-trip-planner/lib/planning-step";
import { tripDraftSchema } from "@/features/ai-trip-planner/schemas/draft";

describe("parseAccommodationRequest", () => {
  it("mappe « gîte » vers bed_and_breakfast, jamais motel", () => {
    const r = parseAccommodationRequest("Je voudrais un gîte pour dormir.");
    expect(r.requested).toBe(true);
    expect(r.type).toBe("bed_and_breakfast");
    expect(r.label).toMatch(/Gîte|couette/i);
    expect(r.placeTypes).not.toContain("motel");
  });

  it("reconnaît couette et café / BnB", () => {
    expect(parseAccommodationRequest("couette et café").type).toBe(
      "bed_and_breakfast",
    );
    expect(parseAccommodationRequest("un BnB près de Magog").type).toBe(
      "bed_and_breakfast",
    );
  });

  it("laisse motel explicite comme motel", () => {
    expect(parseAccommodationRequest("un motel pour la nuit").type).toBe(
      "motel",
    );
  });
});

describe("lodging gate", () => {
  it("bloque la confirmation sans sélection d’hébergement", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Magog", city: "Magog" },
      departureDate: "2026-07-25",
      returnDate: "2026-07-26",
      adults: 2,
      vehicleId: "11111111-1111-4111-8111-111111111111",
      estimatedDistanceKm: 40,
      estimatedDurationMinutes: 40,
      preferences: ["gastronomie"],
      lodgingRequested: true,
      lodgingType: "Gîte / couette et café",
      accommodationType: "bed_and_breakfast",
      activities: [
        { name: "Marché de Magog", category: "meal" },
        { name: "Vignoble Domaine Les Brome (Bromont)", category: "meal" },
      ],
    });
    expect(resolveCurrentStep(draft, { hasTripTypeHint: true })).toBe(
      "lodging",
    );
    expect(isDraftReadyForCreation(draft)).toBe(false);
    expect(lodgingSelectionComplete(draft)).toBe(false);
  });

  it("autorise la création après sélection d’un gîte", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Magog", city: "Magog" },
      departureDate: "2026-07-25",
      returnDate: "2026-07-26",
      adults: 2,
      vehicleId: "11111111-1111-4111-8111-111111111111",
      estimatedDistanceKm: 40,
      estimatedDurationMinutes: 40,
      preferences: ["gastronomie"],
      lodgingRequested: true,
      lodgingType: "Gîte / couette et café",
      accommodationType: "bed_and_breakfast",
      lodgingSelection: {
        name: "Gîte du Lac Magog",
        placeId: "ChIJtest",
        address: "1 rue du Lac, Magog",
        city: "Magog",
        latitude: 45.26,
        longitude: -72.15,
        rating: 4.7,
        googleMapsUrl: null,
      },
      activities: [
        { name: "Marché de Magog", category: "meal" },
        { name: "Vignoble Domaine Les Brome (Bromont)", category: "meal" },
      ],
      stops: [
        {
          name: "Gîte du Lac Magog",
          category: "lodging",
          placeId: "ChIJtest",
          latitude: 45.26,
          longitude: -72.15,
        },
      ],
    });
    expect(resolveCurrentStep(draft, { hasTripTypeHint: true })).not.toBe(
      "lodging",
    );
    expect(isDraftReadyForCreation(draft)).toBe(true);
  });
});
