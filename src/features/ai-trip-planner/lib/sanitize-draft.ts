import {
  emptyTripDraft,
  tripDraftSchema,
  type TripDraftParsed,
} from "@/features/ai-trip-planner/schemas/draft";

export type OwnedVehicleRef = { id: string; label: string };
export type OwnedGroupRef = { id: string; name: string };

function placeNameChanged(
  prev: TripDraftParsed["origin"],
  next: TripDraftParsed["origin"],
): boolean {
  const a = (prev.name ?? "").trim().toLowerCase();
  const b = (next.name ?? "").trim().toLowerCase();
  return Boolean(b) && a !== b;
}

/**
 * Fusionne le brouillon IA avec l’existant.
 * Ne fait jamais confiance aux IDs proposés par le modèle hors listes propriétaires.
 */
export function sanitizeAndMergeDraft(input: {
  previous: TripDraftParsed;
  incoming: unknown;
  ownedVehicles: OwnedVehicleRef[];
  ownedGroups: OwnedGroupRef[];
}): TripDraftParsed {
  const parsedIncoming = tripDraftSchema.safeParse(input.incoming);
  const incoming = parsedIncoming.success
    ? parsedIncoming.data
    : emptyTripDraft();
  const prev = input.previous;

  const vehicleIds = new Set(input.ownedVehicles.map((v) => v.id));
  const groupIds = new Set(input.ownedGroups.map((g) => g.id));

  let vehicleId = incoming.vehicleId;
  if (vehicleId && !vehicleIds.has(vehicleId)) {
    vehicleId =
      prev.vehicleId && vehicleIds.has(prev.vehicleId) ? prev.vehicleId : null;
  }
  if (!vehicleId && prev.vehicleId && vehicleIds.has(prev.vehicleId)) {
    vehicleId = prev.vehicleId;
  }

  const vehicleLabel =
    (vehicleId
      ? input.ownedVehicles.find((v) => v.id === vehicleId)?.label
      : null) ??
    incoming.vehicleLabel ??
    prev.vehicleLabel ??
    null;

  let travelGroupId = incoming.travelGroupId;
  if (travelGroupId && !groupIds.has(travelGroupId)) {
    travelGroupId =
      prev.travelGroupId && groupIds.has(prev.travelGroupId)
        ? prev.travelGroupId
        : null;
  }

  const originChanged = placeNameChanged(prev.origin, incoming.origin);
  const destChanged = placeNameChanged(prev.destination, incoming.destination);

  // placeId : jamais de confiance à l’IA (re-géocodage serveur ensuite).
  const origin = {
    name: incoming.origin.name ?? prev.origin.name,
    placeId: null,
    latitude: originChanged
      ? (incoming.origin.latitude ?? null)
      : (incoming.origin.latitude ?? prev.origin.latitude),
    longitude: originChanged
      ? (incoming.origin.longitude ?? null)
      : (incoming.origin.longitude ?? prev.origin.longitude),
  };

  const destination = {
    name: incoming.destination.name ?? prev.destination.name,
    placeId: null,
    latitude: destChanged
      ? (incoming.destination.latitude ?? null)
      : (incoming.destination.latitude ?? prev.destination.latitude),
    longitude: destChanged
      ? (incoming.destination.longitude ?? null)
      : (incoming.destination.longitude ?? prev.destination.longitude),
  };

  const mergedStops =
    incoming.stops.length > 0
      ? incoming.stops.map((s) => ({
          ...s,
          placeId: null,
        }))
      : prev.stops;

  const mergedActivities =
    incoming.activities.length > 0
      ? incoming.activities.map((a) => ({
          ...a,
          placeId: null,
        }))
      : prev.activities;

  const suggestions =
    incoming.suggestions.length > 0 ? incoming.suggestions : prev.suggestions;

  return tripDraftSchema.parse({
    title: incoming.title ?? prev.title,
    origin,
    destination,
    departureDate: incoming.departureDate ?? prev.departureDate,
    returnDate: incoming.returnDate ?? prev.returnDate,
    durationDays: incoming.durationDays ?? prev.durationDays,
    travelerCount: incoming.travelerCount ?? prev.travelerCount,
    adults: incoming.adults ?? prev.adults,
    children: incoming.children ?? prev.children,
    vehicleId,
    vehicleLabel,
    travelGroupId,
    budgetLevel: incoming.budgetLevel ?? prev.budgetLevel,
    travelStyle:
      incoming.travelStyle.length > 0 ? incoming.travelStyle : prev.travelStyle,
    preferences:
      incoming.preferences.length > 0 ? incoming.preferences : prev.preferences,
    constraints:
      incoming.constraints.length > 0 ? incoming.constraints : prev.constraints,
    lodgingType: incoming.lodgingType ?? prev.lodgingType,
    pace: incoming.pace ?? prev.pace,
    stops: mergedStops,
    activities: mergedActivities,
    suggestions,
    estimatedDistanceKm:
      incoming.estimatedDistanceKm ?? prev.estimatedDistanceKm,
    estimatedDurationMinutes:
      incoming.estimatedDurationMinutes ?? prev.estimatedDurationMinutes,
    estimatedFuelStops: incoming.estimatedFuelStops ?? prev.estimatedFuelStops,
    softWarnings: incoming.softWarnings,
  });
}

/** Refuse un vehicleId qui n’appartient pas à l’utilisateur. */
export function rejectForeignVehicleId(
  vehicleId: string | null | undefined,
  ownedVehicleIds: ReadonlySet<string>,
): string | null {
  if (!vehicleId) return null;
  return ownedVehicleIds.has(vehicleId) ? vehicleId : null;
}
