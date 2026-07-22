import {
  emptyTripDraft,
  placeRefSchema,
  tripDraftSchema,
  type TripDraftParsed,
} from "@/features/ai-trip-planner/schemas/draft";

export type OwnedVehicleRef = { id: string; label: string };
export type OwnedGroupRef = { id: string; name: string };

function placeNameChanged(
  prev: TripDraftParsed["origin"],
  next: TripDraftParsed["origin"] | null | undefined,
): boolean {
  if (!next?.name?.trim()) return false;
  const a = (prev.name ?? "").trim().toLowerCase();
  const b = next.name.trim().toLowerCase();
  return a !== b;
}

function mergePlace(
  prev: TripDraftParsed["origin"],
  incoming: unknown,
): TripDraftParsed["origin"] {
  if (incoming == null) return prev;
  const parsed = placeRefSchema.safeParse(incoming);
  if (!parsed.success) return prev;
  const next = parsed.data;
  if (!next.name?.trim()) return prev;

  const changed = placeNameChanged(prev, next);
  if (changed) {
    return {
      name: next.name,
      placeId: null,
      latitude: null,
      longitude: null,
      city: next.city,
      province: next.province,
      postalCode: null,
      country: next.country,
      isHome: false,
    };
  }

  return {
    name: prev.name ?? next.name,
    placeId: prev.placeId,
    latitude: prev.latitude,
    longitude: prev.longitude,
    city: prev.city ?? next.city,
    province: prev.province ?? next.province,
    postalCode: prev.postalCode,
    country: prev.country ?? next.country,
    isHome: prev.isHome,
  };
}

function pickScalar<T>(incoming: T | null | undefined, previous: T): T {
  if (incoming === undefined || incoming === null) return previous;
  return incoming;
}

/**
 * Fusionne un patch / brouillon IA avec l’existant.
 */
export function sanitizeAndMergeDraft(input: {
  previous: TripDraftParsed;
  incoming: unknown;
  ownedVehicles: OwnedVehicleRef[];
  ownedGroups: OwnedGroupRef[];
}): TripDraftParsed {
  const raw =
    input.incoming && typeof input.incoming === "object"
      ? (input.incoming as Record<string, unknown>)
      : {};
  const prev = input.previous;

  const vehicleIds = new Set(input.ownedVehicles.map((v) => v.id));
  const groupIds = new Set(input.ownedGroups.map((g) => g.id));

  let vehicleId = pickScalar(
    typeof raw.vehicleId === "string" || raw.vehicleId === null
      ? (raw.vehicleId as string | null)
      : undefined,
    prev.vehicleId,
  );
  vehicleId = rejectForeignVehicleId(vehicleId, vehicleIds);

  const vehicleLabel =
    (vehicleId
      ? input.ownedVehicles.find((v) => v.id === vehicleId)?.label
      : null) ??
    pickScalar(
      typeof raw.vehicleLabel === "string" || raw.vehicleLabel === null
        ? (raw.vehicleLabel as string | null)
        : undefined,
      prev.vehicleLabel,
    );

  let travelGroupId = pickScalar(
    typeof raw.travelGroupId === "string" || raw.travelGroupId === null
      ? (raw.travelGroupId as string | null)
      : undefined,
    prev.travelGroupId,
  );
  if (travelGroupId && !groupIds.has(travelGroupId)) {
    travelGroupId =
      prev.travelGroupId && groupIds.has(prev.travelGroupId)
        ? prev.travelGroupId
        : null;
  }

  const origin = mergePlace(prev.origin, raw.origin);
  const destination = mergePlace(prev.destination, raw.destination);

  const stopsRaw = Array.isArray(raw.stops) ? raw.stops : null;
  const activitiesRaw = Array.isArray(raw.activities) ? raw.activities : null;
  const suggestionsRaw = Array.isArray(raw.suggestions)
    ? raw.suggestions
    : null;

  const draftCandidate = {
    title: pickScalar(
      typeof raw.title === "string" || raw.title === null
        ? (raw.title as string | null)
        : undefined,
      prev.title,
    ),
    origin,
    destination,
    departureDate: pickScalar(
      typeof raw.departureDate === "string" || raw.departureDate === null
        ? (raw.departureDate as string | null)
        : undefined,
      prev.departureDate,
    ),
    returnDate: pickScalar(
      typeof raw.returnDate === "string" || raw.returnDate === null
        ? (raw.returnDate as string | null)
        : undefined,
      prev.returnDate,
    ),
    durationDays: pickScalar(
      typeof raw.durationDays === "number" || raw.durationDays === null
        ? (raw.durationDays as number | null)
        : undefined,
      prev.durationDays,
    ),
    travelerCount: pickScalar(
      typeof raw.travelerCount === "number" || raw.travelerCount === null
        ? (raw.travelerCount as number | null)
        : undefined,
      prev.travelerCount,
    ),
    adults: pickScalar(
      typeof raw.adults === "number" || raw.adults === null
        ? (raw.adults as number | null)
        : undefined,
      prev.adults,
    ),
    children: pickScalar(
      typeof raw.children === "number" || raw.children === null
        ? (raw.children as number | null)
        : undefined,
      prev.children,
    ),
    vehicleId,
    vehicleLabel,
    travelGroupId,
    budgetLevel: pickScalar(
      typeof raw.budgetLevel === "string" || raw.budgetLevel === null
        ? (raw.budgetLevel as TripDraftParsed["budgetLevel"])
        : undefined,
      prev.budgetLevel,
    ),
    travelStyle: Array.isArray(raw.travelStyle)
      ? (raw.travelStyle as string[])
      : prev.travelStyle,
    preferences: Array.isArray(raw.preferences)
      ? (raw.preferences as string[])
      : prev.preferences,
    constraints: Array.isArray(raw.constraints)
      ? (raw.constraints as string[])
      : prev.constraints,
    lodgingType: pickScalar(
      typeof raw.lodgingType === "string" || raw.lodgingType === null
        ? (raw.lodgingType as string | null)
        : undefined,
      prev.lodgingType,
    ),
    pace: pickScalar(
      typeof raw.pace === "string" || raw.pace === null
        ? (raw.pace as string | null)
        : undefined,
      prev.pace,
    ),
    stops: stopsRaw ?? prev.stops,
    activities: activitiesRaw ?? prev.activities,
    suggestions: suggestionsRaw ?? prev.suggestions,
    estimatedDistanceKm: pickScalar(
      typeof raw.estimatedDistanceKm === "number" ||
        raw.estimatedDistanceKm === null
        ? (raw.estimatedDistanceKm as number | null)
        : undefined,
      prev.estimatedDistanceKm,
    ),
    estimatedDurationMinutes: pickScalar(
      typeof raw.estimatedDurationMinutes === "number" ||
        raw.estimatedDurationMinutes === null
        ? (raw.estimatedDurationMinutes as number | null)
        : undefined,
      prev.estimatedDurationMinutes,
    ),
    estimatedFuelStops: pickScalar(
      typeof raw.estimatedFuelStops === "number" ||
        raw.estimatedFuelStops === null
        ? (raw.estimatedFuelStops as number | null)
        : undefined,
      prev.estimatedFuelStops,
    ),
    softWarnings: Array.isArray(raw.softWarnings)
      ? (raw.softWarnings as string[])
      : prev.softWarnings,
    destinationMode: pickScalar(
      raw.destinationMode === "known" ||
        raw.destinationMode === "suggest" ||
        raw.destinationMode === null
        ? (raw.destinationMode as TripDraftParsed["destinationMode"])
        : undefined,
      prev.destinationMode,
    ),
    maxDriveMinutes: pickScalar(
      typeof raw.maxDriveMinutes === "number" || raw.maxDriveMinutes === null
        ? (raw.maxDriveMinutes as number | null)
        : undefined,
      prev.maxDriveMinutes,
    ),
    maxDistanceKm: pickScalar(
      typeof raw.maxDistanceKm === "number" || raw.maxDistanceKm === null
        ? (raw.maxDistanceKm as number | null)
        : undefined,
      prev.maxDistanceKm,
    ),
    proposalConfirmed:
      typeof raw.proposalConfirmed === "boolean"
        ? raw.proposalConfirmed
        : prev.proposalConfirmed,
  };

  const parsed = tripDraftSchema.safeParse({
    ...draftCandidate,
    stops: (draftCandidate.stops as TripDraftParsed["stops"]).map((s) => ({
      ...s,
      placeId: null,
    })),
    activities: (
      draftCandidate.activities as TripDraftParsed["activities"]
    ).map((a) => ({
      ...a,
      placeId: null,
    })),
  });

  return parsed.success ? parsed.data : prev;
}

export function rejectForeignVehicleId(
  vehicleId: string | null | undefined,
  ownedVehicleIds: ReadonlySet<string>,
): string | null {
  if (!vehicleId) return null;
  return ownedVehicleIds.has(vehicleId) ? vehicleId : null;
}

export function placeFromAddressSelection(input: {
  formattedAddress: string;
  placeId: string;
  latitude: number;
  longitude: number;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
  isHome?: boolean;
}): TripDraftParsed["origin"] {
  return placeRefSchema.parse({
    name: input.formattedAddress,
    placeId: input.placeId,
    latitude: input.latitude,
    longitude: input.longitude,
    city: input.city,
    province: input.province,
    postalCode: input.postalCode,
    country: input.country,
    isHome: Boolean(input.isHome),
  });
}

export function emptyPlaceRef(): TripDraftParsed["origin"] {
  return emptyTripDraft().origin;
}
