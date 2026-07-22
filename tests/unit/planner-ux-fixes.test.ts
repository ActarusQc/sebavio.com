import { describe, expect, it } from "vitest";
import {
  destinationQuickReplies,
  estimateOneWayDriveMinutes,
  filterDestinationsWithinOneWayLimit,
  QC_DESTINATION_CATALOG,
} from "@/features/ai-trip-planner/lib/destination-suggestions";
import { resolveCurrentStep } from "@/features/ai-trip-planner/lib/planning-step";
import { tripDraftSchema } from "@/features/ai-trip-planner/schemas/draft";
import { buildItineraryProposal } from "@/features/ai-trip-planner/lib/planning-step";
import { lodgingSelectionComplete } from "@/features/ai-trip-planner/lib/accommodation";

describe("suggestions destinations (aller)", () => {
  it("exclut Percé pour un rayon de 2 h depuis le sud du Québec", () => {
    // Saint-Mathias-sur-Richelieu approx
    const list = filterDestinationsWithinOneWayLimit({
      originLatitude: 45.47,
      originLongitude: -73.1,
      maxDriveMinutes: 120,
      maxDistanceKm: null,
      limit: 10,
    });
    const names = list.map((d) => d.name);
    expect(names).not.toContain("Percé");
    expect(names).not.toContain("Gaspé");
    expect(names.some((n) => /Tremblant|Magog|Bromont|Sauveur/i.test(n))).toBe(
      true,
    );
  });

  it("estime Percé bien au-delà de 2 h", () => {
    const perce = QC_DESTINATION_CATALOG.find((d) => d.name === "Percé")!;
    const minutes = estimateOneWayDriveMinutes(45.47, -73.1, perce);
    expect(minutes).toBeGreaterThan(300);
  });

  it("propose des quick replies filtrées", () => {
    const replies = destinationQuickReplies({
      originLatitude: 45.47,
      originLongitude: -73.1,
      maxDriveMinutes: 120,
      maxDistanceKm: null,
    });
    expect(replies.join(" ")).not.toMatch(/Percé/);
    expect(replies.at(-1)).toBe("Autre destination");
  });
});

describe("couple et hébergement", () => {
  it("accepte une sélection d’hébergement sans placeId", () => {
    expect(
      lodgingSelectionComplete({
        lodgingRequested: true,
        lodgingSelection: {
          placeId: null,
          name: "Gîte du Lac",
        },
      }),
    ).toBe(true);
  });

  it("place les repas au jour 1 (pas le retour) pour 2 jours", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Tremblant", city: "Mont-Tremblant" },
      departureDate: "2026-07-25",
      returnDate: "2026-07-26",
      durationDays: 2,
      estimatedDistanceKm: 200,
      estimatedDurationMinutes: 150,
      interests: ["gastronomy", "nature"],
      preferencesResolved: true,
      accommodationMode: "decide_later",
      activities: [
        {
          name: "Repas gastronomique au Bistro",
          category: "meal",
          themes: ["gastronomy"],
        },
        {
          name: "Randonnée au parc",
          category: "activity",
          themes: ["nature"],
        },
        {
          name: "Village piétonnier",
          category: "activity",
          themes: ["shopping"],
        },
      ],
    });
    const proposal = buildItineraryProposal(draft);
    expect(proposal).not.toBeNull();
    const day1 = proposal!.days.find((d) => d.day === 1)!;
    const day2 = proposal!.days.find((d) => d.day === 2);
    expect(
      day1.items.some(
        (i) => /repas|meal/i.test(i.category) || /Repas|Bistro/i.test(i.name),
      ),
    ).toBe(true);
    if (day2) {
      expect(
        day2.items.every(
          (i) =>
            !(/Repas gastronomique/i.test(i.name) && i.category === "meal"),
        ),
      ).toBe(true);
    }
  });

  it("passe en confirmation après choix d’hébergement nommé", () => {
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
      lodgingRequested: true,
      lodgingType: "Gîte",
      lodgingSelection: {
        name: "Gîte du Lac Magog",
        placeId: null,
        address: "1 rue du Lac",
        city: "Magog",
        latitude: 45.26,
        longitude: -72.15,
        rating: 4.7,
        googleMapsUrl: null,
      },
      estimatedDistanceKm: 40,
      estimatedDurationMinutes: 40,
      activities: [
        { name: "Marché", category: "meal", themes: ["gastronomy"] },
        { name: "Parc", category: "activity", themes: ["nature"] },
      ],
    });
    expect(resolveCurrentStep(draft, { hasTripTypeHint: true })).toBe(
      "confirmation",
    );
  });
});
