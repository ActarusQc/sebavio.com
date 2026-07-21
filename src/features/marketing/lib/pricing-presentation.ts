import type { PlanEntitlementKey } from "@/features/plans/lib/entitlement-registry";
import { OFFICIAL_PLAN_SLUGS } from "@/features/subscriptions/lib/official-plan-slugs";

export type PlanEntitlementSnapshot = {
  key: string;
  enabled: boolean;
  limit: number | null;
  value: string | null;
};

export type ComparisonCell =
  | { kind: "yes" }
  | { kind: "no" }
  | { kind: "limited"; label: string }
  | { kind: "text"; label: string };

export type ComparisonRow = {
  id: string;
  label: string;
  cells: Record<string, ComparisonCell>;
};

export type ComparisonGroup = {
  id: string;
  title: string;
  rows: ComparisonRow[];
};

function ent(
  entitlements: PlanEntitlementSnapshot[],
  key: PlanEntitlementKey,
): PlanEntitlementSnapshot | undefined {
  return entitlements.find((e) => e.key === key);
}

function isOn(
  entitlements: PlanEntitlementSnapshot[],
  key: PlanEntitlementKey,
): boolean {
  return ent(entitlements, key)?.enabled === true;
}

function limitOf(
  entitlements: PlanEntitlementSnapshot[],
  key: PlanEntitlementKey,
): number | null {
  const e = ent(entitlements, key);
  if (!e?.enabled) return null;
  return e.limit;
}

/** Avantages courts affichés sur les cartes (dérivés des entitlements). */
export function buildPlanHighlights(
  slug: string,
  entitlements: PlanEntitlementSnapshot[],
): string[] {
  if (slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE) {
    const items = ["Découvrir l’interface Sebavio", "Créer son profil"];
    if (limitOf(entitlements, "vehicles.max") !== null) {
      items.push("Enregistrer un véhicule");
    }
    if (isOn(entitlements, "trip.preview.enabled")) {
      items.push("Consulter un aperçu des outils");
      items.push("Essayer certaines fonctions de démonstration");
    }
    items.push("Découvrir l’agent Sebavio de façon limitée");
    return items;
  }

  const items: string[] = [];
  if (isOn(entitlements, "trip.full_access.enabled")) {
    items.push("Planification complète de voyages");
  }
  if (isOn(entitlements, "trip.detours.enabled")) {
    items.push("Itinéraires et détours personnalisés");
  }
  if (
    isOn(entitlements, "fuel.optimization.enabled") ||
    isOn(entitlements, "fuel.live_prices.enabled")
  ) {
    items.push("Estimation et planification du carburant");
  }
  if (isOn(entitlements, "weather.forecast_days")) {
    const days = limitOf(entitlements, "weather.forecast_days");
    items.push(
      days != null ? `Météo du voyage (${days} jours)` : "Météo du voyage",
    );
  }
  if (isOn(entitlements, "ai.recommendations.enabled")) {
    items.push("Activités et arrêts adaptés au profil");
  }
  if (
    limitOf(entitlements, "vehicles.max") === null &&
    isOn(entitlements, "vehicles.max")
  ) {
    items.push("Gestion du véhicule");
  } else if (isOn(entitlements, "vehicles.max")) {
    items.push("Gestion du véhicule");
  }
  if (isOn(entitlements, "ai.planning.enabled")) {
    items.push("Agent conversationnel Sebavio");
  }
  if (isOn(entitlements, "ai.voice.enabled")) {
    items.push("Conversation vocale avec l’agent");
  }
  if (
    isOn(entitlements, "trip.travel_mode.enabled") ||
    isOn(entitlements, "trip.gps_tracking.enabled")
  ) {
    items.push("Accès aux fonctions disponibles pendant le voyage");
  }

  if (slug === OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS) {
    return [
      "Toutes les fonctions du Pass 30 jours",
      "Accès complet pendant un an",
      "Voyages multiples",
      "Historique des voyages",
      "Gestion continue des véhicules",
      "Entretien et rappels",
      ...(isOn(entitlements, "ai.voice.enabled")
        ? ["Agent conversationnel texte et vocal"]
        : isOn(entitlements, "ai.planning.enabled")
          ? ["Agent conversationnel"]
          : []),
      "Planification avant, pendant et après les voyages",
      "Accès aux nouvelles fonctions incluses selon les droits du forfait",
    ];
  }

  return items.slice(0, 9);
}

function cellYesNo(
  entitlements: PlanEntitlementSnapshot[],
  key: PlanEntitlementKey,
): ComparisonCell {
  return isOn(entitlements, key) ? { kind: "yes" } : { kind: "no" };
}

function cellLimit(
  entitlements: PlanEntitlementSnapshot[],
  key: PlanEntitlementKey,
  unlimitedLabel = "Illimité",
): ComparisonCell {
  if (!isOn(entitlements, key)) return { kind: "no" };
  const limit = limitOf(entitlements, key);
  if (limit == null) return { kind: "text", label: unlimitedLabel };
  return { kind: "text", label: String(limit) };
}

function cellAiAgent(entitlements: PlanEntitlementSnapshot[]): ComparisonCell {
  const planning = isOn(entitlements, "ai.planning.enabled");
  const voice = isOn(entitlements, "ai.voice.enabled");
  if (planning && voice) return { kind: "yes" };
  if (planning) return { kind: "limited", label: "Texte" };
  if (isOn(entitlements, "trip.preview.enabled")) {
    return { kind: "limited", label: "Aperçu" };
  }
  return { kind: "no" };
}

export type PlanBillingMeta = {
  slug: string;
  billingType: string | null;
  accessDurationDays: number | null;
  interval: string | null;
};

/** Matrice de comparaison dérivée des entitlements (source unique). */
export function buildComparisonGroups(
  plans: Array<{
    slug: string;
    entitlements: PlanEntitlementSnapshot[];
    billing?: PlanBillingMeta;
  }>,
): ComparisonGroup[] {
  const bySlug = new Map(plans.map((p) => [p.slug, p]));
  const order = [
    OFFICIAL_PLAN_SLUGS.DECOUVERTE,
    OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
    OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS,
  ] as const;

  const cellsFor = (
    fn: (ents: PlanEntitlementSnapshot[], slug: string) => ComparisonCell,
  ): Record<string, ComparisonCell> => {
    const cells: Record<string, ComparisonCell> = {};
    for (const slug of order) {
      const plan = bySlug.get(slug);
      cells[slug] = plan ? fn(plan.entitlements, slug) : { kind: "no" };
    }
    return cells;
  };

  return [
    {
      id: "discover",
      title: "Découvrir Sebavio",
      rows: [
        {
          id: "account",
          label: "Création de compte",
          cells: cellsFor(() => ({ kind: "yes" })),
        },
        {
          id: "profile",
          label: "Profil",
          cells: cellsFor(() => ({ kind: "yes" })),
        },
        {
          id: "preview-ui",
          label: "Aperçu de l’interface",
          cells: cellsFor((ents) =>
            isOn(ents, "trip.preview.enabled") ||
            isOn(ents, "trip.full_access.enabled")
              ? { kind: "yes" }
              : { kind: "limited", label: "Partiel" },
          ),
        },
        {
          id: "discovery-features",
          label: "Fonctions de découverte",
          cells: cellsFor((ents, slug) =>
            slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE
              ? { kind: "yes" }
              : isOn(ents, "trip.full_access.enabled")
                ? { kind: "text", label: "Inclus +" }
                : { kind: "no" },
          ),
        },
      ],
    },
    {
      id: "plan",
      title: "Planifier un voyage",
      rows: [
        {
          id: "full-route",
          label: "Itinéraire complet",
          cells: cellsFor((ents) =>
            cellYesNo(ents, "trip.full_access.enabled"),
          ),
        },
        {
          id: "detours",
          label: "Détours",
          cells: cellsFor((ents) => cellYesNo(ents, "trip.detours.enabled")),
        },
        {
          id: "stops",
          label: "Étapes",
          cells: cellsFor((ents) =>
            cellYesNo(ents, "trip.full_access.enabled"),
          ),
        },
        {
          id: "activities",
          label: "Activités",
          cells: cellsFor((ents) => {
            if (isOn(ents, "ai.recommendations.enabled"))
              return { kind: "yes" };
            const max = limitOf(ents, "activities.max");
            if (max != null)
              return { kind: "limited", label: `Jusqu’à ${max}` };
            return isOn(ents, "activities.max")
              ? { kind: "yes" }
              : { kind: "no" };
          }),
        },
        {
          id: "weather",
          label: "Météo",
          cells: cellsFor((ents) => {
            if (!isOn(ents, "weather.forecast_days")) return { kind: "no" };
            const days = limitOf(ents, "weather.forecast_days");
            return days != null
              ? { kind: "text", label: `${days} jours` }
              : { kind: "yes" };
          }),
        },
        {
          id: "fuel",
          label: "Carburant",
          cells: cellsFor((ents) =>
            isOn(ents, "fuel.optimization.enabled") ||
            isOn(ents, "fuel.live_prices.enabled")
              ? { kind: "yes" }
              : { kind: "limited", label: "Aperçu" },
          ),
        },
        {
          id: "budget",
          label: "Budget",
          cells: cellsFor((ents) =>
            cellYesNo(ents, "trip.full_access.enabled"),
          ),
        },
        {
          id: "agent",
          label: "Agent conversationnel",
          cells: cellsFor((ents) => cellAiAgent(ents)),
        },
      ],
    },
    {
      id: "travel",
      title: "Voyager avec Sebavio",
      rows: [
        {
          id: "geo",
          label: "Géolocalisation",
          cells: cellsFor((ents) =>
            cellYesNo(ents, "trip.gps_tracking.enabled"),
          ),
        },
        {
          id: "context",
          label: "Informations contextuelles",
          cells: cellsFor((ents) =>
            cellYesNo(ents, "trip.travel_mode.enabled"),
          ),
        },
        {
          id: "live-edit",
          label: "Modifications pendant le trajet",
          cells: cellsFor((ents) =>
            isOn(ents, "trip.travel_mode.enabled") ||
            isOn(ents, "trip.detours.enabled")
              ? { kind: "yes" }
              : { kind: "no" },
          ),
        },
        {
          id: "voice",
          label: "Conversation vocale",
          cells: cellsFor((ents) => cellYesNo(ents, "ai.voice.enabled")),
        },
        {
          id: "nearby",
          label: "Suggestions à proximité",
          cells: cellsFor((ents) =>
            cellYesNo(ents, "ai.recommendations.enabled"),
          ),
        },
      ],
    },
    {
      id: "vehicles",
      title: "Gérer ses véhicules",
      rows: [
        {
          id: "vehicles-count",
          label: "Véhicules",
          cells: cellsFor((ents) => cellLimit(ents, "vehicles.max")),
        },
        {
          id: "consumption",
          label: "Consommation personnalisée",
          cells: cellsFor((ents) =>
            isOn(ents, "vehicles.max") ? { kind: "yes" } : { kind: "no" },
          ),
        },
        {
          id: "maintenance",
          label: "Entretien",
          cells: cellsFor((_ents, slug) =>
            slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE
              ? { kind: "limited", label: "Base" }
              : { kind: "yes" },
          ),
        },
        {
          id: "reminders",
          label: "Rappels",
          cells: cellsFor((ents, slug) =>
            isOn(ents, "notifications.enabled")
              ? slug === OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS
                ? { kind: "yes" }
                : { kind: "limited", label: "Selon forfait" }
              : { kind: "no" },
          ),
        },
        {
          id: "history",
          label: "Historique",
          cells: cellsFor((_ents, slug) =>
            slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE
              ? { kind: "limited", label: "Limité" }
              : { kind: "yes" },
          ),
        },
      ],
    },
    {
      id: "duration",
      title: "Durée et utilisation",
      rows: [
        {
          id: "days",
          label: "Durée d’accès",
          cells: cellsFor((_ents, slug) => {
            const plan = bySlug.get(slug);
            if (slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE) {
              return { kind: "text", label: "Permanent" };
            }
            if (slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS) {
              const days = plan?.billing?.accessDurationDays ?? 30;
              return { kind: "text", label: `${days} jours` };
            }
            return { kind: "text", label: "1 an" };
          }),
        },
        {
          id: "trips",
          label: "Nombre de voyages",
          cells: cellsFor((ents) => cellLimit(ents, "trips.max")),
        },
        {
          id: "renewal",
          label: "Renouvellement",
          cells: cellsFor((_ents, slug) => {
            if (slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS) {
              return { kind: "text", label: "Aucun (paiement unique)" };
            }
            if (slug === OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS) {
              return { kind: "text", label: "Automatique (annuel)" };
            }
            return { kind: "text", label: "—" };
          }),
        },
        {
          id: "billing",
          label: "Paiement",
          cells: cellsFor((_ents, slug) => {
            if (slug === OFFICIAL_PLAN_SLUGS.DECOUVERTE) {
              return { kind: "text", label: "Gratuit" };
            }
            if (slug === OFFICIAL_PLAN_SLUGS.PASS_30_JOURS) {
              return { kind: "text", label: "Paiement unique" };
            }
            return { kind: "text", label: "Abonnement annuel" };
          }),
        },
      ],
    },
  ];
}

export function hasVoiceCapability(
  entitlements: PlanEntitlementSnapshot[],
): boolean {
  return isOn(entitlements, "ai.voice.enabled");
}
