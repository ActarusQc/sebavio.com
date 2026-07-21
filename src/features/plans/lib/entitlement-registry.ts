/**
 * Registre typé des entitlements de forfait (clés, métadonnées UI, catégories).
 */

export const PLAN_ENTITLEMENT_KEYS = [
  "trips.max",
  "vehicles.max",
  "campings.max",
  "activities.max",
  "ai.planning.enabled",
  "ai.recommendations.enabled",
  "ai.voice.enabled",
  "weather.forecast_days",
  "fuel.optimization.enabled",
  "fuel.live_prices.enabled",
  "fuel.stations.detailed.enabled",
  "trip.sharing.enabled",
  "trip.export_pdf.enabled",
  "trip.preview.enabled",
  "trip.full_access.enabled",
  "trip.gps_tracking.enabled",
  "trip.travel_mode.enabled",
  "trip.detours.enabled",
  "trip.optimize.enabled",
  "notifications.enabled",
  "support.priority",
] as const;

export type PlanEntitlementKey = (typeof PLAN_ENTITLEMENT_KEYS)[number];

export type PlanEntitlementValue = {
  key: PlanEntitlementKey;
  enabled: boolean;
  limit: number | null;
  value: string | null;
};

export type EntitlementCategory =
  | "trips"
  | "vehicles"
  | "fuel"
  | "weather"
  | "activities"
  | "ai"
  | "sharing"
  | "support";

export type EntitlementValueType = "boolean" | "limit" | "string";

export type EntitlementDefinition = {
  key: PlanEntitlementKey;
  label: string;
  description: string;
  category: EntitlementCategory;
  valueType: EntitlementValueType;
};

/** Ordre stable d'affichage des catégories UI. */
export const ENTITLEMENT_CATEGORIES: readonly EntitlementCategory[] = [
  "trips",
  "vehicles",
  "fuel",
  "weather",
  "activities",
  "ai",
  "sharing",
  "support",
] as const;

export const ENTITLEMENT_CATEGORY_LABELS: Record<EntitlementCategory, string> =
  {
    trips: "Voyages",
    vehicles: "Véhicules",
    fuel: "Carburant",
    weather: "Météo",
    activities: "Activités et campings",
    ai: "Intelligence artificielle",
    sharing: "Partage et exportation",
    support: "Assistance",
  };

const KNOWN_KEYS = new Set<string>(PLAN_ENTITLEMENT_KEYS);

export function assertKnownEntitlementKey(
  key: string,
): asserts key is PlanEntitlementKey {
  if (!KNOWN_KEYS.has(key)) {
    throw new Error(`Clé d'entitlement inconnue : ${key}`);
  }
}

export const ENTITLEMENT_DEFINITIONS: readonly EntitlementDefinition[] = [
  {
    key: "trips.max",
    label: "Nombre maximum de voyages",
    description:
      "Limite le nombre de voyages actifs ou planifiés pour le forfait.",
    category: "trips",
    valueType: "limit",
  },
  {
    key: "vehicles.max",
    label: "Nombre maximum de véhicules",
    description: "Limite le nombre de véhicules associés au compte.",
    category: "vehicles",
    valueType: "limit",
  },
  {
    key: "campings.max",
    label: "Nombre maximum de campings",
    description: "Limite le nombre de campings favoris ou enregistrés.",
    category: "activities",
    valueType: "limit",
  },
  {
    key: "activities.max",
    label: "Nombre maximum d'activités",
    description: "Limite le nombre d'activités associées aux voyages.",
    category: "activities",
    valueType: "limit",
  },
  {
    key: "ai.planning.enabled",
    label: "Planification par IA",
    description: "Active l'assistance à la planification de voyage par IA.",
    category: "ai",
    valueType: "boolean",
  },
  {
    key: "ai.recommendations.enabled",
    label: "Recommandations IA",
    description: "Active les recommandations personnalisées par IA.",
    category: "ai",
    valueType: "boolean",
  },
  {
    key: "ai.voice.enabled",
    label: "Agent vocal",
    description:
      "Active la conversation vocale avec l’assistant Sebavio (micro et synthèse).",
    category: "ai",
    valueType: "boolean",
  },
  {
    key: "weather.forecast_days",
    label: "Jours de prévision météo",
    description: "Nombre de jours de prévisions météo accessibles.",
    category: "weather",
    valueType: "limit",
  },
  {
    key: "fuel.optimization.enabled",
    label: "Optimisation carburant",
    description:
      "Active l'optimisation des arrêts et de la stratégie carburant.",
    category: "fuel",
    valueType: "boolean",
  },
  {
    key: "fuel.live_prices.enabled",
    label: "Prix carburant en direct",
    description: "Active l'accès aux prix carburant en temps réel.",
    category: "fuel",
    valueType: "boolean",
  },
  {
    key: "fuel.stations.detailed.enabled",
    label: "Stations détaillées",
    description: "Active le détail enrichi des stations-service.",
    category: "fuel",
    valueType: "boolean",
  },
  {
    key: "trip.sharing.enabled",
    label: "Partage de voyage",
    description: "Permet de partager un voyage avec d'autres utilisateurs.",
    category: "sharing",
    valueType: "boolean",
  },
  {
    key: "trip.export_pdf.enabled",
    label: "Export PDF",
    description: "Permet d'exporter un voyage au format PDF.",
    category: "sharing",
    valueType: "boolean",
  },
  {
    key: "trip.preview.enabled",
    label: "Aperçu de voyage",
    description: "Permet un aperçu limité d’un voyage (forfait Découverte).",
    category: "trips",
    valueType: "boolean",
  },
  {
    key: "trip.full_access.enabled",
    label: "Accès complet au voyage",
    description: "Débloque l’accès complet à la planification de voyage.",
    category: "trips",
    valueType: "boolean",
  },
  {
    key: "trip.gps_tracking.enabled",
    label: "Suivi GPS",
    description: "Active le suivi GPS pendant le voyage.",
    category: "trips",
    valueType: "boolean",
  },
  {
    key: "trip.travel_mode.enabled",
    label: "Mode voyage",
    description: "Active le mode voyage (suivi en cours de route).",
    category: "trips",
    valueType: "boolean",
  },
  {
    key: "trip.detours.enabled",
    label: "Détours",
    description: "Permet de calculer et proposer des détours.",
    category: "trips",
    valueType: "boolean",
  },
  {
    key: "trip.optimize.enabled",
    label: "Optimisation d’itinéraire",
    description: "Active l’optimisation d’itinéraire.",
    category: "trips",
    valueType: "boolean",
  },
  {
    key: "notifications.enabled",
    label: "Notifications",
    description: "Active les notifications liées aux voyages et au compte.",
    category: "sharing",
    valueType: "boolean",
  },
  {
    key: "support.priority",
    label: "Priorité d'assistance",
    description: "Niveau de priorité du support (ex. standard, prioritaire).",
    category: "support",
    valueType: "string",
  },
] as const;

const DEFINITIONS_BY_KEY = new Map<PlanEntitlementKey, EntitlementDefinition>(
  ENTITLEMENT_DEFINITIONS.map((d) => [d.key, d]),
);

if (DEFINITIONS_BY_KEY.size !== PLAN_ENTITLEMENT_KEYS.length) {
  throw new Error(
    "Les définitions d'entitlements ne couvrent pas exactement toutes les clés du registre.",
  );
}

export function getEntitlementDefinition(
  key: PlanEntitlementKey,
): EntitlementDefinition {
  const definition = DEFINITIONS_BY_KEY.get(key);
  if (!definition) {
    throw new Error(`Définition d'entitlement introuvable pour : ${key}`);
  }
  return definition;
}

export function getCategoryLabel(category: EntitlementCategory): string {
  return ENTITLEMENT_CATEGORY_LABELS[category];
}

export type EntitlementCategoryGroup = {
  category: EntitlementCategory;
  label: string;
  definitions: EntitlementDefinition[];
};

/**
 * Liste les entitlements groupés par catégorie, dans l'ordre stable du registre.
 */
export function listEntitlementsByCategory(): EntitlementCategoryGroup[] {
  return ENTITLEMENT_CATEGORIES.map((category) => ({
    category,
    label: ENTITLEMENT_CATEGORY_LABELS[category],
    definitions: ENTITLEMENT_DEFINITIONS.filter((d) => d.category === category),
  }));
}
