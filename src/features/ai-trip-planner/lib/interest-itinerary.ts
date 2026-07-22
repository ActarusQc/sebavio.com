import { randomUUID } from "node:crypto";
import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";
import {
  getTravelInterestLabel,
  type TravelInterest,
} from "@/features/ai-trip-planner/lib/labels";
import {
  ANY_INTEREST_LABEL,
  NONE_INTEREST_LABEL,
  parseInterestMutation,
  parseTravelInterest,
  parseTravelInterestsFromList,
} from "@/features/ai-trip-planner/lib/travel-interests";

const GENERIC_NAME_PATTERNS = [
  /^arriv[ée]e et balade/i,
  /^point d[’']int[ée]r[êe]t pr[èe]s/i,
  /^d[ée]couverte de /i,
  /^pause route entre /i,
  /^temps fort autour/i,
  /^activit[ée] phare/i,
];

export function isGenericPlaceholderItem(name: string): boolean {
  const n = name.trim();
  if (!n) return true;
  return GENERIC_NAME_PATTERNS.some((re) => re.test(n));
}

export function countConcreteItineraryItems(draft: TripDraftParsed): number {
  const items = [
    ...draft.stops.filter((s) => s.accepted),
    ...draft.activities.filter((a) => a.accepted),
    ...draft.suggestions.filter((s) => s.accepted),
  ];
  return items.filter((i) => !isGenericPlaceholderItem(i.name)).length;
}

function resolvedInterests(draft: TripDraftParsed): TravelInterest[] {
  if (draft.interests.length > 0) return draft.interests as TravelInterest[];
  return parseTravelInterestsFromList([
    ...draft.preferences,
    ...draft.travelStyle,
    ...draft.constraints,
  ]);
}

export function hasGastronomyInterest(draft: TripDraftParsed): boolean {
  return resolvedInterests(draft).includes("gastronomy");
}

type CatalogItem = {
  name: string;
  category: "meal" | "activity" | "detour" | "other";
  justification: string;
  durationMinutes: number;
  tags: TravelInterest[];
};

/** Catalogue QC — noms réels / lieux connus (pas de placeholders). */
const REGION_CATALOG: Array<{
  match: RegExp;
  items: CatalogItem[];
}> = [
  {
    match: /estrie|cantons|sherbrooke|magog|orford|bromont/i,
    items: [
      {
        name: "Marché de la Gare de Sherbrooke",
        category: "meal",
        justification: "Producteurs locaux et spécialités de l’Estrie.",
        durationMinutes: 90,
        tags: ["gastronomy", "shopping"],
      },
      {
        name: "Vignoble Domaine Les Brome (Bromont)",
        category: "meal",
        justification: "Dégustation de vins du terroir des Cantons-de-l’Est.",
        durationMinutes: 75,
        tags: ["gastronomy"],
      },
      {
        name: "Fromagerie La Station (Compton)",
        category: "meal",
        justification: "Fromages fermiers AOP et produits de la ferme.",
        durationMinutes: 60,
        tags: ["gastronomy"],
      },
      {
        name: "Microbrasserie Siboire (Sherbrooke)",
        category: "meal",
        justification: "Bières artisanales et cuisine décontractée.",
        durationMinutes: 90,
        tags: ["gastronomy"],
      },
      {
        name: "Parc national du Mont-Orford",
        category: "activity",
        justification: "Randonnée et belvédères classiques de l’Estrie.",
        durationMinutes: 150,
        tags: ["nature"],
      },
      {
        name: "Rue Principale de Magog et boutiques",
        category: "activity",
        justification: "Magasinage local, cafés et vue sur le lac.",
        durationMinutes: 120,
        tags: ["shopping", "culture", "gastronomy"],
      },
      {
        name: "Centre-ville de Magog et lac Memphrémagog",
        category: "activity",
        justification: "Promenade, boutiques et vue sur le lac.",
        durationMinutes: 120,
        tags: ["culture", "nature", "shopping"],
      },
    ],
  },
  {
    match: /gasp|perce|perce|carleton|forillon/i,
    items: [
      {
        name: "Restaurant La Maison du Pêcheur (Percé)",
        category: "meal",
        justification: "Fruits de mer et vue sur le Rocher Percé.",
        durationMinutes: 90,
        tags: ["gastronomy"],
      },
      {
        name: "Fumoir d’Antan / produits fumés gaspésiens",
        category: "meal",
        justification: "Spécialités fumées et produits du terroir.",
        durationMinutes: 45,
        tags: ["gastronomy", "shopping"],
      },
      {
        name: "Rocher Percé et promenade du quai",
        category: "activity",
        justification: "Balade iconique et panorama sur le golfe.",
        durationMinutes: 120,
        tags: ["nature", "local_discovery"],
      },
      {
        name: "Boutiques d’artisans de Percé",
        category: "activity",
        justification: "Créations locales et souvenirs gaspésiens.",
        durationMinutes: 60,
        tags: ["shopping", "culture"],
      },
    ],
  },
  {
    match: /charlevoix|baie-saint-paul|baie st|la malbaie/i,
    items: [
      {
        name: "Marché public de Baie-Saint-Paul",
        category: "meal",
        justification: "Producteurs et artisans de Charlevoix.",
        durationMinutes: 75,
        tags: ["gastronomy", "shopping"],
      },
      {
        name: "Galerie et rue Saint-Jean-Baptiste",
        category: "activity",
        justification: "Art, culture et magasinage dans le village.",
        durationMinutes: 90,
        tags: ["culture", "shopping"],
      },
      {
        name: "Sentier des Caps / belvédères Charlevoix",
        category: "activity",
        justification: "Plein air et panoramas du fleuve.",
        durationMinutes: 150,
        tags: ["nature", "sports"],
      },
    ],
  },
];

const DEFAULT_GASTRO: CatalogItem[] = [
  {
    name: "Marché public ou producteurs locaux",
    category: "meal",
    justification: "Produits du terroir et spécialités régionales.",
    durationMinutes: 90,
    tags: ["gastronomy", "shopping"],
  },
  {
    name: "Microbrasserie artisanale",
    category: "meal",
    justification: "Bières locales et planchettes pour une pause gourmande.",
    durationMinutes: 75,
    tags: ["gastronomy"],
  },
  {
    name: "Fromagerie ou cabane à sucre / table champêtre",
    category: "meal",
    justification: "Expérience terroir québécoise selon la saison.",
    durationMinutes: 90,
    tags: ["gastronomy"],
  },
];

const DEFAULT_NATURE: CatalogItem[] = [
  {
    name: "Parc ou belvédère local",
    category: "activity",
    justification: "Pause nature et point de vue recommandé.",
    durationMinutes: 90,
    tags: ["nature"],
  },
  {
    name: "Sentier de randonnée à proximité",
    category: "activity",
    justification: "Marche en plein air adaptée à la durée du séjour.",
    durationMinutes: 120,
    tags: ["nature", "sports"],
  },
];

const DEFAULT_SHOPPING: CatalogItem[] = [
  {
    name: "Rue commerciale et boutiques locales",
    category: "activity",
    justification: "Magasinage, artisans et découvertes locales.",
    durationMinutes: 90,
    tags: ["shopping", "local_discovery"],
  },
  {
    name: "Marché public / artisans",
    category: "activity",
    justification: "Produits locaux, cadeaux et spécialités régionales.",
    durationMinutes: 75,
    tags: ["shopping", "gastronomy"],
  },
];

const DEFAULT_GENERAL: CatalogItem[] = [
  {
    name: "Centre-ville et rue principale",
    category: "activity",
    justification: "Balade, boutiques et cafés du cœur de la destination.",
    durationMinutes: 90,
    tags: ["culture", "shopping"],
  },
  ...DEFAULT_NATURE.slice(0, 1),
];

function pickCatalog(draft: TripDraftParsed): CatalogItem[] {
  const dest = `${draft.destination.name ?? ""} ${draft.destination.city ?? ""}`;
  const region = REGION_CATALOG.find((r) => r.match.test(dest));
  const interests = resolvedInterests(draft);
  const poolBase = region?.items ?? [];

  const byInterest = (tag: TravelInterest) =>
    poolBase.filter((i) => i.tags.includes(tag));

  const selected: CatalogItem[] = [];
  const pushUnique = (items: CatalogItem[]) => {
    for (const item of items) {
      if (selected.some((s) => s.name === item.name)) continue;
      selected.push(item);
    }
  };

  if (interests.length === 0) {
    pushUnique(poolBase.length ? poolBase : DEFAULT_GENERAL);
  } else {
    for (const interest of interests) {
      const fromRegion = byInterest(interest);
      if (fromRegion.length) {
        pushUnique(fromRegion.slice(0, 2));
      } else if (interest === "gastronomy") {
        pushUnique(DEFAULT_GASTRO.slice(0, 2));
      } else if (interest === "nature" || interest === "sports") {
        pushUnique(DEFAULT_NATURE);
      } else if (interest === "shopping") {
        pushUnique(DEFAULT_SHOPPING);
      } else if (interest === "culture" || interest === "local_discovery") {
        pushUnique(DEFAULT_GENERAL);
      }
    }
  }

  if (selected.length < 2) {
    pushUnique(poolBase);
    pushUnique(DEFAULT_GENERAL);
  }

  const days = Math.max(1, draft.durationDays ?? 1);
  const limit = Math.min(2 + days, 6);
  return selected.slice(0, limit);
}

/**
 * Construit une proposition concrète selon les intérêts.
 * Ne produit jamais les placeholders génériques « Arrivée et balade… ».
 */
export function buildInterestBasedItinerary(
  draft: TripDraftParsed,
  options?: { force?: boolean },
): TripDraftParsed {
  if (!draft.origin.name?.trim() || !draft.destination.name?.trim()) {
    return draft;
  }
  if (
    draft.estimatedDistanceKm == null &&
    draft.estimatedDurationMinutes == null
  ) {
    return draft;
  }

  const concrete = countConcreteItineraryItems(draft);
  if (concrete >= 2 && !options?.force) {
    return {
      ...draft,
      activities: draft.activities.filter(
        (a) => !isGenericPlaceholderItem(a.name),
      ),
      stops: draft.stops.filter((s) => !isGenericPlaceholderItem(s.name)),
      suggestions: draft.suggestions.filter(
        (s) => !isGenericPlaceholderItem(s.name),
      ),
    };
  }

  const catalog = pickCatalog(draft);
  const interests = resolvedInterests(draft);
  const activities = catalog.map((item) => ({
    id: randomUUID(),
    name: item.name,
    category: item.category,
    justification: item.justification,
    durationMinutes: item.durationMinutes,
    latitude: null as number | null,
    longitude: null as number | null,
    placeId: null as string | null,
    address: null as string | null,
    accepted: true,
  }));

  const dest =
    draft.destination.city || draft.destination.name || "destination";
  const origin = draft.origin.city || draft.origin.name || "départ";

  const preferenceLabels = interests.map((i) => getTravelInterestLabel(i));

  let next: TripDraftParsed = {
    ...draft,
    interests,
    primaryInterest: interests[0] ?? draft.primaryInterest,
    preferencesResolved: true,
    activities,
    stops: draft.stops.filter(
      (s) =>
        !isGenericPlaceholderItem(s.name) &&
        (s.category === "lodging" || !options?.force),
    ),
    suggestions: catalog.slice(0, 3).map((item) => ({
      id: randomUUID(),
      name: item.name,
      category: item.tags[0] ?? item.category,
      justification: item.justification,
      imageUrl: null,
      accepted: true,
    })),
    title:
      draft.title ??
      (hasGastronomyInterest(draft)
        ? `Escapade gourmande ${origin} → ${dest}`.slice(0, 150)
        : `Voyage ${origin} → ${dest}`.slice(0, 150)),
    preferences:
      preferenceLabels.length > 0 ? preferenceLabels : draft.preferences,
  };

  if (draft.accommodationMode === "decide_later") {
    const warning = "Cet itinéraire ne contient pas encore d’hébergement.";
    next = {
      ...next,
      softWarnings: Array.from(new Set([...next.softWarnings, warning])),
      stops: [
        ...next.stops.filter((s) => s.category !== "lodging"),
        {
          id: randomUUID(),
          name: "Hébergement à déterminer",
          category: "lodging",
          justification: warning,
          durationMinutes: null,
          latitude: null,
          longitude: null,
          placeId: null,
          address: null,
          accepted: true,
        },
      ],
    };
  }

  return next;
}

/** Applique une sélection multi d’intérêts (libellés ou ids). */
export function applyInterestsSelection(
  draft: TripDraftParsed,
  values: string[],
): TripDraftParsed {
  const interests = parseTravelInterestsFromList(values);
  return {
    ...draft,
    interests,
    primaryInterest: interests[0] ?? null,
    preferencesResolved: true,
    preferences: interests.map((i) => getTravelInterestLabel(i)),
    proposalConfirmed: false,
    activities: [],
    suggestions: [],
  };
}

/** Patch préférences depuis une réponse utilisateur (libre ou structurée). */
export function applyInterestFromUserText(
  draft: TripDraftParsed,
  text: string,
): TripDraftParsed {
  const trimmed = text.trim();
  if (!trimmed) return draft;

  if (
    trimmed === NONE_INTEREST_LABEL ||
    /^aucun int[eé]r[eê]t/i.test(trimmed)
  ) {
    return {
      ...draft,
      interests: [],
      primaryInterest: null,
      preferencesResolved: true,
      preferences: draft.preferences,
      proposalConfirmed: false,
      activities: [],
      suggestions: [],
    };
  }

  if (trimmed === ANY_INTEREST_LABEL || /^tout me convient/i.test(trimmed)) {
    return applyInterestsSelection(draft, [
      "gastronomy",
      "nature",
      "culture",
      "local_discovery",
    ]);
  }

  // Format « Continuer avec mes choix : A · B »
  const continueMatch = trimmed.match(
    /continuer avec mes choix\s*[:：]?\s*(.+)$/i,
  );
  if (continueMatch?.[1]) {
    const parts = continueMatch[1]
      .split(/[·,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return applyInterestsSelection(draft, parts);
  }

  const mutated = parseInterestMutation(
    trimmed,
    draft.interests as TravelInterest[],
  );
  if (mutated) {
    return {
      ...draft,
      interests: mutated,
      primaryInterest: mutated[0] ?? null,
      preferencesResolved: true,
      preferences: mutated.map((i) => getTravelInterestLabel(i)),
      proposalConfirmed: false,
      activities: [],
      suggestions: [],
    };
  }

  const single = parseTravelInterest(trimmed);
  if (single) {
    // En étape préférences multi : ne pas finaliser sur un seul clic texte
    // sauf si le message combine plusieurs intérêts.
    const multi = parseTravelInterestsFromList(
      trimmed.split(/[·,;et]+/).map((s) => s.trim()),
    );
    if (multi.length > 1) {
      return applyInterestsSelection(draft, multi);
    }
    if (draft.preferencesResolved || draft.interests.length > 0) {
      const next = draft.interests.includes(single)
        ? draft.interests
        : [...draft.interests, single];
      return applyInterestsSelection(draft, next);
    }
  }

  // Budget
  const t = trimmed.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (/budget moder|modere|modéré/.test(t)) {
    return { ...draft, budgetLevel: draft.budgetLevel ?? "moderate" };
  }

  return draft;
}
