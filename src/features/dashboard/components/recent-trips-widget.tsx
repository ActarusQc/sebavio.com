import Link from "next/link";
import { MapPin } from "lucide-react";
import { TRIP_STATUS_LABELS } from "@/features/trips/constants";
import type { DashboardTripCard } from "@/features/dashboard/types";
import { DashboardCard } from "./dashboard-card";
import { ProgressBar } from "./progress-bar";

type RecentTripsWidgetProps = {
  trips: DashboardTripCard[];
};

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function RecentTripsWidget({ trips }: RecentTripsWidgetProps) {
  const footer = (
    <Link
      href="/dashboard/trips"
      className="text-client-petrol hover:text-client-night text-sm font-medium transition-colors"
    >
      Voir tous mes voyages →
    </Link>
  );

  if (trips.length === 0) {
    return (
      <DashboardCard title="Voyages récents" footer={footer}>
        <div className="text-client-text-muted flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center text-sm">
          <MapPin className="text-client-teal size-7 opacity-70" aria-hidden />
          <p>Votre prochaine route reste à tracer.</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Voyages récents" footer={footer}>
      <ul className="divide-client-border flex flex-col divide-y">
        {trips.map((trip) => (
          <li key={trip.id} className="py-3 first:pt-0 last:pb-0">
            <Link
              href={`/dashboard/trips/${trip.id}`}
              className="group hover:bg-client-pale/50 -mx-1 flex flex-col gap-2 rounded-lg px-1 py-1 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-client-night group-hover:text-client-petrol truncate text-sm font-semibold">
                    {trip.title}
                  </p>
                  <p className="text-client-text-muted truncate text-xs">
                    {trip.destinationLabel} ·{" "}
                    {formatShortDate(trip.departureDate)}
                  </p>
                </div>
                <span className="text-client-text-muted shrink-0 text-[0.65rem] font-medium">
                  {TRIP_STATUS_LABELS[trip.status]}
                </span>
              </div>
              <ProgressBar
                label="Préparation"
                value={trip.preparationProgress}
              />
            </Link>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
