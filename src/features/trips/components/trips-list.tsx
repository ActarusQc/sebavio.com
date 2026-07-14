"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  deleteTripAction,
  type TripsActionResult,
} from "@/features/trips/actions";
import { TRIP_STATUS_LABELS } from "@/features/trips/constants";
import type { TripStatus } from "@/features/trips/constants";
import type { PaginatedTrips } from "@/features/trips/types";
import { Badge, Button } from "@/components/ui";

const initial: TripsActionResult | undefined = undefined;

type TripsListProps = {
  result: PaginatedTrips;
};

function statusVariant(
  status: TripStatus,
): "secondary" | "default" | "outline" | "destructive" {
  if (status === "in_progress") return "default";
  if (status === "completed") return "outline";
  if (status === "cancelled") return "destructive";
  return "secondary";
}

export function TripsList({ result }: TripsListProps) {
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteTripAction,
    initial,
  );

  if (result.items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-muted-foreground text-sm">
          Aucun voyage. Créez votre premier voyage pour planifier un itinéraire.
        </p>
        <Button render={<Link href="/dashboard/trips/new" />}>
          Nouveau voyage
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {deleteState?.ok === false && (
        <p className="text-destructive text-sm" role="alert">
          {deleteState.message}
        </p>
      )}
      {deleteState?.ok && (
        <p className="text-sm text-emerald-700" role="status">
          {deleteState.message}
        </p>
      )}

      <ul className="divide-border divide-y rounded-lg border">
        {result.items.map((trip) => (
          <li
            key={trip.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/trips/${trip.id}`}
                  className="text-foreground font-medium hover:underline"
                >
                  {trip.title}
                </Link>
                <Badge variant={statusVariant(trip.status)}>
                  {TRIP_STATUS_LABELS[trip.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {trip.origin} → {trip.destination}
              </p>
              <p className="text-muted-foreground text-xs">
                Départ{" "}
                {new Date(trip.departureDate).toLocaleDateString("fr-CA")}
                {trip.vehicle ? ` · ${trip.vehicle.displayName}` : null}
                {trip.stopCount > 0
                  ? ` · ${trip.stopCount} étape${trip.stopCount > 1 ? "s" : ""}`
                  : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/dashboard/trips/${trip.id}`} />}
              >
                Voir
              </Button>
              {trip.status !== "completed" && trip.status !== "cancelled" ? (
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/dashboard/trips/${trip.id}/edit`} />}
                >
                  Modifier
                </Button>
              ) : null}
              <form action={deleteAction}>
                <input type="hidden" name="id" value={trip.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  disabled={deletePending}
                >
                  Supprimer
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
