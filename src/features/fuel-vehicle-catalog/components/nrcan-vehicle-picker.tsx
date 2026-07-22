"use client";

import { useEffect, useId, useState } from "react";
import { FormField } from "@/components/common";
import { Button } from "@/components/ui";
import { fuelTypeLabelFr } from "@/features/fuel-vehicle-catalog/domain/normalize";

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type Option = { value: string; label: string };

type Configuration = {
  id: string;
  label: string;
  engineSizeLitres: number | null;
  transmission: string | null;
  fuelType: string | null;
  combinedConsumptionL100Km: number | null;
  cityConsumptionL100Km: number | null;
  highwayConsumptionL100Km: number | null;
  electricRangeKm: number | null;
  vehicleClass: string | null;
};

export type NrcanSelectionPayload = {
  catalogEntryId: string;
  make: string;
  model: string;
  year: number;
  configuration: string | null;
  fuelType: string | null;
  combinedConsumptionL100Km: number | null;
};

type NrcanVehiclePickerProps = {
  disabled?: boolean;
  initialCatalogEntryId?: string | null;
  onManualFallback: () => void;
  onSelectionChange?: (selection: NrcanSelectionPayload | null) => void;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(body?.message ?? "Chargement impossible");
  }
  const json = (await res.json()) as { data: T };
  return json.data;
}

function fmtL100(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${String(n).replace(".", ",")} L/100 km`;
}

export function NrcanVehiclePicker({
  disabled,
  onManualFallback,
  onSelectionChange,
}: NrcanVehiclePickerProps) {
  const baseId = useId();
  const [years, setYears] = useState<number[]>([]);
  const [makes, setMakes] = useState<Option[]>([]);
  const [models, setModels] = useState<Option[]>([]);
  const [configs, setConfigs] = useState<Configuration[]>([]);

  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [configId, setConfigId] = useState("");
  const [selected, setSelected] = useState<Configuration | null>(null);

  const [loading, setLoading] = useState<
    "years" | "makes" | "models" | "configs" | null
  >("years");
  const [error, setError] = useState<string | null>(null);
  const [makeFilter, setMakeFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchJson<number[]>("/api/v1/vehicle-catalog/years")
      .then((data) => {
        if (!cancelled) {
          setYears(data);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!year) return;
    let cancelled = false;
    fetchJson<Option[]>(`/api/v1/vehicle-catalog/makes?year=${year}`)
      .then((data) => {
        if (!cancelled) {
          setMakes(data);
          setError(null);
          setLoading(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  useEffect(() => {
    if (!year || !make) return;
    let cancelled = false;
    const qs = new URLSearchParams({ year, make });
    fetchJson<Option[]>(`/api/v1/vehicle-catalog/models?${qs}`)
      .then((data) => {
        if (!cancelled) {
          setModels(data);
          setError(null);
          setLoading(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [year, make]);

  useEffect(() => {
    if (!year || !make || !model) return;
    let cancelled = false;
    const qs = new URLSearchParams({ year, make, model });
    fetchJson<Configuration[]>(`/api/v1/vehicle-catalog/configurations?${qs}`)
      .then((data) => {
        if (!cancelled) {
          setConfigs(data);
          setError(null);
          setLoading(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [year, make, model]);

  const filteredMakes = makeFilter.trim()
    ? makes.filter((m) =>
        m.label.toLowerCase().includes(makeFilter.trim().toLowerCase()),
      )
    : makes;
  const filteredModels = modelFilter.trim()
    ? models.filter((m) =>
        m.label.toLowerCase().includes(modelFilter.trim().toLowerCase()),
      )
    : models;

  return (
    <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
      <input type="hidden" name="catalogEntryId" value={configId} />
      <input type="hidden" name="isManualEntry" value="false" />

      <FormField htmlFor={`${baseId}-year`} label="Année" required>
        <select
          id={`${baseId}-year`}
          className={selectClassName}
          value={year}
          disabled={disabled || loading === "years"}
          required
          onChange={(e) => {
            setYear(e.target.value);
            setMake("");
            setMakes([]);
            setModel("");
            setModels([]);
            setConfigId("");
            setConfigs([]);
            setSelected(null);
            setMakeFilter("");
            setModelFilter("");
            if (e.target.value) setLoading("makes");
          }}
        >
          <option value="">
            {loading === "years" ? "Chargement…" : "Choisir…"}
          </option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </FormField>

      <FormField htmlFor={`${baseId}-make`} label="Marque" required>
        <div className="grid gap-1.5">
          {makes.length > 12 ? (
            <input
              type="search"
              className={selectClassName}
              placeholder="Filtrer les marques…"
              value={makeFilter}
              disabled={!year || disabled}
              onChange={(e) => setMakeFilter(e.target.value)}
              aria-label="Filtrer les marques"
            />
          ) : null}
          <select
            id={`${baseId}-make`}
            className={selectClassName}
            value={make}
            disabled={!year || disabled || loading === "makes"}
            required
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
              setModels([]);
              setConfigId("");
              setConfigs([]);
              setSelected(null);
              setModelFilter("");
              if (e.target.value) setLoading("models");
            }}
          >
            <option value="">
              {loading === "makes" ? "Chargement…" : "Choisir…"}
            </option>
            {filteredMakes.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </FormField>

      <FormField htmlFor={`${baseId}-model`} label="Modèle" required>
        <div className="grid gap-1.5">
          {models.length > 12 ? (
            <input
              type="search"
              className={selectClassName}
              placeholder="Filtrer les modèles…"
              value={modelFilter}
              disabled={!make || disabled}
              onChange={(e) => setModelFilter(e.target.value)}
              aria-label="Filtrer les modèles"
            />
          ) : null}
          <select
            id={`${baseId}-model`}
            className={selectClassName}
            value={model}
            disabled={!make || disabled || loading === "models"}
            required
            onChange={(e) => {
              setModel(e.target.value);
              setConfigId("");
              setConfigs([]);
              setSelected(null);
              if (e.target.value) setLoading("configs");
            }}
          >
            <option value="">
              {loading === "models" ? "Chargement…" : "Choisir…"}
            </option>
            {filteredModels.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </FormField>

      <FormField htmlFor={`${baseId}-config`} label="Configuration" required>
        <select
          id={`${baseId}-config`}
          className={selectClassName}
          value={configId}
          disabled={!model || disabled || loading === "configs"}
          required
          onChange={(e) => {
            const id = e.target.value;
            setConfigId(id);
            const next = configs.find((c) => c.id === id) ?? null;
            setSelected(next);
            if (!next || !year || !make || !model) {
              onSelectionChange?.(null);
              return;
            }
            onSelectionChange?.({
              catalogEntryId: next.id,
              make,
              model,
              year: Number(year),
              configuration: next.label,
              fuelType: next.fuelType,
              combinedConsumptionL100Km: next.combinedConsumptionL100Km,
            });
          }}
        >
          <option value="">
            {loading === "configs" ? "Chargement…" : "Choisir…"}
          </option>
          {configs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </FormField>

      {error ? (
        <p className="text-destructive text-sm sm:col-span-2" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && year && makes.length === 0 ? (
        <p
          className="text-muted-foreground text-sm sm:col-span-2"
          role="status"
        >
          Aucune marque trouvée pour cette année.
        </p>
      ) : null}
      {!loading && make && models.length === 0 ? (
        <p
          className="text-muted-foreground text-sm sm:col-span-2"
          role="status"
        >
          Aucun modèle trouvé.
        </p>
      ) : null}
      {!loading && model && configs.length === 0 ? (
        <p
          className="text-muted-foreground text-sm sm:col-span-2"
          role="status"
        >
          Aucune configuration trouvée.
        </p>
      ) : null}

      {selected ? (
        <div
          className="bg-muted/40 rounded-lg border p-3 text-sm sm:col-span-2"
          aria-live="polite"
        >
          <p className="font-medium">
            Véhicule {make} {selected.label.split(" — ")[0]} {year}
          </p>
          <p className="text-muted-foreground mt-1">
            Carburant : {fuelTypeLabelFr(selected.fuelType)}
          </p>
          <p className="mt-2 font-medium">Consommation officielle</p>
          <ul className="text-muted-foreground mt-1 list-inside list-disc">
            <li>Ville : {fmtL100(selected.cityConsumptionL100Km)}</li>
            <li>Route : {fmtL100(selected.highwayConsumptionL100Km)}</li>
            <li>Combinée : {fmtL100(selected.combinedConsumptionL100Km)}</li>
          </ul>
          <p className="text-muted-foreground mt-2 text-xs">
            Source : Ressources naturelles Canada
          </p>
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <Button
          type="button"
          variant="outline"
          onClick={onManualFallback}
          disabled={disabled}
        >
          Mon véhicule n’apparaît pas
        </Button>
      </div>
    </div>
  );
}
