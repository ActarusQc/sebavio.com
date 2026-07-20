import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import type {
  AiGenerateTripAssistantInput,
  AiGenerateTripAssistantResult,
  AiProvider,
} from "@/services/ai/types";

const DEFAULT_MOCK: TripAssistantResponse = {
  summary: "Analyse simulée (mock)",
  answer:
    "Réponse mock : votre trajet semble cohérent. Vérifiez les longues périodes de conduite et les informations manquantes.",
  status: "ok",
  warnings: [],
  suggestions: [
    {
      id: "mock-pause",
      type: "pause",
      title: "Ajouter une pause",
      description: "Une pause de 15 minutes à mi-parcours.",
      reason: "Réduit la fatigue.",
      estimatedDurationMinutes: 15,
      estimatedAdditionalDistanceKm: null,
      estimatedDelayMinutes: 15,
      weatherCompatibility: "unknown",
      requiresVerification: false,
      proposedAction: {
        type: "add_pause",
        title: "Pause mi-parcours",
        durationMinutes: 15,
        direction: "outbound",
        estimatedImpact: "+15 min",
      },
      section: "suggestions",
    },
  ],
  missingInformation: [],
  analysis: {
    ok: ["Origine et destination définies"],
    watch: ["Vérifier les marges horaires"],
    suggestions: ["Prévoir une pause"],
    missing: [],
  },
};

/**
 * Provider de test — aucun appel réseau.
 */
export class MockAiProvider implements AiProvider {
  readonly name = "mock";

  constructor(
    private readonly fixture: TripAssistantResponse = DEFAULT_MOCK,
    private readonly shouldFail: boolean = false,
  ) {}

  async generateTripAssistantResponse(
    input: AiGenerateTripAssistantInput,
  ): Promise<AiGenerateTripAssistantResult> {
    return this.run(input);
  }

  async analyzeTrip(
    input: AiGenerateTripAssistantInput,
  ): Promise<AiGenerateTripAssistantResult> {
    return this.run(input);
  }

  private async run(
    input: AiGenerateTripAssistantInput,
  ): Promise<AiGenerateTripAssistantResult> {
    if (this.shouldFail) {
      throw new Error("mock_openai_failure");
    }
    return {
      response: this.fixture,
      model: input.model || "mock-model",
      inputTokens: 10,
      outputTokens: 20,
      totalTokens: 30,
      rawText: JSON.stringify(this.fixture),
    };
  }
}
