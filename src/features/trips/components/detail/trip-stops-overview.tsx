"use client";

import { Fuel, MapPin } from "lucide-react";
import { Button } from "@/components/ui";
import { useTripFuelEstimateContext } from "@/features/fuel/components/trip-fuel-estimate-context";
import type { FuelFillStopDto } from "@/features/fuel/types";
import type { FuelMapMarkerFocus } from "@/features/fuel/components/fuel-stops-list";

function formatKm(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString("fr-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function hasStationName(stop: FuelFillStopDto): boolean {
  return Boolean(stop.station?.name?.trim());
}

function stopTitle(stop: FuelFillStopDto): string {
  if (hasStationName(stop)) return stop.station!.name!.trim();
  const city = stop.station?.city?.trim();
  if (city) return `Près de ${city}`;
  return "Arrêt le long de l'itinéraire";
}

function parseCoord(raw: string | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function focusStop(
  stop: FuelFillStopDto,
  onFocusStop?: (focus: FuelMapMarkerFocus | null) => void,
) {
  const lat = parseCoord(stop.station?.latitude);
  const lng = parseCoord(stop.station?.longitude);
  document
    .getElementById("trip-map-section")
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
  if (lat != null && lng != null) {
    onFocusStop?.({ id: stop.id, latitude: lat, longitude: lng });
  }
}

function StopSummaryCard({
  stop,
  index,
  previousDistanceKm,
  onFocusStop,
}: {
  stop: FuelFillStopDto;
  index: number;
  previousDistanceKm: number | null;
  onFocusStop?: (focus: FuelMapMarkerFocus | null) => void;
}) {
  const fromStart = Number(stop.distanceFromStartKm);
  const delta =
    previousDistanceKm != null && Number.isFinite(fromStart)
      ? fromStart - previousDistanceKm
      : null;
  const lat = parseCoord(stop.station?.latitude);
  const lng = parseCoord(stop.station?.longitude);
  const canMap = lat != null && lng != null;
  const legLabel = stop.leg === "return" ? "Retour" : "Aller";

  return (
    <article
      className="trip-card flex flex-col gap-3 p-4"
      data-testid={`fuel-stop-overview-${stop.id}`}
    >
      <div className="flex items-start gap-3">
        <span
          className="bg-sebavio-teal flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          aria-hidden
        >
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sebavio-navy text-base font-semibold break-words">
              {stopTitle(stop)}
            </p>
            <span className="bg-sebavio-teal-soft text-sebavio-teal rounded-full px-2 py-0.5 text-[11px] font-medium">
              {legLabel}
            </span>
            {stop.isEstimatedLocation && hasStationName(stop) ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                Localisation estimée
              </span>
            ) : null}
          </div>
          {stop.station?.city ? (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {stop.station.city}
            </p>
          ) : null}
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {delta != null && delta > 0 && previousDistanceKm != null
              ? `À environ ${formatKm(String(delta))} km du précédent arrêt`
              : `À environ ${formatKm(stop.distanceFromStartKm)} km du départ`}
          </p>
        </div>
      </div>
      {canMap ? (
        <Button
          type="button"
          variant="outline"
          className="border-sebavio-navy/20 text-sebavio-navy min-h-11 w-full"
          onClick={() => focusStop(stop, onFocusStop)}
        >
          Voir sur la carte
        </Button>
      ) : null}
    </article>
  );
}

export function TripStopsOverview() {
  const {
    calc,
    form,
    estimate,
    pending,
    canCalculate,
    error,
    onFocusFuelStop,
  } = useTripFuelEstimateContext();

  if (!canCalculate) return null;

  if (pending && !estimate) {
    return (
      <section className="trip-card p-5" data-testid="trip-stops-overview">
        <h2 className="font-heading text-sebavio-navy text-lg font-semibold">
          Arrêts de carburant
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">Calcul en cours…</p>
      </section>
    );
  }

  if (error && !calc) {
    return (
      <section className="trip-card p-5" data-testid="trip-stops-overview">
        <h2 className="font-heading text-sebavio-navy text-lg font-semibold">
          Arrêts de carburant
        </h2>
        <p className="text-destructive mt-2 text-sm" role="alert">
          Le plan de carburant n&apos;a pas pu être recalculé. {error}
        </p>
      </section>
    );
  }

  if (error && calc?.feasible) {
    // Plan précédent conservé (stale) — affiché avec avertissement non bloquant.
    const outboundStale = calc.outbound?.refuelStops ?? [];
    const inboundStale =
      calc.includeReturnTrip || form.includeReturnTrip
        ? (calc.returnLeg?.refuelStops ?? [])
        : [];
    const allStale = [
      ...outboundStale.map((s) => ({ stop: s, leg: "outbound" as const })),
      ...inboundStale.map((s) => ({ stop: s, leg: "return" as const })),
    ];
    return (
      <section
        className="trip-card space-y-4 p-5 sm:p-6"
        data-testid="trip-stops-overview"
      >
        <h2 className="font-heading text-sebavio-navy text-lg font-semibold">
          Arrêts de carburant
          <span className="text-sebavio-teal ml-2 font-bold">
            — {allStale.length}
          </span>
        </h2>
        <p
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="status"
        >
          Le plan de carburant n&apos;a pas pu être recalculé. Les arrêts
          affichés correspondent à l&apos;itinéraire précédent.
        </p>
        {allStale.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun arrêt de carburant nécessaire pour ce trajet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {allStale.map(({ stop }, i) => {
              const prev =
                i > 0
                  ? Number(allStale[i - 1]!.stop.distanceFromStartKm)
                  : null;
              const sameLeg = i > 0 && allStale[i - 1]!.stop.leg === stop.leg;
              return (
                <StopSummaryCard
                  key={`fuel:${stop.id}`}
                  stop={stop}
                  index={i + 1}
                  previousDistanceKm={sameLeg ? prev : null}
                  onFocusStop={onFocusFuelStop}
                />
              );
            })}
          </div>
        )}
      </section>
    );
  }

  if (!calc?.feasible) {
    return (
      <section className="trip-card p-5" data-testid="trip-stops-overview">
        <h2 className="font-heading text-sebavio-navy text-lg font-semibold">
          Arrêts de carburant
        </h2>
        <p className="text-destructive mt-2 text-sm">
          {calc?.failureMessage ??
            error ??
            "Le plan de carburant n'a pas pu être recalculé."}
        </p>
      </section>
    );
  }

  const outbound = calc.outbound?.refuelStops ?? [];
  const inbound =
    calc.includeReturnTrip || form.includeReturnTrip
      ? (calc.returnLeg?.refuelStops ?? [])
      : [];
  const all = [
    ...outbound.map((s) => ({ stop: s, leg: "outbound" as const })),
    ...inbound.map((s) => ({ stop: s, leg: "return" as const })),
  ];
  const total = all.length;

  return (
    <section
      className="trip-card space-y-4 p-5 sm:p-6"
      data-testid="trip-stops-overview"
      aria-labelledby="trip-stops-overview-title"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className="bg-sebavio-teal-soft text-sebavio-teal flex size-10 items-center justify-center rounded-full"
          aria-hidden
        >
          <Fuel className="size-5" />
        </span>
        <h2
          id="trip-stops-overview-title"
          className="font-heading text-sebavio-navy text-lg font-semibold"
        >
          Arrêts de carburant
          <span className="text-sebavio-teal ml-2 font-bold">— {total}</span>
        </h2>
      </div>

      {total === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aucun arrêt de carburant nécessaire pour ce trajet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {all.map(({ stop }, i) => {
            const prev =
              i > 0 ? Number(all[i - 1]!.stop.distanceFromStartKm) : null;
            // Distance « précédent » uniquement sur la même jambe
            const sameLeg = i > 0 && all[i - 1]!.stop.leg === stop.leg;
            return (
              <StopSummaryCard
                key={`fuel:${stop.id}`}
                stop={stop}
                index={i + 1}
                previousDistanceKm={sameLeg ? prev : null}
                onFocusStop={onFocusFuelStop}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
