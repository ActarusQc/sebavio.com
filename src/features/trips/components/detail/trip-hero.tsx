import Image from "next/image";
import Link from "next/link";
import { List, Pencil, Wallet } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { TRIP_STATUS_LABELS } from "@/features/trips/constants";
import type { TripStatus } from "@/features/trips/constants";
import { BRAND_ASSETS } from "@/features/marketing/lib/brand-assets";
import { cn } from "@/lib/utils";

type TripHeroProps = {
  tripId: string;
  title: string;
  status: TripStatus;
  imageSrc?: string | null;
  canEdit: boolean;
};

const STATUS_BADGE: Record<TripStatus, string> = {
  planned: "bg-white/90 text-sebavio-navy",
  in_progress: "bg-sebavio-teal text-white",
  completed: "bg-sebavio-sage text-white",
  cancelled: "bg-white/80 text-sebavio-muted",
};

export function TripHero({
  tripId,
  title,
  status,
  imageSrc,
  canEdit,
}: TripHeroProps) {
  const src = imageSrc?.trim() || BRAND_ASSETS.heroCampingcar;

  return (
    <header
      className="relative isolate overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-md)]"
      data-testid="trip-hero"
    >
      <div className="relative min-h-[160px] sm:min-h-[200px] lg:min-h-[240px]">
        <Image
          src={src}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1200px) 100vw, 1200px"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0a2438]/95 via-[#0e2d46]/55 to-[#0e2d46]/20"
          aria-hidden
        />
        <div className="relative z-10 flex h-full min-h-[160px] flex-col justify-end gap-4 p-4 sm:min-h-[200px] sm:p-6 lg:min-h-[240px] lg:flex-row lg:items-end lg:justify-between lg:p-8">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {title}
              </h1>
              <Badge
                className={cn(
                  "h-7 rounded-full border-0 px-3 text-xs font-semibold",
                  STATUS_BADGE[status],
                )}
              >
                {TRIP_STATUS_LABELS[status]}
              </Badge>
            </div>
            <p className="text-sm text-white/85 sm:text-base">
              Fiche voyage et étapes
            </p>
          </div>

          <div
            className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end"
            role="group"
            aria-label="Actions du voyage"
          >
            <Button
              variant="outline"
              size="lg"
              className="text-sebavio-navy min-h-11 min-w-[6.5rem] flex-1 border-0 bg-white hover:bg-white/90 sm:flex-none"
              render={<Link href="/dashboard/trips" />}
            >
              <List data-icon="inline-start" aria-hidden />
              Liste
            </Button>
            {canEdit ? (
              <Button
                size="lg"
                className="bg-sebavio-orange hover:bg-sebavio-orange/90 min-h-11 min-w-[6.5rem] flex-1 border-0 text-white hover:brightness-100 sm:flex-none"
                render={<Link href={`/dashboard/trips/${tripId}/edit`} />}
              >
                <Pencil data-icon="inline-start" aria-hidden />
                Modifier
              </Button>
            ) : null}
            <Button
              size="lg"
              className="bg-sebavio-navy hover:bg-sebavio-navy/90 min-h-11 min-w-[6.5rem] flex-1 border border-white/70 text-white hover:brightness-100 sm:flex-none"
              render={<Link href={`/dashboard/finance/trips/${tripId}`} />}
            >
              <Wallet data-icon="inline-start" aria-hidden />
              Finances
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
