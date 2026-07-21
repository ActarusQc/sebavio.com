"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarRange,
  MapPinned,
  NotebookPen,
  UsersRound,
  Wallet,
} from "lucide-react";
import {
  createTripAction,
  updateTripAction,
  type TripsActionResult,
} from "@/features/trips/actions";
import { TripTravelerProfileFields } from "@/features/trips/activities/components/trip-traveler-profile-fields";
import type { TripTravelerProfileDto } from "@/features/trips/activities/activity-types";
import type { TripDto } from "@/features/trips/types";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { FormField, FormSection } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: TripsActionResult | undefined = undefined;

const selectClassName =
  "border-input bg-card text-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3";

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
  travelerProfile?: TripTravelerProfileDto | null;
};

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function toCoord(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function placeDefaults(
  address: string,
  placeId: string | null,
  latitude: string | null,
  longitude: string | null,
  city: string | null,
  province: string | null,
  postalCode: string | null,
  country: string | null,
) {
  const lat = toCoord(latitude);
  const lng = toCoord(longitude);
  if (!placeId && lat == null && lng == null) return null;
  return {
    formattedAddress: address,
    placeId: placeId ?? "",
    latitude: lat ?? Number.NaN,
    longitude: lng ?? Number.NaN,
    streetNumber: null as string | null,
    route: null as string | null,
    city,
    province,
    postalCode,
    country,
  };
}

export function TripForm({
  vehicles,
  groups = [],
  trip,
  travelerProfile = null,
}: TripFormProps) {
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
    <form
      action={formAction}
      className="flex flex-col gap-5 lg:flex-row lg:items-start"
    >
      {trip ? <input type="hidden" name="id" value={trip.id} /> : null}

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <FormSection
          title="Informations générales"
          description="Nommez votre voyage pour le retrouver facilement."
          icon={<NotebookPen />}
        >
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
        </FormSection>

        <FormSection
          title="Véhicule et voyageurs"
          description="Le véhicule est obligatoire ; le groupe est optionnel."
          icon={<UsersRound />}
        >
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
        </FormSection>

        <FormSection
          title="Itinéraire"
          description="Départ et destination avec autocomplétion d’adresses."
          icon={<MapPinned />}
        >
          <FormField htmlFor="trip-origin" label="Départ" required>
            <AddressAutocomplete
              id="trip-origin"
              name="origin"
              required
              defaultValue={trip?.origin ?? ""}
              defaultSelection={
                trip
                  ? placeDefaults(
                      trip.origin,
                      trip.originPlaceId,
                      trip.originLatitude,
                      trip.originLongitude,
                      trip.originCity,
                      trip.originProvince,
                      trip.originPostalCode,
                      trip.originCountry,
                    )
                  : null
              }
              placeholder="Ville ou adresse"
            />
          </FormField>

          <FormField htmlFor="trip-destination" label="Destination" required>
            <AddressAutocomplete
              id="trip-destination"
              name="destination"
              required
              defaultValue={trip?.destination ?? ""}
              defaultSelection={
                trip
                  ? placeDefaults(
                      trip.destination,
                      trip.destinationPlaceId,
                      trip.destinationLatitude,
                      trip.destinationLongitude,
                      trip.destinationCity,
                      trip.destinationProvince,
                      trip.destinationPostalCode,
                      trip.destinationCountry,
                    )
                  : null
              }
              placeholder="Ville ou adresse"
            />
          </FormField>
        </FormSection>

        <FormSection
          title="Dates"
          description="Planifiez le départ et le retour éventuel."
          icon={<CalendarRange />}
        >
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
        </FormSection>

        <FormSection
          title="Budget"
          description="Montant prévu pour ce voyage (CAD)."
          icon={<Wallet />}
        >
          <FormField
            htmlFor="trip-budget"
            label="Budget prévu (CAD)"
            className="sm:col-span-2"
          >
            <Input
              id="trip-budget"
              name="plannedBudget"
              type="number"
              step="0.01"
              min="0"
              defaultValue={trip?.plannedBudget ?? ""}
            />
          </FormField>
        </FormSection>

        <TripTravelerProfileFields initial={travelerProfile} />

        {state?.ok === false && (
          <p className="text-destructive text-sm" role="alert">
            {state.message}
          </p>
        )}
        {state?.ok && (
          <p
            className="dark:text-sebavio-sage text-sm text-emerald-700"
            role="status"
          >
            {state.message}
          </p>
        )}

        <div className="border-sebavio-sand/40 flex flex-wrap gap-2 border-t pt-4 dark:border-white/10">
          <Button type="submit" size="lg" disabled={pending}>
            {pending
              ? "Enregistrement…"
              : isEdit
                ? "Enregistrer"
                : "Créer le voyage"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            render={
              <Link
                href={trip ? `/dashboard/trips/${trip.id}` : "/dashboard/trips"}
              />
            }
          >
            Retour
          </Button>
        </div>
      </div>

      <aside className="border-sebavio-sand/50 bg-card/90 dark:bg-card/70 hidden w-full max-w-sm shrink-0 rounded-[var(--radius-card)] border p-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-24 lg:block dark:border-white/10">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Résumé
        </p>
        <h3 className="font-heading text-sebavio-navy dark:text-foreground mt-2 text-lg font-semibold">
          {isEdit ? trip?.title : "Nouveau voyage"}
        </h3>
        <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
          <li>
            Statut :{" "}
            <span className="text-foreground font-medium">
              {isEdit ? "Modification" : "Planifié à la création"}
            </span>
          </li>
          <li>Véhicule et groupe dans la section dédiée</li>
          <li>Itinéraire avec adresses Google Places</li>
          <li>Budget optionnel en dollars canadiens</li>
        </ul>
      </aside>
    </form>
  );
}
