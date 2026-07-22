import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";
import { hasItineraryProposal } from "@/features/ai-trip-planner/lib/planning-step";

export function detectMissingFields(draft: TripDraftParsed): string[] {
  const missing: string[] = [];

  if (!draft.origin.name?.trim()) missing.push("origin");
  if (!draft.destination.name?.trim()) missing.push("destination");
  if (!draft.departureDate?.trim()) missing.push("departureDate");
  if (!draft.returnDate?.trim() && draft.durationDays == null) {
    missing.push("returnDate");
  }

  const hasTravelers =
    (draft.travelerCount != null && draft.travelerCount > 0) ||
    (draft.adults != null && draft.adults > 0) ||
    (draft.adults ?? 0) + (draft.children ?? 0) > 0;
  if (!hasTravelers) missing.push("travelers");

  if (!draft.vehicleId) missing.push("vehicleId");

  if (
    detectMissingFieldsBasicsComplete(draft) &&
    !hasItineraryProposal(draft)
  ) {
    missing.push("itineraryProposal");
  }

  if (draft.lodgingRequested && !draft.lodgingSelection?.name?.trim()) {
    missing.push("lodgingSelection");
  }

  return missing;
}

function detectMissingFieldsBasicsComplete(draft: TripDraftParsed): boolean {
  if (!draft.origin.name?.trim()) return false;
  if (!draft.destination.name?.trim()) return false;
  if (!draft.departureDate?.trim()) return false;
  if (!draft.returnDate?.trim() && draft.durationDays == null) return false;
  const hasTravelers =
    (draft.travelerCount != null && draft.travelerCount > 0) ||
    (draft.adults != null && draft.adults > 0) ||
    (draft.adults ?? 0) + (draft.children ?? 0) > 0;
  if (!hasTravelers) return false;
  if (!draft.vehicleId) return false;
  return true;
}

/** Champs scalaires seuls (sans exiger la proposition). */
export function detectMissingScalarFields(draft: TripDraftParsed): string[] {
  return detectMissingFields(draft).filter(
    (f) => f !== "itineraryProposal" && f !== "lodgingSelection",
  );
}

export function isDraftReadyForCreation(draft: TripDraftParsed): boolean {
  if (draft.lodgingRequested && !draft.lodgingSelection?.name?.trim()) {
    return false;
  }
  return (
    detectMissingScalarFields(draft).length === 0 && hasItineraryProposal(draft)
  );
}
