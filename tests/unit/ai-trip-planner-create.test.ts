import { describe, expect, it } from "vitest";
import {
  detectMissingFields,
  isDraftReadyForCreation,
} from "@/features/ai-trip-planner/lib/missing-fields";
import { tripDraftSchema } from "@/features/ai-trip-planner/schemas/draft";

/**
 * Couvre la logique d’idempotence / readiness côté conversion brouillon → voyage
 * (sans DB). La création réelle est exercée via createTrip existant.
 */
describe("ai-trip-planner create readiness", () => {
  it("refuse la création si véhicule manquant", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", placeId: null, latitude: 1, longitude: 2 },
      destination: {
        name: "Gaspésie",
        placeId: null,
        latitude: 3,
        longitude: 4,
      },
      departureDate: "2026-08-12",
      returnDate: "2026-08-16",
      adults: 2,
      children: 0,
      vehicleId: null,
    });
    expect(isDraftReadyForCreation(draft)).toBe(false);
    expect(detectMissingFields(draft)).toContain("vehicleId");
  });

  it("autorise la création quand les champs et la proposition sont présents", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", placeId: null, latitude: 1, longitude: 2 },
      destination: {
        name: "Gaspésie",
        placeId: null,
        latitude: 3,
        longitude: 4,
      },
      departureDate: "2026-08-12",
      returnDate: "2026-08-16",
      adults: 2,
      children: 2,
      vehicleId: "33333333-3333-4333-8333-333333333333",
      estimatedDistanceKm: 700,
      estimatedDurationMinutes: 480,
      activities: [
        {
          name: "Rocher Percé et promenade du quai",
          category: "activity",
          justification: "Incontournable",
          durationMinutes: 90,
        },
        {
          name: "Restaurant La Maison du Pêcheur (Percé)",
          category: "meal",
          justification: "Fruits de mer",
          durationMinutes: 90,
        },
      ],
    });
    expect(isDraftReadyForCreation(draft)).toBe(true);
  });

  it("refuse la création sans proposition d’itinéraire", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", placeId: null, latitude: 1, longitude: 2 },
      destination: {
        name: "Gaspésie",
        placeId: null,
        latitude: 3,
        longitude: 4,
      },
      departureDate: "2026-08-12",
      returnDate: "2026-08-16",
      adults: 2,
      vehicleId: "33333333-3333-4333-8333-333333333333",
      estimatedDistanceKm: 700,
    });
    expect(isDraftReadyForCreation(draft)).toBe(false);
    expect(detectMissingFields(draft)).toContain("itineraryProposal");
  });
});
