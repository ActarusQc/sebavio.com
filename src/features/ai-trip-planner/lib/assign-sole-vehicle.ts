import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";

/**
 * Si l’utilisateur n’a qu’un seul véhicule, l’assigner sans poser la question.
 */
export function assignSoleVehicleIfNeeded(
  draft: TripDraftParsed,
  ownedVehicles: Array<{ id: string; label: string }>,
): TripDraftParsed {
  if (draft.vehicleId) return draft;
  if (ownedVehicles.length !== 1) return draft;
  const sole = ownedVehicles[0]!;
  return {
    ...draft,
    vehicleId: sole.id,
    vehicleLabel: sole.label,
  };
}
