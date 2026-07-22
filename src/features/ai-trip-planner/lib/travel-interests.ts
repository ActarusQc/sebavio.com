import {
  TRAVEL_INTEREST_LABELS,
  type TravelInterest,
} from "@/features/ai-trip-planner/lib/labels";

export type { TravelInterest };

export type InterestChoice = {
  id: TravelInterest;
  label: string;
};

export const INTEREST_CHOICES: InterestChoice[] = (
  Object.keys(TRAVEL_INTEREST_LABELS) as TravelInterest[]
).map((id) => ({
  id,
  label: TRAVEL_INTEREST_LABELS[id],
}));

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[’']/g, "'")
    .trim();
}

/** Normalise une réponse libre ou un libellé vers un intérêt interne. */
export function parseTravelInterest(text: string): TravelInterest | null {
  const t = normalize(text);
  if (!t) return null;

  if (
    /gastro|restaurant|cuisine|bouffe|gourm|vin|fromage|brasserie|degustation|terroir|bonne bouffe|sortie gourmande/.test(
      t,
    )
  ) {
    return "gastronomy";
  }
  if (
    /nature|plein air|rando|randonn|paysage|foret|parc|exterieur|extérieur/.test(
      t,
    )
  ) {
    return "nature";
  }
  if (/culture|patrimoine|musee|musée|village|art|galerie|historique/.test(t)) {
    return "culture";
  }
  if (
    /magasin|boutique|shopping|centres? commerciaux?|faire les magasins|marche public|marche/.test(
      t,
    )
  ) {
    return "shopping";
  }
  if (/detente|détente|bien[- ]?etre|spa|relax/.test(t)) return "wellness";
  if (/famille|enfant|familial/.test(t)) return "family";
  if (/sport|aventure|velo|vélo|kayak/.test(t)) return "sports";
  if (/evenement|événement|divertissement|spectacle|festival/.test(t)) {
    return "entertainment";
  }
  if (/nocturne|bar|soir[ée]e/.test(t)) return "nightlife";
  if (/decouverte|découverte|local|authentique/.test(t)) {
    return "local_discovery";
  }

  // Correspondance exacte id
  if (t in TRAVEL_INTEREST_LABELS) return t as TravelInterest;

  // Correspondance libellé
  for (const [id, label] of Object.entries(TRAVEL_INTEREST_LABELS)) {
    if (normalize(label) === t) return id as TravelInterest;
  }
  return null;
}

export function parseTravelInterestsFromList(
  values: string[],
): TravelInterest[] {
  const out: TravelInterest[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const id = parseTravelInterest(v);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function parseInterestMutation(
  text: string,
  current: TravelInterest[],
): TravelInterest[] | null {
  const t = normalize(text);
  if (!t) return null;

  const add =
    /ajoute|ajoutez|aussi|inclus|inclure|veux aussi|je veux/.test(t) &&
    !/retire|enleve|enlève|pas de|sans|finalement pas/.test(t);
  const remove =
    /retire|enleve|enlève|pas de|sans |finalement,? pas|ne veux plus/.test(t);
  const only =
    /surtout|principalement|priorite|priorité|le plus important/.test(t);

  const parsed = parseTravelInterest(t);
  if (!parsed && !add && !remove && !only) return null;

  let next = [...current];
  if (remove && parsed) {
    next = next.filter((i) => i !== parsed);
    return next;
  }
  if (only && parsed) {
    return [parsed, ...current.filter((i) => i !== parsed)];
  }
  if (parsed) {
    if (!next.includes(parsed)) next.push(parsed);
    return next;
  }
  return null;
}

export const NONE_INTEREST_LABEL = "Aucun intérêt particulier";
export const ANY_INTEREST_LABEL = "Tout me convient";
export const CONTINUE_INTERESTS_LABEL = "Continuer avec mes choix";
