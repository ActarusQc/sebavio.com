"use client";

import { useEffect, useMemo, useState } from "react";
import { CloudOff, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeatherConditionIcon } from "@/features/weather/components/weather-condition-icon";
import {
  buildDualWeatherBlocks,
  formatWeatherDayHeading,
  type WeatherDayBlock,
} from "@/features/weather/lib/dual-blocks";
import type { TripWeatherResponse } from "@/features/weather/types";
import type { WeatherDailyForecast } from "@/services/weather/types";

type Props = {
  tripId: string;
  liveLatitude?: number | null;
  liveLongitude?: number | null;
  originLabel?: string | null;
  destinationLabel?: string | null;
  className?: string;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; data: TripWeatherResponse }
  | { kind: "error"; message: string };

function CompactSkeleton() {
  return (
    <div
      className="grid animate-pulse gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5"
      aria-busy="true"
      data-testid="trip-weather-compact-loading"
    >
      {[0, 1].map((block) => (
        <div key={block} className="space-y-3">
          <div className="bg-muted h-4 w-28 rounded" />
          <div className="bg-muted h-3 w-40 rounded" />
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-muted h-[6.5rem] min-w-0 flex-1 rounded-xl"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TripWeatherCompact({
  tripId,
  liveLatitude = null,
  liveLongitude = null,
  originLabel = null,
  destinationLabel = null,
  className,
}: Props) {
  return (
    <TripWeatherCompactInner
      key={`${tripId}:${liveLatitude ?? ""}:${liveLongitude ?? ""}`}
      tripId={tripId}
      liveLatitude={liveLatitude}
      liveLongitude={liveLongitude}
      originLabel={originLabel}
      destinationLabel={destinationLabel}
      className={className}
    />
  );
}

function TripWeatherCompactInner({
  tripId,
  liveLatitude,
  liveLongitude,
  originLabel,
  destinationLabel,
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
      <div className="flex items-center justify-between gap-3 border-b border-[rgb(14_45_70/0.06)] px-4 py-3 sm:px-5">
        <h2
          id="trip-weather-compact-heading"
          className="font-heading text-sebavio-navy text-[15px] font-bold sm:text-[16px]"
        >
          Météo du voyage
        </h2>
      </div>

      {state.kind === "loading" ? <CompactSkeleton /> : null}

      {state.kind === "error" ? (
        <p
          className="text-muted-foreground flex items-center gap-2 px-5 py-4 text-sm"
          role="alert"
        >
          <CloudOff className="size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : null}

      {state.kind === "ready" ? (
        <CompactBody
          data={state.data}
          originLabel={originLabel}
          destinationLabel={destinationLabel}
        />
      ) : null}
    </section>
  );
}

function CompactBody({
  data,
  originLabel,
  destinationLabel,
}: {
  data: TripWeatherResponse;
  originLabel?: string | null;
  destinationLabel?: string | null;
}) {
  const { departure, arrival, todayIso } = useMemo(
    () =>
      buildDualWeatherBlocks({
        response: data,
        originLabel,
        destinationLabel,
      }),
    [data, originLabel, destinationLabel],
  );

  const bothEmpty = departure.days.length === 0 && arrival.days.length === 0;

  if (
    bothEmpty &&
    (data.status === "disabled" ||
      data.status === "no_coordinates" ||
      data.status === "too_early")
  ) {
    return (
      <p className="text-muted-foreground px-5 py-4 text-sm" role="status">
        {data.message ??
          "Les prévisions seront disponibles à l’approche du voyage."}
      </p>
    );
  }

  if (
    bothEmpty &&
    (data.status === "temporarily_unavailable" ||
      data.status === "provider_limit_reached")
  ) {
    return (
      <p
        className="text-muted-foreground flex items-center gap-2 px-5 py-4 text-sm"
        role="status"
      >
        <CloudOff className="size-4 shrink-0" aria-hidden />
        {data.message ?? "Données météo temporairement indisponibles."}
      </p>
    );
  }

  if (bothEmpty) {
    return (
      <p className="text-muted-foreground px-5 py-4 text-sm" role="status">
        Les prévisions seront disponibles à l’approche du voyage.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="grid gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-4 lg:grid-cols-2 lg:gap-6">
        <WeatherGroup block={departure} todayIso={todayIso} />
        <WeatherGroup block={arrival} todayIso={todayIso} />
      </div>

      <div className="flex items-center justify-end border-t border-[rgb(14_45_70/0.06)] px-4 py-2 sm:px-5">
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

function WeatherGroup({
  block,
  todayIso,
}: {
  block: WeatherDayBlock;
  todayIso: string;
}) {
  return (
    <div
      className="min-w-0"
      data-testid={`trip-weather-block-${block.kind === "live" ? "live" : block.kind === "arrival" ? "arrival" : "departure"}`}
    >
      <div className="mb-2.5 flex items-start gap-2">
        <MapPin
          className="text-sebavio-navy/55 mt-0.5 size-3.5 shrink-0"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sebavio-navy text-[13px] font-bold sm:text-[14px]">
            {block.title}
          </p>
          {block.placeLabel && block.placeLabel !== "—" ? (
            <p className="text-muted-foreground truncate text-[12px] leading-snug">
              {block.placeLabel}
            </p>
          ) : null}
        </div>
      </div>

      {block.days.length > 0 ? (
        <ul
          className="flex gap-2 overflow-x-auto pb-0.5 sm:overflow-visible"
          role="list"
          aria-label={`${block.title} — prévisions sur 3 jours`}
        >
          {block.days.map((day) => (
            <DayCell key={day.date} day={day} todayIso={todayIso} />
          ))}
        </ul>
      ) : (
        <p
          className="text-muted-foreground rounded-xl border border-dashed border-[rgb(14_45_70/0.12)] bg-[rgb(248_250_252)] px-3 py-4 text-[12px] leading-relaxed sm:text-[13px]"
          role="status"
        >
          {block.emptyMessage}
        </p>
      )}
    </div>
  );
}

function DayCell({
  day,
  todayIso,
}: {
  day: WeatherDailyForecast;
  todayIso: string;
}) {
  return (
    <li
      className="flex min-w-[5.75rem] flex-1 flex-col items-center rounded-xl border border-[rgb(14_45_70/0.07)] bg-[rgb(248_250_252)] px-2 py-2.5 text-center sm:min-w-0 sm:px-2.5 sm:py-3"
      data-testid="trip-weather-day-cell"
    >
      <span className="text-sebavio-navy text-[11px] font-semibold tracking-wide sm:text-[12px]">
        {formatWeatherDayHeading(day.date, todayIso)}
      </span>
      <WeatherConditionIcon
        iconId={day.condition.iconId}
        code={day.condition.code}
        description={day.condition.description}
        size={36}
        preferDay
        className="my-1 size-[32px] sm:size-[36px] [&_svg]:size-full"
      />
      <span className="text-sebavio-navy text-[16px] leading-none font-bold tabular-nums sm:text-[17px]">
        {Math.round(day.tempMaxC)}°
        <span className="text-muted-foreground ml-1 text-[12px] font-medium">
          {Math.round(day.tempMinC)}°
        </span>
      </span>
      <span className="text-muted-foreground mt-1 line-clamp-1 max-w-full text-[11px] leading-tight sm:text-[12px]">
        {day.condition.description}
      </span>
    </li>
  );
}
