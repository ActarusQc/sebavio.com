"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  deleteVehicleAction,
  setPrimaryVehicleAction,
  type VehiclesActionResult,
} from "@/features/vehicles/actions";
import type { PaginatedVehicles } from "@/features/vehicles/types";
import { Badge, Button } from "@/components/ui";

const initial: VehiclesActionResult | undefined = undefined;

type VehiclesListProps = {
  result: PaginatedVehicles;
};

export function VehiclesList({ result }: VehiclesListProps) {
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteVehicleAction,
    initial,
  );
  const [primaryState, primaryAction, primaryPending] = useActionState(
    setPrimaryVehicleAction,
    initial,
  );

  if (result.items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-muted-foreground text-sm">
          Aucun véhicule enregistré. Ajoutez votre premier véhicule pour
          personnaliser voyages et entretien.
        </p>
        <Button render={<Link href="/dashboard/vehicles/new" />}>
          Ajouter un véhicule
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {(deleteState?.ok === false || primaryState?.ok === false) && (
        <p className="text-destructive text-sm" role="alert">
          {deleteState?.ok === false
            ? deleteState.message
            : primaryState?.ok === false
              ? primaryState.message
              : null}
        </p>
      )}
      {(deleteState?.ok || primaryState?.ok) && (
        <p className="text-sm text-emerald-700" role="status">
          {deleteState?.ok
            ? deleteState.message
            : primaryState?.ok
              ? primaryState.message
              : null}
        </p>
      )}

      <ul className="divide-border divide-y rounded-lg border">
        {result.items.map((vehicle) => (
          <li
            key={vehicle.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/vehicles/${vehicle.id}`}
                  className="text-foreground font-medium hover:underline"
                >
                  {vehicle.displayName}
                </Link>
                {vehicle.primaryVehicle ? (
                  <Badge variant="secondary">Principal</Badge>
                ) : null}
                {vehicle.isManualEntry ? (
                  <Badge variant="outline">Manuel</Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground text-sm">
                {vehicle.currentOdometer.toLocaleString("fr-CA")} km
                {vehicle.vin ? ` · VIN ${vehicle.vin}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/dashboard/vehicles/${vehicle.id}`} />}
              >
                Voir
              </Button>
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link href={`/dashboard/vehicles/${vehicle.id}/edit`} />
                }
              >
                Modifier
              </Button>
              {!vehicle.primaryVehicle ? (
                <form action={primaryAction}>
                  <input type="hidden" name="id" value={vehicle.id} />
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={primaryPending}
                  >
                    Définir principal
                  </Button>
                </form>
              ) : null}
              <form action={deleteAction}>
                <input type="hidden" name="id" value={vehicle.id} />
                <Button
                  type="submit"
                  variant="destructive"
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

      <p className="text-muted-foreground text-xs">
        Page {result.page} / {result.totalPages} · {result.total} véhicule
        {result.total > 1 ? "s" : ""}
      </p>
    </div>
  );
}
