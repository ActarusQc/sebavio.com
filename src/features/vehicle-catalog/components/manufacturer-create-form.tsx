"use client";

import { useActionState } from "react";
import {
  createManufacturerAction,
  type CatalogActionResult,
} from "@/features/vehicle-catalog/actions";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: CatalogActionResult | undefined = undefined;

export function ManufacturerCreateForm() {
  const [state, formAction, pending] = useActionState(
    createManufacturerAction,
    initial,
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <FormField htmlFor="mfr-name" label="Nom" required>
        <Input id="mfr-name" name="name" required maxLength={150} />
      </FormField>
      <FormField htmlFor="mfr-country" label="Pays (ISO)">
        <Input
          id="mfr-country"
          name="countryCode"
          maxLength={2}
          placeholder="CA"
        />
      </FormField>
      <FormField htmlFor="mfr-website" label="Site web">
        <Input id="mfr-website" name="website" type="url" />
      </FormField>
      <FormField htmlFor="mfr-support" label="URL support">
        <Input id="mfr-support" name="supportUrl" type="url" />
      </FormField>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="active" defaultChecked />
        Actif
      </label>
      {state?.ok === false ? (
        <p className="text-destructive text-sm sm:col-span-2">
          {state.message}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="text-sm text-green-700 sm:col-span-2">{state.message}</p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Ajouter le constructeur"}
        </Button>
      </div>
    </form>
  );
}
