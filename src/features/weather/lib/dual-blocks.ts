import type {
  TripWeatherLocation,
  TripWeatherResponse,
} from "@/features/weather/types";
import type { WeatherDailyForecast } from "@/services/weather/types";

export type WeatherBlockKind = "departure" | "live" | "arrival";

export type WeatherDayBlock = {
  kind: WeatherBlockKind;
  /** Libellé principal : Départ | Position actuelle | Arrivée */
  title: string;
  /** Sous-libellé lieu (court). */
  placeLabel: string;
  location: TripWeatherLocation | null;
  days: WeatherDailyForecast[];
  emptyMessage: string | null;
};

const DAYS_PER_BLOCK = 3;

/** Libellé lieu court pour l’en-tête de bloc météo. */
export function shortWeatherPlaceLabel(
  preferred: string | null | undefined,
  fallback: string,
  maxLen = 36,
): string {
  const raw = (preferred?.trim() || fallback.trim() || "").trim();
  if (!raw) return "—";
  if (raw.length <= maxLen) return raw;
  const firstComma = raw.indexOf(",");
  if (firstComma > 8 && firstComma <= maxLen) {
    return raw.slice(0, firstComma).trim();
  }
  return `${raw.slice(0, maxLen - 1).trimEnd()}…`;
}

export function formatWeatherDayHeading(
  dateIso: string,
  todayIso?: string | null,
): string {
  if (todayIso && dateIso === todayIso) return "Aujourd’hui";
  const d = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateIso;
  const weekday = d
    .toLocaleDateString("fr-CA", { weekday: "short" })
    .replace(".", "");
  const day = d.toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "short",
  });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}. ${day}`;
}

function todayIsoLocal(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Sélectionne les 3 jours à partir de l’ancre (`location.date` si présent
 * dans `daily`, sinon les 3 premiers jours renvoyés par le provider —
 * déjà réordonnés côté serveur avec le jour cible en tête).
 */
export function selectThreeDays(
  location: TripWeatherLocation | null | undefined,
): WeatherDailyForecast[] {
  if (!location || location.daily.length === 0) return [];
  return location.daily.slice(0, DAYS_PER_BLOCK);
}

export type BuildDualWeatherBlocksInput = {
  response: TripWeatherResponse;
  /** Libellé court du départ (ville). */
  originLabel?: string | null;
  /** Libellé court de l’arrivée (ville). */
  destinationLabel?: string | null;
  todayIso?: string;
};

/**
 * Construit les deux blocs météo Voyage :
 * - gauche : live si présent, sinon origin
 * - droite : destination
 */
export function buildDualWeatherBlocks(input: BuildDualWeatherBlocksInput): {
  departure: WeatherDayBlock;
  arrival: WeatherDayBlock;
  todayIso: string;
} {
  const today = input.todayIso ?? todayIsoLocal();
  const locations = input.response.locations;

  const live = locations.find((l) => l.type === "live") ?? null;
  const origin = locations.find((l) => l.type === "origin") ?? null;
  const destination = locations.find((l) => l.type === "destination") ?? null;

  const left = live ?? origin;
  const leftIsLive = live != null;

  const departureDays = selectThreeDays(left);
  const arrivalDays = selectThreeDays(destination);

  const departure: WeatherDayBlock = {
    kind: leftIsLive ? "live" : "departure",
    title: leftIsLive ? "Position actuelle" : "Départ",
    placeLabel: leftIsLive
      ? shortWeatherPlaceLabel(null, left?.name ?? "Géolocalisation")
      : shortWeatherPlaceLabel(
          input.originLabel,
          left?.name ?? origin?.name ?? "",
        ),
    location: left,
    days: departureDays,
    emptyMessage:
      departureDays.length > 0
        ? null
        : emptyMessageForSide(input.response, "departure"),
  };

  const arrival: WeatherDayBlock = {
    kind: "arrival",
    title: "Arrivée",
    placeLabel: shortWeatherPlaceLabel(
      input.destinationLabel,
      destination?.name ?? "",
    ),
    location: destination,
    days: arrivalDays,
    emptyMessage:
      arrivalDays.length > 0
        ? null
        : emptyMessageForSide(input.response, "arrival"),
  };

  return { departure, arrival, todayIso: today };
}

function emptyMessageForSide(
  response: TripWeatherResponse,
  side: "departure" | "arrival",
): string {
  if (
    response.status === "too_early" ||
    response.status === "disabled" ||
    response.status === "no_coordinates"
  ) {
    return (
      response.message ??
      "Les prévisions seront disponibles à l’approche du voyage."
    );
  }
  if (
    response.status === "temporarily_unavailable" ||
    response.status === "provider_limit_reached"
  ) {
    return response.message ?? "Données météo temporairement indisponibles.";
  }
  if (side === "arrival") {
    return "Les prévisions détaillées pour l’arrivée seront disponibles plus près de la date.";
  }
  return "Les prévisions détaillées pour le départ seront disponibles plus près de la date.";
}
