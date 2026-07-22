import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";
import { hasItineraryProposal } from "@/features/ai-trip-planner/lib/planning-step";
import { buildInterestBasedItinerary } from "@/features/ai-trip-planner/lib/interest-itinerary";

/**
 * Complète une proposition concrète selon les intérêts (gastronomie, etc.).
 * Ne produit plus les placeholders « Arrivée et balade… ».
 */
export function ensureMinimalItineraryContent(
  draft: TripDraftParsed,
): TripDraftParsed {
  if (hasItineraryProposal(draft)) {
    return buildInterestBasedItinerary(draft);
  }
  return buildInterestBasedItinerary(draft);
}
