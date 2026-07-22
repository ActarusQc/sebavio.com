import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { BRAND_ASSETS } from "@/features/marketing";
import { TRIP_STATUS_LABELS } from "@/features/trips/constants";
import type { DashboardTripCard } from "@/features/dashboard/types";
import { Button } from "@/components/ui";
import { DashboardCard } from "./dashboard-card";
import { ProgressBar } from "./progress-bar";

type NextTripWidgetProps = {
  trip: DashboardTripCard | null;
};

function formatTripDates(
  departureIso: string,
  returnIso: string | null,
): string {
  const fmt = new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const departure = fmt.format(new Date(departureIso));
  if (!returnIso) return departure;
  return `${departure} → ${fmt.format(new Date(returnIso))}`;
}

export function NextTripWidget({ trip }: NextTripWidgetProps) {
  if (!trip) {
    return (
      <DashboardCard title="Prochaine aventure">
        <div className="flex flex-1 flex-col items-start justify-center gap-4 py-2">
          <div className="space-y-1">
            <p className="font-heading text-client-night text-lg font-semibold">
              Votre prochaine aventure commence ici
            </p>
            <p className="text-client-text-muted text-sm">
              Créez votre premier voyage et laissez Sebavio vous accompagner.
            </p>
          </div>
          <Button size="lg" render={<Link href="/dashboard/ai" />}>
            Planifier un voyage
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </DashboardCard>
    );
  }

  const imageSrc =
    trip.imageSrc ?? BRAND_ASSETS.heroCampingcar ?? BRAND_ASSETS.heroLandscape;

  return (
    <DashboardCard title="Prochaine aventure">
      <div className="flex flex-1 flex-col gap-4">
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
          <Image
            src={imageSrc}
            alt={`Illustration du voyage ${trip.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-client-night text-lg font-semibold">
              {trip.title}
            </h3>
            <span className="bg-client-turquoise text-client-night rounded-full px-2 py-0.5 text-[0.65rem] font-semibold">
              {TRIP_STATUS_LABELS[trip.status]}
            </span>
          </div>
          <p className="text-client-text-muted flex items-center gap-1.5 text-sm">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{trip.destinationLabel}</span>
          </p>
          <p className="text-client-text-muted text-xs">
            {formatTripDates(trip.departureDate, trip.returnDate)}
          </p>
          <ProgressBar
            label="Préparation"
            value={trip.preparationProgress}
            className="pt-1"
          />
        </div>
        <Button
          variant="outline"
          className="border-client-petrol text-client-petrol hover:bg-client-pale mt-auto w-full"
          render={<Link href={`/dashboard/trips/${trip.id}`} />}
        >
          Voir les détails du voyage
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </DashboardCard>
  );
}
