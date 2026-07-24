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
  /**
   * Date éditoriale civile `YYYY-MM-DD` (Québec), figée — ne pas générer à chaque build.
   * Évite les décalages UTC → « lendemain ».
   */
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

/** Fuseau de référence pour toute conversion horodatée éventuelle. */
export const GUIDE_EDITORIAL_TIMEZONE = "America/Toronto";

const CIVIL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

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
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-23",
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
    /** Publication réelle au Québec : 23 juillet 2026. */
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-23",
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
  return GUIDES.filter((g) => g.isPublished).sort((a, b) => {
    const byDate = b.publishedAt.localeCompare(a.publishedAt);
    if (byDate !== 0) return byDate;
    // Ordre éditorial stable : budget avant checklist si même jour.
    return a.slug.localeCompare(b.slug);
  });
}

export function getGuideBySlug(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug && g.isPublished);
}

export function getRelatedGuides(guide: GuideMeta): GuideMeta[] {
  return guide.relatedGuideSlugs
    .map((slug) => getGuideBySlug(slug))
    .filter((g): g is GuideMeta => Boolean(g));
}

/** Extrait la date civile `YYYY-MM-DD` (ignorant toute heure / fuseau). */
export function toGuideCivilDate(value: string): string {
  const match = CIVIL_DATE_RE.exec(value.trim());
  if (!match) {
    throw new Error(`Date éditoriale invalide: ${value}`);
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/**
 * Formatage FR-CA stable : basé sur la date civile, midi UTC,
 * pour que le jour affiché ne bascule jamais selon le serveur.
 */
export function formatGuideDate(value: string): string {
  const civil = toGuideCivilDate(value);
  const [year, month, day] = civil.split("-").map(Number);
  const utcNoon = new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0));
  return utcNoon.toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
