import type { TripDraftParsed } from "@/features/ai-trip-planner/schemas/draft";
import {
  formatPlaceSummary,
  formatDateRangeFr,
} from "@/features/ai-trip-planner/lib/format";
import {
  formatInterestsListFr,
  getTravelInterestLabel,
} from "@/features/ai-trip-planner/lib/labels";
import { computeNights } from "@/features/ai-trip-planner/lib/nights";
import { lodgingSelectionComplete } from "@/features/ai-trip-planner/lib/accommodation";

export const PLANNER_STEPS = [
  "trip_type",
  "origin",
  "destination_mode",
  "destination_radius",
  "destination",
  "dates",
  "travelers",
  "vehicle",
  "preferences",
  "accommodation_need",
  "accommodation_type",
  "lodging",
  "itinerary_proposal",
  "confirmation",
  "created",
] as const;

export type PlannerStep = (typeof PLANNER_STEPS)[number];

export type ItineraryProposalItem = {
  name: string;
  category: string;
  justification: string | null;
  durationMinutes: number | null;
  themeLabels?: string[];
};

export type ItineraryProposalDay = {
  day: number;
  label: string;
  items: ItineraryProposalItem[];
};

export type ItineraryProposal = {
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
  days: ItineraryProposalDay[];
  highlights: string[];
};

function hasTravelers(draft: TripDraftParsed): boolean {
  return (
    (draft.travelerCount != null && draft.travelerCount > 0) ||
    (draft.adults != null && draft.adults > 0) ||
    (draft.adults ?? 0) + (draft.children ?? 0) > 0
  );
}

function hasDates(draft: TripDraftParsed): boolean {
  return Boolean(
    draft.departureDate?.trim() &&
    (draft.returnDate?.trim() || draft.durationDays != null),
  );
}

function preferencesDone(draft: TripDraftParsed): boolean {
  return draft.preferencesResolved || draft.interests.length > 0;
}

function accommodationDecisionDone(draft: TripDraftParsed): boolean {
  const nights = computeNights(
    draft.departureDate,
    draft.returnDate,
    draft.durationDays,
  );
  if (nights < 1) return true;
  if (!draft.accommodationMode) return false;
  if (draft.accommodationMode === "sebavio_suggestion") {
    if (!draft.accommodationType && !draft.lodgingType) return false;
    return lodgingSelectionComplete(draft);
  }
  return true;
}

/** Contenu concret affichable avant confirmation (placeholders génériques exclus). */
export function hasItineraryProposal(draft: TripDraftParsed): boolean {
  if (!draft.origin.name?.trim() || !draft.destination.name?.trim()) {
    return false;
  }
  const hasEstimate =
    draft.estimatedDistanceKm != null || draft.estimatedDurationMinutes != null;
  const generic =
    /^arriv[ée]e et balade|^point d[’']int[ée]r[êe]t pr[èe]s|^d[ée]couverte de |^pause route entre /i;
  const concrete = [
    ...draft.stops.filter((s) => s.accepted),
    ...draft.activities.filter((a) => a.accepted),
    ...draft.suggestions.filter((s) => s.accepted),
  ].filter((i) => i.name.trim() && !generic.test(i.name.trim()));
  return hasEstimate && concrete.length >= 2;
}

export function buildItineraryProposal(
  draft: TripDraftParsed,
): ItineraryProposal | null {
  if (!hasItineraryProposal(draft)) return null;

  const items: ItineraryProposalItem[] = [
    ...draft.stops
      .filter((s) => s.accepted)
      .map((s) => ({
        name: s.name,
        category: s.category,
        justification: s.justification,
        durationMinutes: s.durationMinutes,
      })),
    ...draft.activities
      .filter((a) => a.accepted)
      .map((a) => ({
        name: a.name,
        category: a.category,
        justification: a.justification,
        durationMinutes: a.durationMinutes,
        themeLabels: draft.interests.length
          ? draft.interests
              .slice(0, 2)
              .map((i) => getTravelInterestLabel(i))
              .filter(Boolean)
          : undefined,
      })),
    ...draft.suggestions
      .filter((s) => s.accepted)
      .map((s) => ({
        name: s.name,
        category: s.category,
        justification: s.justification,
        durationMinutes: null as number | null,
      })),
  ];

  const seen = new Set<string>();
  const unique = items.filter((item) => {
    const key = item.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const daysCount = Math.max(1, draft.durationDays ?? 1);
  const days: ItineraryProposalDay[] = [];
  for (let d = 1; d <= Math.min(daysCount, 7); d += 1) {
    days.push({
      day: d,
      label: `Jour ${d}`,
      items: [],
    });
  }
  unique.forEach((item, index) => {
    const dayIndex = index % days.length;
    days[dayIndex]!.items.push(item);
  });

  const originLabel = formatPlaceSummary(draft.origin) ?? draft.origin.name!;
  const destinationLabel =
    formatPlaceSummary(draft.destination) ?? draft.destination.name!;
  const title =
    draft.title?.trim() || `Voyage ${originLabel} → ${destinationLabel}`;

  const summaryParts = [
    `Départ : ${originLabel}`,
    `Destination : ${destinationLabel}`,
  ];
  if (draft.estimatedDistanceKm != null) {
    summaryParts.push(`≈ ${Math.round(draft.estimatedDistanceKm)} km`);
  }
  if (draft.estimatedDurationMinutes != null) {
    const h = Math.floor(draft.estimatedDurationMinutes / 60);
    const m = draft.estimatedDurationMinutes % 60;
    summaryParts.push(h > 0 ? `≈ ${h} h ${m} min de route` : `≈ ${m} min`);
  }

  const softWarnings = [...draft.softWarnings];
  if (draft.accommodationMode === "decide_later") {
    if (!softWarnings.some((w) => /hébergement/i.test(w))) {
      softWarnings.push("Cet itinéraire ne contient pas encore d’hébergement.");
    }
  }

  return {
    title,
    summary: summaryParts.join(" · "),
    originLabel,
    destinationLabel,
    dateLabel: formatDateRangeFr(draft.departureDate, draft.returnDate),
    estimatedDistanceKm: draft.estimatedDistanceKm,
    estimatedDurationMinutes: draft.estimatedDurationMinutes,
    estimatedFuelStops: draft.estimatedFuelStops,
    interestsLabels: draft.interests.map((i) => getTravelInterestLabel(i)),
    softWarnings,
    days: days.filter((d) => d.items.length > 0),
    highlights: unique
      .slice(0, 5)
      .map((i) => i.justification || i.name)
      .filter(Boolean),
  };
}

/**
 * Autorité serveur : étape active dérivée du brouillon (pas du modèle).
 */
export function resolveCurrentStep(
  draft: TripDraftParsed,
  options?: { sessionStatus?: string; hasTripTypeHint?: boolean },
): PlannerStep {
  if (options?.sessionStatus === "created") return "created";

  if (!draft.origin.name?.trim()) {
    if (
      !options?.hasTripTypeHint &&
      draft.travelStyle.length === 0 &&
      draft.preferences.length === 0 &&
      draft.interests.length === 0
    ) {
      return "trip_type";
    }
    return "origin";
  }

  if (!draft.destination.name?.trim()) {
    if (!draft.destinationMode) {
      return "destination_mode";
    }
    if (
      draft.destinationMode === "suggest" &&
      draft.maxDriveMinutes == null &&
      draft.maxDistanceKm == null
    ) {
      return "destination_radius";
    }
    return "destination";
  }

  if (!hasDates(draft)) return "dates";
  if (!hasTravelers(draft)) return "travelers";
  if (!draft.vehicleId) return "vehicle";

  if (!preferencesDone(draft)) {
    return "preferences";
  }

  const nights = computeNights(
    draft.departureDate,
    draft.returnDate,
    draft.durationDays,
  );

  if (nights >= 1 && !draft.accommodationMode) {
    return "accommodation_need";
  }

  if (
    draft.accommodationMode === "sebavio_suggestion" &&
    !draft.accommodationType &&
    !draft.lodgingType
  ) {
    return "accommodation_type";
  }

  if (
    (draft.lodgingRequested ||
      draft.accommodationMode === "sebavio_suggestion") &&
    !lodgingSelectionComplete({
      lodgingRequested:
        draft.lodgingRequested ||
        draft.accommodationMode === "sebavio_suggestion",
      lodgingSelection: draft.lodgingSelection,
    })
  ) {
    return "lodging";
  }

  if (!hasItineraryProposal(draft)) {
    return "itinerary_proposal";
  }

  if (!accommodationDecisionDone(draft)) {
    return "accommodation_need";
  }

  if (options?.sessionStatus === "ready_for_confirmation") {
    return "confirmation";
  }

  return "confirmation";
}

export function resolveSessionStatus(
  draft: TripDraftParsed,
  step: PlannerStep,
): "collecting" | "proposing" | "ready_for_confirmation" {
  if (step === "confirmation" && hasItineraryProposal(draft)) {
    return "ready_for_confirmation";
  }
  if (
    step === "itinerary_proposal" ||
    step === "confirmation" ||
    step === "lodging" ||
    step === "accommodation_need" ||
    step === "accommodation_type" ||
    hasItineraryProposal(draft)
  ) {
    return "proposing";
  }
  return "collecting";
}

/** Extrait une limite de trajet depuis le texte utilisateur. */
export function parseDriveLimitFromText(text: string): {
  maxDriveMinutes?: number;
  maxDistanceKm?: number;
} {
  const t = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const hours = t.match(/(\d+(?:[.,]\d+)?)\s*h(?:eure)?s?\b/);
  if (hours) {
    const h = Number(hours[1]!.replace(",", "."));
    if (Number.isFinite(h) && h > 0 && h <= 24) {
      return { maxDriveMinutes: Math.round(h * 60) };
    }
  }
  const minutes = t.match(/(\d+)\s*min(?:ute)?s?\b/);
  if (minutes) {
    const m = Number(minutes[1]);
    if (Number.isFinite(m) && m > 0 && m <= 24 * 60) {
      return { maxDriveMinutes: m };
    }
  }
  const km = t.match(/(\d+)\s*km\b/);
  if (km) {
    const d = Number(km[1]);
    if (Number.isFinite(d) && d > 0 && d <= 5000) {
      return { maxDistanceKm: d };
    }
  }
  if (/\b1\s*h\b|\bune heure\b/.test(t)) return { maxDriveMinutes: 60 };
  if (/\b2\s*h\b|\bdeux heures\b/.test(t)) return { maxDriveMinutes: 120 };
  if (/\b3\s*h\b|\btrois heures\b/.test(t)) return { maxDriveMinutes: 180 };
  if (/\b4\s*h\b|\bquatre heures\b/.test(t)) return { maxDriveMinutes: 240 };
  if (/\bdemi[- ]?journee\b|\bmatin(ee)?\b/.test(t))
    return { maxDriveMinutes: 180 };
  return {};
}

export function formatDraftInterestsSummary(draft: TripDraftParsed): string {
  if (draft.interests.length > 0) {
    return formatInterestsListFr(draft.interests);
  }
  return draft.preferences.join(" · ");
}
