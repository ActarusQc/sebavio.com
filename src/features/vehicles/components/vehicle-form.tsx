"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createVehicleAction,
  updateVehicleAction,
  type VehiclesActionResult,
} from "@/features/vehicles/actions";
import { VEHICLE_CATEGORIES } from "@/features/vehicle-catalog/constants";
import { NrcanVehiclePicker } from "@/features/fuel-vehicle-catalog/components/nrcan-vehicle-picker";
import { VinDecodePanel } from "@/features/vehicle-maintenance/components/vin-decode-panel";
import type { UserVehicleDto } from "@/features/vehicles/types";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";
import {
  FUEL_TYPE_OPTIONS,
  OverridableFuelTypeField,
  OverridableNumberField,
} from "@/features/vehicles/components/overridable-spec-field";

const initial: VehiclesActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type VehicleFormProps = {
  vehicle?: UserVehicleDto;
};

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter();
  const isEdit = Boolean(vehicle);
  const action = isEdit ? updateVehicleAction : createVehicleAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  const [mode, setMode] = useState<"catalog" | "manual">(() => {
    if (vehicle?.isManualEntry && !vehicle.catalogEntryId) return "manual";
    if (vehicle?.catalogEntryId) return "catalog";
    if (vehicle?.modelId && !vehicle.catalogEntryId) return "manual";
    return "catalog";
  });

  useEffect(() => {
    if (state?.ok && state.id && !isEdit) {
      router.push(`/dashboard/vehicles/${state.id}`);
    }
  }, [state, isEdit, router]);

  const manufacturerConso =
    vehicle?.effectiveSpecs.manufacturerConsumptionL100 ??
    (vehicle?.officialCombinedConsumptionL100 != null
      ? Number(vehicle.officialCombinedConsumptionL100)
      : null);
  const customConso =
    vehicle?.customConsumptionL100 != null
      ? Number(vehicle.customConsumptionL100)
      : null;
  const manufacturerTank =
    vehicle?.effectiveSpecs.manufacturerTankCapacityL ??
    (vehicle?.manufacturerTankCapacityL != null
      ? Number(vehicle.manufacturerTankCapacityL)
      : null);
  const customTank =
    vehicle?.tankCapacityOverride != null
      ? Number(vehicle.tankCapacityOverride)
      : null;

  const isElectricish =
    (vehicle?.effectiveSpecs.fuelType ?? vehicle?.fuelType)?.includes(
      "electric",
    ) ||
    vehicle?.effectiveSpecs.fuelType === "plugin_hybrid" ||
    Boolean(vehicle?.catalogElectricRangeKm);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {vehicle ? <input type="hidden" name="id" value={vehicle.id} /> : null}

      {mode === "catalog" && !isEdit ? (
        <NrcanVehiclePicker
          disabled={pending}
          onManualFallback={() => setMode("manual")}
        />
      ) : null}

      {mode === "catalog" && isEdit && vehicle?.catalogEntryId ? (
        <div className="bg-muted/40 rounded-lg border p-3 text-sm sm:col-span-2">
          <input
            type="hidden"
            name="catalogEntryId"
            value={vehicle.catalogEntryId}
          />
          <input type="hidden" name="isManualEntry" value="false" />
          <p className="font-medium">{vehicle.displayName}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Configuration catalogue NRCan conservée. Les caractéristiques
            ci-dessous restent modifiables pour coller à votre véhicule.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => setMode("manual")}
          >
            Passer en saisie manuelle
          </Button>
        </div>
      ) : null}

      {mode === "manual" ? (
        <>
          <input type="hidden" name="isManualEntry" value="true" />
          <input
            type="hidden"
            name="consumptionDataSource"
            value="user_manual"
          />
          <p className="text-muted-foreground text-sm sm:col-span-2">
            Saisie manuelle — source : user_manual. Les données ne proviennent
            pas du catalogue officiel canadien.
          </p>
          {!isEdit ? (
            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("catalog")}
              >
                Revenir au catalogue officiel
              </Button>
            </div>
          ) : null}
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
          <FormField htmlFor="veh-man-trim" label="Configuration / version">
            <Input
              id="veh-man-trim"
              name="manualTrim"
              maxLength={150}
              defaultValue={vehicle?.manualTrim ?? ""}
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
          <FormField
            htmlFor="veh-fuel-manual"
            label="Type de carburant"
            required
          >
            <select
              id="veh-fuel-manual"
              name="fuelType"
              className={selectClassName}
              required
              defaultValue={vehicle?.fuelType ?? "regular"}
            >
              {FUEL_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            htmlFor="veh-off-combined"
            label="Consommation combinée (L/100 km)"
            required
          >
            <Input
              id="veh-off-combined"
              name="officialCombinedConsumptionL100"
              type="text"
              inputMode="decimal"
              required
              defaultValue={vehicle?.officialCombinedConsumptionL100 ?? ""}
            />
          </FormField>
          <FormField
            htmlFor="veh-off-city"
            label="Consommation ville (L/100 km)"
          >
            <Input
              id="veh-off-city"
              name="officialCityConsumptionL100"
              type="text"
              inputMode="decimal"
              defaultValue={vehicle?.officialCityConsumptionL100 ?? ""}
            />
          </FormField>
          <FormField
            htmlFor="veh-off-hwy"
            label="Consommation route (L/100 km)"
          >
            <Input
              id="veh-off-hwy"
              name="officialHighwayConsumptionL100"
              type="text"
              inputMode="decimal"
              defaultValue={vehicle?.officialHighwayConsumptionL100 ?? ""}
            />
          </FormField>
        </>
      ) : null}

      <FormField htmlFor="veh-nick" label="Surnom">
        <Input
          id="veh-nick"
          name="nickname"
          maxLength={100}
          defaultValue={vehicle?.nickname ?? ""}
        />
      </FormField>
      <FormField
        htmlFor="veh-odo"
        label="Kilométrage actuel"
        required={!isEdit}
      >
        <Input
          id="veh-odo"
          name="currentOdometer"
          type="number"
          min={0}
          required={!isEdit}
          defaultValue={vehicle?.currentOdometer ?? ""}
        />
      </FormField>

      <FormField htmlFor="veh-engine" label="Version / motorisation">
        <Input
          id="veh-engine"
          name="engine"
          maxLength={150}
          defaultValue={vehicle?.engine ?? ""}
          placeholder="ex. 2.0L turbo"
        />
      </FormField>

      {isEdit && mode === "catalog" ? (
        <FormField htmlFor="veh-year-edit" label="Année">
          <Input
            id="veh-year-edit"
            name="manualYear"
            type="number"
            min={1950}
            max={2100}
            defaultValue={vehicle?.manualYear ?? ""}
          />
        </FormField>
      ) : null}

      {isEdit && mode === "catalog" ? (
        <FormField htmlFor="veh-trim-edit" label="Version / configuration">
          <Input
            id="veh-trim-edit"
            name="manualTrim"
            maxLength={150}
            defaultValue={vehicle?.manualTrim ?? ""}
          />
        </FormField>
      ) : null}

      <VinDecodePanel defaultVin={vehicle?.vin ?? ""} />

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

      <div className="border-t pt-4 sm:col-span-2">
        <h3 className="mb-3 text-sm font-semibold">
          Caractéristiques pour les calculs
        </h3>
        <p className="text-muted-foreground mb-4 text-xs">
          Les valeurs constructeur / catalogue servent de suggestion. Vous
          pouvez les adapter à la réalité de votre véhicule.
        </p>
      </div>

      {mode === "catalog" || isEdit ? (
        <OverridableFuelTypeField
          manufacturerFuelType={
            vehicle?.manufacturerFuelType ?? vehicle?.fuelType ?? null
          }
          customFuelType={vehicle?.customFuelType ?? null}
          effectiveFuelType={
            vehicle?.effectiveSpecs.fuelType ?? vehicle?.fuelType ?? null
          }
          disabled={pending}
        />
      ) : null}

      <OverridableNumberField
        id="veh-conso"
        name="customConsumptionL100"
        label="Consommation moyenne"
        unit="L/100 km"
        suggestedValue={manufacturerConso}
        customValue={customConso}
        defaultValue={
          customConso ??
          vehicle?.effectiveSpecs.consumptionLPer100Km ??
          manufacturerConso
        }
        min={1}
        max={100}
        step="0.01"
        required={!manufacturerConso}
        hint={
          vehicle?.realAvgConsumption
            ? `Moyenne des pleins : ${vehicle.realAvgConsumption} L/100 km (utilisée si aucune valeur personnalisée).`
            : undefined
        }
      />

      <OverridableNumberField
        id="veh-tank"
        name="tankCapacityOverride"
        label="Capacité du réservoir"
        unit="L"
        suggestedValue={manufacturerTank}
        customValue={customTank}
        defaultValue={customTank ?? manufacturerTank}
        min={10}
        max={500}
        step="0.1"
        required={!customTank && !manufacturerTank}
        hint="Obligatoire pour l'estimation carburant. Le catalogue NRCan ne fournit généralement pas cette donnée."
      />
      {manufacturerTank != null ? (
        <input
          type="hidden"
          name="manufacturerTankCapacityL"
          value={manufacturerTank}
        />
      ) : null}

      {isElectricish ? (
        <>
          <OverridableNumberField
            id="veh-elec-range"
            name="specElectricRangeKm"
            label="Autonomie électrique"
            unit="km"
            suggestedValue={vehicle?.catalogElectricRangeKm ?? null}
            customValue={vehicle?.specOverrides?.electricRangeKm ?? null}
            defaultValue={
              vehicle?.effectiveSpecs.electricRangeKm ??
              vehicle?.catalogElectricRangeKm
            }
            step="1"
            inputMode="numeric"
          />
          <OverridableNumberField
            id="veh-battery"
            name="specBatteryCapacityKwh"
            label="Capacité batterie"
            unit="kWh"
            suggestedValue={null}
            customValue={vehicle?.specOverrides?.batteryCapacityKwh ?? null}
            defaultValue={vehicle?.effectiveSpecs.batteryCapacityKwh}
            step="0.1"
          />
        </>
      ) : null}

      <OverridableNumberField
        id="veh-length"
        name="specLengthM"
        label="Longueur"
        unit="m"
        suggestedValue={
          vehicle?.model
            ? vehicle.effectiveSpecs.lengthM != null &&
              vehicle.specOverrides?.lengthM == null
              ? vehicle.effectiveSpecs.lengthM
              : null
            : null
        }
        customValue={vehicle?.specOverrides?.lengthM ?? null}
        defaultValue={vehicle?.effectiveSpecs.lengthM}
        step="0.01"
      />
      <OverridableNumberField
        id="veh-width"
        name="specWidthM"
        label="Largeur"
        unit="m"
        suggestedValue={null}
        customValue={vehicle?.specOverrides?.widthM ?? null}
        defaultValue={vehicle?.effectiveSpecs.widthM}
        step="0.01"
      />
      <OverridableNumberField
        id="veh-height"
        name="specHeightM"
        label="Hauteur"
        unit="m"
        suggestedValue={null}
        customValue={vehicle?.specOverrides?.heightM ?? null}
        defaultValue={vehicle?.effectiveSpecs.heightM}
        step="0.01"
      />
      <OverridableNumberField
        id="veh-weight"
        name="specWeightKg"
        label="Poids"
        unit="kg"
        suggestedValue={null}
        customValue={vehicle?.specOverrides?.weightKg ?? null}
        defaultValue={vehicle?.effectiveSpecs.weightKg}
        step="1"
        inputMode="numeric"
      />

      {!isEdit ? (
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="primaryVehicle" value="true" />
          Définir comme véhicule principal
        </label>
      ) : null}

      {isEdit ? (
        <div className="rounded-lg border border-dashed p-3 sm:col-span-2">
          {!confirmResetAll ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setConfirmResetAll(true)}
            >
              Rétablir toutes les valeurs constructeur
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm">
                Confirmer le rétablissement de toutes les personnalisations ?
              </p>
              <Button
                type="submit"
                name="resetAllManufacturerSpecs"
                value="true"
                variant="destructive"
                disabled={pending}
              >
                Confirmer
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmResetAll(false)}
              >
                Annuler
              </Button>
            </div>
          )}
        </div>
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
