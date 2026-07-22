import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { BRAND_ASSETS } from "@/features/marketing";
import { TRIP_STATUS_LABELS } from "@/features/trips/constants";
import type { DashboardTripCard } from "@/features/dashboard/types";
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
      <section className="flex h-full flex-col rounded-[1.25rem] border border-white/10 bg-[rgba(12,30,56,0.85)] p-5 shadow-[0_8px_32px_rgb(0_0_0/0.28)] sm:p-6">
        <h2 className="font-heading mb-4 text-base font-semibold text-white">
          Prochaine aventure
        </h2>
        <div className="flex flex-1 flex-col items-start justify-center gap-4 py-2">
          <div className="space-y-2">
            <p className="font-heading text-xl font-semibold text-white">
              Votre prochaine aventure commence ici
            </p>
            <p className="text-[0.9375rem] text-white/60">
              Créez votre premier voyage et laissez Sebavio vous accompagner.
            </p>
          </div>
          <Link
            href="/dashboard/ai"
            className="font-heading inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(59,130,246,0.35)] hover:brightness-110"
          >
            Planifier un voyage
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    );
  }

  const imageSrc =
    trip.imageSrc ?? BRAND_ASSETS.heroCampingcar ?? BRAND_ASSETS.heroLandscape;

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-[rgba(12,30,56,0.9)] shadow-[0_8px_32px_rgb(0_0_0/0.35)] transition-shadow hover:border-white/16 hover:shadow-[0_12px_40px_rgb(0_0_0/0.45)]">
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
          className="absolute inset-0 bg-gradient-to-t from-[#050b1c] via-[#050b1c]/35 to-transparent"
          aria-hidden
        />
        <p className="absolute top-4 left-4 rounded-full border border-white/15 bg-[rgba(5,11,28,0.7)] px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          Prochaine aventure
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-xl font-semibold tracking-tight text-white">
            {trip.title}
          </h3>
          <span className="rounded-full border border-[#f0b64d]/35 bg-[rgba(240,182,77,0.15)] px-2.5 py-0.5 text-xs font-semibold text-[#f0b64d]">
            {TRIP_STATUS_LABELS[trip.status]}
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-[0.9375rem] text-white/60">
          <MapPin className="size-4 shrink-0 text-[#c4b5fd]" aria-hidden />
          <span className="truncate">{trip.destinationLabel}</span>
        </p>
        <p className="text-sm text-white/45">
          {formatTripDates(trip.departureDate, trip.returnDate)}
        </p>
        <ProgressBar
          label="Préparation"
          value={trip.preparationProgress}
          className="pt-1"
        />
        <Link
          href={`/dashboard/trips/${trip.id}`}
          className="font-heading mt-auto inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(59,130,246,0.35)] transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:outline-none"
        >
          Voir les détails du voyage
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
