/**
 * Normalisation des types d’hébergement (contexte québécois).
 * « gîte » → bed_and_breakfast (couette et café / maison d’hôtes), jamais motel.
 */

export const ACCOMMODATION_TYPES = [
  "bed_and_breakfast",
  "inn",
  "hotel",
  "motel",
  "vacation_rental",
  "campground",
  "hostel",
  "other",
] as const;

export type AccommodationType = (typeof ACCOMMODATION_TYPES)[number];

export type AccommodationParseResult = {
  requested: boolean;
  type: AccommodationType | null;
  /** Libellé FR pour l’UI / le brouillon. */
  label: string | null;
  /** Requête Places Text Search. */
  searchQuery: string | null;
  /** Types Google Places (New). */
  placeTypes: string[];
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[’']/g, "'")
    .trim();
}

export function accommodationLabel(type: AccommodationType): string {
  switch (type) {
    case "bed_and_breakfast":
      return "Gîte / couette et café";
    case "inn":
      return "Auberge";
    case "hotel":
      return "Hôtel";
    case "motel":
      return "Motel";
    case "vacation_rental":
      return "Location de vacances";
    case "campground":
      return "Camping";
    case "hostel":
      return "Auberge de jeunesse";
    default:
      return "Hébergement";
  }
}

/**
 * Détecte une demande d’hébergement dans le message utilisateur.
 * Priorité : gîte / BnB avant hôtel/motel génériques.
 */
export function parseAccommodationRequest(
  text: string,
): AccommodationParseResult {
  const t = normalize(text);
  if (!t) {
    return {
      requested: false,
      type: null,
      label: null,
      searchQuery: null,
      placeTypes: [],
    };
  }

  const wantsLodging =
    /\b(gite|gites|couette et cafe|bed and breakfast|\bbnb\b|maison d'hotes|maison d hote|auberge|hotel|motel|hebergement|dormir|coucher|nuit(ee)?|camping|hostel|airbnb|chalet)\b/.test(
      t,
    ) || /\bje voudrais un gite\b/.test(t);

  if (!wantsLodging) {
    return {
      requested: false,
      type: null,
      label: null,
      searchQuery: null,
      placeTypes: [],
    };
  }

  // Gîte québécois — ne jamais mapper vers motel
  if (
    /\b(gite|gites|couette et cafe|bed and breakfast|\bbnb\b|maison d'hotes|maison d hote)\b/.test(
      t,
    )
  ) {
    return {
      requested: true,
      type: "bed_and_breakfast",
      label: accommodationLabel("bed_and_breakfast"),
      searchQuery: "gîte touristique couette et café bed and breakfast",
      placeTypes: ["bed_and_breakfast", "guest_house", "lodging"],
    };
  }

  if (/\b(auberge de jeunesse|hostel)\b/.test(t)) {
    return {
      requested: true,
      type: "hostel",
      label: accommodationLabel("hostel"),
      searchQuery: "auberge de jeunesse hostel",
      placeTypes: ["hostel", "lodging"],
    };
  }

  if (/\bauberge\b/.test(t)) {
    return {
      requested: true,
      type: "inn",
      label: accommodationLabel("inn"),
      searchQuery: "auberge inn",
      placeTypes: ["extended_stay_hotel", "lodging", "guest_house"],
    };
  }

  if (/\bmotel\b/.test(t)) {
    return {
      requested: true,
      type: "motel",
      label: accommodationLabel("motel"),
      searchQuery: "motel",
      placeTypes: ["motel", "lodging"],
    };
  }

  if (/\b(hotel|hôtel)\b/.test(t)) {
    return {
      requested: true,
      type: "hotel",
      label: accommodationLabel("hotel"),
      searchQuery: "hôtel hotel",
      placeTypes: ["hotel", "lodging"],
    };
  }

  if (/\b(camping|campground|tente|vr)\b/.test(t)) {
    return {
      requested: true,
      type: "campground",
      label: accommodationLabel("campground"),
      searchQuery: "camping",
      placeTypes: ["campground", "rv_park"],
    };
  }

  if (/\b(airbnb|chalet|location de vacances|condo)\b/.test(t)) {
    return {
      requested: true,
      type: "vacation_rental",
      label: accommodationLabel("vacation_rental"),
      searchQuery: "chalet location vacances",
      placeTypes: ["lodging"],
    };
  }

  // « pour dormir » / hébergement générique
  return {
    requested: true,
    type: "other",
    label: "Hébergement",
    searchQuery: "hébergement gîte auberge hôtel",
    placeTypes: ["lodging", "bed_and_breakfast", "guest_house", "hotel"],
  };
}

export function lodgingSelectionComplete(draft: {
  lodgingRequested?: boolean;
  lodgingSelection?: { placeId: string | null; name: string | null } | null;
}): boolean {
  if (!draft.lodgingRequested) return true;
  return Boolean(
    draft.lodgingSelection?.placeId?.trim() &&
    draft.lodgingSelection?.name?.trim(),
  );
}
