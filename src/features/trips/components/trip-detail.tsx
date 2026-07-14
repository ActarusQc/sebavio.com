"use client";

import dynamic from "next/dynamic";
import { useActionState } from "react";
import {
  addStopAction,
  cancelTripAction,
  completeTripAction,
  deleteStopAction,
  geocodeStopAction,
  optimizeTripAction,
  startTripAction,
  type TripsActionResult,
} from "@/features/trips/actions";
import { STOP_TYPES, TRIP_STATUS_LABELS } from "@/features/trips/constants";
import type { TripDetailDto } from "@/features/trips/types";
import { FormField } from "@/components/common";
import { Badge, Button, Input } from "@/components/ui";
import { TripFuelEstimatePanel } from "@/features/fuel/components";
import { TripWeatherPanel } from "@/features/weather/components";
import type { TripWeatherDto } from "@/features/weather/types";

const TripMap = dynamic(
  () => import("@/features/maps").then((m) => m.TripMap),
  {
    ssr: false,
    loading: () => (
      <p className="text-muted-foreground text-sm">Chargement de la carte…</p>
    ),
  },
);

const initial: TripsActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type TripDetailPanelsProps = {
  trip: TripDetailDto;
  weather?: TripWeatherDto | null;
};

export function TripDetailPanels({
  trip,
  weather = null,
}: TripDetailPanelsProps) {
  const readonly = trip.status === "completed" || trip.status === "cancelled";
  const [startState, startAction, startPending] = useActionState(
    startTripAction,
    initial,
  );
  const [completeState, completeAction, completePending] = useActionState(
    completeTripAction,
    initial,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelTripAction,
    initial,
  );
  const [addState, addAction, addPending] = useActionState(
    addStopAction,
    initial,
  );
  const [delState, delAction, delPending] = useActionState(
    deleteStopAction,
    initial,
  );
  const [geocodeState, geocodeAction, geocodePending] = useActionState(
    geocodeStopAction,
    initial,
  );
  const [optimizeState, optimizeAction, optimizePending] = useActionState(
    optimizeTripAction,
    initial,
  );

  const feedback =
    (startState?.ok === false && startState.message) ||
    (completeState?.ok === false && completeState.message) ||
    (cancelState?.ok === false && cancelState.message) ||
    (addState?.ok === false && addState.message) ||
    (delState?.ok === false && delState.message) ||
    (geocodeState?.ok === false && geocodeState.message) ||
    (optimizeState?.ok === false && optimizeState.message) ||
    null;

  const success =
    (startState?.ok && startState.message) ||
    (completeState?.ok && completeState.message) ||
    (cancelState?.ok && cancelState.message) ||
    (addState?.ok && addState.message) ||
    (delState?.ok && delState.message) ||
    (geocodeState?.ok && geocodeState.message) ||
    (optimizeState?.ok && optimizeState.message) ||
    null;

  const routeFresh = trip.route && !trip.route.isStale;
  const routeStale = Boolean(trip.route?.isStale);

  return (
    <div className="flex flex-col gap-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{trip.title}</h2>
          <Badge variant="secondary">{TRIP_STATUS_LABELS[trip.status]}</Badge>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Itinéraire</dt>
            <dd>
              {trip.origin} → {trip.destination}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Véhicule</dt>
            <dd>{trip.vehicle?.displayName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Groupe</dt>
            <dd>
              {trip.travelGroup
                ? trip.travelGroup.archived
                  ? "Groupe archivé"
                  : trip.travelGroup.name
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Départ</dt>
            <dd>{new Date(trip.departureDate).toLocaleDateString("fr-CA")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Retour</dt>
            <dd>
              {trip.returnDate
                ? new Date(trip.returnDate).toLocaleDateString("fr-CA")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Budget prévu</dt>
            <dd>{trip.plannedBudget ? `${trip.plannedBudget} CAD` : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Distance estimée</dt>
            <dd>
              {routeFresh && trip.route?.distanceKm
                ? `${trip.route.distanceKm} km`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Durée estimée</dt>
            <dd>
              {routeFresh && trip.route?.estimatedDurationMin != null
                ? `${trip.route.estimatedDurationMin} min`
                : "—"}
            </dd>
          </div>
        </dl>

        {!readonly ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {trip.status === "planned" ? (
              <form action={startAction}>
                <input type="hidden" name="id" value={trip.id} />
                <Button type="submit" disabled={startPending}>
                  Démarrer
                </Button>
              </form>
            ) : null}
            {trip.status === "planned" || trip.status === "in_progress" ? (
              <>
                <form action={completeAction}>
                  <input type="hidden" name="id" value={trip.id} />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={completePending}
                  >
                    Clôturer
                  </Button>
                </form>
                <form action={cancelAction}>
                  <input type="hidden" name="id" value={trip.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    disabled={cancelPending}
                  >
                    Annuler le voyage
                  </Button>
                </form>
              </>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {trip.status === "cancelled"
              ? "Voyage annulé — consultation uniquement (suppression toujours possible)."
              : "Voyage terminé — consultation uniquement."}
          </p>
        )}
      </section>

      {(feedback || success) && (
        <p
          className={
            feedback ? "text-destructive text-sm" : "text-sm text-emerald-700"
          }
          role={feedback ? "alert" : "status"}
        >
          {feedback ?? success}
        </p>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">Carte</h3>
          {!readonly ? (
            <form action={optimizeAction}>
              <input type="hidden" name="id" value={trip.id} />
              <Button
                type="submit"
                variant="outline"
                disabled={optimizePending}
              >
                {routeStale || !trip.route
                  ? "Calculer l'itinéraire"
                  : "Recalculer l'itinéraire"}
              </Button>
            </form>
          ) : null}
        </div>
        {routeStale ? (
          <p
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
          >
            Itinéraire à recalculer — les étapes ont changé depuis le dernier
            calcul.
          </p>
        ) : null}
        <TripMap stops={trip.stops} route={trip.route} />
      </section>

      <TripFuelEstimatePanel
        tripId={trip.id}
        distanceKm={routeFresh ? (trip.route?.distanceKm ?? null) : null}
        estimatedFuelCost={
          routeFresh ? (trip.route?.estimatedFuelCost ?? null) : null
        }
        routeFresh={Boolean(routeFresh)}
      />

      <TripWeatherPanel weather={weather} />

      <section className="space-y-3">
        <h3 className="font-medium">Étapes ({trip.stops.length})</h3>
        {trip.stops.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucune étape. Ajoutez des lieux (géocodage à la sauvegarde si le
            service cartes est configuré).
          </p>
        ) : (
          <ol className="divide-border divide-y rounded-lg border">
            {trip.stops.map((stop) => (
              <li
                key={stop.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {stop.sequence}. {stop.name}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {stop.address ?? "Adresse non renseignée"} · {stop.stopType}
                    {stop.latitude && stop.longitude
                      ? ` · ${stop.latitude}, ${stop.longitude}`
                      : " · non géocodé"}
                  </p>
                </div>
                {!readonly ? (
                  <div className="flex flex-wrap gap-1">
                    {stop.address && (!stop.latitude || !stop.longitude) ? (
                      <form action={geocodeAction}>
                        <input type="hidden" name="tripId" value={trip.id} />
                        <input type="hidden" name="stopId" value={stop.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          disabled={geocodePending}
                        >
                          Géocoder
                        </Button>
                      </form>
                    ) : null}
                    <form action={delAction}>
                      <input type="hidden" name="tripId" value={trip.id} />
                      <input type="hidden" name="stopId" value={stop.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        disabled={delPending}
                      >
                        Retirer
                      </Button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      {!readonly ? (
        <section className="space-y-3">
          <h3 className="font-medium">Ajouter une étape</h3>
          <form action={addAction} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="tripId" value={trip.id} />
            <FormField htmlFor="stop-name" label="Nom" required>
              <Input id="stop-name" name="name" required maxLength={200} />
            </FormField>
            <FormField htmlFor="stop-type" label="Type">
              <select
                id="stop-type"
                name="stopType"
                className={selectClassName}
                defaultValue="stop"
              >
                {STOP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              htmlFor="stop-address"
              label="Adresse / lieu"
              className="sm:col-span-2"
            >
              <Input
                id="stop-address"
                name="address"
                placeholder="Ex. 123 rue Principale, Québec"
              />
            </FormField>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={addPending}>
                Ajouter l&apos;étape
              </Button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
