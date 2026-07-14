"use client";

import { useActionState } from "react";
import {
  createModelAction,
  type CatalogActionResult,
} from "@/features/vehicle-catalog/actions";
import {
  DRIVE_TYPES,
  FUEL_TYPES,
  VEHICLE_CATEGORIES,
} from "@/features/vehicle-catalog/constants";
import type { ManufacturerDto } from "@/features/vehicle-catalog/types";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: CatalogActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type ModelCreateFormProps = {
  manufacturers: ManufacturerDto[];
};

export function ModelCreateForm({ manufacturers }: ModelCreateFormProps) {
  const [state, formAction, pending] = useActionState(
    createModelAction,
    initial,
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <FormField htmlFor="model-mfr" label="Constructeur" required>
        <select
          id="model-mfr"
          name="manufacturerId"
          required
          className={selectClassName}
          defaultValue=""
        >
          <option value="" disabled>
            Choisir…
          </option>
          {manufacturers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField htmlFor="model-category" label="Catégorie" required>
        <select
          id="model-category"
          name="category"
          required
          className={selectClassName}
          defaultValue="Car"
        >
          {VEHICLE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>
      <FormField htmlFor="model-name" label="Nom du modèle" required>
        <Input id="model-name" name="modelName" required maxLength={150} />
      </FormField>
      <FormField htmlFor="model-trim" label="Version (trim)">
        <Input id="model-trim" name="trim" maxLength={150} />
      </FormField>
      <FormField htmlFor="model-year" label="Année" required>
        <Input
          id="model-year"
          name="year"
          type="number"
          required
          min={1950}
          max={2100}
        />
      </FormField>
      <FormField htmlFor="model-fuel" label="Carburant">
        <select
          id="model-fuel"
          name="fuelType"
          className={selectClassName}
          defaultValue=""
        >
          <option value="">—</option>
          {FUEL_TYPES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </FormField>
      <FormField htmlFor="model-engine" label="Moteur">
        <Input id="model-engine" name="engine" maxLength={150} />
      </FormField>
      <FormField htmlFor="model-drive" label="Transmission">
        <select
          id="model-drive"
          name="driveType"
          className={selectClassName}
          defaultValue=""
        >
          <option value="">—</option>
          {DRIVE_TYPES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </FormField>
      <FormField htmlFor="model-consumption" label="Conso. (L/100 km)">
        <Input
          id="model-consumption"
          name="avgConsumption"
          type="number"
          step="0.1"
        />
      </FormField>
      <FormField htmlFor="model-capacity" label="Réservoir (L)">
        <Input
          id="model-capacity"
          name="fuelCapacityL"
          type="number"
          step="0.1"
        />
      </FormField>
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
          {pending ? "Enregistrement…" : "Ajouter le modèle"}
        </Button>
      </div>
    </form>
  );
}
