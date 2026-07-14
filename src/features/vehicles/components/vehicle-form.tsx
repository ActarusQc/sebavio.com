"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createVehicleAction,
  updateVehicleAction,
  type VehiclesActionResult,
} from "@/features/vehicles/actions";
import { VEHICLE_CATEGORIES } from "@/features/vehicle-catalog/constants";
import type {
  ManufacturerDto,
  VehicleModelDto,
} from "@/features/vehicle-catalog/types";
import type { UserVehicleDto } from "@/features/vehicles/types";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: VehiclesActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type VehicleFormProps = {
  manufacturers: ManufacturerDto[];
  models: VehicleModelDto[];
  vehicle?: UserVehicleDto;
};

export function VehicleForm({
  manufacturers,
  models,
  vehicle,
}: VehicleFormProps) {
  const router = useRouter();
  const isEdit = Boolean(vehicle);
  const action = isEdit ? updateVehicleAction : createVehicleAction;
  const [state, formAction, pending] = useActionState(action, initial);

  const [isManual, setIsManual] = useState(
    vehicle?.isManualEntry ?? !vehicle?.modelId,
  );
  const [manufacturerId, setManufacturerId] = useState(
    vehicle?.model?.manufacturerId ?? "",
  );

  const filteredModels = useMemo(() => {
    if (!manufacturerId) return models;
    return models.filter((m) => m.manufacturerId === manufacturerId);
  }, [manufacturerId, models]);

  useEffect(() => {
    if (state?.ok && state.id && !isEdit) {
      router.push(`/dashboard/vehicles/${state.id}`);
    }
  }, [state, isEdit, router]);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {vehicle ? <input type="hidden" name="id" value={vehicle.id} /> : null}

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isManualEntry"
            value="true"
            checked={isManual}
            onChange={(e) => setIsManual(e.target.checked)}
          />
          Saisie manuelle (modèle hors catalogue)
        </label>
      </div>

      {!isManual ? (
        <>
          <FormField htmlFor="veh-mfr" label="Constructeur" required>
            <select
              id="veh-mfr"
              className={selectClassName}
              value={manufacturerId}
              onChange={(e) => setManufacturerId(e.target.value)}
              required
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
          <FormField htmlFor="veh-model" label="Modèle catalogue" required>
            <select
              id="veh-model"
              name="modelId"
              className={selectClassName}
              defaultValue={vehicle?.modelId ?? ""}
              required
            >
              <option value="" disabled>
                Choisir…
              </option>
              {filteredModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.modelName}
                  {m.trim ? ` ${m.trim}` : ""} ({m.year})
                </option>
              ))}
            </select>
          </FormField>
        </>
      ) : (
        <>
          <FormField htmlFor="veh-man-mfr" label="Marque" required>
            <Input
              id="veh-man-mfr"
              name="manualManufacturerName"
              required
              maxLength={150}
              defaultValue={vehicle?.manualManufacturerName ?? ""}
            />
          </FormField>
          <FormField htmlFor="veh-man-model" label="Modèle" required>
            <Input
              id="veh-man-model"
              name="manualModelName"
              required
              maxLength={150}
              defaultValue={vehicle?.manualModelName ?? ""}
            />
          </FormField>
          <FormField htmlFor="veh-man-year" label="Année" required>
            <Input
              id="veh-man-year"
              name="manualYear"
              type="number"
              required
              min={1950}
              max={2100}
              defaultValue={vehicle?.manualYear ?? ""}
            />
          </FormField>
          <FormField htmlFor="veh-man-cat" label="Catégorie">
            <select
              id="veh-man-cat"
              name="manualCategory"
              className={selectClassName}
              defaultValue={vehicle?.manualCategory ?? ""}
            >
              <option value="">—</option>
              {VEHICLE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
          <FormField htmlFor="veh-man-trim" label="Version">
            <Input
              id="veh-man-trim"
              name="manualTrim"
              maxLength={150}
              defaultValue={vehicle?.manualTrim ?? ""}
            />
          </FormField>
          {isEdit ? (
            <p className="text-muted-foreground text-xs sm:col-span-2">
              Pour lier ce véhicule au catalogue, décochez « Saisie manuelle »
              et choisissez un modèle.
            </p>
          ) : null}
        </>
      )}

      <FormField htmlFor="veh-nick" label="Surnom">
        <Input
          id="veh-nick"
          name="nickname"
          maxLength={100}
          defaultValue={vehicle?.nickname ?? ""}
        />
      </FormField>
      <FormField htmlFor="veh-odo" label="Kilométrage" required={!isEdit}>
        <Input
          id="veh-odo"
          name="currentOdometer"
          type="number"
          min={0}
          required={!isEdit}
          defaultValue={vehicle?.currentOdometer ?? ""}
        />
      </FormField>
      <FormField htmlFor="veh-vin" label="VIN">
        <Input
          id="veh-vin"
          name="vin"
          maxLength={17}
          defaultValue={vehicle?.vin ?? ""}
        />
      </FormField>
      <FormField htmlFor="veh-plate" label="Plaque">
        <Input
          id="veh-plate"
          name="licensePlate"
          maxLength={20}
          defaultValue={vehicle?.licensePlate ?? ""}
        />
      </FormField>
      <FormField htmlFor="veh-purchase-date" label="Date d'achat">
        <Input
          id="veh-purchase-date"
          name="purchaseDate"
          type="date"
          defaultValue={vehicle?.purchaseDate ?? ""}
        />
      </FormField>
      <FormField htmlFor="veh-purchase-price" label="Prix d'achat">
        <Input
          id="veh-purchase-price"
          name="purchasePrice"
          type="number"
          step="0.01"
          min={0}
          defaultValue={vehicle?.purchasePrice ?? ""}
        />
      </FormField>
      <FormField htmlFor="veh-conso" label="Conso réelle (L/100 km)">
        <Input
          id="veh-conso"
          name="realAvgConsumption"
          type="number"
          step="0.01"
          min={0}
          defaultValue={vehicle?.realAvgConsumption ?? ""}
        />
      </FormField>
      <FormField htmlFor="veh-tank" label="Capacité réservoir (L)">
        <Input
          id="veh-tank"
          name="tankCapacityOverride"
          type="number"
          step="0.01"
          min={0}
          defaultValue={vehicle?.tankCapacityOverride ?? ""}
        />
      </FormField>

      {!isEdit ? (
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="primaryVehicle" value="true" />
          Définir comme véhicule principal
        </label>
      ) : null}

      {state?.ok === false ? (
        <p className="text-destructive text-sm sm:col-span-2" role="alert">
          {state.message}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-700 sm:col-span-2" role="status">
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Enregistrement…"
            : isEdit
              ? "Enregistrer"
              : "Créer le véhicule"}
        </Button>
      </div>
    </form>
  );
}
