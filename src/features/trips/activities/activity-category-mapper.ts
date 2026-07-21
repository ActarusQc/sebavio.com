import type {
  ActivityInterest,
  TripPurpose,
} from "@/features/trips/activities/activity-types";

/**
 * Types Places API (New) — Table A (includedTypes / primaryType).
 * @see https://developers.google.com/maps/documentation/places/web-service/place-types
 */
/** Types Table A uniquement (Places API New — includedTypes). */
export const INTEREST_TO_PLACE_TYPES: Record<ActivityInterest, string[]> = {
  nature: ["park", "national_park", "botanical_garden", "hiking_area"],
  hiking: ["hiking_area", "park", "national_park"],
  animals: ["zoo", "aquarium", "wildlife_park"],
  museums: ["museum", "art_gallery", "history_museum"],
  history: ["historical_landmark", "museum", "monument"],
  science: ["planetarium", "museum", "visitor_center"],
  amusement: ["amusement_park", "water_park", "ferris_wheel"],
  beaches: ["beach"],
  water_activities: ["marina", "beach", "fishing_charter"],
  sports: ["stadium", "sports_complex", "adventure_sports_center"],
  shopping: ["shopping_mall", "market", "gift_shop"],
  food: ["restaurant", "cafe", "bakery"],
  local_products: ["market", "farm", "farmers_market"],
  culture: ["performing_arts_theater", "cultural_center", "art_gallery"],
  relaxation: ["spa", "park", "garden"],
  nightlife: ["night_club", "bar", "comedy_club"],
  photography: ["tourist_attraction", "observation_deck", "park"],
  scenic_views: ["tourist_attraction", "observation_deck", "scenic_spot"],
};

/** Recherches textuelles complémentaires (FR / EN). */
export function textQueriesForProfile(input: {
  purpose: TripPurpose;
  interests: ActivityInterest[];
  childAges: number[];
  environmentPreference?: string | null;
}): string[] {
  const queries = new Set<string>();
  queries.add("attraction touristique");
  queries.add("tourist attraction");

  for (const interest of input.interests) {
    const labelMap: Partial<Record<ActivityInterest, string[]>> = {
      nature: ["parc nature", "nature park"],
      hiking: ["randonnée facile", "easy hike"],
      animals: ["zoo aquarium", "wildlife park"],
      museums: ["musée", "museum"],
      history: ["site historique", "historical site"],
      science: ["musée sciences", "science museum"],
      amusement: ["parc d'attractions", "amusement park"],
      beaches: ["plage", "beach"],
      water_activities: ["activités nautiques", "boat rental"],
      sports: ["activité sportive", "adventure activity"],
      shopping: ["magasinage", "shopping"],
      food: ["restaurant local", "local restaurant"],
      local_products: ["produits locaux", "farmers market"],
      culture: ["culture spectacle", "cultural venue"],
      relaxation: ["détente spa", "relaxation spa"],
      nightlife: ["vie nocturne", "nightlife"],
      photography: ["point de vue panoramique", "scenic viewpoint"],
      scenic_views: ["point de vue panoramique", "scenic lookout"],
    };
    for (const q of labelMap[interest] ?? []) queries.add(q);
  }

  if (input.purpose === "family" || input.childAges.length > 0) {
    queries.add("activités familiales");
    queries.add("activité pour enfants");
    queries.add("family activities");
  }
  if (input.purpose === "couple") {
    queries.add("activité romantique");
    queries.add("romantic activity");
  }
  if (input.environmentPreference === "indoor") {
    queries.add("activité intérieure");
    queries.add("indoor activity");
  }

  return [...queries].slice(0, 8);
}

export function placeTypesForInterests(
  interests: ActivityInterest[],
): string[] {
  const types = new Set<string>();
  const list =
    interests.length > 0
      ? interests
      : (["nature", "culture", "scenic_views"] as ActivityInterest[]);
  for (const interest of list) {
    for (const t of INTEREST_TO_PLACE_TYPES[interest] ?? []) {
      types.add(t);
    }
  }
  return [...types].slice(0, 20);
}

const INDOOR_TYPES = new Set([
  "museum",
  "art_gallery",
  "science_museum",
  "planetarium",
  "shopping_mall",
  "spa",
  "aquarium",
  "performing_arts_theater",
  "cultural_center",
  "restaurant",
  "cafe",
  "night_club",
  "bar",
]);

const OUTDOOR_TYPES = new Set([
  "park",
  "national_park",
  "botanical_garden",
  "hiking_area",
  "beach",
  "zoo",
  "wildlife_park",
  "amusement_park",
  "water_park",
  "marina",
  "observation_deck",
  "tourist_attraction",
  "farm",
  "stadium",
  "adventure_sports_center",
]);

export function guessEnvironment(
  types: string[],
  primaryType: string | null,
): "indoor" | "outdoor" | "unknown" {
  const all = new Set([
    ...(primaryType ? [primaryType] : []),
    ...types.map((t) => t.toLowerCase()),
  ]);
  let indoor = 0;
  let outdoor = 0;
  for (const t of all) {
    if (INDOOR_TYPES.has(t)) indoor += 1;
    if (OUTDOOR_TYPES.has(t)) outdoor += 1;
  }
  if (indoor > outdoor && indoor > 0) return "indoor";
  if (outdoor > indoor && outdoor > 0) return "outdoor";
  return "unknown";
}

export function interestMatchesTypes(
  interest: ActivityInterest,
  types: string[],
  primaryType: string | null,
): boolean {
  const mapped = INTEREST_TO_PLACE_TYPES[interest] ?? [];
  const hay = new Set([
    ...(primaryType ? [primaryType.toLowerCase()] : []),
    ...types.map((t) => t.toLowerCase()),
  ]);
  return mapped.some((t) => hay.has(t.toLowerCase()));
}
