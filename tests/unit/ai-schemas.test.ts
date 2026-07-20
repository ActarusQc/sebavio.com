import { describe, expect, it } from "vitest";
import { tripAssistantResponseSchema } from "@/features/ai/schemas/response";
import {
  proposedTripActionSchema,
  applyProposedActionInputSchema,
} from "@/features/ai/schemas/actions";
import { describeProposedAction } from "@/features/ai/services/apply-action-client";
import { DEMO_STATIC_RESPONSE } from "@/features/ai/constants";
import { requestTypeNeedsRecommendations } from "@/features/ai/lib/request-types";

describe("ai schemas — TripAssistantResponse", () => {
  it("valide une réponse complète", () => {
    const parsed = tripAssistantResponseSchema.parse(DEMO_STATIC_RESPONSE);
    expect(parsed.status).toBe("ok");
    expect(parsed.suggestions.length).toBeGreaterThan(0);
  });

  it("rejette une réponse invalide", () => {
    expect(() => tripAssistantResponseSchema.parse({ summary: "x" })).toThrow();
  });
});

describe("ai schemas — ProposedTripAction", () => {
  it("accepte add_pause", () => {
    const action = proposedTripActionSchema.parse({
      type: "add_pause",
      title: "Pause",
      durationMinutes: 15,
    });
    expect(action.type).toBe("add_pause");
  });

  it("refuse une action invalide", () => {
    expect(() =>
      proposedTripActionSchema.parse({
        type: "add_pause",
        title: "Pause",
        durationMinutes: -1,
      }),
    ).toThrow();
  });

  it("exige confirm=true pour apply", () => {
    expect(() =>
      applyProposedActionInputSchema.parse({
        tripId: "00000000-0000-4000-8000-000000000001",
        action: {
          type: "add_pause",
          title: "Pause",
          durationMinutes: 10,
        },
        confirm: false,
      }),
    ).toThrow();
  });
});

describe("describeProposedAction", () => {
  it("marque create_detour comme non applicable", () => {
    const d = describeProposedAction({
      type: "create_detour",
      title: "Détour",
      applicableInV1: false,
    });
    expect(d.applicable).toBe(false);
  });

  it("marque add_activity comme applicable", () => {
    const d = describeProposedAction({
      type: "add_activity",
      title: "Musée",
      durationMinutes: 60,
      direction: "outbound",
      placement: "outbound",
    });
    expect(d.applicable).toBe(true);
  });
});

describe("entitlements request types", () => {
  it("détecte les types recommandations", () => {
    expect(requestTypeNeedsRecommendations("suggest_activities")).toBe(true);
    expect(requestTypeNeedsRecommendations("weather")).toBe(true);
    expect(requestTypeNeedsRecommendations("fuel")).toBe(false);
    expect(requestTypeNeedsRecommendations("analyze")).toBe(false);
  });
});
