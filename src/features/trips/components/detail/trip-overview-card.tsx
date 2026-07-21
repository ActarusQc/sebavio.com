"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  Calendar,
  Car,
  CircleDollarSign,
  MapPinned,
  Navigation,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui";
import type { TripDetailDto } from "@/features/trips/types";
import { cn } from "@/lib/utils";

type TripOverviewCardProps = {
  trip: TripDetailDto;
  readonly: boolean;
  startPending: boolean;
  completePending: boolean;
  cancelPending: boolean;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
};

function InfoItem({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 gap-2.5", className)}>
      <span
        className="bg-sebavio-teal-soft text-sebavio-teal flex size-8 shrink-0 items-center justify-center rounded-full"
        aria-hidden
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-[11px] font-medium">{label}</p>
        <div className="text-sebavio-navy mt-0.5 text-sm font-semibold break-words">
          {children}
        </div>
      </div>
    </div>
  );
}

export function TripOverviewCard({
  trip,
  readonly,
  startPending,
  completePending,
  cancelPending,
  onStart,
  onComplete,
  onCancel,
}: TripOverviewCardProps) {
  const groupLabel = trip.travelGroup
    ? trip.travelGroup.archived
      ? "Groupe archivé"
      : trip.travelGroup.name
    : "—";

  const periodLabel = `${new Date(trip.departureDate).toLocaleDateString(
    "fr-CA",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  )}${
    trip.returnDate
      ? ` → ${new Date(trip.returnDate).toLocaleDateString("fr-CA", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`
      : ""
  }`;

  return (
    <section
      id="trip-overview-section"
      className="trip-card flex h-full flex-col p-4 sm:p-5"
      data-testid="trip-overview-card"
      aria-labelledby="trip-overview-title"
    >
      <h2
        id="trip-overview-title"
        className="font-heading text-sebavio-navy mb-4 text-base font-semibold"
      >
        Détails du voyage
      </h2>

      <dl className="grid flex-1 gap-3 sm:grid-cols-2">
        <InfoItem icon={Car} label="Véhicule">
          {trip.vehicle?.displayName ?? "—"}
        </InfoItem>
        <InfoItem icon={Calendar} label="Période">
          {periodLabel}
        </InfoItem>
        <InfoItem icon={CircleDollarSign} label="Budget">
          {trip.plannedBudget ? (
            <Link
              href={`/dashboard/finance/trips/${trip.id}`}
              className="underline-offset-4 hover:underline"
            >
              {trip.plannedBudget} CAD
            </Link>
          ) : (
            <Link
              href={`/dashboard/finance/trips/${trip.id}`}
              className="text-sebavio-slate font-medium underline-offset-4 hover:underline"
            >
              Définir le budget
            </Link>
          )}
        </InfoItem>
        <InfoItem icon={Users} label="Groupe">
          {groupLabel}
        </InfoItem>
        <InfoItem icon={Navigation} label="Départ" className="sm:col-span-2">
          {trip.origin}
        </InfoItem>
        <InfoItem
          icon={MapPinned}
          label="Destination"
          className="sm:col-span-2"
        >
          {trip.destination}
        </InfoItem>
      </dl>

      {!readonly ? (
        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[rgb(14_45_70/0.08)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          {(trip.status === "planned" || trip.status === "in_progress") && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive min-h-10 justify-center text-sm"
              disabled={cancelPending}
              onClick={onCancel}
            >
              Annuler le voyage
            </Button>
          )}
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {trip.status === "planned" ? (
              <Button
                type="button"
                className="bg-sebavio-teal hover:bg-sebavio-teal/90 min-h-10 text-white"
                disabled={startPending}
                onClick={onStart}
              >
                Démarrer
              </Button>
            ) : null}
            {trip.status === "planned" || trip.status === "in_progress" ? (
              <Button
                type="button"
                className="bg-sebavio-navy hover:bg-sebavio-navy/90 min-h-10 text-white"
                disabled={completePending}
                onClick={onComplete}
              >
                Clôturer
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground mt-4 border-t border-[rgb(14_45_70/0.08)] pt-3 text-sm">
          {trip.status === "cancelled"
            ? "Voyage annulé — consultation uniquement."
            : "Voyage terminé — consultation uniquement."}
        </p>
      )}
    </section>
  );
}
