/**
 * Libellés français canadien pour l’UI « Planifier avec l’IA ».
 * Les clés internes (anglais) ne doivent jamais être affichées telles quelles.
 */

const ITINERARY_TYPE_LABELS: Record<string, string> = {
  activity: "Activité",
  meal: "Repas",
  lodging: "Hébergement",
  accommodation: "Hébergement",
  hotel: "Hôtel",
  motel: "Motel",
  bed_and_breakfast: "Gîte / couette et café",
  inn: "Auberge",
  vacation_rental: "Location de vacances",
  campground: "Camping",
  hostel: "Auberge de jeunesse",
  detour: "Détour",
  fuel: "Carburant",
  rest: "Pause",
  break: "Pause",
  other: "Autre",
  drive: "Trajet",
  departure: "Départ",
  arrival: "Arrivée",
  destination: "Destination",
  return: "Retour",
  shopping: "Magasinage",
  highlight: "Temps fort",
  nature: "Nature",
  culture: "Culture",
  gastronomy: "Gastronomie",
  wellness: "Bien-être",
  family: "Famille",
  sports: "Sports",
  entertainment: "Divertissement",
  nightlife: "Vie nocturne",
  local_discovery: "Découvertes locales",
};

export function getItineraryTypeLabel(
  type: string | null | undefined,
  _locale: string = "fr-CA",
): string {
  if (!type?.trim()) return "Activité";
  const key = type.trim().toLowerCase().replace(/\s+/g, "_");
  if (ITINERARY_TYPE_LABELS[key]) return ITINERARY_TYPE_LABELS[key]!;
  // Déjà en français (ex. « Repas ») — conserver
  if (/[àâäéèêëïîôùûüçœ]/i.test(type) || /\s/.test(type)) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  return ITINERARY_TYPE_LABELS[key] ?? "Activité";
}

/** Format durée : « 1 h 30 », « 45 min ». */
export function formatDurationFr(
  minutes: number | null | undefined,
): string | null {
  if (minutes == null || !Number.isFinite(minutes)) return null;
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m} min`;
  if (m <= 0) return `${h} h`;
  return `${h} h ${m}`;
}

export const TRAVEL_INTEREST_LABELS = {
  gastronomy: "Gastronomie",
  nature: "Nature et plein air",
  culture: "Culture et patrimoine",
  shopping: "Magasinage",
  wellness: "Détente et bien-être",
  family: "Activités familiales",
  sports: "Sports et aventure",
  entertainment: "Événements et divertissement",
  nightlife: "Vie nocturne",
  local_discovery: "Découvertes locales",
} as const;

export type TravelInterest = keyof typeof TRAVEL_INTEREST_LABELS;

export function getTravelInterestLabel(
  interest: string | null | undefined,
): string {
  if (!interest?.trim()) return "";
  const key = interest.trim().toLowerCase() as TravelInterest;
  return TRAVEL_INTEREST_LABELS[key] ?? getItineraryTypeLabel(interest);
}

export function formatInterestsListFr(interests: string[]): string {
  return interests
    .map((i) => getTravelInterestLabel(i))
    .filter(Boolean)
    .join(" · ");
}
