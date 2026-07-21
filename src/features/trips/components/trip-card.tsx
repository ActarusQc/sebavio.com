"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  MoreHorizontal,
  Users,
  Wallet,
} from "lucide-react";
import {
  deleteTripAction,
  type TripsActionResult,
} from "@/features/trips/actions";
import { TRIP_STATUS_LABELS } from "@/features/trips/constants";
import type { TripStatus } from "@/features/trips/constants";
import type { TripDto } from "@/features/trips/types";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";

const initial: TripsActionResult | undefined = undefined;

function statusVariant(
  status: TripStatus,
): "secondary" | "default" | "outline" | "destructive" {
  if (status === "in_progress") return "default";
  if (status === "completed") return "outline";
  if (status === "cancelled") return "destructive";
  return "secondary";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-CA");
}

type TripCardProps = {
  trip: TripDto;
  deletePending: boolean;
  onDeleteAction: (payload: FormData) => void;
};

export function TripCard({
  trip,
  deletePending,
  onDeleteAction,
}: TripCardProps) {
  const canEdit = trip.status !== "completed" && trip.status !== "cancelled";

  return (
    <article className="group/trip border-sebavio-sand/55 bg-card/95 dark:bg-card/75 flex flex-col gap-4 rounded-[var(--radius-card)] border p-4 shadow-[var(--shadow-sm)] transition-[box-shadow,transform] duration-200 hover:shadow-[var(--shadow-md)] motion-safe:hover:-translate-y-0.5 sm:p-5 dark:border-white/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/trips/${trip.id}`}
              className="font-heading text-sebavio-navy dark:text-foreground text-lg font-semibold tracking-tight hover:underline"
            >
              {trip.title}
            </Link>
            <Badge variant={statusVariant(trip.status)}>
              {TRIP_STATUS_LABELS[trip.status]}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions pour ${trip.title}`}
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem
              render={<Link href={`/dashboard/trips/${trip.id}`} />}
            >
              Voir
            </DropdownMenuItem>
            {canEdit ? (
              <DropdownMenuItem
                render={<Link href={`/dashboard/trips/${trip.id}/edit`} />}
              >
                Modifier
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={deletePending}
              onClick={() => {
                const fd = new FormData();
                fd.set("id", trip.id);
                onDeleteAction(fd);
              }}
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-sebavio-slate/5 dark:bg-sebavio-slate/15 flex items-center gap-2 rounded-xl px-3 py-3 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <MapPin
            className="text-sebavio-sage mt-0.5 size-4 shrink-0"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-muted-foreground text-[0.65rem] font-medium tracking-wide uppercase">
              Départ
            </p>
            <p className="text-foreground truncate text-sm font-medium">
              {trip.origin}
            </p>
          </div>
        </div>
        <ArrowRight className="text-sebavio-gold size-4 shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <MapPin
            className="text-sebavio-coral mt-0.5 size-4 shrink-0"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-muted-foreground text-[0.65rem] font-medium tracking-wide uppercase">
              Destination
            </p>
            <p className="text-foreground truncate text-sm font-medium">
              {trip.destination}
            </p>
          </div>
        </div>
      </div>

      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden />
          {formatDate(trip.departureDate)}
          {trip.returnDate ? ` → ${formatDate(trip.returnDate)}` : null}
        </span>
        {trip.vehicle ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="bg-sebavio-slate/20 size-1.5 rounded-full"
              aria-hidden
            />
            {trip.vehicle.displayName}
          </span>
        ) : null}
        {trip.travelGroup ? (
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5 shrink-0" aria-hidden />
            {trip.travelGroup.name}
          </span>
        ) : null}
        {trip.plannedBudget ? (
          <span className="inline-flex items-center gap-1.5">
            <Wallet className="size-3.5 shrink-0" aria-hidden />
            {trip.plannedBudget} CAD
          </span>
        ) : null}
        {trip.stopCount > 0 ? (
          <span>
            {trip.stopCount} étape{trip.stopCount > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>

      <div className="border-sebavio-sand/40 flex flex-wrap gap-2 border-t pt-3 dark:border-white/10">
        <Button
          size="sm"
          render={<Link href={`/dashboard/trips/${trip.id}`} />}
        >
          Voir
        </Button>
        {canEdit ? (
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/dashboard/trips/${trip.id}/edit`} />}
          >
            Modifier
          </Button>
        ) : null}
      </div>
    </article>
  );
}

type TripCardsListProps = {
  trips: TripDto[];
};

export function TripCardsList({ trips }: TripCardsListProps) {
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteTripAction,
    initial,
  );

  return (
    <div className="flex flex-col gap-4">
      {deleteState?.ok === false && (
        <p className="text-destructive text-sm" role="alert">
          {deleteState.message}
        </p>
      )}
      {deleteState?.ok && (
        <p
          className="dark:text-sebavio-sage text-sm text-emerald-700"
          role="status"
        >
          {deleteState.message}
        </p>
      )}
      <ul className="grid gap-4 lg:grid-cols-2">
        {trips.map((trip) => (
          <li key={trip.id}>
            <TripCard
              trip={trip}
              deletePending={deletePending}
              onDeleteAction={deleteAction}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
