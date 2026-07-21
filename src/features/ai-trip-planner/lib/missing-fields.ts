import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";

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

  return missing;
}

export function isDraftReadyForCreation(draft: TripDraftParsed): boolean {
  return detectMissingFields(draft).length === 0;
}
