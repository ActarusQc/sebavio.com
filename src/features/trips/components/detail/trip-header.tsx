"use client";

import Link from "next/link";
import { ArrowLeft, MoreHorizontal, Pencil, Wallet, List } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TRIP_STATUS_LABELS,
  type TripStatus,
} from "@/features/trips/constants";
import {
  formatPlaceLabel,
  formatTripDateRange,
} from "@/features/trips/lib/format-place";
import { cn } from "@/lib/utils";

type TripHeaderProps = {
  tripId: string;
  title: string;
  status: TripStatus;
  origin: string;
  originCity: string | null;
  originProvince: string | null;
  destination: string;
  destinationCity: string | null;
  destinationProvince: string | null;
  departureDate: string;
  returnDate: string | null;
  canEdit: boolean;
};

const STATUS_BADGE: Record<TripStatus, string> = {
  planned: "bg-sky-50 text-sky-800 ring-sky-200",
  in_progress: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function TripHeader({
  tripId,
  title,
  status,
  origin,
  originCity,
  originProvince,
  destination,
  destinationCity,
  destinationProvince,
  departureDate,
  returnDate,
  canEdit,
}: TripHeaderProps) {
  const from = formatPlaceLabel(originCity, originProvince, origin);
  const to = formatPlaceLabel(
    destinationCity,
    destinationProvince,
    destination,
  );
  const dates = formatTripDateRange(departureDate, returnDate);

  return (
    <header className="space-y-3 sm:space-y-4" data-testid="trip-header">
      <Link
        href="/dashboard/trips"
        className="text-sebavio-navy/70 hover:text-sebavio-navy inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium underline-offset-2 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour aux voyages
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2.5">
          <h1 className="font-heading text-sebavio-navy flex flex-wrap items-center gap-2.5 text-[1.875rem] leading-[1.15] font-bold tracking-tight sm:text-[2rem] lg:text-[2.125rem]">
            <span className="min-w-0 break-words">{title}</span>
            <span
              className="text-sebavio-gold inline-flex shrink-0 text-[1.35rem]"
              aria-hidden
            >
              ✦
            </span>
          </h1>

          <div className="text-sebavio-navy/75 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[14px] sm:text-[15px]">
            <span className="text-sebavio-navy font-medium">
              {from}
              <span className="text-muted-foreground mx-1.5 font-normal">
                →
              </span>
              {to}
            </span>
            <span className="text-sebavio-navy/25 hidden sm:inline" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>📅</span>
              <time dateTime={departureDate}>{dates}</time>
            </span>
            <span className="text-sebavio-navy/25 hidden sm:inline" aria-hidden>
              ·
            </span>
            <Badge
              className={cn(
                "h-7 rounded-full border-0 px-3 text-[13px] font-semibold ring-1 ring-inset",
                STATUS_BADGE[status],
              )}
            >
              <span
                className={cn(
                  "mr-1.5 inline-block size-1.5 rounded-full",
                  status === "in_progress" && "bg-emerald-500",
                  status === "planned" && "bg-sky-500",
                  status === "completed" && "bg-slate-400",
                  status === "cancelled" && "bg-rose-400",
                )}
                aria-hidden
              />
              {TRIP_STATUS_LABELS[status]}
            </Badge>
          </div>
        </div>

        <div
          className="flex shrink-0 flex-wrap items-center gap-2"
          role="group"
          aria-label="Actions du voyage"
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="border-sebavio-navy/15 size-11"
                  aria-label="Plus d’actions"
                  data-testid="trip-header-menu"
                />
              }
            >
              <MoreHorizontal className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              {canEdit ? (
                <DropdownMenuItem
                  render={<Link href={`/dashboard/trips/${tripId}/edit`} />}
                >
                  <Pencil className="size-4" aria-hidden />
                  Modifier
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                render={<Link href={`/dashboard/finance/trips/${tripId}`} />}
              >
                <Wallet className="size-4" aria-hidden />
                Finances
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/dashboard/trips" />}>
                <List className="size-4" aria-hidden />
                Tous les voyages
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
