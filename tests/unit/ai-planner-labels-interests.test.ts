import { describe, expect, it } from "vitest";
import {
  formatDurationFr,
  getItineraryTypeLabel,
  getTravelInterestLabel,
  formatInterestsListFr,
} from "@/features/ai-trip-planner/lib/labels";
import {
  computeNights,
  needsOvernightStay,
} from "@/features/ai-trip-planner/lib/nights";
import {
  applyInterestFromUserText,
  applyInterestsSelection,
  buildInterestBasedItinerary,
} from "@/features/ai-trip-planner/lib/interest-itinerary";
import {
  CONTINUE_INTERESTS_LABEL,
  parseInterestMutation,
  parseTravelInterest,
} from "@/features/ai-trip-planner/lib/travel-interests";
import { buildControlsForStep } from "@/features/ai-trip-planner/lib/controls-for-step";
import {
  buildItineraryProposal,
  resolveCurrentStep,
} from "@/features/ai-trip-planner/lib/planning-step";
import { parseAccommodationMode } from "@/features/ai-trip-planner/lib/accommodation";
import { tripDraftSchema } from "@/features/ai-trip-planner/schemas/draft";

describe("libellés FR itinéraire", () => {
  it("traduit les types internes", () => {
    expect(getItineraryTypeLabel("meal")).toBe("Repas");
    expect(getItineraryTypeLabel("activity")).toBe("Activité");
    expect(getItineraryTypeLabel("accommodation")).toBe("Hébergement");
    expect(getItineraryTypeLabel("lodging")).toBe("Hébergement");
    expect(getItineraryTypeLabel("drive")).toBe("Trajet");
    expect(getItineraryTypeLabel("shopping")).toBe("Magasinage");
  });

  it("formate les durées en français canadien", () => {
    expect(formatDurationFr(90)).toBe("1 h 30");
    expect(formatDurationFr(45)).toBe("45 min");
    expect(formatDurationFr(60)).toBe("1 h");
  });
});

describe("nuits et hébergement", () => {
  it("calcule les nuits par jours calendaires", () => {
    expect(computeNights("2026-07-25", "2026-07-25", null)).toBe(0);
    expect(computeNights("2026-07-25", "2026-07-26", null)).toBe(1);
    expect(computeNights("2026-07-25", "2026-07-27", null)).toBe(2);
    expect(needsOvernightStay("2026-07-25", "2026-07-25", 1)).toBe(false);
  });

  it("propose l’itinéraire avant de demander l’hébergement", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Magog", city: "Magog" },
      destinationMode: "known",
      departureDate: "2026-07-25",
      returnDate: "2026-07-26",
      adults: 2,
      vehicleId: "11111111-1111-4111-8111-111111111111",
      interests: ["gastronomy", "nature", "shopping"],
      preferencesResolved: true,
    });
    expect(resolveCurrentStep(draft, { hasTripTypeHint: true })).toBe(
      "itinerary_proposal",
    );
  });

  it("demande l’hébergement après une proposition pour 1 nuit", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Magog", city: "Magog" },
      destinationMode: "known",
      departureDate: "2026-07-25",
      returnDate: "2026-07-26",
      adults: 2,
      vehicleId: "11111111-1111-4111-8111-111111111111",
      interests: ["gastronomy"],
      preferencesResolved: true,
      estimatedDistanceKm: 40,
      estimatedDurationMinutes: 40,
      activities: [
        { name: "Marché de Magog", category: "meal" },
        { name: "Parc Orford", category: "activity" },
      ],
    });
    expect(resolveCurrentStep(draft, { hasTripTypeHint: true })).toBe(
      "accommodation_need",
    );
  });

  it("ne demande pas l’hébergement pour une journée", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Magog", city: "Magog" },
      destinationMode: "known",
      departureDate: "2026-07-25",
      returnDate: "2026-07-25",
      durationDays: 1,
      adults: 2,
      vehicleId: "11111111-1111-4111-8111-111111111111",
      interests: ["gastronomy"],
      preferencesResolved: true,
    });
    expect(resolveCurrentStep(draft, { hasTripTypeHint: true })).toBe(
      "itinerary_proposal",
    );
  });

  it("parse les modes d’hébergement", () => {
    expect(parseAccommodationMode("Oui, proposez-moi un hébergement")).toBe(
      "sebavio_suggestion",
    );
    expect(parseAccommodationMode("Non, j’ai déjà un hébergement")).toBe(
      "already_booked",
    );
    expect(parseAccommodationMode("Non, je m’en occuperai plus tard")).toBe(
      "decide_later",
    );
    expect(parseAccommodationMode("Je retourne à la maison chaque soir")).toBe(
      "return_home_each_night",
    );
  });

  it("bloque la proposition tant que le gîte n’est pas choisi", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Magog", city: "Magog" },
      departureDate: "2026-07-25",
      returnDate: "2026-07-26",
      adults: 2,
      vehicleId: "11111111-1111-4111-8111-111111111111",
      interests: ["gastronomy"],
      preferencesResolved: true,
      accommodationMode: "sebavio_suggestion",
      accommodationType: "bed_and_breakfast",
      lodgingType: "Gîte ou couette et café",
      lodgingRequested: true,
      estimatedDistanceKm: 40,
      estimatedDurationMinutes: 40,
      activities: [
        { name: "Marché de Magog", category: "meal" },
        { name: "Parc Orford", category: "activity" },
      ],
    });
    expect(resolveCurrentStep(draft, { hasTripTypeHint: true })).toBe(
      "lodging",
    );
  });
});

describe("intérêts multi", () => {
  it("expose une question multi_choice avec libellés FR", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Magog", city: "Magog" },
      destinationMode: "known",
      departureDate: "2026-07-25",
      returnDate: "2026-07-26",
      adults: 2,
      vehicleId: "11111111-1111-4111-8111-111111111111",
    });
    expect(resolveCurrentStep(draft, { hasTripTypeHint: true })).toBe(
      "preferences",
    );
    const controls = buildControlsForStep({
      step: "preferences",
      draft,
      ownedVehicles: [],
      homeCity: null,
      hasHome: false,
      originSuggestions: [],
      hasProposal: false,
    });
    expect(controls.requestedInput?.type).toBe("multi_choice");
    expect(controls.requestedInput?.field).toBe("interests");
    const labels = (controls.requestedInput?.choices ?? []).map((c) => c.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        "Gastronomie",
        "Nature et plein air",
        "Magasinage",
      ]),
    );
    expect(labels.join(" ")).not.toMatch(/\bShopping\b/);
  });

  it("enregistre plusieurs intérêts via Continuer avec mes choix", () => {
    let draft = tripDraftSchema.parse({});
    draft = applyInterestFromUserText(
      draft,
      `${CONTINUE_INTERESTS_LABEL} : Gastronomie · Nature et plein air · Magasinage`,
    );
    expect(draft.interests).toEqual(["gastronomy", "nature", "shopping"]);
    expect(draft.primaryInterest).toBe("gastronomy");
    expect(draft.preferencesResolved).toBe(true);
    expect(formatInterestsListFr(draft.interests)).toBe(
      "Gastronomie · Nature et plein air · Magasinage",
    );
  });

  it("normalise les réponses libres", () => {
    expect(parseTravelInterest("bonne bouffe")).toBe("gastronomy");
    expect(parseTravelInterest("centres commerciaux")).toBe("shopping");
    expect(parseTravelInterest("randonnée")).toBe("nature");
  });

  it("modifie les intérêts et invalide la proposition", () => {
    let draft = applyInterestsSelection(tripDraftSchema.parse({}), [
      "gastronomy",
      "nature",
    ]);
    draft = {
      ...draft,
      activities: [
        {
          id: "1",
          name: "Test",
          category: "meal",
          justification: null,
          durationMinutes: 60,
          latitude: null,
          longitude: null,
          placeId: null,
          address: null,
          accepted: true,
          themes: ["gastronomy"],
        },
      ],
      proposalConfirmed: true,
    };
    draft = applyInterestFromUserText(draft, "Ajoute aussi du magasinage");
    expect(draft.interests).toContain("shopping");
    expect(draft.activities).toEqual([]);
    expect(draft.proposalConfirmed).toBe(false);

    draft = applyInterestFromUserText(draft, "Retire la nature");
    expect(draft.interests).not.toContain("nature");
  });

  it("génère des activités multi-intérêts sans clé anglaise dans la proposition", () => {
    let draft = tripDraftSchema.parse({
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Magog", city: "Magog" },
      departureDate: "2026-07-25",
      returnDate: "2026-07-26",
      durationDays: 2,
      estimatedDistanceKm: 45,
      estimatedDurationMinutes: 40,
      interests: ["gastronomy", "nature", "shopping"],
      preferencesResolved: true,
      accommodationMode: "decide_later",
    });
    draft = buildInterestBasedItinerary(draft, { force: true });
    const proposal = buildItineraryProposal(draft);
    expect(proposal).not.toBeNull();
    expect(proposal!.interestsLabels).toEqual([
      "Gastronomie",
      "Nature et plein air",
      "Magasinage",
    ]);
    const displayCats = proposal!.days.flatMap((d) =>
      d.items.map((i) => getItineraryTypeLabel(i.category)),
    );
    expect(displayCats).toContain("Repas");
    expect(displayCats.every((c) => c !== "meal")).toBe(true);
    expect(getTravelInterestLabel("shopping")).toBe("Magasinage");
  });

  it("parseInterestMutation retire un choix", () => {
    expect(
      parseInterestMutation("Retire la nature", ["gastronomy", "nature"]),
    ).toEqual(["gastronomy"]);
  });
});
