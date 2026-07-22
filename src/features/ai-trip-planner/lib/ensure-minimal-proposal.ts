import { randomUUID } from "node:crypto";
import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";
import { hasItineraryProposal } from "@/features/ai-trip-planner/lib/planning-step";

/**
 * Si le brouillon a O/D + estimations mais aucun arrêt/activité,
 * ajoute une proposition minimale concrète (jamais une confirmation vide).
 */
export function ensureMinimalItineraryContent(
  draft: TripDraftParsed,
): TripDraftParsed {
  if (hasItineraryProposal(draft)) return draft;
  if (!draft.origin.name?.trim() || !draft.destination.name?.trim()) {
    return draft;
  }
  if (
    draft.estimatedDistanceKm == null &&
    draft.estimatedDurationMinutes == null
  ) {
    return draft;
  }

  const dest =
    draft.destination.city || draft.destination.name || "la destination";
  const origin = draft.origin.city || draft.origin.name || "le départ";

  const activities = [
    {
      id: randomUUID(),
      name: `Arrivée et balade à ${dest}`,
      category: "activity" as const,
      justification: `Premier temps libre pour découvrir ${dest}.`,
      durationMinutes: 120,
      latitude: draft.destination.latitude,
      longitude: draft.destination.longitude,
      placeId: draft.destination.placeId,
      address: draft.destination.name,
      accepted: true,
    },
    {
      id: randomUUID(),
      name: `Point d’intérêt près de ${dest}`,
      category: "activity" as const,
      justification: "Activité phare adaptée à votre type de voyage.",
      durationMinutes: 90,
      latitude: null,
      longitude: null,
      placeId: null,
      address: null,
      accepted: true,
    },
  ];

  const stops =
    draft.estimatedDistanceKm != null && draft.estimatedDistanceKm > 150
      ? [
          {
            id: randomUUID(),
            name: `Pause route entre ${origin} et ${dest}`,
            category: "rest" as const,
            justification: "Pause confort recommandée sur un trajet plus long.",
            durationMinutes: 30,
            latitude: null,
            longitude: null,
            placeId: null,
            address: null,
            accepted: true,
          },
        ]
      : [];

  return {
    ...draft,
    activities: draft.activities.length > 0 ? draft.activities : activities,
    stops: draft.stops.length > 0 ? draft.stops : stops,
    suggestions:
      draft.suggestions.length > 0
        ? draft.suggestions
        : [
            {
              id: randomUUID(),
              name: `Découverte de ${dest}`,
              category: "highlight",
              justification: `Temps fort autour de ${dest}.`,
              imageUrl: null,
              accepted: true,
            },
          ],
    title: draft.title ?? `Voyage ${origin} → ${dest}`.slice(0, 150),
  };
}
