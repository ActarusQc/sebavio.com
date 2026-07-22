import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { BRAND_ASSETS } from "@/features/marketing";
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
      className="text-sebavio-navy hover:text-sebavio-slate text-[0.9375rem] font-semibold transition-colors"
    >
      Voir tous mes voyages →
    </Link>
  );

  if (trips.length === 0) {
    return (
      <DashboardCard title="Voyages récents" footer={footer}>
        <div className="text-client-text-muted flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center text-[0.9375rem]">
          <MapPin
            className="text-sebavio-slate size-8 opacity-70"
            aria-hidden
          />
          <p>Votre prochaine route reste à tracer.</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Voyages récents" footer={footer}>
      <ul className="divide-client-border flex flex-col divide-y">
        {trips.map((trip) => {
          const thumb =
            trip.imageSrc ??
            BRAND_ASSETS.heroCampingcar ??
            BRAND_ASSETS.heroLandscape;
          return (
            <li key={trip.id} className="py-3.5 first:pt-0 last:pb-0">
              <Link
                href={`/dashboard/trips/${trip.id}`}
                className="group hover:bg-client-pale/60 -mx-1 flex flex-col gap-2.5 rounded-xl px-1.5 py-1.5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-client-text group-hover:text-sebavio-slate text-[0.9375rem] font-semibold">
                      {trip.title}
                    </p>
                    <p className="text-client-text-muted text-sm">
                      {trip.destinationLabel} ·{" "}
                      {formatShortDate(trip.departureDate)}
                    </p>
                  </div>
                  <span className="text-client-text-muted shrink-0 text-xs font-medium">
                    {TRIP_STATUS_LABELS[trip.status]}
                  </span>
                </div>
                <ProgressBar
                  label="Préparation"
                  value={trip.preparationProgress}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
