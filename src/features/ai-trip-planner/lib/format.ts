import type { BudgetLevel, TripDraft } from "@/features/ai-trip-planner/types";

const BUDGET_LABELS: Record<BudgetLevel, string> = {
  low: "Économique",
  moderate: "Modéré",
  comfortable: "Confortable",
  premium: "Premium",
};

export function formatBudgetLevel(level: BudgetLevel | null): string | null {
  if (!level) return null;
  return BUDGET_LABELS[level] ?? level;
}

function parseDisplayDate(value: string): Date | null {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    // Midi UTC pour éviter le décalage fuseau sur les dates calendaires.
    const d = new Date(`${trimmed}T12:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateRangeFr(
  departureDate: string | null,
  returnDate: string | null,
  timeZone = "America/Toronto",
): string | null {
  if (!departureDate) return null;
  const start = parseDisplayDate(departureDate);
  if (!start) return null;

  const fmtDay = new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    timeZone,
  });
  const fmtMonthYear = new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  });

  if (!returnDate) return fmtMonthYear.format(start);

  const end = parseDisplayDate(returnDate);
  if (!end) return fmtMonthYear.format(start);

  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    return `${fmtDay.format(start)} au ${fmtMonthYear.format(end)}`;
  }

  return `${fmtMonthYear.format(start)} au ${fmtMonthYear.format(end)}`;
}

export function formatTravelers(draft: TripDraft): string | null {
  if (draft.adults != null || draft.children != null) {
    const adults = draft.adults ?? 0;
    const children = draft.children ?? 0;
    const parts: string[] = [];
    if (adults > 0) {
      parts.push(`${adults} adulte${adults > 1 ? "s" : ""}`);
    }
    if (children > 0) {
      parts.push(`${children} enfant${children > 1 ? "s" : ""}`);
    }
    if (parts.length) return parts.join(", ");
  }
  if (draft.travelerCount != null && draft.travelerCount > 0) {
    return `${draft.travelerCount} voyageur${draft.travelerCount > 1 ? "s" : ""}`;
  }
  return null;
}

export function formatDurationMinutes(minutes: number | null): string | null {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `~${m} min`;
  if (m === 0) return `~${h} h`;
  return `~${h} h ${m}`;
}

export function formatDistanceKm(km: number | null): string | null {
  if (km == null || !Number.isFinite(km) || km <= 0) return null;
  return `~${Math.round(km)} km`;
}

export function formatMessageTime(
  iso: string,
  timeZone = "America/Toronto",
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(d);
}

export const MISSING_FIELD_LABELS: Record<string, string> = {
  origin: "point de départ",
  destination: "destination",
  departureDate: "date de départ",
  returnDate: "date de retour",
  travelers: "voyageurs",
  vehicleId: "véhicule",
  title: "titre",
  itineraryProposal: "proposition d’itinéraire",
};

export function formatPlaceSummary(place: {
  name: string | null;
  city: string | null;
  isHome?: boolean;
}): string | null {
  if (place.isHome) {
    return place.city ? `Domicile — ${place.city}` : "Domicile";
  }
  if (place.city && place.name && place.name.length > 48) {
    return place.city;
  }
  return place.name?.trim() || place.city || null;
}
