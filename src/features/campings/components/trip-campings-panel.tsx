"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  attachCampgroundAction,
  detachCampgroundAction,
  type CampingsActionResult,
} from "@/features/campings/actions";
import type { CampgroundDto } from "@/features/campings/types";
import type { TripDetailDto } from "@/features/trips/types";
import { Button, Input } from "@/components/ui";

const initial: CampingsActionResult | undefined = undefined;

type Props = {
  trip: TripDetailDto;
};

export function TripCampingsPanel({ trip }: Props) {
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
  const [items, setItems] = useState<CampgroundDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [attachState, attachAction, attachPending] = useActionState(
    attachCampgroundAction,
    initial,
  );
  const [detachState, detachAction, detachPending] = useActionState(
    detachCampgroundAction,
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
      ...(trip.vehicleId ? { vehicleId: trip.vehicleId } : {}),
      ...(q.trim() ? { q: q.trim() } : {}),
    });
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/campgrounds/search?${params}`);
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
        <h3 className="font-medium">Campings</h3>
        <p className="text-muted-foreground text-sm">
          Ajoutez des étapes géocodées pour rechercher des campings à proximité.
        </p>
      </section>
    );
  }

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
      <h3 className="font-medium">Campings</h3>
      <p className="text-muted-foreground text-sm">
        Recherche locale près d&apos;une étape — planifier une nuit.
      </p>

      <ul className="divide-border mb-2 divide-y rounded-lg border">
        {trip.stops
          .filter((s) => s.campground)
          .map((stop) => (
            <li key={stop.id} className="space-y-1 p-3 text-sm">
              <p className="font-medium">
                {stop.sequence}. {stop.name}
              </p>
              <p className="text-muted-foreground">
                {stop.campground?.archived
                  ? "Camping archivé"
                  : stop.campground?.name}
              </p>
              {stop.distanceWarning ? (
                <p
                  className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                  role="status"
                >
                  {stop.distanceWarning}
                </p>
              ) : null}
              {!readonly && stop.campground && !stop.campground.archived ? (
                <form action={detachAction}>
                  <input type="hidden" name="tripId" value={trip.id} />
                  <input type="hidden" name="stopId" value={stop.id} />
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
          {items.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm">
                <p className="font-medium">{c.name}</p>
                <p className="text-muted-foreground">
                  {[c.city, c.region].filter(Boolean).join(", ")}
                  {c.distanceKm != null ? ` · ${c.distanceKm} km` : ""}
                  {c.petFriendly ? " · animaux OK" : ""}
                  {c.maxLengthM ? ` · max ${c.maxLengthM} m` : ""}
                </p>
              </div>
              <form action={attachAction}>
                <input type="hidden" name="tripId" value={trip.id} />
                <input type="hidden" name="stopId" value={stopId} />
                <input type="hidden" name="campgroundId" value={c.id} />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={attachPending || !stopId}
                >
                  Planifier la nuit
                </Button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
