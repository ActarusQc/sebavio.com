import { randomUUID } from "node:crypto";
import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";

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

function interestsOf(draft: TripDraftParsed): string[] {
  return [...draft.preferences, ...draft.travelStyle, ...draft.constraints]
    .map((s) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, ""))
    .filter(Boolean);
}

export function hasGastronomyInterest(draft: TripDraftParsed): boolean {
  const bag = interestsOf(draft).join(" ");
  return /gastro|restaurant|cuisine|food|gourm|vin|vignoble|fromage|brasserie|microbrasserie|marche|terroir|degustation|dégustation/.test(
    bag,
  );
}

type CatalogItem = {
  name: string;
  category: "meal" | "activity" | "detour" | "other";
  justification: string;
  durationMinutes: number;
  tags: string[];
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
        tags: ["gastronomie"],
      },
      {
        name: "Vignoble Domaine Les Brome (Bromont)",
        category: "meal",
        justification: "Dégustation de vins du terroir des Cantons-de-l’Est.",
        durationMinutes: 75,
        tags: ["gastronomie"],
      },
      {
        name: "Fromagerie La Station (Compton)",
        category: "meal",
        justification: "Fromages fermiers AOP et produits de la ferme.",
        durationMinutes: 60,
        tags: ["gastronomie"],
      },
      {
        name: "Microbrasserie Siboire (Sherbrooke)",
        category: "meal",
        justification: "Bières artisanales et cuisine décontractée.",
        durationMinutes: 90,
        tags: ["gastronomie"],
      },
      {
        name: "Parc national du Mont-Orford",
        category: "activity",
        justification: "Randonnée et belvédères classiques de l’Estrie.",
        durationMinutes: 150,
        tags: ["nature"],
      },
      {
        name: "Centre-ville de Magog et lac Memphrémagog",
        category: "activity",
        justification: "Promenade, boutiques et vue sur le lac.",
        durationMinutes: 120,
        tags: ["culture", "nature"],
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
        tags: ["gastronomie"],
      },
      {
        name: "Fumoir d’Antan / produits fumés gaspésiens",
        category: "meal",
        justification: "Spécialités fumées et produits du terroir.",
        durationMinutes: 45,
        tags: ["gastronomie"],
      },
      {
        name: "Rocher Percé et promenade du quai",
        category: "activity",
        justification: "Incontournable de la pointe de la Gaspésie.",
        durationMinutes: 120,
        tags: ["nature", "culture"],
      },
      {
        name: "Parc national Forillon",
        category: "activity",
        justification: "Falaises, phares et sentiers côtiers.",
        durationMinutes: 180,
        tags: ["nature"],
      },
    ],
  },
  {
    match: /charlevoix|baie-saint-paul|la malbaie|isle-aux-coudres/i,
    items: [
      {
        name: "Fromagerie St-Fidèle / produits Charlevoix",
        category: "meal",
        justification: "Fromages et paniers gourmands de Charlevoix.",
        durationMinutes: 60,
        tags: ["gastronomie"],
      },
      {
        name: "Cidrerie et vergers de Charlevoix",
        category: "meal",
        justification: "Dégustation de cidres et produits de pommes.",
        durationMinutes: 75,
        tags: ["gastronomie"],
      },
      {
        name: "Rue Saint-Jean-Baptiste, Baie-Saint-Paul",
        category: "activity",
        justification: "Galeries, cafés et ambiance artistique.",
        durationMinutes: 120,
        tags: ["culture", "gastronomie"],
      },
      {
        name: "Hautes-Gorges-de-la-Rivière-Malbaie",
        category: "activity",
        justification: "Paysages spectaculaires et randonnée.",
        durationMinutes: 180,
        tags: ["nature"],
      },
    ],
  },
  {
    match: /qu[ée]bec|capitale|old quebec/i,
    items: [
      {
        name: "Marché du Vieux-Port de Québec",
        category: "meal",
        justification: "Producteurs, fromages et spécialités québécoises.",
        durationMinutes: 90,
        tags: ["gastronomie"],
      },
      {
        name: "Grande Allée — restaurants et terrasses",
        category: "meal",
        justification: "Choix de restos pour une soirée gastronomique.",
        durationMinutes: 120,
        tags: ["gastronomie"],
      },
      {
        name: "Château Frontenac et Terrasse Dufferin",
        category: "activity",
        justification: "Balade emblématique dans le Vieux-Québec.",
        durationMinutes: 90,
        tags: ["culture"],
      },
    ],
  },
  {
    match: /montr[ée]al|montreal|laval|longueuil/i,
    items: [
      {
        name: "Marché Jean-Talon",
        category: "meal",
        justification:
          "Plus grand marché à ciel ouvert — produits frais et dégustations.",
        durationMinutes: 120,
        tags: ["gastronomie"],
      },
      {
        name: "Rue Saint-Denis / Plateau — restos et cafés",
        category: "meal",
        justification: "Scène culinaire variée du Plateau-Mont-Royal.",
        durationMinutes: 120,
        tags: ["gastronomie"],
      },
      {
        name: "Vieux-Montréal et Vieux-Port",
        category: "activity",
        justification: "Patrimoine, terrasses et balade au bord de l’eau.",
        durationMinutes: 150,
        tags: ["culture"],
      },
    ],
  },
];

const DEFAULT_GASTRO: CatalogItem[] = [
  {
    name: "Marché public régional",
    category: "meal",
    justification: "Producteurs locaux, fromages et spécialités du terroir.",
    durationMinutes: 90,
    tags: ["gastronomie"],
  },
  {
    name: "Microbrasserie artisanale",
    category: "meal",
    justification: "Bières locales et planchettes pour une pause gourmande.",
    durationMinutes: 75,
    tags: ["gastronomie"],
  },
  {
    name: "Fromagerie ou cabane à sucre / table champêtre",
    category: "meal",
    justification: "Expérience terroir québécoise selon la saison.",
    durationMinutes: 90,
    tags: ["gastronomie"],
  },
];

const DEFAULT_GENERAL: CatalogItem[] = [
  {
    name: "Centre-ville et rue principale",
    category: "activity",
    justification: "Balade, boutiques et cafés du cœur de la destination.",
    durationMinutes: 90,
    tags: ["culture"],
  },
  {
    name: "Parc ou belvédère local",
    category: "activity",
    justification: "Pause nature et point de vue recommandé.",
    durationMinutes: 90,
    tags: ["nature"],
  },
];

function pickCatalog(draft: TripDraftParsed): CatalogItem[] {
  const dest = `${draft.destination.name ?? ""} ${draft.destination.city ?? ""}`;
  const region = REGION_CATALOG.find((r) => r.match.test(dest));
  const gastro = hasGastronomyInterest(draft);
  const bag = interestsOf(draft).join(" ");
  const wantsNature = /nature|plein air|rando|randonn/.test(bag);
  const wantsCulture = /culture|village|patrimoine|art/.test(bag);

  let pool = region?.items ?? [];
  if (gastro) {
    const gastroItems = pool.filter((i) => i.tags.includes("gastronomie"));
    pool = [
      ...gastroItems,
      ...(region ? [] : DEFAULT_GASTRO),
      ...pool.filter((i) => !i.tags.includes("gastronomie")),
    ];
    if (gastroItems.length === 0) {
      pool = [...DEFAULT_GASTRO, ...pool, ...DEFAULT_GENERAL];
    }
  } else {
    if (wantsNature) {
      pool = [...pool.filter((i) => i.tags.includes("nature")), ...pool];
    }
    if (wantsCulture) {
      pool = [...pool.filter((i) => i.tags.includes("culture")), ...pool];
    }
    if (pool.length === 0) pool = DEFAULT_GENERAL;
  }

  // Dédupliquer par nom
  const seen = new Set<string>();
  const unique: CatalogItem[] = [];
  for (const item of pool) {
    const key = item.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique.slice(0, 4);
}

/**
 * Construit une proposition concrète selon les intérêts (ex. gastronomie).
 * Ne produit jamais les placeholders génériques « Arrivée et balade… ».
 */
export function buildInterestBasedItinerary(
  draft: TripDraftParsed,
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
  if (concrete >= 2) {
    // Nettoyer d’éventuels placeholders restants
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

  return {
    ...draft,
    activities,
    stops: draft.stops.filter((s) => !isGenericPlaceholderItem(s.name)),
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
    preferences: hasGastronomyInterest(draft)
      ? Array.from(new Set([...draft.preferences, "gastronomie"]))
      : draft.preferences,
  };
}

/** Patch préférences depuis une réponse rapide. */
export function applyInterestFromUserText(
  draft: TripDraftParsed,
  text: string,
): TripDraftParsed {
  const t = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const prefs = [...draft.preferences];
  if (/gastro|restaurant|gourm|cuisine|vin|fromage|brasserie/.test(t)) {
    if (!prefs.some((p) => /gastro/i.test(p))) prefs.push("gastronomie");
  }
  if (/nature|plein air|rando/.test(t)) {
    if (!prefs.some((p) => /nature/i.test(p))) prefs.push("nature");
  }
  if (/culture|village/.test(t)) {
    if (!prefs.some((p) => /culture/i.test(p))) prefs.push("culture");
  }
  if (/budget moder|modere|modéré/.test(t)) {
    return {
      ...draft,
      preferences: prefs,
      budgetLevel: draft.budgetLevel ?? "moderate",
    };
  }
  return { ...draft, preferences: prefs };
}
