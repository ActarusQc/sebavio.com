"use client";

import { useActionState, useState } from "react";
import {
  clearHomeAddressAction,
  upsertHomeAddressAction,
  type UsersActionResult,
} from "@/features/users/actions";
import type { HomeAddressDto } from "@/features/users/types";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { FormField } from "@/components/common";
import { Button } from "@/components/ui";

const initial: UsersActionResult | undefined = undefined;

type Props = {
  homeAddress: HomeAddressDto | null;
};

export function HomeAddressForm({ homeAddress }: Props) {
  const [editing, setEditing] = useState(!homeAddress);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selected, setSelected] = useState(Boolean(homeAddress?.placeId));

  const [saveState, saveAction, savePending] = useActionState(
    upsertHomeAddressAction,
    initial,
  );
  const [clearState, clearAction, clearPending] = useActionState(
    clearHomeAddressAction,
    initial,
  );

  const status = saveState ?? clearState;

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <p className="text-sebavio-slate text-sm">
        Cette adresse peut être utilisée comme point de départ proposé lors de
        la planification de vos voyages.
      </p>

      {homeAddress && !editing ? (
        <div className="rounded-xl border border-[#e8eef3] bg-[#fafbfc] px-4 py-3">
          <p className="text-sebavio-navy text-sm font-medium">
            {homeAddress.city
              ? `Domicile — ${homeAddress.city}`
              : "Domicile enregistré"}
          </p>
          <p className="text-sebavio-slate mt-1 text-xs">{homeAddress.label}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Modifier
            </Button>
            {!confirmDelete ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                Supprimer
              </Button>
            ) : (
              <form action={clearAction} className="flex gap-2">
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={clearPending}
                >
                  Confirmer la suppression
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Annuler
                </Button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <form action={saveAction} className="flex flex-col gap-3">
          <FormField
            htmlFor="home-address"
            label="Adresse de domicile"
            required
          >
            <AddressAutocomplete
              id="home-address"
              name="homeAddressLabel"
              geoNamePrefix="homeAddress"
              placeholder="Entrez une adresse ou une ville"
              defaultValue={homeAddress?.label ?? ""}
              defaultSelection={
                homeAddress
                  ? {
                      formattedAddress: homeAddress.label,
                      placeId: homeAddress.placeId,
                      latitude: homeAddress.latitude,
                      longitude: homeAddress.longitude,
                      city: homeAddress.city,
                      province: homeAddress.province,
                      postalCode: homeAddress.postalCode,
                      country: homeAddress.country,
                    }
                  : null
              }
              onAddressSelect={(addr) => setSelected(Boolean(addr?.placeId))}
              required
            />
          </FormField>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={savePending || !selected}
              className="bg-sebavio-navy hover:bg-sebavio-navy/90 text-white"
            >
              {savePending ? "Enregistrement…" : "Enregistrer l’adresse"}
            </Button>
            {homeAddress ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(false)}
              >
                Annuler
              </Button>
            ) : null}
          </div>
        </form>
      )}

      {status?.ok === false ? (
        <p className="text-sm text-red-700" role="alert">
          {status.message}
        </p>
      ) : null}
      {status?.ok === true && status.message ? (
        <p className="text-sm text-emerald-800" role="status">
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
