import { describe, expect, it } from "vitest";
import { buildVoiceSpokenText } from "@/features/ai/voice/services/voice-summary";

describe("ai voice summary", () => {
  it("utilise summary et tronque en mode conversation", () => {
    const long = "A".repeat(400);
    const result = buildVoiceSpokenText(
      { summary: long, answer: "fallback" },
      "conversation",
    );
    expect(result.spokenText.length).toBeLessThanOrEqual(280);
    expect(result.confirmationRequired).toBe(false);
  });

  it("tronque plus court en mode driving", () => {
    const long = "Phrase longue. ".repeat(40);
    const result = buildVoiceSpokenText({ summary: long }, "driving");
    expect(result.spokenText.length).toBeLessThanOrEqual(160);
  });

  it("ajoute une question de confirmation si proposedAction", () => {
    const result = buildVoiceSpokenText(
      {
        summary: "Je peux ajouter une pause.",
        suggestions: [
          {
            title: "Pause",
            proposedAction: { type: "add_pause", title: "Pause" },
          },
        ],
      },
      "conversation",
    );
    expect(result.confirmationRequired).toBe(true);
    expect(result.proposedAction).toEqual({
      type: "add_pause",
      title: "Pause",
    });
    expect(result.spokenText).toMatch(/voulez-vous/i);
  });

  it("fallback sur answer si summary vide", () => {
    const result = buildVoiceSpokenText({
      summary: "  ",
      answer: "Réponse affichée.",
    });
    expect(result.spokenText).toContain("Réponse affichée");
  });
});
