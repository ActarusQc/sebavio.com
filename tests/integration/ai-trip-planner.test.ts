/**
 * Intégration légère — parsing session / mock provider.
 */
import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  WELCOME_MESSAGE,
  INITIAL_QUICK_REPLIES,
  emptyTripDraft,
  plannerMessagesSchema,
  tripPlanningAiResponseSchema,
} from "@/features/ai-trip-planner";
import { MockAiProvider } from "@/services/ai/mock-provider";

describe("ai-trip-planner session flow (unit-integration)", () => {
  it("construit un message d’accueil valide", () => {
    const messages = plannerMessagesSchema.parse([
      {
        id: randomUUID(),
        role: "assistant",
        content: WELCOME_MESSAGE,
        createdAt: new Date().toISOString(),
        quickReplies: [...INITIAL_QUICK_REPLIES],
      },
    ]);
    expect(messages[0]?.content).toContain("prochain voyage");
    expect(messages[0]?.quickReplies).toContain("Road trip");
  });

  it("parse une réponse mock de planification", async () => {
    const provider = new MockAiProvider();
    const raw = await provider.generateRawJsonResponse({
      systemPrompt: "plan",
      userPayload: JSON.stringify({
        userMessage: "Je cherche des idées",
        currentDraft: emptyTripDraft(),
      }),
      model: "mock",
      timeoutMs: 2000,
    });
    const parsed = tripPlanningAiResponseSchema.parse(JSON.parse(raw.rawText));
    expect(parsed.sessionStatus).toMatch(
      /collecting|proposing|ready_for_confirmation/,
    );
    expect(Array.isArray(parsed.missingFields)).toBe(true);
  });
});
