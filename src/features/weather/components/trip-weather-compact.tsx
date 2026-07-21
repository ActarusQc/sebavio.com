"use client";

import { useEffect, useMemo, useState } from "react";
import { CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeatherConditionIcon } from "@/features/weather/components/weather-condition-icon";
import type {
  TripWeatherLocation,
  TripWeatherResponse,
} from "@/features/weather/types";

type Props = {
  tripId: string;
  liveLatitude?: number | null;
  liveLongitude?: number | null;
  className?: string;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; data: TripWeatherResponse }
  | { kind: "error"; message: string };

function pickPrimaryLocation(
  locations: TripWeatherLocation[],
): TripWeatherLocation | null {
  if (locations.length === 0) return null;
  return (
    locations.find((l) => l.type === "destination") ??
    locations.find((l) => l.type === "live") ??
    locations.find((l) => l.type === "stop") ??
    locations[0] ??
    null
  );
}

function formatDayHeading(dateIso: string, index: number): string {
  if (index === 0) return "Aujourd’hui";
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

function CompactSkeleton() {
  return (
    <div
      className="flex animate-pulse gap-0"
      aria-busy="true"
      data-testid="trip-weather-compact-loading"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-muted h-[7.5rem] min-w-[5.5rem] flex-1 border-r border-[rgb(14_45_70/0.06)] last:border-r-0"
        />
      ))}
    </div>
  );
}

export function TripWeatherCompact({
  tripId,
  liveLatitude = null,
  liveLongitude = null,
  className,
}: Props) {
  return (
    <TripWeatherCompactInner
      key={`${tripId}:${liveLatitude ?? ""}:${liveLongitude ?? ""}`}
      tripId={tripId}
      liveLatitude={liveLatitude}
      liveLongitude={liveLongitude}
      className={className}
    />
  );
}

function TripWeatherCompactInner({
  tripId,
  liveLatitude,
  liveLongitude,
  className,
}: Props) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const params = new URLSearchParams();
        if (
          liveLatitude != null &&
          liveLongitude != null &&
          Number.isFinite(liveLatitude) &&
          Number.isFinite(liveLongitude)
        ) {
          params.set("liveLat", String(liveLatitude));
          params.set("liveLng", String(liveLongitude));
        }
        const qs = params.toString();
        const res = await fetch(
          `/api/v1/trips/${tripId}/weather${qs ? `?${qs}` : ""}`,
          { credentials: "same-origin" },
        );
        if (!res.ok) throw new Error("Erreur de chargement météo");
        const json = (await res.json()) as {
          success?: boolean;
          data?: { weather?: TripWeatherResponse };
        };
        const weather = json.data?.weather;
        if (!weather) throw new Error("Réponse météo invalide");
        if (!cancelled) setState({ kind: "ready", data: weather });
      } catch {
        if (!cancelled) {
          setState({
            kind: "error",
            message: "Impossible de charger la météo pour le moment.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tripId, liveLatitude, liveLongitude]);

  return (
    <section
      className={cn("trip-card overflow-hidden p-0", className)}
      data-testid="trip-weather-compact"
      aria-labelledby="trip-weather-compact-heading"
    >
      <h2 id="trip-weather-compact-heading" className="sr-only">
        Météo du voyage
      </h2>
      {state.kind === "loading" ? (
        <div className="p-1">
          <CompactSkeleton />
        </div>
      ) : null}

      {state.kind === "error" ? (
        <p
          className="text-muted-foreground flex items-center gap-2 px-5 py-4 text-sm"
          role="alert"
        >
          <CloudOff className="size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : null}

      {state.kind === "ready" ? <CompactBody data={state.data} /> : null}
    </section>
  );
}

function CompactBody({ data }: { data: TripWeatherResponse }) {
  const primary = useMemo(
    () => pickPrimaryLocation(data.locations),
    [data.locations],
  );

  if (
    data.status === "disabled" ||
    data.status === "no_coordinates" ||
    data.status === "too_early"
  ) {
    return (
      <p className="text-muted-foreground px-5 py-4 text-sm" role="status">
        {data.message ??
          "Les prévisions détaillées seront disponibles à l’approche du voyage."}
      </p>
    );
  }

  if (!primary || (primary.daily.length === 0 && !primary.current)) {
    if (
      data.status === "temporarily_unavailable" ||
      data.status === "provider_limit_reached"
    ) {
      return (
        <p className="text-muted-foreground flex items-center gap-2 px-5 py-4 text-sm">
          <CloudOff className="size-4 shrink-0" aria-hidden />
          {data.message ?? "Données météo temporairement indisponibles."}
        </p>
      );
    }
    return (
      <p className="text-muted-foreground px-5 py-4 text-sm" role="status">
        Les prévisions détaillées seront disponibles à l’approche du voyage.
      </p>
    );
  }

  const days = primary.daily.slice(0, 5);

  return (
    <div className="flex flex-col">
      <ul
        className="flex min-h-[118px] snap-x snap-mandatory gap-0 overflow-x-auto scroll-smooth sm:min-h-[132px] sm:overflow-visible"
        role="list"
        aria-label="Prévisions sur plusieurs jours"
      >
        {days.map((day, index) => (
          <li
            key={day.date}
            className={cn(
              "flex min-w-[8.5rem] shrink-0 snap-start flex-col items-center px-[18px] py-4 text-center sm:min-w-0 sm:flex-1 sm:px-5 sm:py-5",
              index < days.length - 1 && "border-r border-[rgb(14_45_70/0.08)]",
            )}
          >
            <span className="text-sebavio-navy text-[12px] font-semibold tracking-wide sm:text-[13px]">
              {formatDayHeading(day.date, index)}
            </span>
            <WeatherConditionIcon
              iconId={day.condition.iconId}
              code={day.condition.code}
              description={day.condition.description}
              size={42}
              preferDay
              className="my-2.5 size-[36px] sm:my-3 sm:size-[42px] [&_svg]:size-full"
            />
            <span className="text-sebavio-navy text-[20px] font-bold tabular-nums sm:text-[22px]">
              {Math.round(day.tempMaxC)}°
              <span className="text-muted-foreground ml-1.5 text-[13px] font-medium sm:text-[14px]">
                {Math.round(day.tempMinC)}°
              </span>
            </span>
            <span className="text-muted-foreground mt-1 line-clamp-1 max-w-[9rem] text-[12px] leading-snug sm:text-[13px]">
              {day.condition.description}
            </span>
          </li>
        ))}
        {days.length === 0 && primary.current ? (
          <li className="flex w-full items-center gap-3 px-5 py-4">
            <WeatherConditionIcon
              iconId={primary.current.condition.iconId}
              code={primary.current.condition.code}
              description={primary.current.condition.description}
              size={40}
              className="size-10 [&_svg]:size-full"
            />
            <div>
              <p className="text-sebavio-navy text-lg font-bold">
                {Math.round(primary.current.temperatureC)}°
              </p>
              <p className="text-muted-foreground text-sm">
                {primary.current.condition.description}
              </p>
            </div>
          </li>
        ) : null}
      </ul>

      <div className="flex items-center justify-end border-t border-[rgb(14_45_70/0.06)] px-5 py-2">
        <button
          type="button"
          className="min-h-9 text-[13px] font-semibold text-sky-700 underline-offset-2 hover:text-sky-800 hover:underline"
          onClick={() => {
            const el = document.getElementById(
              "trip-weather-section",
            ) as HTMLDetailsElement | null;
            if (el) {
              el.open = true;
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
        >
          Voir la météo complète →
        </button>
      </div>
    </div>
  );
}
