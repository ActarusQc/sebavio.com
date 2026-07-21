import { describe, expect, it } from "vitest";
import { normalizeTripPlanningAiJson } from "@/features/ai-trip-planner/lib/normalize-ai-json";
import { parseTripPlanningAiResponseSoft } from "@/features/ai-trip-planner/services/parse-ai-response";
import { sanitizeAndMergeDraft } from "@/features/ai-trip-planner/lib/sanitize-draft";
import { emptyTripDraft } from "@/features/ai-trip-planner/schemas/draft";
import { formatPlaceSummary } from "@/features/ai-trip-planner/lib/format";

describe("normalizeTripPlanningAiJson", () => {
  it("accepte JSON entouré de markdown", () => {
    const raw = `\`\`\`json
{"assistantMessage":"Bonjour","tripDraftPatch":{"budgetLevel":"modéré"}}
\`\`\``;
    const soft = parseTripPlanningAiResponseSoft(raw);
    expect(soft.ok).toBe(true);
    if (soft.ok) {
      expect(soft.data.assistantMessage).toBe("Bonjour");
    }
  });

  it("normalise budget français et listes absentes", () => {
    const normalized = normalizeTripPlanningAiJson({
      assistantMessage: "OK",
      tripDraft: {
        budgetLevel: "modéré",
        origin: "Montréal",
      },
    }) as {
      tripDraft: { budgetLevel: string | null; origin: { name: string } };
    };
    expect(normalized.tripDraft.budgetLevel).toBe("moderate");
    expect(normalized.tripDraft.origin.name).toBe("Montréal");
  });

  it("ne remplace pas un champ valide par null (patch)", () => {
    const previous = emptyTripDraft();
    previous.origin = {
      ...previous.origin,
      name: "Bromont, QC",
      city: "Bromont",
      placeId: "ChIJreal",
      latitude: 45.3,
      longitude: -72.6,
      isHome: true,
    };
    const merged = sanitizeAndMergeDraft({
      previous,
      incoming: { title: "Road trip", origin: null },
      ownedVehicles: [],
      ownedGroups: [],
    });
    expect(merged.origin.name).toContain("Bromont");
    expect(merged.origin.placeId).toBe("ChIJreal");
    expect(merged.title).toBe("Road trip");
  });

  it("affiche Domicile — ville dans le résumé", () => {
    expect(
      formatPlaceSummary({
        name: "123 rue X, Bromont",
        city: "Bromont",
        isHome: true,
      }),
    ).toBe("Domicile — Bromont");
  });

  it("conserve un fallback conversationnel si JSON invalide", () => {
    const soft = parseTripPlanningAiResponseSoft(
      "Je n’ai pas pu structurer la réponse correctement pour le moment.",
    );
    expect(soft.ok).toBe(false);
    if (!soft.ok) {
      expect(soft.conversationalFallback).toMatch(/structurer|réponse/i);
    }
  });
});
