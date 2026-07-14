"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";
import {
  FUEL_TYPES,
  VEHICLE_CATEGORIES,
} from "@/features/vehicle-catalog/constants";
import type { ManufacturerDto } from "@/features/vehicle-catalog/types";

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type CatalogFiltersProps = {
  manufacturers: ManufacturerDto[];
};

export function CatalogFilters({ manufacturers }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const params = new URLSearchParams();
    const keys = [
      "keyword",
      "manufacturerId",
      "category",
      "year",
      "fuelType",
      "sort",
    ] as const;
    for (const key of keys) {
      const value = String(formData.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/dashboard/catalog?${params.toString()}`);
    });
  }

  return (
    <form
      action={onSubmit}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <FormField htmlFor="keyword" label="Recherche">
        <Input
          id="keyword"
          name="keyword"
          defaultValue={searchParams.get("keyword") ?? ""}
          placeholder="Modèle, trim, constructeur…"
        />
      </FormField>
      <FormField htmlFor="manufacturerId" label="Constructeur">
        <select
          id="manufacturerId"
          name="manufacturerId"
          defaultValue={searchParams.get("manufacturerId") ?? ""}
          className={selectClassName}
        >
          <option value="">Tous</option>
          {manufacturers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField htmlFor="category" label="Catégorie">
        <select
          id="category"
          name="category"
          defaultValue={searchParams.get("category") ?? ""}
          className={selectClassName}
        >
          <option value="">Toutes</option>
          {VEHICLE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>
      <FormField htmlFor="year" label="Année">
        <Input
          id="year"
          name="year"
          type="number"
          min={1950}
          max={2100}
          defaultValue={searchParams.get("year") ?? ""}
          placeholder="ex. 2024"
        />
      </FormField>
      <FormField htmlFor="fuelType" label="Carburant">
        <select
          id="fuelType"
          name="fuelType"
          defaultValue={searchParams.get("fuelType") ?? ""}
          className={selectClassName}
        >
          <option value="">Tous</option>
          {FUEL_TYPES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </FormField>
      <FormField htmlFor="sort" label="Tri">
        <select
          id="sort"
          name="sort"
          defaultValue={searchParams.get("sort") ?? "year_desc"}
          className={selectClassName}
        >
          <option value="year_desc">Année ↓</option>
          <option value="year_asc">Année ↑</option>
          <option value="name_asc">Nom A→Z</option>
          <option value="name_desc">Nom Z→A</option>
        </select>
      </FormField>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Filtrage…" : "Filtrer"}
        </Button>
        <Link
          href="/dashboard/catalog"
          className="border-border bg-background hover:bg-muted inline-flex h-8 items-center rounded-lg border px-2.5 text-sm"
        >
          Réinitialiser
        </Link>
      </div>
    </form>
  );
}
