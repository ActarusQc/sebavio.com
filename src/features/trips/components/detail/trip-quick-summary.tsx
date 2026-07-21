"use client";

import type { ComponentType } from "react";
import { CircleDollarSign, Fuel, MapPinned, Route, Timer } from "lucide-react";
import { useTripFuelEstimateContext } from "@/features/fuel/components/trip-fuel-estimate-context";
import {
  formatCost,
  formatKm,
} from "@/features/fuel/components/trip-fuel-form-shared";
import { formatTripDuration } from "@/features/trips/lib/format-duration";
import {
  formatArretsCarburantCount,
  formatDetoursCount,
  formatEtapesCount,
} from "@/features/trips/lib/stop-counts";
import { cn } from "@/lib/utils";

type TripQuickSummaryProps = {
  routeFresh: boolean;
  distanceKm: string | null;
  durationMin: number | null;
  estimatedFuelCost: string | null;
  /** Étapes utilisateur (activités / manuelles) — jamais les ravitaillements. */
  routeStopCount: number;
  activityStopCount?: number;
  detourStopCount?: number;
};

function SummaryTile({
  icon: Icon,
  label,
  value,
  highlight,
  testId,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
  highlight?: boolean;
  testId?: string;
}) {
  return (
    <div
      className={cn(
        "trip-card flex min-h-[5.5rem] items-start gap-3 p-4",
        highlight &&
          "border-2 border-[var(--sebavio-teal-border)] bg-[var(--sebavio-teal-soft)]",
      )}
      data-testid={testId}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          highlight
            ? "bg-sebavio-teal text-white"
            : "bg-sebavio-teal-soft text-sebavio-teal",
        )}
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p
          className={cn(
            "text-sebavio-navy mt-0.5 font-semibold break-words",
            highlight ? "text-xl" : "text-lg",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function TripQuickSummary({
  routeFresh,
  distanceKm,
  durationMin,
  estimatedFuelCost,
  routeStopCount,
  activityStopCount = 0,
  detourStopCount = 0,
}: TripQuickSummaryProps) {
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

  const etapesLabel =
    routeStopCount > 0
      ? `${formatEtapesCount(routeStopCount)} (${formatDetoursCount(detourStopCount)}${
          activityStopCount > 0 ? `, ${activityStopCount} act.` : ""
        })`
      : formatEtapesCount(0);

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
    // Plan obsolète ou échec : ne pas afficher un compteur comme s'il était valide.
    fuelLabel = "Recalcul requis";
  } else if (!estimate || !calc) {
    fuelLabel = "—";
  } else if (!calc.feasible) {
    fuelLabel = "Recalcul requis";
  } else {
    fuelLabel = formatArretsCarburantCount(fuelStopCount);
  }

  const costLabel =
    calc && estimate && !pending
      ? `${formatCost(calc.moneySpent)} CAD`
      : estimatedFuelCost != null
        ? `${formatCost(estimatedFuelCost)} CAD`
        : "—";

  return (
    <section
      className="grid grid-cols-2 gap-3 lg:grid-cols-5"
      data-testid="trip-quick-summary"
      aria-label="Résumé du voyage"
    >
      <SummaryTile icon={Route} label="Distance totale" value={distanceLabel} />
      <SummaryTile icon={Timer} label="Durée estimée" value={durationLabel} />
      <SummaryTile
        icon={MapPinned}
        label="Étapes prévues"
        value={etapesLabel}
        testId="summary-route-stops"
      />
      <SummaryTile
        icon={Fuel}
        label="Arrêts carburant"
        value={fuelLabel}
        highlight
        testId="summary-fuel-stops"
      />
      <SummaryTile
        icon={CircleDollarSign}
        label="Coût estimé"
        value={costLabel}
      />
    </section>
  );
}
