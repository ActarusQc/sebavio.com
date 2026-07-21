import {
  guessEnvironment,
  interestMatchesTypes,
} from "@/features/trips/activities/activity-category-mapper";
import type {
  ActivityCandidate,
  ActivityInterest,
  ActivityWeatherContext,
  RankedActivityCandidate,
  TripPurpose,
} from "@/features/trips/activities/activity-types";
import { childAgeBand } from "@/features/trips/activities/activity-types";
import type { TripTravelerProfileInput } from "@/features/trips/activities/activity-validation";

const PURPOSE_BOOST_INTERESTS: Record<TripPurpose, ActivityInterest[]> = {
  solo: [
    "culture",
    "nature",
    "photography",
    "food",
    "hiking",
    "local_products",
  ],
  couple: [
    "scenic_views",
    "food",
    "relaxation",
    "culture",
    "photography",
    "local_products",
  ],
  family: ["animals", "science", "amusement", "beaches", "nature", "museums"],
  friends: [
    "sports",
    "water_activities",
    "nightlife",
    "food",
    "amusement",
    "hiking",
  ],
  business: ["food", "relaxation", "culture", "shopping"],
};

/** Note pondérée (Bayesian) — évite qu'un 5.0/2 avis batte un 4.6/1500. */
export function bayesianRatingScore(
  rating: number | null,
  reviewCount: number | null,
): { ratingPoints: number; reviewPoints: number } {
  if (rating == null || !(rating > 0)) {
    return { ratingPoints: 0, reviewPoints: 0 };
  }
  const C = 4.0;
  const m = 50;
  const v = Math.max(0, reviewCount ?? 0);
  const R = Math.min(5, Math.max(0, rating));
  const bayes = (v / (v + m)) * R + (m / (v + m)) * C;
  const ratingPoints = Math.min(10, Math.max(0, ((bayes - 3.2) / 1.8) * 10));
  const reviewPoints = Math.min(8, Math.log10(v + 1) * 2.8);
  return {
    ratingPoints: Math.round(ratingPoints * 10) / 10,
    reviewPoints: Math.round(reviewPoints * 10) / 10,
  };
}

function priceLevelRank(priceLevel: string | null): number | null {
  if (!priceLevel) return null;
  const map: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
    VERY_EXPENSIVE: 4,
  };
  return map[priceLevel] ?? null;
}

export function childCompatibilityScore(
  types: string[],
  primaryType: string | null,
  childAges: number[],
  estimatedVisitMinutes: number | null,
): { points: number; reasons: string[]; warnings: string[]; penalty: number } {
  if (childAges.length === 0) {
    return { points: 0, reasons: [], warnings: [], penalty: 0 };
  }

  const bands = childAges.map(childAgeBand);
  const hay = new Set([
    ...(primaryType ? [primaryType.toLowerCase()] : []),
    ...types.map((t) => t.toLowerCase()),
  ]);
  const reasons: string[] = [];
  const warnings: string[] = [];
  let points = 10;
  let penalty = 0;

  const babyFriendly = ["aquarium", "park", "botanical_garden", "zoo", "cafe"];
  const preschoolFriendly = [
    "zoo",
    "aquarium",
    "amusement_park",
    "park",
    "science_museum",
  ];
  const childFriendly = [
    "science_museum",
    "zoo",
    "park",
    "amusement_park",
    "beach",
    "museum",
  ];
  const hardTypes = [
    "night_club",
    "bar",
    "hiking_area",
    "adventure_sports_center",
  ];

  if (bands.includes("baby")) {
    if (hardTypes.some((t) => hay.has(t))) {
      penalty += 20;
      warnings.push("Peut être exigeant avec un bébé (0-2 ans)");
    }
    if (babyFriendly.some((t) => hay.has(t))) points += 6;
    if (estimatedVisitMinutes != null && estimatedVisitMinutes > 90) {
      penalty += 8;
      warnings.push("Activité potentiellement longue pour un bébé");
    }
  }
  if (bands.includes("preschool")) {
    if (preschoolFriendly.some((t) => hay.has(t))) points += 5;
    if (hay.has("museum") && !hay.has("science_museum")) {
      penalty += 4;
      warnings.push("Visite muséale peut être longue pour 3-5 ans");
    }
  }
  if (bands.includes("child") || bands.includes("tween")) {
    if (childFriendly.some((t) => hay.has(t))) points += 4;
  }
  if (bands.includes("teen")) {
    if (
      ["sports_complex", "adventure_sports_center", "cultural_center"].some(
        (t) => hay.has(t),
      )
    ) {
      points += 3;
    }
  }

  const agesLabel = [...childAges].sort((a, b) => a - b).join(" et ");
  if (points >= 14) {
    reasons.push(`Convient aux enfants de ${agesLabel} ans`);
  } else if (penalty === 0) {
    reasons.push(`Compatible avec le groupe (enfants ${agesLabel} ans)`);
  }

  return {
    points: Math.min(20, Math.max(0, points)),
    reasons,
    warnings,
    penalty,
  };
}

export function scoreActivityCandidate(input: {
  candidate: ActivityCandidate;
  profile: Pick<
    TripTravelerProfileInput,
    | "purpose"
    | "interests"
    | "childAges"
    | "budgetPreference"
    | "durationPreference"
    | "maxDetourMinutes"
    | "environmentPreference"
    | "activityLevel"
    | "accessibilityNeeds"
    | "travelingWithPet"
  >;
  detourDurationMinutes: number | null;
  detourDistanceKm: number | null;
  routePositionKm: number | null;
  suggestedForSegment: string;
  weather?: ActivityWeatherContext | null;
}): RankedActivityCandidate {
  const { candidate, profile } = input;
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  let penalty = 0;

  const interests =
    profile.interests.length > 0
      ? profile.interests
      : PURPOSE_BOOST_INTERESTS[profile.purpose];

  let interestPoints = 0;
  for (const interest of interests) {
    if (
      interestMatchesTypes(interest, candidate.types, candidate.primaryType)
    ) {
      interestPoints += 8;
      reasons.push(
        `Correspond à votre intérêt pour ${interest.replaceAll("_", " ")}`,
      );
    }
  }
  interestPoints = Math.min(25, interestPoints);
  score += interestPoints;

  const purposeBoost = PURPOSE_BOOST_INTERESTS[profile.purpose];
  let purposePoints = 0;
  for (const interest of purposeBoost) {
    if (
      interestMatchesTypes(interest, candidate.types, candidate.primaryType)
    ) {
      purposePoints += 4;
    }
  }
  purposePoints = Math.min(15, purposePoints);
  score += purposePoints;
  if (purposePoints >= 8) {
    reasons.push(`Bien adapté à un voyage ${profile.purpose}`);
  }

  const child = childCompatibilityScore(
    candidate.types,
    candidate.primaryType,
    profile.childAges,
    candidate.estimatedVisitMinutes,
  );
  score += child.points;
  penalty += child.penalty;
  reasons.push(...child.reasons);
  warnings.push(...child.warnings);

  const { ratingPoints, reviewPoints } = bayesianRatingScore(
    candidate.rating,
    candidate.reviewCount,
  );
  score += ratingPoints + reviewPoints;
  if (ratingPoints >= 7 && reviewPoints >= 4) {
    reasons.push("Très bien évalué par les visiteurs");
  } else if (ratingPoints >= 5) {
    reasons.push("Bien noté par les visiteurs");
  }

  const maxDetour = profile.maxDetourMinutes ?? 15;
  if (input.detourDurationMinutes != null) {
    if (input.detourDurationMinutes > maxDetour) {
      penalty += 25;
      warnings.push(
        `Détour estimé de ${input.detourDurationMinutes} min (max ${maxDetour} min)`,
      );
    } else {
      const detourPoints = Math.min(
        12,
        12 * (1 - input.detourDurationMinutes / Math.max(maxDetour, 1)),
      );
      score += detourPoints;
      reasons.push(
        `Détour estimé de seulement ${input.detourDurationMinutes} minutes`,
      );
    }
  } else if (candidate.searchZoneKind === "destination") {
    score += 8;
    reasons.push("Situé à destination");
  }

  const priceRank = priceLevelRank(candidate.priceLevel);
  const budget = profile.budgetPreference ?? "any";
  if (budget === "free") {
    if (priceRank === 0) score += 5;
    else if (priceRank != null && priceRank > 0) penalty += 10;
  } else if (budget === "budget") {
    if (priceRank != null && priceRank <= 1) score += 5;
    else if (priceRank != null && priceRank >= 3) penalty += 6;
  } else if (budget === "moderate") {
    if (priceRank != null && priceRank <= 2) score += 4;
  } else {
    score += 2;
  }

  const env = guessEnvironment(candidate.types, candidate.primaryType);
  const envPref = profile.environmentPreference ?? "both";
  if (envPref === "both" || env === "unknown") {
    score += 3;
  } else if (envPref === env) {
    score += 5;
    reasons.push(
      env === "indoor" ? "Activité intérieure" : "Activité extérieure",
    );
  } else {
    penalty += 6;
  }

  if (profile.travelingWithPet) {
    const petOk = ["park", "beach", "hiking_area", "botanical_garden"].some(
      (t) =>
        candidate.types.map((x) => x.toLowerCase()).includes(t) ||
        candidate.primaryType?.toLowerCase() === t,
    );
    if (!petOk) {
      warnings.push("À confirmer si les animaux sont acceptés");
      penalty += 4;
    }
  }

  if (profile.accessibilityNeeds.includes("stroller")) {
    if (
      ["hiking_area", "adventure_sports_center"].some(
        (t) =>
          candidate.types.map((x) => x.toLowerCase()).includes(t) ||
          candidate.primaryType?.toLowerCase() === t,
      )
    ) {
      warnings.push(
        "Certaines sections peuvent être difficiles avec une poussette",
      );
      penalty += 8;
    }
  }

  if (profile.purpose === "business") {
    const visit = candidate.estimatedVisitMinutes ?? 90;
    if (visit <= 90) score += 4;
    else penalty += 3;
  }

  // Météo optionnelle (pas de fausse donnée)
  if (
    input.weather?.condition === "rain" ||
    input.weather?.condition === "storm"
  ) {
    if (env === "indoor") {
      score += 4;
      reasons.push("Adapté en cas de mauvais temps");
    } else if (env === "outdoor") {
      penalty += 6;
      warnings.push("Activité extérieure — vérifier la météo");
    }
  } else if (input.weather?.condition === "sunny" && env === "outdoor") {
    score += 3;
  }

  warnings.push("Les heures d'ouverture doivent être confirmées");

  const finalScore = Math.max(0, Math.min(100, score - penalty));

  return {
    ...candidate,
    suitabilityScore: Math.round(finalScore * 10) / 10,
    suitabilityReasons: [...new Set(reasons)].slice(0, 5),
    warningReasons: [...new Set(warnings)].slice(0, 4),
    detourDistanceKm: input.detourDistanceKm,
    detourDurationMinutes: input.detourDurationMinutes,
    routePositionKm: input.routePositionKm,
    suggestedForSegment: input.suggestedForSegment,
    environmentGuess: env,
  };
}

export function filterByMaxDetour(
  ranked: RankedActivityCandidate[],
  maxDetourMinutes: number,
): RankedActivityCandidate[] {
  return ranked.filter(
    (a) =>
      a.detourDurationMinutes == null ||
      a.detourDurationMinutes <= maxDetourMinutes ||
      a.suggestedForSegment === "destination",
  );
}

export function dedupeCandidates(
  candidates: ActivityCandidate[],
): ActivityCandidate[] {
  const byPlace = new Map<string, ActivityCandidate>();
  for (const c of candidates) {
    if (!byPlace.has(c.googlePlaceId)) {
      byPlace.set(c.googlePlaceId, c);
    }
  }

  const list = [...byPlace.values()];
  const kept: ActivityCandidate[] = [];

  for (const c of list) {
    const normName = c.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const duplicate = kept.find((k) => {
      const kn = k.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
      const sameName = kn === normName && kn.length > 3;
      const dLat = Math.abs(k.latitude - c.latitude);
      const dLng = Math.abs(k.longitude - c.longitude);
      const near = dLat < 0.0008 && dLng < 0.0008;
      return (sameName && near) || near;
    });
    if (!duplicate) kept.push(c);
  }
  return kept;
}
