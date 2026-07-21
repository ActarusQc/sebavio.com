export {
  assertOwnedTripForLocations,
  recordTripLocations,
  getLatestTripLocation,
  listTripLocations,
  purgeTripLocations,
  cleanupStaleTripLocations,
} from "@/features/trips/services/trip-locations";
export type {
  TripLocationDto,
  RecordLocationsResult,
} from "@/features/trips/services/trip-locations";

export {
  listTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  completeTrip,
  cancelTrip,
  getTripSummary,
  optimizeTrip,
  rebuildTripRouteFromCanonicalData,
  geocodeStop,
  addStop,
  updateStop,
  deleteStop,
  reorderStops,
  assertOwnedVehicle,
  assertTripAccess,
  getOwnedTripOrThrow,
  isRouteStale,
} from "@/features/trips/services/trips";

export { recalculateTripItineraryAtomic } from "@/features/trips/services/recalculate-itinerary";

export {
  assertContiguousSequences,
  buildContiguousAssignments,
} from "@/features/trips/services/sequences";

export {
  assertWritableStatus,
  assertCanStart,
  assertCanComplete,
  assertCanCancel,
  isTerminalStatus,
} from "@/features/trips/services/transitions";
