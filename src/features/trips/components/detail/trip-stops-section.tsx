"use client";

import { Button } from "@/components/ui";
import {
  STOP_DIRECTION_LABELS,
  STOP_TYPE_LABELS,
} from "@/features/trips/constants";
import type { TripStopDto } from "@/features/trips/types";

type TripStopsSectionProps = {
  tripId: string;
  stops: TripStopDto[];
  readonly: boolean;
  geocodePending: boolean;
  deletePending: boolean;
  onGeocode: (formData: FormData) => void;
  onDelete: (formData: FormData) => void;
  /** Durées sur place des activités liées (stopId → minutes). */
  visitMinutesByStopId?: Record<string, number | null | undefined>;
};

function formatVisit(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  }
  return `${minutes} min`;
}

export function TripStopsSection({
  tripId,
  stops,
  readonly,
  geocodePending,
  deletePending,
  onGeocode,
  onDelete,
  visitMinutesByStopId = {},
}: TripStopsSectionProps) {
  return (
    <section
      className="trip-card p-5 sm:p-6"
      data-testid="trip-stops-section"
      aria-labelledby="trip-stops-title"
    >
      <h2
        id="trip-stops-title"
        className="font-heading text-sebavio-navy mb-4 text-lg font-semibold"
      >
        Étapes du trajet — {stops.length}
      </h2>

      {stops.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aucune étape utilisateur. Les arrêts de carburant calculés
          automatiquement apparaissent dans la section dédiée.
        </p>
      ) : (
        <ol className="divide-border divide-y rounded-xl border">
          {stops.map((stop) => {
            const visit = visitMinutesByStopId[stop.id];
            return (
              <li
                key={`route-stop:${stop.id}`}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sebavio-navy font-medium">
                    {stop.sequence}. {stop.name}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {STOP_TYPE_LABELS[stop.stopType] ?? stop.stopType}
                    {" · "}
                    {
                      STOP_DIRECTION_LABELS[
                        stop.direction === "return" ? "return" : "outbound"
                      ]
                    }
                    {" · "}
                    {stop.address ?? "Adresse non renseignée"}
                    {stop.latitude && stop.longitude ? "" : " · non géocodé"}
                  </p>
                  {stop.durationMinutes > 0 ? (
                    <p className="text-sebavio-navy/80 mt-1 text-sm">
                      Durée sur place : {formatVisit(stop.durationMinutes)}
                    </p>
                  ) : null}
                  {visit != null && visit > 0 ? (
                    <p className="text-sebavio-navy/80 mt-1 text-sm">
                      Temps prévu sur place (activité) : {formatVisit(visit)}
                    </p>
                  ) : null}
                  {stop.campground ? (
                    <p className="text-muted-foreground text-sm">
                      Camping :{" "}
                      {stop.campground.archived
                        ? "Camping archivé"
                        : stop.campground.name}
                    </p>
                  ) : null}
                  {stop.distanceWarning ? (
                    <p
                      className="mt-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-sm text-amber-950"
                      role="status"
                    >
                      {stop.distanceWarning}
                    </p>
                  ) : null}
                </div>
                {!readonly ? (
                  <div className="flex flex-wrap gap-1">
                    {stop.address && (!stop.latitude || !stop.longitude) ? (
                      <form action={onGeocode}>
                        <input type="hidden" name="tripId" value={tripId} />
                        <input type="hidden" name="stopId" value={stop.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="min-h-11"
                          disabled={geocodePending}
                        >
                          Géocoder
                        </Button>
                      </form>
                    ) : null}
                    <form action={onDelete}>
                      <input type="hidden" name="tripId" value={tripId} />
                      <input type="hidden" name="stopId" value={stop.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="min-h-11"
                        disabled={deletePending}
                      >
                        Retirer
                      </Button>
                    </form>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
