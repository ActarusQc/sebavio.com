import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";
import { hasItineraryProposal } from "@/features/ai-trip-planner/lib/planning-step";
import { buildInterestBasedItinerary } from "@/features/ai-trip-planner/lib/interest-itinerary";

/**
 * Complète une proposition concrète selon les intérêts (gastronomie, etc.).
 * Ne produit plus les placeholders « Arrivée et balade… ».
 */
export function ensureMinimalItineraryContent(
  draft: TripDraftParsed,
  options?: { force?: boolean },
): TripDraftParsed {
  const force =
    options?.force || (draft.interests.length > 0 && countNeedsRebuild(draft));
  return buildInterestBasedItinerary(draft, { force });
}

function countNeedsRebuild(draft: TripDraftParsed): boolean {
  if (hasItineraryProposal(draft) && draft.activities.length === 0) {
    return true;
  }
  return draft.activities.length === 0 && draft.suggestions.length === 0;
}
