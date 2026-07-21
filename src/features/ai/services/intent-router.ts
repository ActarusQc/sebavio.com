import type { TripAssistantRequestType } from "@/features/ai/schemas/request";
import type { AiKnowledgeMode } from "@/features/ai/schemas/sources";

export const TRIP_ASSISTANT_INTENTS = [
  "trip_analysis",
  "schedule_analysis",
  "fuel_explanation",
  "weather_analysis",
  "restaurant_search",
  "activity_search",
  "lodging_search",
  "tourism_search",
  "general_question",
] as const;

export type TripAssistantIntent = (typeof TRIP_ASSISTANT_INTENTS)[number];

export type TripAssistantRouting = {
  intent: TripAssistantIntent;
  knowledgeMode: AiKnowledgeMode;
  requiresRecommendationsEntitlement: boolean;
  needsRouteSearchContext: boolean;
  reason: string;
};

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

const RESTAURANT_RE =
  /\b(restaurant|resto|gastronom|manger|repas|diner|dejeuner|brunch|michelin|bib gourmand|fine dining|haut de gamme|table|cuisine)\b/;
const LODGING_RE =
  /\b(hotel|hôtel|hebergement|hébergement|auberge|motel|gite|gîte|bnb|bed and breakfast|logement)\b/;
const ACTIVITY_TOURISM_RE =
  /\b(musee|musée|parc|attraction|touristique|evenement|événement|spectacle|visite|activite|activité|quoi faire|endroit|lieu d.interet|lieu d.intérêt)\b/;
const FUEL_RE =
  /\b(carburant|essence|plein|station[- ]service|consommation|litre|gasoil|diesel)\b/;
const WEATHER_RE =
  /\b(meteo|météo|pluie|neige|vent|temperature|température|orage)\b/;
const SCHEDULE_RE =
  /\b(horaire|depart|départ|arrivee|arrivée|retard|duree|durée|pause|conduite|timing)\b/;
const EXISTING_ACTIVITY_RE =
  /\b(mon activite|mon activité|mes activites|mes activités|activite deja|activité déjà|activite enregistree|activité enregistrée|stop deja|arrêt déjà)\b/;

/**
 * Routeur déterministe — aucun appel IA.
 */
export function routeTripAssistantRequest(input: {
  message: string;
  requestType: TripAssistantRequestType;
  hasExistingActivitiesInContext?: boolean;
}): TripAssistantRouting {
  const msg = normalize(input.message);
  const type = input.requestType;

  if (type === "fuel" || FUEL_RE.test(msg)) {
    return {
      intent: "fuel_explanation",
      knowledgeMode: "trip_context",
      requiresRecommendationsEntitlement: false,
      needsRouteSearchContext: false,
      reason: "explication carburant / données internes",
    };
  }

  if (type === "weather" || WEATHER_RE.test(msg)) {
    return {
      intent: "weather_analysis",
      knowledgeMode: "trip_context",
      requiresRecommendationsEntitlement: false,
      needsRouteSearchContext: false,
      reason: "météo du contexte voyage",
    };
  }

  if (type === "analyze") {
    return {
      intent: "trip_analysis",
      knowledgeMode: "trip_context",
      requiresRecommendationsEntitlement: false,
      needsRouteSearchContext: false,
      reason: "analyse structurée du voyage",
    };
  }

  // Activité déjà au voyage → contexte interne si le message le cible
  if (
    input.hasExistingActivitiesInContext &&
    EXISTING_ACTIVITY_RE.test(msg) &&
    !RESTAURANT_RE.test(msg) &&
    !LODGING_RE.test(msg)
  ) {
    return {
      intent: "trip_analysis",
      knowledgeMode: "trip_context",
      requiresRecommendationsEntitlement: false,
      needsRouteSearchContext: false,
      reason: "question sur activité déjà enregistrée",
    };
  }

  if (RESTAURANT_RE.test(msg)) {
    return {
      intent: "restaurant_search",
      knowledgeMode: "web_grounded",
      requiresRecommendationsEntitlement: true,
      needsRouteSearchContext: true,
      reason: "recherche restaurant / gastronomie",
    };
  }

  if (LODGING_RE.test(msg)) {
    return {
      intent: "lodging_search",
      knowledgeMode: "web_grounded",
      requiresRecommendationsEntitlement: true,
      needsRouteSearchContext: true,
      reason: "recherche hébergement",
    };
  }

  if (type === "suggest_activities" || ACTIVITY_TOURISM_RE.test(msg)) {
    return {
      intent: ACTIVITY_TOURISM_RE.test(msg)
        ? "tourism_search"
        : "activity_search",
      knowledgeMode: "web_grounded",
      requiresRecommendationsEntitlement: true,
      needsRouteSearchContext: true,
      reason: "recherche activité / tourisme externe",
    };
  }

  if (type === "schedule" || SCHEDULE_RE.test(msg)) {
    return {
      intent: "schedule_analysis",
      knowledgeMode: "trip_context",
      requiresRecommendationsEntitlement: false,
      needsRouteSearchContext: false,
      reason: "analyse d’horaire interne",
    };
  }

  return {
    intent: "general_question",
    knowledgeMode: "trip_context",
    requiresRecommendationsEntitlement: false,
    needsRouteSearchContext: false,
    reason: "question générale — contexte voyage",
  };
}
