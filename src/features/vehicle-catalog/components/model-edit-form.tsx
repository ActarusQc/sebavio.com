"use client";

import { useActionState } from "react";
import {
  updateModelAction,
  type CatalogActionResult,
} from "@/features/vehicle-catalog/actions";
import {
  DRIVE_TYPES,
  FUEL_TYPES,
  VEHICLE_CATEGORIES,
} from "@/features/vehicle-catalog/constants";
import type {
  ManufacturerDto,
  VehicleModelDto,
} from "@/features/vehicle-catalog/types";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: CatalogActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type ModelEditFormProps = {
  model: VehicleModelDto;
  manufacturers: ManufacturerDto[];
};

export function ModelEditForm({ model, manufacturers }: ModelEditFormProps) {
  const [state, formAction, pending] = useActionState(
    updateModelAction,
    initial,
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={model.id} />
      <FormField htmlFor="edit-mfr" label="Constructeur" required>
        <select
          id="edit-mfr"
          name="manufacturerId"
          required
          className={selectClassName}
          defaultValue={model.manufacturerId}
        >
          {manufacturers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField htmlFor="edit-category" label="Catégorie" required>
        <select
          id="edit-category"
          name="category"
          required
          className={selectClassName}
          defaultValue={model.category}
        >
          {VEHICLE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>
      <FormField htmlFor="edit-name" label="Nom" required>
        <Input
          id="edit-name"
          name="modelName"
          required
          maxLength={150}
          defaultValue={model.modelName}
        />
      </FormField>
      <FormField htmlFor="edit-trim" label="Version">
        <Input
          id="edit-trim"
          name="trim"
          maxLength={150}
          defaultValue={model.trim}
        />
      </FormField>
      <FormField htmlFor="edit-year" label="Année" required>
        <Input
          id="edit-year"
          name="year"
          type="number"
          required
          min={1950}
          max={2100}
          defaultValue={model.year}
        />
      </FormField>
      <FormField htmlFor="edit-fuel" label="Carburant">
        <select
          id="edit-fuel"
          name="fuelType"
          className={selectClassName}
          defaultValue={model.fuelType ?? ""}
        >
          <option value="">—</option>
          {FUEL_TYPES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </FormField>
      <FormField htmlFor="edit-engine" label="Moteur">
        <Input
          id="edit-engine"
          name="engine"
          maxLength={150}
          defaultValue={model.engine ?? ""}
        />
      </FormField>
      <FormField htmlFor="edit-drive" label="Transmission">
        <select
          id="edit-drive"
          name="driveType"
          className={selectClassName}
          defaultValue={model.driveType ?? ""}
        >
          <option value="">—</option>
          {DRIVE_TYPES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </FormField>
      <FormField htmlFor="edit-consumption" label="Conso. (L/100 km)">
        <Input
          id="edit-consumption"
          name="avgConsumption"
          type="number"
          step="0.1"
          defaultValue={model.avgConsumption ?? ""}
        />
      </FormField>
      <FormField htmlFor="edit-capacity" label="Réservoir (L)">
        <Input
          id="edit-capacity"
          name="fuelCapacityL"
          type="number"
          step="0.1"
          defaultValue={model.fuelCapacityL ?? ""}
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
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
