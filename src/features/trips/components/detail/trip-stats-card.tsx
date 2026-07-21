"use client";

import type { ComponentType, ReactNode } from "react";
import { Clock, Fuel, MapPinned, Route, Timer } from "lucide-react";
import { useTripFuelEstimateContext } from "@/features/fuel/components/trip-fuel-estimate-context";
import { formatKm } from "@/features/fuel/components/trip-fuel-form-shared";
import { formatTripDuration } from "@/features/trips/lib/format-duration";
import { formatArretsCarburantCount } from "@/features/trips/lib/stop-counts";
import { formatClockTime } from "@/features/trips/lib/format-place";
import { cn } from "@/lib/utils";

type TripStatsCardProps = {
  routeFresh: boolean;
  distanceKm: string | null;
  durationMin: number | null;
  estimatedArrival: string | null;
  activityCount: number;
  pauseCount: number;
};

function StatRow({
  icon: Icon,
  label,
  value,
  testId,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
  testId?: string;
}) {
  return (
    <div
      className="flex items-start gap-3.5 border-b border-[rgb(14_45_70/0.06)] py-4 last:border-b-0"
      data-testid={testId}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700"
        aria-hidden
      >
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
        <p className="text-sebavio-navy mt-1 text-[22px] leading-tight font-bold tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

export function TripStatsCard({
  routeFresh,
  distanceKm,
  durationMin,
  estimatedArrival,
  activityCount,
  pauseCount,
}: TripStatsCardProps) {
  const { calc, form, estimate, pending, error } = useTripFuelEstimateContext();

  const distanceLabel =
    routeFresh && distanceKm
      ? `${formatKm(
          calc?.totalDistanceKm &&
            (calc.includeReturnTrip || form.includeReturnTrip)
            ? calc.totalDistanceKm
            : distanceKm,
        )} km`
      : "—";

  const durationLabel = routeFresh ? formatTripDuration(durationMin) : "—";

  const outbound = calc?.outbound?.refuelStops?.length ?? 0;
  const inbound =
    calc?.includeReturnTrip || form.includeReturnTrip
      ? (calc?.returnLeg?.refuelStops?.length ?? 0)
      : 0;
  const fuelStopCount = outbound + inbound;

  let fuelLabel: string;
  if (!routeFresh) {
    fuelLabel = "Recalcul requis";
  } else if (pending && !estimate) {
    fuelLabel = "Calcul en cours…";
  } else if (error) {
    fuelLabel = "Recalcul requis";
  } else if (!estimate || !calc) {
    fuelLabel = "—";
  } else if (!calc.feasible) {
    fuelLabel = "Recalcul requis";
  } else {
    fuelLabel = formatArretsCarburantCount(fuelStopCount);
  }

  const arrivalLabel =
    estimatedArrival != null ? formatClockTime(estimatedArrival) : "—";

  return (
    <section
      className="trip-card flex h-full flex-col p-6 sm:p-7"
      data-testid="trip-stats-card"
      aria-labelledby="trip-stats-heading"
    >
      <h2
        id="trip-stats-heading"
        className="font-heading text-sebavio-navy text-[17px] font-bold"
      >
        Détails du voyage
      </h2>

      <div className="mt-1 flex-1">
        <StatRow icon={Route} label="Distance totale" value={distanceLabel} />
        <StatRow icon={Timer} label="Durée de conduite" value={durationLabel} />
        <StatRow
          icon={Fuel}
          label="Arrêts carburant"
          value={fuelLabel}
          testId="summary-fuel-stops"
        />
        <StatRow
          icon={Clock}
          label="Arrivée estimée"
          value={arrivalLabel}
          testId="summary-arrival"
        />
        {activityCount > 0 || pauseCount > 0 ? (
          <StatRow
            icon={MapPinned}
            label="Activités / pauses"
            value={`${activityCount} act. · ${pauseCount} pause${pauseCount !== 1 ? "s" : ""}`}
          />
        ) : null}
      </div>

      <div className="mt-auto border-t border-[rgb(14_45_70/0.06)] pt-4">
        <a
          href="#trip-overview-section"
          className="text-sebavio-navy hover:text-sebavio-navy/80 inline-flex min-h-11 items-center text-[14px] font-semibold underline-offset-2 hover:underline"
        >
          Voir tous les détails →
        </a>
      </div>
    </section>
  );
}

export function TripStatsSkeleton(): ReactNode {
  return (
    <div className="trip-card h-full animate-pulse p-5" aria-hidden>
      <div className="bg-muted mb-4 h-5 w-40 rounded" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cn("flex gap-3 py-3", i < 3 && "border-b")}>
          <div className="bg-muted size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-3 w-24 rounded" />
            <div className="bg-muted h-4 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
