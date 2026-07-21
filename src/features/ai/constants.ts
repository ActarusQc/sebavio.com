export const TRIP_ASSISTANT_PROMPT_VERSION = "trip-assistant-v2-web-grounded";

export const QUICK_ACTIONS = [
  {
    id: "analyze",
    requestType: "analyze" as const,
    label: "Analyser mon voyage",
    prompt:
      "Analyse mon voyage de façon structurée : points positifs, éléments à surveiller, risques de retard, suggestions et informations manquantes.",
  },
  {
    id: "suggest_activities",
    requestType: "suggest_activities" as const,
    label: "Suggérer des activités",
    prompt:
      "Suggère des activités réalistes sur mon trajet et à destination, en tenant compte du temps disponible et de la météo si elle est fournie. Marque clairement ce qui doit être confirmé.",
  },
  {
    id: "weather",
    requestType: "weather" as const,
    label: "Adapter selon la météo",
    prompt:
      "En te basant uniquement sur les prévisions météo fournies dans le contexte, indique les périodes problématiques et propose des adaptations concrètes.",
  },
  {
    id: "schedule",
    requestType: "schedule" as const,
    label: "Vérifier mon horaire",
    prompt:
      "Vérifie si mon horaire est réaliste : départs, arrivées, durées d’activités, pauses, arrêts carburant et marges de sécurité. Propose un horaire corrigé si pertinent, sans modifier le voyage.",
  },
  {
    id: "fuel",
    requestType: "fuel" as const,
    label: "Expliquer le carburant",
    prompt:
      "Explique simplement mon estimation de carburant : arrêts, consommation, carburant de départ, limites de l’estimation. N’invente aucun chiffre.",
  },
] as const;

export const DEMO_STATIC_RESPONSE = {
  summary: "Aperçu de l’Assistant Sebavio (démonstration)",
  answer:
    "Sur un forfait payant, l’assistant analyserait votre voyage réel : horaire, météo, arrêts et carburant. Voici un exemple non personnalisé.",
  status: "ok" as const,
  warnings: [
    {
      code: "demo",
      title: "Démonstration",
      description:
        "Aucune donnée de votre voyage n’a été envoyée à l’IA en forfait Découverte.",
      severity: "info" as const,
    },
  ],
  suggestions: [
    {
      id: "demo-1",
      type: "schedule" as const,
      title: "Prévoir des pauses régulières",
      description:
        "Exemple : une pause de 15 minutes toutes les 2 heures de conduite.",
      reason: "Réduit la fatigue sur les longs trajets.",
      estimatedDurationMinutes: 15,
      estimatedAdditionalDistanceKm: null,
      estimatedDelayMinutes: 15,
      weatherCompatibility: "unknown" as const,
      requiresVerification: false,
      proposedAction: null,
      section: "suggestions" as const,
    },
  ],
  missingInformation: [],
  analysis: {
    ok: ["Exemple : trajet aller/retour clairement défini"],
    watch: ["Exemple : vérifier les longues périodes de conduite"],
    suggestions: ["Exemple : ajouter une pause à mi-parcours"],
    missing: ["Exemple : véhicule ou météo non renseignés"],
  },
  knowledgeMode: "trip_context" as const,
  webSearchUsed: false,
  sources: [],
  restaurantRecommendations: [],
};
