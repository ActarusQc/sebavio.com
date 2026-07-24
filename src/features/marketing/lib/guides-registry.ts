import { BRAND_ASSETS } from "./brand-assets";

export type GuideCategory =
  "preparation" | "budget" | "itineraire" | "vehicule" | "quebec";

export type GuideRelatedLink = {
  href: string;
  label: string;
};

export type GuideMeta = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: GuideCategory;
  categoryLabel: string;
  /** Date ISO figée — ne pas générer à chaque build. */
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  image: string;
  imageAlt: string;
  relatedLinks: readonly GuideRelatedLink[];
  /** Slugs d’autres guides publiés pour la section « À lire aussi ». */
  relatedGuideSlugs: readonly string[];
  isPublished: boolean;
};

export const GUIDE_CATEGORY_LABELS: Record<GuideCategory, string> = {
  preparation: "Préparation",
  budget: "Budget",
  itineraire: "Itinéraire",
  vehicule: "Véhicule",
  quebec: "Québec",
};

/**
 * Fuseau éditorial Québec : les dates affichées suivent America/Toronto,
 * pas le décalage UTC qui peut basculer au lendemain.
 */
export const GUIDE_EDITORIAL_TIMEZONE = "America/Toronto";

/**
 * Registre typé des guides publics.
 * Ajouter un guide ici + sa page de contenu; seuls les `isPublished: true` apparaissent.
 */
export const GUIDES: readonly GuideMeta[] = [
  {
    slug: "budget-road-trip-quebec",
    title: "Budget road trip au Québec : les coûts à prévoir",
    description:
      "Préparez le budget de votre road trip au Québec : carburant, hébergement, repas, activités, stationnement et marge pour les imprévus.",
    excerpt:
      "Organisez le budget global d’un voyage routier : catégories de dépenses, coûts fixes et variables, marge et suivi avant le départ.",
    category: "budget",
    categoryLabel: GUIDE_CATEGORY_LABELS.budget,
    publishedAt: "2026-07-23T20:00:00.000Z",
    updatedAt: "2026-07-23T20:00:00.000Z",
    readingTimeMinutes: 11,
    image: BRAND_ASSETS.heroLandscapeWebp,
    imageAlt:
      "Route nocturne sous un ciel étoilé — ambiance de voyage routier Sebavia",
    relatedLinks: [
      {
        href: "/calculateur-cout-carburant-voyage",
        label: "Calculateur de coût de carburant",
      },
      {
        href: "/planificateur-road-trip-quebec",
        label: "Planificateur de road trip au Québec",
      },
      {
        href: "/planifier-arrets-carburant",
        label: "Planifier les arrêts de carburant",
      },
      { href: "/fonctionnalites", label: "Fonctionnalités Sebavia" },
      { href: "/pricing", label: "Tarifs" },
    ],
    relatedGuideSlugs: ["checklist-road-trip-quebec"],
    isPublished: true,
  },
  {
    slug: "checklist-road-trip-quebec",
    title: "Checklist road trip au Québec : quoi préparer avant de partir",
    description:
      "Liste pratique pour préparer un road trip au Québec : véhicule, itinéraire, carburant, météo, bagages et vérifications avant le départ.",
    excerpt:
      "Une checklist claire pour organiser votre voyage routier : documents, véhicule, étapes, essence, météo et dernières vérifications.",
    category: "preparation",
    categoryLabel: GUIDE_CATEGORY_LABELS.preparation,
    /** Publication réelle au Québec : 23 juillet 2026 (pas le lendemain UTC). */
    publishedAt: "2026-07-23T16:00:00.000Z",
    updatedAt: "2026-07-23T16:00:00.000Z",
    readingTimeMinutes: 9,
    image: BRAND_ASSETS.heroLandscapeWebp,
    imageAlt:
      "Route nocturne sous un ciel étoilé — ambiance de voyage routier Sebavia",
    relatedLinks: [
      {
        href: "/planificateur-road-trip-quebec",
        label: "Planificateur de road trip au Québec",
      },
      {
        href: "/calculateur-cout-carburant-voyage",
        label: "Calculateur de coût de carburant",
      },
      {
        href: "/planifier-arrets-carburant",
        label: "Planifier les arrêts de carburant",
      },
      { href: "/meteo-voyage", label: "Météo du voyage" },
      { href: "/fonctionnalites", label: "Fonctionnalités Sebavia" },
    ],
    relatedGuideSlugs: ["budget-road-trip-quebec"],
    isPublished: true,
  },
] as const;

export function getPublishedGuides(): GuideMeta[] {
  return GUIDES.filter((g) => g.isPublished).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}

export function getGuideBySlug(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug && g.isPublished);
}

export function getRelatedGuides(guide: GuideMeta): GuideMeta[] {
  return guide.relatedGuideSlugs
    .map((slug) => getGuideBySlug(slug))
    .filter((g): g is GuideMeta => Boolean(g));
}

export function formatGuideDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: GUIDE_EDITORIAL_TIMEZONE,
  });
}
