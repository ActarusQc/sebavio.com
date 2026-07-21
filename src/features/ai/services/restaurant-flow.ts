import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import {
  buildRestaurantStyleClarification,
  buildSameStyleConfirmClarification,
} from "@/features/ai/lib/restaurant-preferences";
import type { MealType } from "@/features/ai/lib/meal-timing";
import type { PendingAssistantRequest } from "@/features/ai/lib/pending-assistant-request";

export function buildRestaurantClarificationResponse(
  pending: PendingAssistantRequest,
  mealType: MealType = pending.mealType,
): TripAssistantResponse {
  const clarification =
    pending.status === "awaiting_same_style_confirm" &&
    pending.previousStyleLabel
      ? buildSameStyleConfirmClarification(pending.previousStyleLabel)
      : buildRestaurantStyleClarification(mealType);

  return {
    summary: "Précision du style de restaurant",
    answer:
      pending.status === "awaiting_same_style_confirm"
        ? "Pour ce nouveau repas :"
        : "Pour vous proposer des options adaptées :",
    status: "incomplete",
    warnings: [],
    suggestions: [],
    missingInformation: ["Préférence de style de restaurant"],
    analysis: null,
    knowledgeMode: "trip_context",
    webSearchUsed: false,
    sources: [],
    restaurantRecommendations: [],
    clarification,
    pendingRequest: pending,
  };
}

/** Exclut les établissements clairement fermés de la liste principale. */
export function filterOpenRestaurantRecommendations(
  response: TripAssistantResponse,
): TripAssistantResponse {
  const all = response.restaurantRecommendations ?? [];
  const closed = all.filter(
    (r) =>
      r.openingStatus.value === "closed" ||
      r.openingStatus.value === "likely_closed",
  );
  const open = all.filter(
    (r) =>
      r.openingStatus.value !== "closed" &&
      r.openingStatus.value !== "likely_closed",
  );

  if (closed.length === 0) {
    return {
      ...response,
      restaurantRecommendations: open.slice(0, 3),
    };
  }

  const warnings = [...response.warnings];
  if (open.length === 0 && closed.length > 0) {
    warnings.push({
      code: "RESTAURANT_CLOSED_AT_MEAL",
      title: "Horaires incompatibles",
      description:
        "Des établissements ont été trouvés, mais aucun n’est confirmé ouvert à l’heure du repas dans un détour raisonnable.",
      severity: "warning",
    });
  }

  return {
    ...response,
    restaurantRecommendations: open.slice(0, 3),
    warnings,
  };
}

export function buildNoRestaurantResultSuggestions(): TripAssistantResponse["suggestions"] {
  return [
    {
      id: "search-1130",
      type: "schedule",
      title: "Chercher vers 11 h 30",
      description: "Avancer le repas d’environ 30 minutes.",
      reason: "Élargir la fenêtre temporelle",
      estimatedDurationMinutes: null,
      estimatedAdditionalDistanceKm: null,
      estimatedDelayMinutes: null,
      weatherCompatibility: "unknown",
      requiresVerification: false,
      proposedAction: null,
    },
    {
      id: "search-1230",
      type: "schedule",
      title: "Chercher vers 12 h 30",
      description: "Retarder le repas d’environ 30 minutes.",
      reason: "Élargir la fenêtre temporelle",
      estimatedDurationMinutes: null,
      estimatedAdditionalDistanceKm: null,
      estimatedDelayMinutes: null,
      weatherCompatibility: "unknown",
      requiresVerification: false,
      proposedAction: null,
    },
    {
      id: "widen-detour",
      type: "route_suggestion",
      title: "Élargir à 30 minutes de détour",
      description: "Autoriser un détour plus long pour trouver une ouverture.",
      reason: "Élargir le corridor de recherche",
      estimatedDurationMinutes: null,
      estimatedAdditionalDistanceKm: null,
      estimatedDelayMinutes: 30,
      weatherCompatibility: "unknown",
      requiresVerification: false,
      proposedAction: null,
    },
    {
      id: "search-fast",
      type: "activity",
      title: "Voir la restauration rapide",
      description: "Chercher des options pour un arrêt court.",
      reason: "Catégorie souvent plus flexible en horaire",
      estimatedDurationMinutes: 30,
      estimatedAdditionalDistanceKm: null,
      estimatedDelayMinutes: null,
      weatherCompatibility: "unknown",
      requiresVerification: false,
      proposedAction: null,
    },
    {
      id: "change-style",
      type: "activity",
      title: "Changer le type de restaurant",
      description: "Relancer la recherche avec un autre style.",
      reason: "Nouvelle préférence pour ce même repas",
      estimatedDurationMinutes: null,
      estimatedAdditionalDistanceKm: null,
      estimatedDelayMinutes: null,
      weatherCompatibility: "unknown",
      requiresVerification: false,
      proposedAction: null,
    },
  ];
}
