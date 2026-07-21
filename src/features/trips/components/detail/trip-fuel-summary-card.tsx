"use client";

import { Fuel } from "lucide-react";
import { useTripFuelEstimateContext } from "@/features/fuel/components/trip-fuel-estimate-context";
import {
  formatCost,
  formatLiters,
} from "@/features/fuel/components/trip-fuel-form-shared";
import { Button } from "@/components/ui";

type TripFuelSummaryCardProps = {
  hasVehicle: boolean;
  fuelEstimateStale: boolean;
};

export function TripFuelSummaryCard({
  hasVehicle,
  fuelEstimateStale,
}: TripFuelSummaryCardProps) {
  const {
    calc,
    estimate,
    pending,
    error,
    recalculate,
    form,
    hasVehicle: ctxHasVehicle,
  } = useTripFuelEstimateContext();

  const vehicleOk = hasVehicle && ctxHasVehicle;
  const outbound = calc?.outbound?.refuelStops ?? [];
  const inbound =
    calc?.includeReturnTrip || form.includeReturnTrip
      ? (calc?.returnLeg?.refuelStops ?? [])
      : [];
  const stops = [...outbound, ...inbound];
  const stopCount = stops.length;

  const liters = calc?.totalLitersConsumed ?? estimate?.litersNeeded ?? null;
  const cost = calc?.moneySpent ?? estimate?.estimatedCost ?? null;
  const pricePerL = estimate?.pricePerLiter ?? null;

  return (
    <section
      className="trip-card flex h-full flex-col p-6 sm:p-7"
      data-testid="trip-fuel-summary-card"
      aria-labelledby="trip-fuel-summary-heading"
    >
      <h2
        id="trip-fuel-summary-heading"
        className="font-heading text-sebavio-navy text-[17px] font-bold"
      >
        Estimation carburant
      </h2>

      {!vehicleOk ? (
        <p className="text-muted-foreground mt-4 text-[14px]" role="status">
          Ajoutez un véhicule pour obtenir une estimation de carburant.
        </p>
      ) : null}

      {vehicleOk && (fuelEstimateStale || error) ? (
        <div
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-[14px] text-amber-950"
          role="status"
        >
          <p className="font-semibold">Estimation carburant à actualiser</p>
          <p className="mt-1 text-amber-900/90">
            L’itinéraire a été mis à jour, mais Sebavio n’a pas pu recalculer
            immédiatement les arrêts de carburant.
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            disabled={pending}
            onClick={() => recalculate()}
          >
            {pending ? "Calcul…" : "Réessayer le calcul"}
          </Button>
        </div>
      ) : null}

      {vehicleOk && !error && !fuelEstimateStale ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3.5">
            <div className="rounded-xl border border-[rgb(14_45_70/0.06)] bg-[#f3f6f9] px-4 py-4">
              <p className="text-muted-foreground text-[13px] font-medium">
                Consommation estimée
              </p>
              <p className="text-sebavio-navy mt-1.5 text-[22px] leading-none font-bold tabular-nums">
                {pending && !liters
                  ? "…"
                  : liters
                    ? `${formatLiters(liters)} L`
                    : "—"}
              </p>
              {cost ? (
                <p className="text-muted-foreground mt-1.5 text-[12px]">
                  ≈ {formatCost(cost)} $
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-[rgb(14_45_70/0.06)] bg-[#f3f6f9] px-4 py-4">
              <p className="text-muted-foreground text-[13px] font-medium">
                Coût estimé
              </p>
              <p className="text-sebavio-navy mt-1.5 text-[22px] leading-none font-bold tabular-nums">
                {pending && !cost ? "…" : cost ? `${formatCost(cost)} $` : "—"}
              </p>
              {pricePerL ? (
                <p className="text-muted-foreground mt-1.5 text-[12px]">
                  {formatCost(pricePerL)} $ / L en moyenne
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex-1">
            {calc && calc.feasible && stopCount === 0 ? (
              <p className="text-muted-foreground text-sm" role="status">
                Aucun arrêt de carburant requis selon l’estimation actuelle.
              </p>
            ) : null}

            {stopCount > 0 ? (
              <>
                <p className="text-sebavio-navy text-sm font-semibold">
                  {stopCount} arrêt{stopCount > 1 ? "s" : ""} carburant planifié
                  {stopCount > 1 ? "s" : ""}
                </p>
                <ol className="mt-3 space-y-3">
                  {stops.slice(0, 5).map((stop, i) => (
                    <li
                      key={`${stop.kind}-${stop.distanceFromStartKm}-${i}`}
                      className="flex items-center justify-between gap-2 text-[14px]"
                    >
                      <span className="text-sebavio-navy flex min-w-0 items-center gap-2">
                        <Fuel
                          className="size-3.5 shrink-0 text-amber-600"
                          aria-hidden
                        />
                        <span className="truncate">
                          {i + 1}.{" "}
                          {stop.station?.city ??
                            stop.station?.name ??
                            stop.regionLabel ??
                            stop.positionLabel ??
                            (stop.isEstimatedLocation
                              ? "Emplacement approximatif"
                              : "Arrêt")}
                        </span>
                      </span>
                      <span className="text-muted-foreground shrink-0 tabular-nums">
                        ≈ {formatLiters(stop.litersAdded)} L
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            ) : null}

            {pending && !calc ? (
              <p className="text-muted-foreground text-sm">Calcul en cours…</p>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="mt-auto border-t border-[rgb(14_45_70/0.06)] pt-4">
        <a
          href="#trip-fuel-section"
          className="text-sebavio-navy hover:text-sebavio-navy/80 inline-flex min-h-11 items-center text-[14px] font-semibold underline-offset-2 hover:underline"
        >
          Voir le détail carburant →
        </a>
      </div>
    </section>
  );
}
