import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { BRAND_ASSETS } from "@/features/marketing";
import { TRIP_STATUS_LABELS } from "@/features/trips/constants";
import type { DashboardTripCard } from "@/features/dashboard/types";
import { Button } from "@/components/ui";
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
      <section className="border-client-border bg-client-surface flex h-full flex-col rounded-[var(--client-radius)] border p-5 shadow-[var(--client-shadow)] sm:p-6">
        <h2 className="font-heading text-client-text mb-4 text-base font-semibold tracking-tight">
          Prochaine aventure
        </h2>
        <div className="flex flex-1 flex-col items-start justify-center gap-4 py-2">
          <div className="space-y-2">
            <p className="font-heading text-client-text text-xl font-semibold">
              Votre prochaine aventure commence ici
            </p>
            <p className="text-client-text-muted text-[0.9375rem]">
              Créez votre premier voyage et laissez Sebavio vous accompagner.
            </p>
          </div>
          <Button
            size="lg"
            className="h-11"
            render={<Link href="/dashboard/ai" />}
          >
            Planifier un voyage
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </section>
    );
  }

  const imageSrc =
    trip.imageSrc ?? BRAND_ASSETS.heroCampingcar ?? BRAND_ASSETS.heroLandscape;

  return (
    <section className="border-client-border bg-client-surface flex h-full flex-col overflow-hidden rounded-[var(--client-radius)] border shadow-[var(--client-shadow)] transition-shadow duration-200 hover:shadow-[var(--client-shadow-hover)]">
      <div className="relative aspect-[16/9] min-h-[12rem] w-full overflow-hidden sm:min-h-[14rem]">
        <Image
          src={imageSrc}
          alt={`Illustration du voyage ${trip.title}`}
          fill
          className="object-cover"
          sizes="(max-width: 1280px) 100vw, 40vw"
          priority
        />
        <div
          className="from-sebavio-navy/70 via-sebavio-navy/15 absolute inset-0 bg-gradient-to-t to-transparent"
          aria-hidden
        />
        <p className="text-sebavio-navy absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold">
          Prochaine aventure
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-client-text text-xl font-semibold tracking-tight">
            {trip.title}
          </h3>
          <span className="border-sebavio-gold/30 bg-sebavio-orange-100 text-sebavio-navy rounded-full border px-2.5 py-0.5 text-xs font-semibold">
            {TRIP_STATUS_LABELS[trip.status]}
          </span>
        </div>
        <p className="text-client-text-muted flex items-center gap-1.5 text-[0.9375rem]">
          <MapPin className="text-sebavio-slate size-4 shrink-0" aria-hidden />
          <span className="truncate">{trip.destinationLabel}</span>
        </p>
        <p className="text-client-text-muted text-sm">
          {formatTripDates(trip.departureDate, trip.returnDate)}
        </p>
        <ProgressBar
          label="Préparation"
          value={trip.preparationProgress}
          className="pt-1"
        />
        <Button
          className="mt-auto h-11 w-full"
          render={<Link href={`/dashboard/trips/${trip.id}`} />}
        >
          Voir les détails du voyage
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </section>
  );
}
