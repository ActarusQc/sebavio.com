import type {
  ActivityEnhancementInput,
  ActivityEnhancementResult,
  ActivityRecommendationEnhancer,
} from "@/features/trips/activities/activity-types";

/**
 * Abstraction IA facultative — désactivée par défaut.
 * Ne crée jamais de lieu ; ne conserve que des googlePlaceId fournis.
 */
export class NoopActivityEnhancer implements ActivityRecommendationEnhancer {
  async enhance(
    input: ActivityEnhancementInput,
  ): Promise<ActivityEnhancementResult> {
    const allowed = new Set(input.activities.map((a) => a.googlePlaceId));
    const descriptions: Record<string, string> = {};
    for (const a of input.activities) {
      if (!allowed.has(a.googlePlaceId)) continue;
      descriptions[a.googlePlaceId] =
        a.suitabilityReasons[0] ?? `Suggestion pour ${a.name}`;
    }
    return { descriptions };
  }
}

export function getActivityRecommendationEnhancer(): ActivityRecommendationEnhancer {
  const enabled = process.env.TRIP_ACTIVITY_AI_ENHANCEMENT_ENABLED === "true";
  if (!enabled) return new NoopActivityEnhancer();
  // Fournisseur réel à brancher plus tard via couche IA multi-providers.
  return new NoopActivityEnhancer();
}

/** Filtre de sécurité : ignore tout id inconnu. */
export function sanitizeEnhancementResult(
  input: ActivityEnhancementInput,
  result: ActivityEnhancementResult,
): ActivityEnhancementResult {
  const allowed = new Set(input.activities.map((a) => a.googlePlaceId));
  const descriptions: Record<string, string> = {};
  for (const [id, text] of Object.entries(result.descriptions)) {
    if (allowed.has(id) && typeof text === "string") {
      descriptions[id] = text.slice(0, 500);
    }
  }
  const daySuggestions = result.daySuggestions
    ?.map((d) => ({
      dayLabel: d.dayLabel,
      googlePlaceIds: d.googlePlaceIds.filter((id) => allowed.has(id)),
    }))
    .filter((d) => d.googlePlaceIds.length > 0);
  return { descriptions, daySuggestions };
}
