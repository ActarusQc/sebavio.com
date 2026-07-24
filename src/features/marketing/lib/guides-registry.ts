import { BRAND_ASSETS } from "./brand-assets";

export type GuideCategory =
  "preparation" | "itineraire" | "vehicule" | "quebec";

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
  isPublished: boolean;
};

export const GUIDE_CATEGORY_LABELS: Record<GuideCategory, string> = {
  preparation: "Préparation",
  itineraire: "Itinéraire",
  vehicule: "Véhicule",
  quebec: "Québec",
};

/**
 * Registre typé des guides publics.
 * Ajouter un guide ici + sa page de contenu; seuls les `isPublished: true` apparaissent.
 */
export const GUIDES: readonly GuideMeta[] = [
  {
    slug: "checklist-road-trip-quebec",
    title: "Checklist road trip au Québec : quoi préparer avant de partir",
    description:
      "Liste pratique pour préparer un road trip au Québec : véhicule, itinéraire, carburant, météo, bagages et vérifications avant le départ.",
    excerpt:
      "Une checklist claire pour organiser votre voyage routier : documents, véhicule, étapes, essence, météo et dernières vérifications.",
    category: "preparation",
    categoryLabel: GUIDE_CATEGORY_LABELS.preparation,
    publishedAt: "2026-07-24T12:00:00.000Z",
    updatedAt: "2026-07-24T12:00:00.000Z",
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
    isPublished: true,
  },
] as const;

export function getPublishedGuides(): GuideMeta[] {
  return GUIDES.filter((g) => g.isPublished);
}

export function getGuideBySlug(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug && g.isPublished);
}

export function formatGuideDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
