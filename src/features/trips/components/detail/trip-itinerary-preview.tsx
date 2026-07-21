"use client";

import { CircleDot, Fuel, MapPin, Mountain, Pause } from "lucide-react";
import type { TripDetailDto, TripStopDto } from "@/features/trips/types";
import { formatTripDuration } from "@/features/trips/lib/format-duration";
import {
  formatClockTime,
  formatPlaceLabel,
} from "@/features/trips/lib/format-place";
import { cn } from "@/lib/utils";

type TripItineraryPreviewProps = {
  trip: TripDetailDto;
};

type TimelineItem = {
  id: string;
  kind:
    | "origin"
    | "destination"
    | "activity"
    | "pause"
    | "fuel"
    | "detour"
    | "stop";
  time: string | null;
  title: string;
  subtitle?: string | null;
  durationMin?: number;
};

function classifyStop(stop: TripStopDto): TimelineItem["kind"] {
  const t = stop.stopType;
  if (t === "fuel") return "fuel";
  if (t === "rest") return "pause";
  if (t === "activity" || t === "lodging" || t === "camping") return "activity";
  if (t === "detour") return "detour";
  if (t === "origin") return "origin";
  if (t === "destination") return "destination";
  return "stop";
}

function buildTimeline(trip: TripDetailDto): TimelineItem[] {
  const outbound = trip.stops
    .filter((s) => s.direction === "outbound")
    .sort((a, b) => a.sequence - b.sequence);

  const items: TimelineItem[] = [];

  items.push({
    id: "origin",
    kind: "origin",
    time: outbound[0]?.departureTime ?? outbound[0]?.arrivalTime ?? null,
    title: "Départ",
    subtitle: formatPlaceLabel(
      trip.originCity,
      trip.originProvince,
      trip.origin,
    ),
  });

  for (const stop of outbound) {
    if (stop.stopType === "origin" || stop.stopType === "destination") continue;
    const kind = classifyStop(stop);
    items.push({
      id: stop.id,
      kind,
      time: stop.arrivalTime ?? stop.departureTime,
      title:
        kind === "fuel"
          ? "Ravitaillement"
          : kind === "pause"
            ? stop.name || "Pause"
            : stop.name,
      subtitle:
        kind === "fuel"
          ? stop.name
          : (stop.address ??
            (stop.activities[0]?.name ? stop.activities[0].name : null)),
      durationMin: stop.durationMinutes > 0 ? stop.durationMinutes : undefined,
    });
  }

  const destArrival =
    outbound.find((s) => s.stopType === "destination")?.arrivalTime ??
    outbound.at(-1)?.arrivalTime ??
    null;

  items.push({
    id: "destination",
    kind: "destination",
    time: destArrival,
    title: "Arrivée",
    subtitle: formatPlaceLabel(
      trip.destinationCity,
      trip.destinationProvince,
      trip.destination,
    ),
  });

  return items;
}

const KIND_STYLE: Record<
  TimelineItem["kind"],
  { ring: string; bg: string; Icon: typeof CircleDot }
> = {
  origin: {
    ring: "ring-emerald-200",
    bg: "bg-emerald-500 text-white",
    Icon: CircleDot,
  },
  destination: {
    ring: "ring-rose-200",
    bg: "bg-rose-500 text-white",
    Icon: MapPin,
  },
  activity: {
    ring: "ring-sky-200",
    bg: "bg-sky-500 text-white",
    Icon: Mountain,
  },
  pause: {
    ring: "ring-violet-200",
    bg: "bg-violet-500 text-white",
    Icon: Pause,
  },
  fuel: {
    ring: "ring-amber-200",
    bg: "bg-amber-500 text-white",
    Icon: Fuel,
  },
  detour: {
    ring: "ring-orange-200",
    bg: "bg-orange-500 text-white",
    Icon: CircleDot,
  },
  stop: {
    ring: "ring-slate-200",
    bg: "bg-slate-500 text-white",
    Icon: CircleDot,
  },
};

export function TripItineraryPreview({ trip }: TripItineraryPreviewProps) {
  const items = buildTimeline(trip);
  const activityCount = trip.stops.filter(
    (s) =>
      s.direction === "outbound" &&
      (s.stopType === "activity" ||
        s.stopType === "lodging" ||
        s.stopType === "camping" ||
        s.activityCount > 0),
  ).length;

  const activityBadge =
    activityCount === 0
      ? "Aucune activité"
      : activityCount === 1
        ? "1 activité"
        : `${activityCount} activités`;

  const preview = items.slice(0, 8);
  const hasOnlyEndpoints =
    items.length <= 2 ||
    items.every((i) => i.kind === "origin" || i.kind === "destination");

  return (
    <section
      className="trip-card flex h-full flex-col p-6 sm:p-7"
      data-testid="trip-itinerary-preview"
      aria-labelledby="trip-itinerary-preview-heading"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <h2
          id="trip-itinerary-preview-heading"
          className="font-heading text-sebavio-navy text-[17px] font-bold"
        >
          Itinéraire et activités
        </h2>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-[12px] font-semibold text-sky-800">
          {activityBadge}
        </span>
      </div>

      {hasOnlyEndpoints && activityCount === 0 ? (
        <p className="text-muted-foreground mt-4 text-[14px]" role="status">
          Aucune activité ajoutée pour le moment.
        </p>
      ) : null}

      <ol className="relative mt-5 flex-1 space-y-0">
        {preview.map((item, index) => {
          const style = KIND_STYLE[item.kind];
          const Icon = style.Icon;
          const isLast = index === preview.length - 1;
          return (
            <li key={item.id} className="relative flex gap-3.5 pb-6 last:pb-0">
              {!isLast ? (
                <span
                  className="absolute top-10 bottom-0 left-[19px] w-px bg-[rgb(14_45_70/0.12)]"
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "relative z-[1] flex size-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
                  style.bg,
                )}
                aria-hidden
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-muted-foreground text-[13px] font-semibold tabular-nums">
                    {formatClockTime(item.time)}
                  </p>
                  {item.durationMin != null && item.durationMin > 0 ? (
                    <span className="text-sebavio-navy rounded-md bg-sky-50 px-2.5 py-1 text-[12px] font-medium">
                      {formatTripDuration(item.durationMin)}
                    </span>
                  ) : null}
                </div>
                <p className="text-sebavio-navy mt-1 truncate text-[15px] font-semibold">
                  {item.title}
                  {item.subtitle ? (
                    <span className="text-muted-foreground font-normal">
                      {" — "}
                      {item.subtitle}
                    </span>
                  ) : null}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-auto border-t border-[rgb(14_45_70/0.06)] pt-4">
        <a
          href="#trip-itinerary-section"
          className="text-sebavio-navy hover:text-sebavio-navy/80 inline-flex min-h-11 items-center text-[14px] font-semibold underline-offset-2 hover:underline"
        >
          Voir l’itinéraire complet →
        </a>
      </div>
    </section>
  );
}
