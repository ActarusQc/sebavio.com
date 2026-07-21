"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { TripActivitiesSection } from "@/features/trips/activities/components/trip-activities-section";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export type ActivityTripOption = {
  id: string;
  title: string;
  status: string;
  origin: string;
  destination: string;
  departureDate: string;
};

type Props = {
  trips: ActivityTripOption[];
  initialTripId: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planifié",
  in_progress: "En cours",
};

export function ActivitiesPageClient({ trips, initialTripId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId =
    searchParams.get("tripId") ?? initialTripId ?? trips[0]?.id ?? null;

  const selected = useMemo(
    () => trips.find((t) => t.id === tripId) ?? null,
    [trips, tripId],
  );

  const selectTrip = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tripId", id);
      router.replace(`/dashboard/activities?${params.toString()}`);
    },
    [router, searchParams],
  );

  if (trips.length === 0) {
    return (
      <div className="trip-card flex flex-col gap-3 p-5">
        <p className="text-muted-foreground text-sm">
          Aucun voyage planifié ou en cours. Créez un voyage pour recevoir des
          suggestions d&apos;activités.
        </p>
        <Button
          type="button"
          className="w-fit"
          render={<Link href="/dashboard/trips/new" />}
        >
          Créer un voyage
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="trip-card flex flex-col gap-3 p-4 sm:p-5">
        <div>
          <h2 className="text-sebavio-navy text-base font-semibold">
            Choisir un voyage
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Les suggestions réutilisent le profil voyageurs, Google Places et le
            classement déjà en place.
          </p>
        </div>

        <label className="flex flex-col gap-1.5 sm:max-w-md">
          <span className="text-sm font-medium">Voyage</span>
          <select
            className="border-input bg-background focus-visible:ring-sebavio-teal min-h-11 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2"
            value={tripId ?? ""}
            onChange={(e) => selectTrip(e.target.value)}
            aria-label="Sélectionner un voyage"
          >
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} — {STATUS_LABELS[t.status] ?? t.status}
              </option>
            ))}
          </select>
        </label>

        {selected ? (
          <p className="text-muted-foreground flex items-start gap-1.5 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {selected.origin} → {selected.destination}
              {selected.departureDate
                ? ` · départ ${new Date(selected.departureDate).toLocaleDateString("fr-CA")}`
                : null}
              {" · "}
              <Link
                href={`/dashboard/trips/${selected.id}`}
                className={cn(
                  "text-sebavio-teal underline-offset-2 hover:underline",
                )}
              >
                Voir le voyage
              </Link>
            </span>
          </p>
        ) : null}
      </div>

      {tripId ? (
        <TripActivitiesSection tripId={tripId} variant="explorer" />
      ) : null}
    </div>
  );
}
