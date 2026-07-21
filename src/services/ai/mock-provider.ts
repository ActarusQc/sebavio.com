import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import type {
  AiGenerateRawJsonInput,
  AiGenerateRawJsonResult,
  AiGenerateTripAssistantInput,
  AiGenerateTripAssistantResult,
  AiProvider,
} from "@/services/ai/types";

function extractKeyword(payload: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = payload.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

function buildMockTripPlanningJson(userPayload: string): string {
  const lower = userPayload.toLowerCase();
  const origin =
    extractKeyword(userPayload, [
      /(?:de|depuis|départ|origin)[:\s]+([A-Za-zÀ-ÿ'’\-\s]{2,80})/i,
      /bromont/i,
    ]) ?? (lower.includes("bromont") ? "Bromont" : null);
  const destination =
    extractKeyword(userPayload, [
      /(?:vers|destination|pour)[:\s]+([A-Za-zÀ-ÿ'’\-\s]{2,80})/i,
      /gaspésie|gaspesie|québec|quebec|montréal|montreal/i,
    ]) ??
    (lower.includes("gasp")
      ? "Gaspésie"
      : lower.includes("idée") || lower.includes("idee")
        ? null
        : null);

  const hasDates =
    /\d{4}-\d{2}-\d{2}/.test(userPayload) ||
    /\d{1,2}\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)/i.test(
      userPayload,
    );

  const tripDraft = {
    title: destination ? `Voyage vers ${destination}` : null,
    origin: {
      name: origin,
      placeId: null,
      latitude: null,
      longitude: null,
    },
    destination: {
      name: destination,
      placeId: null,
      latitude: null,
      longitude: null,
    },
    departureDate: hasDates ? "2026-08-12" : null,
    returnDate: hasDates ? "2026-08-16" : null,
    durationDays: hasDates ? 5 : null,
    travelerCount: null,
    adults: lower.includes("famille") ? 2 : null,
    children: lower.includes("famille") ? 2 : null,
    vehicleId: null,
    travelGroupId: null,
    budgetLevel: null,
    travelStyle: lower.includes("road") ? ["road_trip"] : [],
    preferences: [],
    constraints: [],
    stops: [],
    activities: [],
    estimatedDistanceKm: null,
    estimatedDurationMinutes: null,
    softWarnings: [],
  };

  const missingFields: string[] = [];
  if (!tripDraft.origin.name) missingFields.push("origin");
  if (!tripDraft.destination.name) missingFields.push("destination");
  if (!tripDraft.departureDate) missingFields.push("departureDate");
  if (!tripDraft.returnDate && !tripDraft.durationDays) {
    missingFields.push("returnDate");
  }
  if (tripDraft.travelerCount == null && tripDraft.adults == null) {
    missingFields.push("adults");
  }
  missingFields.push("vehicleId");

  const assistantMessage = destination
    ? `Parfait, je prépare un voyage vers ${destination}. Précisons encore les détails manquants.`
    : "Je peux vous proposer des idées ou partir d’une destination précise. Que préférez-vous ?";

  return JSON.stringify({
    sessionStatus:
      missingFields.length > 0 ? "collecting" : "ready_for_confirmation",
    assistantMessage,
    missingFields,
    quickReplies: destination
      ? ["5 jours", "En famille", "Budget modéré", "Choisir mon véhicule"]
      : ["Road trip", "Escapade", "Voyage en famille", "Je cherche des idées"],
    tripDraft,
    suggestions: [],
    destinationIdeas:
      !destination && (lower.includes("idée") || lower.includes("idee"))
        ? [
            {
              id: "idea-gaspesie",
              name: "Gaspésie",
              category: "nature",
              justification: "Paysages côtiers et villages pittoresques.",
              imageUrl: null,
              accepted: false,
            },
            {
              id: "idea-charlevoix",
              name: "Charlevoix",
              category: "scenic",
              justification: "Route panoramique et gastronomie.",
              imageUrl: null,
              accepted: false,
            },
          ]
        : undefined,
  });
}

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
  knowledgeMode: "trip_context",
  webSearchUsed: false,
  sources: [],
  restaurantRecommendations: [],
  clarification: null,
  pendingRequest: null,
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

  async generateRawJsonResponse(
    input: AiGenerateRawJsonInput,
  ): Promise<AiGenerateRawJsonResult> {
    if (this.shouldFail) {
      throw new Error("mock_openai_failure");
    }
    return {
      rawText: buildMockTripPlanningJson(input.userPayload),
      model: input.model || "mock-model",
      inputTokens: 12,
      outputTokens: 48,
      totalTokens: 60,
    };
  }

  private async run(
    input: AiGenerateTripAssistantInput,
  ): Promise<AiGenerateTripAssistantResult> {
    if (this.shouldFail) {
      throw new Error("mock_openai_failure");
    }
    const enableWeb = Boolean(input.enableWebSearch);
    const response: TripAssistantResponse = {
      ...this.fixture,
      knowledgeMode: input.knowledgeMode ?? this.fixture.knowledgeMode,
      webSearchUsed: enableWeb,
      sources: enableWeb ? (this.fixture.sources ?? []) : [],
    };
    return {
      response,
      model: input.model || "mock-model",
      inputTokens: 10,
      outputTokens: 20,
      totalTokens: 30,
      rawText: JSON.stringify(response),
      webSearchUsed: enableWeb,
      webSearchCallCount: enableWeb ? 1 : 0,
      citationSources: enableWeb ? (response.sources ?? []) : [],
    };
  }
}
