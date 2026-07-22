export type TripPlannerSessionStatus =
  | "collecting"
  | "proposing"
  | "ready_for_confirmation"
  | "created"
  | "abandoned";

export type BudgetLevel = "low" | "moderate" | "comfortable" | "premium";

export type PlaceRef = {
  name: string | null;
  placeId: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
  isHome: boolean;
};

export type StopDraft = {
  id: string;
  name: string;
  category:
    "activity" | "detour" | "lodging" | "meal" | "fuel" | "rest" | "other";
  justification: string | null;
  durationMinutes: number | null;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  address: string | null;
  accepted: boolean;
};

export type AiSuggestion = {
  id: string;
  name: string;
  category: string;
  justification: string | null;
  imageUrl: string | null;
  accepted: boolean;
};

export type LodgingOptionDto = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  placeId: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  ratingCount: number | null;
  googleMapsUrl: string | null;
  primaryType: string | null;
};

export type LodgingSelectionDto = {
  name: string;
  placeId: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  googleMapsUrl: string | null;
};

export type TripDraft = {
  title: string | null;
  origin: PlaceRef;
  destination: PlaceRef;
  departureDate: string | null;
  returnDate: string | null;
  durationDays: number | null;
  travelerCount: number | null;
  adults: number | null;
  children: number | null;
  vehicleId: string | null;
  vehicleLabel: string | null;
  travelGroupId: string | null;
  budgetLevel: BudgetLevel | null;
  travelStyle: string[];
  preferences: string[];
  interests: Array<
    | "gastronomy"
    | "nature"
    | "culture"
    | "shopping"
    | "wellness"
    | "family"
    | "sports"
    | "entertainment"
    | "nightlife"
    | "local_discovery"
  >;
  primaryInterest:
    | "gastronomy"
    | "nature"
    | "culture"
    | "shopping"
    | "wellness"
    | "family"
    | "sports"
    | "entertainment"
    | "nightlife"
    | "local_discovery"
    | null;
  preferencesResolved: boolean;
  constraints: string[];
  lodgingType: string | null;
  accommodationType:
    | "bed_and_breakfast"
    | "inn"
    | "hotel"
    | "motel"
    | "vacation_rental"
    | "campground"
    | "hostel"
    | "other"
    | null;
  accommodationMode:
    | "sebavio_suggestion"
    | "already_booked"
    | "decide_later"
    | "return_home_each_night"
    | null;
  lodgingRequested: boolean;
  lodgingOptions: LodgingOptionDto[];
  lodgingSelection: LodgingSelectionDto | null;
  pace: string | null;
  stops: StopDraft[];
  activities: StopDraft[];
  suggestions: AiSuggestion[];
  estimatedDistanceKm: number | null;
  estimatedDurationMinutes: number | null;
  estimatedFuelStops: number | null;
  softWarnings: string[];
  destinationMode: "known" | "suggest" | null;
  maxDriveMinutes: number | null;
  maxDistanceKm: number | null;
  proposalConfirmed: boolean;
};

export type ItineraryProposalDto = {
  title: string;
  summary: string;
  originLabel: string;
  destinationLabel: string;
  dateLabel: string | null;
  estimatedDistanceKm: number | null;
  estimatedDurationMinutes: number | null;
  estimatedFuelStops: number | null;
  interestsLabels: string[];
  softWarnings: string[];
  days: Array<{
    day: number;
    label: string;
    items: Array<{
      name: string;
      category: string;
      justification: string | null;
      durationMinutes: number | null;
      themeLabels?: string[];
    }>;
  }>;
  highlights: string[];
};

export type RequestedInputDto = {
  type:
    | "text"
    | "address"
    | "date"
    | "choice"
    | "number"
    | "vehicle"
    | "multi_choice";
  field:
    | "origin"
    | "destination"
    | "activity"
    | "detour"
    | "lodging"
    | "stop"
    | "departureDate"
    | "returnDate"
    | "travelers"
    | "vehicleId"
    | "interests"
    | "other";
  placeholder: string | null;
  countryBias: string;
  regionBias: string;
  minimumSelections?: number;
  maximumSelections?: number | null;
  choices?: Array<{ id: string; label: string }>;
} | null;

export type PlannerMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  quickReplies?: string[];
};

export type OriginSuggestionDto = {
  kind: "home" | "recent" | "city";
  label: string;
  city: string | null;
};

export type TripPlannerSessionDto = {
  id: string;
  status: TripPlannerSessionStatus;
  sessionVersion: number;
  currentStep: string;
  messages: PlannerMessage[];
  draft: TripDraft;
  missingFields: string[];
  /** Quick replies de l’étape active (autorité serveur). */
  quickReplies: string[];
  requestedInput: RequestedInputDto;
  proposal: ItineraryProposalDto | null;
  originSuggestions: OriginSuggestionDto[];
  homeCity: string | null;
  createdTripId: string | null;
  canCreate: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TripPlannerAccessDto = {
  canUse: boolean;
  aiEnabled: boolean;
  reason?: string | null;
};
