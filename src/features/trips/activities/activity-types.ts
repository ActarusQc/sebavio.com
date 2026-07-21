/** Types et constantes — suggestions d'activités voyage. */

export const TRIP_PURPOSES = [
  "solo",
  "couple",
  "family",
  "friends",
  "business",
] as const;
export type TripPurpose = (typeof TRIP_PURPOSES)[number];

export const TRIP_PURPOSE_LABELS: Record<TripPurpose, string> = {
  solo: "Solo",
  couple: "En amoureux",
  family: "En famille",
  friends: "Entre amis",
  business: "Affaires",
};

export const ACTIVITY_INTERESTS = [
  "nature",
  "hiking",
  "animals",
  "museums",
  "history",
  "science",
  "amusement",
  "beaches",
  "water_activities",
  "sports",
  "shopping",
  "food",
  "local_products",
  "culture",
  "relaxation",
  "nightlife",
  "photography",
  "scenic_views",
] as const;
export type ActivityInterest = (typeof ACTIVITY_INTERESTS)[number];

export const ACTIVITY_INTEREST_LABELS: Record<ActivityInterest, string> = {
  nature: "Nature",
  hiking: "Randonnée",
  animals: "Animaux",
  museums: "Musées",
  history: "Histoire",
  science: "Sciences",
  amusement: "Parcs d'attractions",
  beaches: "Plages",
  water_activities: "Activités nautiques",
  sports: "Sports",
  shopping: "Magasinage",
  food: "Gastronomie",
  local_products: "Produits locaux",
  culture: "Culture",
  relaxation: "Détente",
  nightlife: "Vie nocturne",
  photography: "Photographie",
  scenic_views: "Points de vue",
};

export const BUDGET_PREFERENCES = [
  "free",
  "budget",
  "moderate",
  "any",
] as const;
export type BudgetPreference = (typeof BUDGET_PREFERENCES)[number];

export const BUDGET_PREFERENCE_LABELS: Record<BudgetPreference, string> = {
  free: "Gratuit uniquement",
  budget: "Économique",
  moderate: "Modéré",
  any: "Sans préférence",
};

export const DURATION_PREFERENCES = [
  "under_1h",
  "1_2h",
  "2_4h",
  "half_day",
  "any",
] as const;
export type DurationPreference = (typeof DURATION_PREFERENCES)[number];

export const DURATION_PREFERENCE_LABELS: Record<DurationPreference, string> = {
  under_1h: "Moins d'une heure",
  "1_2h": "1 à 2 heures",
  "2_4h": "2 à 4 heures",
  half_day: "Demi-journée",
  any: "Sans préférence",
};

export const MAX_DETOUR_OPTIONS = [5, 10, 15, 30, 45] as const;

export const ENVIRONMENT_PREFERENCES = ["indoor", "outdoor", "both"] as const;
export type EnvironmentPreference = (typeof ENVIRONMENT_PREFERENCES)[number];

export const ENVIRONMENT_PREFERENCE_LABELS: Record<
  EnvironmentPreference,
  string
> = {
  indoor: "Intérieur",
  outdoor: "Extérieur",
  both: "Les deux",
};

export const ACTIVITY_LEVELS = ["very_low", "low", "moderate", "high"] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  very_low: "Très faible",
  low: "Faible",
  moderate: "Modéré",
  high: "Élevé",
};

export const ACCESSIBILITY_NEEDS = ["mobility", "stroller", "none"] as const;
export type AccessibilityNeed = (typeof ACCESSIBILITY_NEEDS)[number];

export const ACCESSIBILITY_NEED_LABELS: Record<AccessibilityNeed, string> = {
  mobility: "Mobilité réduite",
  stroller: "Poussette",
  none: "Aucune exigence particulière",
};

export const ACTIVITY_SUGGESTION_STATUSES = [
  "suggested",
  "saved",
  "added_to_trip",
  "rejected",
  "completed",
] as const;
export type ActivitySuggestionStatus =
  (typeof ACTIVITY_SUGGESTION_STATUSES)[number];

export const REJECT_REASONS = [
  "too_far",
  "too_expensive",
  "not_for_kids",
  "not_my_type",
  "already_visited",
  "other",
] as const;
export type RejectReason = (typeof REJECT_REASONS)[number];

export const REJECT_REASON_LABELS: Record<RejectReason, string> = {
  too_far: "Trop loin",
  too_expensive: "Trop cher",
  not_for_kids: "Pas adapté aux enfants",
  not_my_type: "Pas mon type d'activité",
  already_visited: "Déjà visité",
  other: "Autre",
};

export const INSERT_PLACEMENTS = [
  "outbound",
  "destination",
  "return",
  "day",
] as const;
export type InsertPlacement = (typeof INSERT_PLACEMENTS)[number];

export type ChildAgeBand = "baby" | "preschool" | "child" | "tween" | "teen";

export function childAgeBand(age: number): ChildAgeBand {
  if (age <= 2) return "baby";
  if (age <= 5) return "preschool";
  if (age <= 9) return "child";
  if (age <= 12) return "tween";
  return "teen";
}

export const CHILD_AGE_BAND_LABELS: Record<ChildAgeBand, string> = {
  baby: "Bébé",
  preschool: "Préscolaire",
  child: "Enfant",
  tween: "Préadolescent",
  teen: "Adolescent",
};

export type ActivityWeatherContext = {
  condition?: "sunny" | "cloudy" | "rain" | "snow" | "storm";
  temperatureCelsius?: number;
  precipitationProbability?: number;
};

export type TripTravelerProfileDto = {
  id: string;
  tripId: string;
  purpose: TripPurpose;
  adultCount: number;
  childCount: number;
  childAges: number[];
  interests: ActivityInterest[];
  budgetPreference: BudgetPreference | null;
  durationPreference: DurationPreference | null;
  maxDetourMinutes: number;
  environmentPreference: EnvironmentPreference | null;
  activityLevel: ActivityLevel | null;
  accessibilityNeeds: AccessibilityNeed[];
  travelingWithPet: boolean;
  deferred: boolean;
  suggestionsGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TripActivityDto = {
  id: string;
  tripId: string;
  googlePlaceId: string;
  status: ActivitySuggestionStatus;
  name: string;
  address: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  primaryType: string | null;
  types: string[];
  rating: number | null;
  reviewCount: number | null;
  priceLevel: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  photoReference: string | null;
  suggestedForSegment: string | null;
  routePositionKm: number | null;
  detourDistanceKm: number | null;
  detourDurationMinutes: number | null;
  estimatedVisitMinutes: number | null;
  suitabilityScore: number | null;
  suitabilityReasons: string[];
  warningReasons: string[];
  rejectReason: string | null;
  plannedDate: string | null;
  plannedStartTime: string | null;
  plannedEndTime: string | null;
  sequence: number | null;
  linkedStopId: string | null;
  insertPlacement: string | null;
  environmentGuess: "indoor" | "outdoor" | "unknown";
};

export type ActivityCandidate = {
  googlePlaceId: string;
  name: string;
  address: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  primaryType: string | null;
  types: string[];
  rating: number | null;
  reviewCount: number | null;
  priceLevel: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  photoReference: string | null;
  estimatedVisitMinutes: number | null;
  searchZoneKind: "destination" | "stop" | "route_sample" | "city";
};

export type RankedActivityCandidate = ActivityCandidate & {
  suitabilityScore: number;
  suitabilityReasons: string[];
  warningReasons: string[];
  detourDistanceKm: number | null;
  detourDurationMinutes: number | null;
  routePositionKm: number | null;
  suggestedForSegment: string;
  environmentGuess: "indoor" | "outdoor" | "unknown";
};

export type ActivityEnhancementInput = {
  tripPurpose: TripPurpose;
  interests: ActivityInterest[];
  childAges: number[];
  activities: Array<{
    googlePlaceId: string;
    name: string;
    primaryType: string | null;
    suitabilityReasons: string[];
  }>;
};

export type ActivityEnhancementResult = {
  descriptions: Record<string, string>;
  daySuggestions?: Array<{
    dayLabel: string;
    googlePlaceIds: string[];
  }>;
};

export interface ActivityRecommendationEnhancer {
  enhance(input: ActivityEnhancementInput): Promise<ActivityEnhancementResult>;
}

/** Zones max — volontairement bas pour limiter les appels Places / génération. */
export const MAX_SEARCH_ZONES = 6;
export const MAX_RESULTS_PER_ZONE = 8;
export const MAX_CANDIDATES_BEFORE_RANKING = 80;
export const MAX_FINAL_SUGGESTIONS = 24;
export const MAX_DETOUR_CALCULATIONS = 30;
/** Espacement plus large → moins de zones sur longs trajets. */
export const SEARCH_ZONE_SPACING_KM = 140;
export const SEARCH_RADIUS_METERS = 15000;
export const CACHE_TTL_SEARCH_SECONDS = 60 * 60 * 18;
export const GENERATION_LOCK_TTL_SECONDS = 90;
/** Requêtes texte max (destination uniquement). */
export const MAX_TEXT_QUERIES_PER_GENERATION = 2;
