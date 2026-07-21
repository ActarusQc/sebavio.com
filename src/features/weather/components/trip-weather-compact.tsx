"use client";

import { useEffect, useMemo, useState } from "react";
import { CloudOff, MapPin, Navigation } from "lucide-react";
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
      className="grid animate-pulse gap-3 px-5 pt-2 pb-5 sm:grid-cols-2 sm:gap-4"
      aria-busy="true"
      data-testid="trip-weather-compact-loading"
    >
      {[0, 1].map((block) => (
        <div
          key={block}
          className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3.5"
        >
          <div className="bg-muted h-3.5 w-28 rounded" />
          <div className="bg-muted h-3 w-36 rounded" />
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-muted h-[6.25rem] min-w-0 flex-1 rounded-xl"
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
      className={cn(
        "overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.07)]",
        className,
      )}
      data-testid="trip-weather-compact"
      aria-labelledby="trip-weather-compact-heading"
    >
      <header className="px-5 pt-5 pb-1 sm:px-6 sm:pt-5">
        <h2
          id="trip-weather-compact-heading"
          className="font-heading text-sebavio-navy text-[16px] font-bold sm:text-[17px]"
        >
          Météo du voyage
        </h2>
        <p
          className="text-muted-foreground mt-0.5 text-[12px] leading-snug sm:text-[13px]"
          data-testid="trip-weather-compact-subtitle"
        >
          {state.kind === "ready" &&
          state.data.locations.some((l) => l.type === "live")
            ? "Prévisions à votre position actuelle et à l’arrivée"
            : "Prévisions au départ et à l’arrivée"}
        </p>
      </header>

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
      <div className="grid gap-3 px-4 pt-3 pb-4 sm:gap-4 sm:px-5 sm:pt-3.5 sm:pb-4 lg:grid-cols-2">
        <WeatherPanel block={departure} todayIso={todayIso} />
        <WeatherPanel block={arrival} todayIso={todayIso} />
      </div>

      <div className="flex items-center justify-end border-t border-slate-200/70 px-5 py-2.5 sm:px-6">
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

function panelMeta(block: WeatherDayBlock) {
  if (block.kind === "arrival") {
    return {
      eyebrow: "À l’arrivée",
      panelClass:
        "border-amber-200/70 bg-gradient-to-b from-amber-50/80 to-white",
      badgeClass: "bg-amber-100/90 text-amber-900",
      Icon: MapPin,
      iconClass: "text-amber-700",
      dayCellClass: "border-amber-100/90 bg-white/90",
    };
  }
  if (block.kind === "live") {
    return {
      eyebrow: "Position actuelle",
      panelClass: "border-sky-200/70 bg-gradient-to-b from-sky-50/90 to-white",
      badgeClass: "bg-sky-100/90 text-sky-900",
      Icon: Navigation,
      iconClass: "text-sky-700",
      dayCellClass: "border-sky-100/90 bg-white/90",
    };
  }
  return {
    eyebrow: "Au départ",
    panelClass: "border-sky-200/70 bg-gradient-to-b from-sky-50/80 to-white",
    badgeClass: "bg-sky-100/90 text-sky-900",
    Icon: MapPin,
    iconClass: "text-sky-700",
    dayCellClass: "border-sky-100/90 bg-white/90",
  };
}

function WeatherPanel({
  block,
  todayIso,
}: {
  block: WeatherDayBlock;
  todayIso: string;
}) {
  const meta = panelMeta(block);
  const Icon = meta.Icon;
  const testId =
    block.kind === "live"
      ? "live"
      : block.kind === "arrival"
        ? "arrival"
        : "departure";

  return (
    <div
      className={cn("min-w-0 rounded-2xl border p-3.5 sm:p-4", meta.panelClass)}
      data-testid={`trip-weather-block-${testId}`}
    >
      <div className="mb-3 flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full",
            meta.badgeClass,
          )}
          aria-hidden
        >
          <Icon className={cn("size-3.5", meta.iconClass)} />
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "text-[11px] font-bold tracking-[0.06em] uppercase sm:text-[12px]",
              block.kind === "arrival"
                ? "text-amber-900/90"
                : "text-sky-900/90",
            )}
          >
            {meta.eyebrow}
          </p>
          {block.placeLabel && block.placeLabel !== "—" ? (
            <p className="text-sebavio-navy mt-0.5 truncate text-[13px] leading-snug font-semibold sm:text-[14px]">
              {block.placeLabel}
            </p>
          ) : null}
        </div>
      </div>

      {block.days.length > 0 ? (
        <ul
          className="flex gap-2 overflow-x-auto pb-0.5 sm:overflow-visible"
          role="list"
          aria-label={`${meta.eyebrow} — prévisions sur 3 jours`}
        >
          {block.days.map((day) => (
            <DayCell
              key={day.date}
              day={day}
              todayIso={todayIso}
              cellClassName={meta.dayCellClass}
            />
          ))}
        </ul>
      ) : (
        <p
          className="text-muted-foreground rounded-xl border border-dashed border-slate-200/90 bg-white/70 px-3 py-3.5 text-[12px] leading-relaxed sm:text-[13px]"
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
  cellClassName,
}: {
  day: WeatherDailyForecast;
  todayIso: string;
  cellClassName?: string;
}) {
  return (
    <li
      className={cn(
        "flex min-w-[5.5rem] flex-1 flex-col items-center rounded-xl border px-2 py-2 text-center sm:min-w-0 sm:px-2 sm:py-2.5",
        cellClassName,
      )}
      data-testid="trip-weather-day-cell"
    >
      <span className="text-sebavio-navy/80 text-[10px] font-semibold tracking-wide sm:text-[11px]">
        {formatWeatherDayHeading(day.date, todayIso)}
      </span>
      <WeatherConditionIcon
        iconId={day.condition.iconId}
        code={day.condition.code}
        description={day.condition.description}
        size={34}
        preferDay
        className="my-0.5 size-[30px] sm:size-[34px] [&_svg]:size-full"
      />
      <span className="text-sebavio-navy text-[15px] leading-none font-bold tabular-nums sm:text-[16px]">
        {Math.round(day.tempMaxC)}°
        <span className="text-muted-foreground ml-1 text-[11px] font-medium sm:text-[12px]">
          {Math.round(day.tempMinC)}°
        </span>
      </span>
      <span className="text-muted-foreground mt-0.5 line-clamp-1 max-w-full text-[10px] leading-tight sm:text-[11px]">
        {day.condition.description}
      </span>
    </li>
  );
}
