"use client";

import { useState } from "react";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

type OverridableNumberFieldProps = {
  id: string;
  name: string;
  label: string;
  unit?: string;
  suggestedValue: number | null;
  customValue: number | null;
  /** Valeur affichée initiale (effective). */
  defaultValue?: string | number | null;
  suggestedLabel?: string;
  min?: number;
  max?: number;
  step?: string;
  required?: boolean;
  disabled?: boolean;
  inputMode?: "decimal" | "numeric";
  placeholder?: string;
  hint?: string;
};

/**
 * Champ avec indication constructeur / personnalisé + action rétablir.
 */
export function OverridableNumberField({
  id,
  name,
  label,
  unit,
  suggestedValue,
  customValue,
  defaultValue,
  suggestedLabel = "Valeur suggérée",
  min,
  max,
  step = "0.01",
  required,
  disabled,
  inputMode = "decimal",
  placeholder,
  hint,
}: OverridableNumberFieldProps) {
  const initial =
    defaultValue != null && defaultValue !== ""
      ? String(defaultValue)
      : customValue != null
        ? String(customValue)
        : suggestedValue != null
          ? String(suggestedValue)
          : "";

  const [value, setValue] = useState(initial);
  const [clearedCustom, setClearedCustom] = useState(false);

  const numeric = (() => {
    const n = Number(String(value).trim().replace(",", "."));
    return Number.isFinite(n) ? n : null;
  })();

  const isCustom =
    !clearedCustom &&
    ((customValue != null &&
      (numeric == null ||
        Math.abs(numeric - customValue) < 0.001 ||
        value !== "")) ||
      (suggestedValue != null &&
        numeric != null &&
        Math.abs(numeric - suggestedValue) > 0.001) ||
      (suggestedValue == null && numeric != null && customValue != null));

  const showSuggested =
    suggestedValue != null &&
    (isCustom || customValue != null || !clearedCustom);

  function restoreSuggested() {
    setClearedCustom(true);
    setValue(suggestedValue != null ? String(suggestedValue) : "");
  }

  return (
    <FormField htmlFor={id} label={label} required={required}>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          name={name}
          type="text"
          inputMode={inputMode}
          min={min}
          max={max}
          step={step}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            setClearedCustom(false);
            setValue(e.target.value);
          }}
          className="flex-1"
        />
        {unit ? (
          <span className="text-muted-foreground shrink-0 text-sm">{unit}</span>
        ) : null}
      </div>
      {/* Envoi null explicite pour rétablir (champ vide + flag). */}
      {clearedCustom ? (
        <input type="hidden" name={`${name}__reset`} value="1" />
      ) : null}
      {customValue != null && !clearedCustom ? (
        <input type="hidden" name={`${name}__keep`} value="1" />
      ) : null}
      {suggestedValue != null && name === "customConsumptionL100" ? (
        <input
          type="hidden"
          name="manufacturerConsumptionHint"
          value={suggestedValue}
        />
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {isCustom ? (
          <span className="font-medium text-amber-800">
            Valeur personnalisée
          </span>
        ) : showSuggested && suggestedValue != null ? (
          <span className="text-muted-foreground">
            {suggestedLabel} : {formatFr(suggestedValue)}
            {unit ? ` ${unit}` : ""}
          </span>
        ) : null}
        {(isCustom || customValue != null) && suggestedValue != null ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-0 py-0 text-xs"
            onClick={restoreSuggested}
          >
            Rétablir la valeur suggérée
          </Button>
        ) : null}
      </div>
      {hint ? (
        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
      ) : null}
    </FormField>
  );
}

function formatFr(n: number): string {
  return n.toLocaleString("fr-CA", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(n) ? 0 : 1,
  });
}

export const FUEL_TYPE_OPTIONS = [
  { value: "regular", label: "Essence ordinaire" },
  { value: "premium", label: "Essence super" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Électrique" },
  { value: "ethanol", label: "Éthanol (E85)" },
  { value: "natural_gas", label: "Gaz naturel" },
  { value: "hybrid", label: "Hybride" },
  { value: "plugin_hybrid", label: "Hybride rechargeable" },
] as const;

type OverridableFuelTypeFieldProps = {
  manufacturerFuelType: string | null;
  customFuelType: string | null;
  effectiveFuelType: string | null;
  disabled?: boolean;
};

export function OverridableFuelTypeField({
  manufacturerFuelType,
  customFuelType,
  effectiveFuelType,
  disabled,
}: OverridableFuelTypeFieldProps) {
  const [value, setValue] = useState(
    effectiveFuelType ?? manufacturerFuelType ?? "regular",
  );
  const [reset, setReset] = useState(false);

  const isCustom =
    !reset &&
    customFuelType != null &&
    customFuelType !== "" &&
    customFuelType !== manufacturerFuelType;

  const labelFor = (v: string | null) =>
    FUEL_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v ?? "—";

  return (
    <FormField htmlFor="veh-fuel-eff" label="Type de carburant">
      <select
        id="veh-fuel-eff"
        name={
          reset || (manufacturerFuelType && value === manufacturerFuelType)
            ? undefined
            : "customFuelType"
        }
        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3"
        disabled={disabled}
        value={reset ? (manufacturerFuelType ?? "regular") : value}
        onChange={(e) => {
          setReset(false);
          setValue(e.target.value);
        }}
      >
        {FUEL_TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {manufacturerFuelType ? (
        <input
          type="hidden"
          name="manufacturerFuelType"
          value={manufacturerFuelType}
        />
      ) : null}
      {reset || (manufacturerFuelType && value === manufacturerFuelType) ? (
        <input type="hidden" name="customFuelType" value="" />
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {isCustom ? (
          <span className="font-medium text-amber-800">
            Valeur personnalisée
          </span>
        ) : manufacturerFuelType ? (
          <span className="text-muted-foreground">
            Valeur suggérée : {labelFor(manufacturerFuelType)}
          </span>
        ) : null}
        {isCustom && manufacturerFuelType ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-0 py-0 text-xs"
            onClick={() => {
              setReset(true);
              setValue(manufacturerFuelType);
            }}
          >
            Rétablir la valeur suggérée
          </Button>
        ) : null}
      </div>
    </FormField>
  );
}
