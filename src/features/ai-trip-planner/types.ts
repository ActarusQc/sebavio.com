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
  constraints: string[];
  lodgingType: string | null;
  pace: string | null;
  stops: StopDraft[];
  activities: StopDraft[];
  suggestions: AiSuggestion[];
  estimatedDistanceKm: number | null;
  estimatedDurationMinutes: number | null;
  estimatedFuelStops: number | null;
  softWarnings: string[];
};

export type RequestedInputDto = {
  type: "text" | "address" | "date" | "choice" | "number" | "vehicle";
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
    | "other";
  placeholder: string | null;
  countryBias: string;
  regionBias: string;
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
  messages: PlannerMessage[];
  draft: TripDraft;
  missingFields: string[];
  requestedInput: RequestedInputDto;
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
