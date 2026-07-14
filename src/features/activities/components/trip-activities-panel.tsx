"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  attachActivityAction,
  detachActivityAction,
  type ActivitiesActionResult,
} from "@/features/activities/actions";
import type { ActivityDto } from "@/features/activities/types";
import type { TripDetailDto } from "@/features/trips/types";
import { Button, Input } from "@/components/ui";

const initial: ActivitiesActionResult | undefined = undefined;

type Props = {
  trip: TripDetailDto;
};

export function TripActivitiesPanel({ trip }: Props) {
  const readonly = trip.status === "completed" || trip.status === "cancelled";
  const [stopIdOverride, setStopIdOverride] = useState<string | null>(null);
  const stopId = useMemo(() => {
    if (stopIdOverride && trip.stops.some((s) => s.id === stopIdOverride)) {
      return stopIdOverride;
    }
    return trip.stops[0]?.id ?? "";
  }, [stopIdOverride, trip.stops]);
  const [radiusKm, setRadiusKm] = useState("50");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ActivityDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [attachState, attachAction, attachPending] = useActionState(
    attachActivityAction,
    initial,
  );
  const [detachState, detachAction, detachPending] = useActionState(
    detachActivityAction,
    initial,
  );

  const selectedStop = trip.stops.find((s) => s.id === stopId) ?? null;

  function runSearch() {
    if (!selectedStop?.latitude || !selectedStop?.longitude) {
      setError("Sélectionnez une étape géocodée pour chercher à proximité.");
      setItems([]);
      return;
    }
    setError(null);
    const params = new URLSearchParams({
      latitude: selectedStop.latitude,
      longitude: selectedStop.longitude,
      radiusKm: radiusKm || "50",
      ...(q.trim() ? { q: q.trim() } : {}),
    });
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/activities/search?${params}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error?.message ?? "Recherche impossible");
          setItems([]);
          return;
        }
        setItems(data.data?.items ?? []);
      } catch {
        setError("Recherche impossible");
        setItems([]);
      }
    });
  }

  if (trip.stops.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="font-medium">Activités &amp; points d&apos;intérêt</h3>
        <p className="text-muted-foreground text-sm">
          Ajoutez des étapes géocodées pour rechercher des activités à
          proximité.
        </p>
      </section>
    );
  }

  const linkedStops = trip.stops.filter((s) => s.activityCount > 0);

  const feedback =
    (attachState?.ok === false && attachState.message) ||
    (detachState?.ok === false && detachState.message) ||
    null;
  const success =
    (attachState?.ok && attachState.message) ||
    (detachState?.ok && detachState.message) ||
    null;

  return (
    <section className="space-y-3">
      <h3 className="font-medium">Activités &amp; points d&apos;intérêt</h3>
      <p className="text-muted-foreground text-sm">
        Recherche locale près d&apos;une étape — plusieurs activités par étape.
      </p>

      <ul className="divide-border mb-2 divide-y rounded-lg border">
        {linkedStops.map((stop) => (
          <li key={stop.id} className="space-y-2 p-3 text-sm">
            <p className="font-medium">
              {stop.sequence}. {stop.name}{" "}
              <span className="text-muted-foreground font-normal">
                ({stop.activityCount} activité
                {stop.activityCount > 1 ? "s" : ""})
              </span>
            </p>
            <ul className="space-y-1">
              {stop.activities.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-muted-foreground">
                    {a.archived ? "Activité archivée" : a.name}
                    {a.distanceWarning ? ` · ${a.distanceWarning}` : ""}
                  </span>
                  {!readonly && !a.archived ? (
                    <form action={detachAction}>
                      <input type="hidden" name="tripId" value={trip.id} />
                      <input type="hidden" name="stopId" value={stop.id} />
                      <input type="hidden" name="activityId" value={a.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        disabled={detachPending}
                      >
                        Détacher
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {!readonly ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-muted-foreground mb-1 block">Étape</span>
            <select
              className="border-input h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm"
              value={stopId}
              onChange={(e) => setStopIdOverride(e.target.value)}
            >
              {trip.stops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sequence}. {s.name}
                  {s.activityCount > 0 ? ` (${s.activityCount})` : ""}
                  {!s.latitude || !s.longitude ? " (non géocodé)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground mb-1 block">Rayon (km)</span>
            <Input
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              type="number"
              min={1}
              max={200}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-muted-foreground mb-1 block">Recherche</span>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom, ville…"
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="button" onClick={runSearch} disabled={pending}>
              {pending ? "Recherche…" : "Chercher à proximité"}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {feedback ? <p className="text-destructive text-sm">{feedback}</p> : null}
      {success ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          {success}
        </p>
      ) : null}
      {attachState?.distanceWarning ? (
        <p
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          {attachState.distanceWarning}
        </p>
      ) : null}

      {!readonly && items.length > 0 ? (
        <ul className="divide-border divide-y rounded-lg border">
          {items.map((a) => {
            const already =
              selectedStop?.activities.some((x) => x.id === a.id) ?? false;
            return (
              <li
                key={a.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-muted-foreground">
                    {[a.city, a.region].filter(Boolean).join(", ")}
                    {a.distanceKm != null ? ` · ${a.distanceKm} km` : ""}
                    {a.petFriendly ? " · animaux OK" : ""}
                    {a.kind === "poi" ? " · POI" : ""}
                  </p>
                </div>
                <form action={attachAction}>
                  <input type="hidden" name="tripId" value={trip.id} />
                  <input type="hidden" name="stopId" value={stopId} />
                  <input type="hidden" name="activityId" value={a.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    disabled={attachPending || !stopId || already}
                  >
                    {already ? "Déjà liée" : "Ajouter à l'étape"}
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
