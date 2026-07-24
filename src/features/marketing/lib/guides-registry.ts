import { BRAND_ASSETS } from "./brand-assets";

export type GuideCategory =
  | "preparation"
  | "budget"
  | "famille"
  | "couple"
  | "solo"
  | "court_sejour"
  | "itineraire"
  | "vehicule"
  | "quebec";

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
  /**
   * Ordre éditorial (plus élevé = plus haut dans `/guides` à date égale).
   */
  editorialOrder: number;
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
  famille: "Famille",
  couple: "Couple",
  solo: "Solo",
  court_sejour: "Court séjour",
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
    slug: "escapade-fin-de-semaine-quebec",
    title: "Escapade de fin de semaine au Québec : bien organiser le séjour",
    description:
      "Organisez une escapade de fin de semaine au Québec : durée de route, activités, hébergement, météo, carburant et trajet de retour.",
    excerpt:
      "Structurez une courte escapade de deux ou trois jours : temps disponible, distance réaliste, nuitées, activités et retour avec marge.",
    category: "court_sejour",
    categoryLabel: GUIDE_CATEGORY_LABELS.court_sejour,
    publishedAt: "2026-07-24",
    updatedAt: "2026-07-24",
    editorialOrder: 60,
    readingTimeMinutes: 10,
    image: BRAND_ASSETS.heroLandscapeWebp,
    imageAlt:
      "Route nocturne sous un ciel étoilé — ambiance de voyage routier Sebavia",
    relatedLinks: [
      {
        href: "/planificateur-road-trip-quebec",
        label: "Planificateur de road trip au Québec",
      },
      { href: "/assistant-voyage-ia", label: "Assistant voyage IA" },
      { href: "/meteo-voyage", label: "Météo du voyage" },
      {
        href: "/calculateur-cout-carburant-voyage",
        label: "Calculateur de coût de carburant",
      },
      { href: "/fonctionnalites", label: "Fonctionnalités Sebavia" },
    ],
    relatedGuideSlugs: [
      "checklist-road-trip-quebec",
      "budget-road-trip-quebec",
      "road-trip-solo-quebec",
    ],
    isPublished: true,
  },
  {
    slug: "road-trip-solo-quebec",
    title: "Road trip solo au Québec : bien préparer son voyage",
    description:
      "Préparez votre road trip solo au Québec : itinéraire, pauses, hébergement, météo, carburant, budget et checklist avant le départ.",
    excerpt:
      "Organisez un voyage routier seul : rythme personnel, pauses, activités, hébergement, communications et checklist avant le départ.",
    category: "solo",
    categoryLabel: GUIDE_CATEGORY_LABELS.solo,
    publishedAt: "2026-07-24",
    updatedAt: "2026-07-24",
    editorialOrder: 50,
    readingTimeMinutes: 11,
    image: BRAND_ASSETS.heroLandscapeWebp,
    imageAlt:
      "Route nocturne sous un ciel étoilé — ambiance de voyage routier Sebavia",
    relatedLinks: [
      {
        href: "/planificateur-road-trip-quebec",
        label: "Planificateur de road trip au Québec",
      },
      { href: "/assistant-voyage-ia", label: "Assistant voyage IA" },
      { href: "/meteo-voyage", label: "Météo du voyage" },
      {
        href: "/calculateur-cout-carburant-voyage",
        label: "Calculateur de coût de carburant",
      },
      { href: "/fonctionnalites", label: "Fonctionnalités Sebavia" },
    ],
    relatedGuideSlugs: [
      "escapade-fin-de-semaine-quebec",
      "checklist-road-trip-quebec",
      "budget-road-trip-quebec",
    ],
    isPublished: true,
  },
  {
    slug: "road-trip-couple-quebec",
    title: "Road trip en couple au Québec : bien organiser l’escapade",
    description:
      "Organisez votre road trip ou escapade en couple au Québec : rythme, activités, repas, hébergement, météo, budget et checklist avant le départ.",
    excerpt:
      "Préparez une escapade à deux : style de séjour, rythme, activités communes, repas, hébergement et marge pour la spontanéité.",
    category: "couple",
    categoryLabel: GUIDE_CATEGORY_LABELS.couple,
    publishedAt: "2026-07-24",
    updatedAt: "2026-07-24",
    editorialOrder: 40,
    readingTimeMinutes: 10,
    image: BRAND_ASSETS.heroLandscapeWebp,
    imageAlt:
      "Route nocturne sous un ciel étoilé — ambiance de voyage routier Sebavia",
    relatedLinks: [
      {
        href: "/planificateur-road-trip-quebec",
        label: "Planificateur de road trip au Québec",
      },
      { href: "/assistant-voyage-ia", label: "Assistant voyage IA" },
      { href: "/meteo-voyage", label: "Météo du voyage" },
      {
        href: "/calculateur-cout-carburant-voyage",
        label: "Calculateur de coût de carburant",
      },
      { href: "/fonctionnalites", label: "Fonctionnalités Sebavia" },
    ],
    relatedGuideSlugs: [
      "escapade-fin-de-semaine-quebec",
      "checklist-road-trip-quebec",
      "budget-road-trip-quebec",
    ],
    isPublished: true,
  },
  {
    slug: "road-trip-famille-quebec",
    title: "Road trip en famille au Québec : bien organiser le voyage",
    description:
      "Préparez votre road trip en famille au Québec : pauses, activités, repas, hébergement, météo, carburant et checklist avant le départ.",
    excerpt:
      "Rythme, pauses, activités adaptées et organisation des journées pour un voyage routier avec enfants — sans parcours trop chargé.",
    category: "famille",
    categoryLabel: GUIDE_CATEGORY_LABELS.famille,
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-23",
    editorialOrder: 30,
    readingTimeMinutes: 12,
    image: BRAND_ASSETS.heroLandscapeWebp,
    imageAlt:
      "Route nocturne sous un ciel étoilé — ambiance de voyage routier Sebavia",
    relatedLinks: [
      {
        href: "/planificateur-road-trip-quebec",
        label: "Planificateur de road trip au Québec",
      },
      { href: "/assistant-voyage-ia", label: "Assistant voyage IA" },
      { href: "/meteo-voyage", label: "Météo du voyage" },
      {
        href: "/calculateur-cout-carburant-voyage",
        label: "Calculateur de coût de carburant",
      },
      { href: "/fonctionnalites", label: "Fonctionnalités Sebavia" },
    ],
    relatedGuideSlugs: [
      "escapade-fin-de-semaine-quebec",
      "checklist-road-trip-quebec",
      "budget-road-trip-quebec",
    ],
    isPublished: true,
  },
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
    editorialOrder: 20,
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
    relatedGuideSlugs: [
      "escapade-fin-de-semaine-quebec",
      "road-trip-solo-quebec",
      "checklist-road-trip-quebec",
    ],
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
    publishedAt: "2026-07-23",
    updatedAt: "2026-07-23",
    editorialOrder: 10,
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
    relatedGuideSlugs: [
      "escapade-fin-de-semaine-quebec",
      "road-trip-solo-quebec",
      "budget-road-trip-quebec",
    ],
    isPublished: true,
  },
] as const;

export function getPublishedGuides(): GuideMeta[] {
  return GUIDES.filter((g) => g.isPublished).sort((a, b) => {
    const byDate = b.publishedAt.localeCompare(a.publishedAt);
    if (byDate !== 0) return byDate;
    return b.editorialOrder - a.editorialOrder;
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
