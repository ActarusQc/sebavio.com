"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createVehicleAction,
  updateVehicleAction,
  type VehiclesActionResult,
} from "@/features/vehicles/actions";
import { VEHICLE_CATEGORIES } from "@/features/vehicle-catalog/constants";
import {
  NrcanVehiclePicker,
  type NrcanSelectionPayload,
} from "@/features/fuel-vehicle-catalog/components/nrcan-vehicle-picker";
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

type SpecsEstimateResult = {
  consumptionL100: number | null;
  tankCapacityL: number | null;
  sources: {
    consumption: "nrcan" | "ai_estimate" | "catalog_cache" | null;
    tankCapacity: "nrcan" | "ai_estimate" | "catalog_cache" | null;
  };
  confidence: "high" | "medium" | "low" | null;
};

type VehicleFormProps = {
  vehicle?: UserVehicleDto;
};

function sourceHint(
  source: SpecsEstimateResult["sources"]["consumption"],
): string | undefined {
  if (source === "nrcan") return "Source : NRCan";
  if (source === "ai_estimate") return "Source : IA (estimé)";
  if (source === "catalog_cache") return "Source : cache";
  return undefined;
}

async function fetchSpecsEstimate(
  body: Record<string, unknown>,
): Promise<SpecsEstimateResult | null> {
  const res = await fetch("/api/v1/vehicles/specs-estimate", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: SpecsEstimateResult };
  return json.data ?? null;
}

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

  const [manualMake, setManualMake] = useState(
    vehicle?.manualManufacturerName ?? "",
  );
  const [manualModel, setManualModel] = useState(
    vehicle?.manualModelName ?? "",
  );
  const [manualYear, setManualYear] = useState(
    vehicle?.manualYear != null ? String(vehicle.manualYear) : "",
  );
  const [manualTrim, setManualTrim] = useState(vehicle?.manualTrim ?? "");
  const [manualFuelType, setManualFuelType] = useState(
    vehicle?.fuelType ?? "regular",
  );
  const [officialCombined, setOfficialCombined] = useState(
    vehicle?.officialCombinedConsumptionL100 ?? "",
  );
  const [officialCombinedDirty, setOfficialCombinedDirty] = useState(false);

  const [estimate, setEstimate] = useState<SpecsEstimateResult | null>(null);
  const [estimateToken, setEstimateToken] = useState(0);
  const [estimating, setEstimating] = useState(false);
  const [dirtyConso, setDirtyConso] = useState(false);
  const [dirtyTank, setDirtyTank] = useState(false);
  const estimateSeq = useRef(0);
  const editEstimateStarted = useRef(false);

  useEffect(() => {
    if (state?.ok && state.id && !isEdit) {
      router.push(`/dashboard/vehicles/${state.id}`);
    }
  }, [state, isEdit, router]);

  async function runEstimate(body: Record<string, unknown>) {
    const seq = ++estimateSeq.current;
    setEstimating(true);
    try {
      const data = await fetchSpecsEstimate(body);
      if (seq !== estimateSeq.current) return;
      if (!data) return;
      setEstimate(data);
      setEstimateToken((t) => t + 1);
      if (
        !officialCombinedDirty &&
        data.consumptionL100 != null &&
        mode === "manual"
      ) {
        setOfficialCombined(String(data.consumptionL100));
      }
    } finally {
      if (seq === estimateSeq.current) setEstimating(false);
    }
  }

  function handleCatalogSelection(selection: NrcanSelectionPayload | null) {
    if (!selection) return;
    void runEstimate({
      catalogEntryId: selection.catalogEntryId,
      make: selection.make,
      model: selection.model,
      year: selection.year,
      configuration: selection.configuration,
      fuelType: selection.fuelType,
    });
  }

  useEffect(() => {
    if (mode !== "manual") return;
    const make = manualMake.trim();
    const model = manualModel.trim();
    const year = Number(manualYear);
    if (!make || !model || !Number.isFinite(year) || year < 1950) return;

    const handle = window.setTimeout(() => {
      void runEstimate({
        make,
        model,
        year,
        configuration: manualTrim.trim() || null,
        fuelType: manualFuelType || null,
      });
    }, 600);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce manuel volontaire
  }, [mode, manualMake, manualModel, manualYear, manualTrim, manualFuelType]);

  useEffect(() => {
    if (!isEdit || !vehicle?.catalogEntryId || mode !== "catalog") return;
    if (editEstimateStarted.current) return;
    editEstimateStarted.current = true;
    const catalogEntryId = vehicle.catalogEntryId;
    const handle = window.setTimeout(() => {
      void runEstimate({ catalogEntryId });
    }, 0);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une fois à l’édition catalogue
  }, [isEdit, vehicle?.catalogEntryId, mode]);

  const manufacturerConso =
    estimate?.consumptionL100 ??
    vehicle?.effectiveSpecs.manufacturerConsumptionL100 ??
    (vehicle?.officialCombinedConsumptionL100 != null
      ? Number(vehicle.officialCombinedConsumptionL100)
      : null);
  const customConso =
    vehicle?.customConsumptionL100 != null
      ? Number(vehicle.customConsumptionL100)
      : null;
  const manufacturerTank =
    estimate?.tankCapacityL ??
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
    Boolean(vehicle?.catalogElectricRangeKm) ||
    manualFuelType === "electric";

  const consoHint =
    sourceHint(estimate?.sources.consumption ?? null) ??
    (vehicle?.realAvgConsumption
      ? `Moyenne des pleins : ${vehicle.realAvgConsumption} L/100 km (utilisée si aucune valeur personnalisée).`
      : undefined);

  const tankHint =
    sourceHint(estimate?.sources.tankCapacity ?? null) ??
    "Utile pour l'estimation carburant. Le catalogue NRCan ne fournit généralement pas cette donnée.";

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {vehicle ? <input type="hidden" name="id" value={vehicle.id} /> : null}

      {mode === "catalog" && !isEdit ? (
        <NrcanVehiclePicker
          disabled={pending}
          onManualFallback={() => setMode("manual")}
          onSelectionChange={handleCatalogSelection}
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
              value={manualMake}
              onChange={(e) => setManualMake(e.target.value)}
            />
          </FormField>
          <FormField htmlFor="veh-man-model" label="Modèle" required>
            <Input
              id="veh-man-model"
              name="manualModelName"
              required
              maxLength={150}
              value={manualModel}
              onChange={(e) => setManualModel(e.target.value)}
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
              value={manualYear}
              onChange={(e) => setManualYear(e.target.value)}
            />
          </FormField>
          <FormField htmlFor="veh-man-trim" label="Configuration / version">
            <Input
              id="veh-man-trim"
              name="manualTrim"
              maxLength={150}
              value={manualTrim}
              onChange={(e) => setManualTrim(e.target.value)}
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
              value={manualFuelType}
              onChange={(e) => setManualFuelType(e.target.value)}
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
          >
            <Input
              id="veh-off-combined"
              name="officialCombinedConsumptionL100"
              type="text"
              inputMode="decimal"
              value={officialCombined}
              onChange={(e) => {
                setOfficialCombinedDirty(true);
                setOfficialCombined(e.target.value);
              }}
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
      <FormField htmlFor="veh-odo" label="Kilométrage actuel">
        <Input
          id="veh-odo"
          name="currentOdometer"
          type="number"
          min={0}
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

      <div className="border-t pt-4 sm:col-span-2">
        <h3 className="mb-3 text-sm font-semibold">
          Caractéristiques pour les calculs
        </h3>
        <p className="text-muted-foreground mb-4 text-xs">
          Les valeurs constructeur / catalogue servent de suggestion. Vous
          pouvez les adapter à la réalité de votre véhicule.
          {estimating ? " Estimation en cours…" : null}
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
        key={dirtyConso ? "conso-user" : `conso-${estimateToken}`}
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
        onDirtyChange={setDirtyConso}
        hint={consoHint}
      />

      <OverridableNumberField
        key={dirtyTank ? "tank-user" : `tank-${estimateToken}`}
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
        onDirtyChange={setDirtyTank}
        hint={tankHint}
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
