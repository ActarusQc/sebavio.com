"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createTripAction,
  updateTripAction,
  type TripsActionResult,
} from "@/features/trips/actions";
import type { TripDto } from "@/features/trips/types";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: TripsActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type VehicleOption = {
  id: string;
  displayName: string;
};

type GroupOption = {
  id: string;
  name: string;
};

type TripFormProps = {
  vehicles: VehicleOption[];
  groups?: GroupOption[];
  trip?: TripDto;
};

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function TripForm({ vehicles, groups = [], trip }: TripFormProps) {
  const router = useRouter();
  const isEdit = Boolean(trip);
  const action = isEdit ? updateTripAction : createTripAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state?.ok && state.id && !isEdit) {
      router.push(`/dashboard/trips/${state.id}`);
    }
  }, [state, isEdit, router]);

  if (vehicles.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Ajoutez d&apos;abord un véhicule avant de créer un voyage.
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {trip ? <input type="hidden" name="id" value={trip.id} /> : null}

      <FormField
        htmlFor="trip-title"
        label="Titre"
        required
        className="sm:col-span-2"
      >
        <Input
          id="trip-title"
          name="title"
          required
          maxLength={150}
          defaultValue={trip?.title ?? ""}
        />
      </FormField>

      <FormField htmlFor="trip-vehicle" label="Véhicule" required>
        <select
          id="trip-vehicle"
          name="vehicleId"
          className={selectClassName}
          required
          defaultValue={trip?.vehicleId ?? vehicles[0]?.id}
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.displayName}
            </option>
          ))}
        </select>
      </FormField>

      <FormField htmlFor="trip-group" label="Groupe de voyageurs">
        <select
          id="trip-group"
          name="travelGroupId"
          className={selectClassName}
          defaultValue={trip?.travelGroupId ?? ""}
        >
          <option value="">Aucun (optionnel)</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField htmlFor="trip-budget" label="Budget prévu (CAD)">
        <Input
          id="trip-budget"
          name="plannedBudget"
          type="number"
          step="0.01"
          min="0"
          defaultValue={trip?.plannedBudget ?? ""}
        />
      </FormField>

      <FormField htmlFor="trip-origin" label="Départ" required>
        <Input
          id="trip-origin"
          name="origin"
          required
          defaultValue={trip?.origin ?? ""}
          placeholder="Ville ou adresse"
        />
      </FormField>

      <FormField htmlFor="trip-destination" label="Destination" required>
        <Input
          id="trip-destination"
          name="destination"
          required
          defaultValue={trip?.destination ?? ""}
          placeholder="Ville ou adresse"
        />
      </FormField>

      <FormField htmlFor="trip-dep" label="Date de départ" required>
        <Input
          id="trip-dep"
          name="departureDate"
          type="date"
          required
          defaultValue={toDateInput(trip?.departureDate)}
        />
      </FormField>

      <FormField htmlFor="trip-ret" label="Date de retour">
        <Input
          id="trip-ret"
          name="returnDate"
          type="date"
          defaultValue={toDateInput(trip?.returnDate)}
        />
      </FormField>

      {state?.ok === false && (
        <p className="text-destructive text-sm sm:col-span-2" role="alert">
          {state.message}
        </p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-700 sm:col-span-2" role="status">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Enregistrement…"
            : isEdit
              ? "Enregistrer"
              : "Créer le voyage"}
        </Button>
      </div>
    </form>
  );
}
