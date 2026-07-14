"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createHistoryAction,
  type MaintenanceActionResult,
} from "@/features/maintenance/actions";
import type { MaintenanceTemplateDto } from "@/features/maintenance/types";
import type { UserVehicleDto } from "@/features/vehicles/types";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";
import { DEFAULT_CURRENCY } from "@/features/maintenance/constants";

const initial: MaintenanceActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type Props = {
  vehicles: UserVehicleDto[];
  templates: MaintenanceTemplateDto[];
  defaultVehicleId?: string;
};

export function MaintenanceForm({
  vehicles,
  templates,
  defaultVehicleId,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createHistoryAction,
    initial,
  );

  useEffect(() => {
    if (state?.ok && state.id) {
      router.push(`/dashboard/maintenance/${state.id}`);
    }
  }, [state, router]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <FormField htmlFor="mnt-vehicle" label="Véhicule" required>
        <select
          id="mnt-vehicle"
          name="vehicleId"
          className={selectClassName}
          defaultValue={defaultVehicleId ?? vehicles[0]?.id ?? ""}
          required
        >
          <option value="" disabled>
            Choisir…
          </option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.displayName} — {v.currentOdometer} km
            </option>
          ))}
        </select>
      </FormField>

      <FormField htmlFor="mnt-template" label="Gabarit constructeur">
        <select
          id="mnt-template"
          name="templateId"
          className={selectClassName}
          defaultValue=""
        >
          <option value="">Aucun / manuel</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.category})
            </option>
          ))}
        </select>
      </FormField>

      <FormField htmlFor="mnt-date" label="Date réalisée" required>
        <Input
          id="mnt-date"
          name="performedDate"
          type="date"
          defaultValue={today}
          required
        />
      </FormField>

      <FormField htmlFor="mnt-odo" label="Kilométrage" required>
        <Input
          id="mnt-odo"
          name="performedOdometer"
          type="number"
          min={0}
          step={1}
          required
        />
      </FormField>

      <FormField htmlFor="mnt-provider" label="Prestataire">
        <Input id="mnt-provider" name="provider" maxLength={200} />
      </FormField>

      <FormField htmlFor="mnt-cost" label="Coût">
        <Input id="mnt-cost" name="cost" type="number" min={0} step="0.01" />
      </FormField>

      <FormField htmlFor="mnt-currency" label="Devise">
        <Input
          id="mnt-currency"
          name="currency"
          maxLength={3}
          defaultValue={DEFAULT_CURRENCY}
        />
      </FormField>

      <FormField htmlFor="mnt-notes" label="Notes" className="sm:col-span-2">
        <Input id="mnt-notes" name="notes" maxLength={5000} />
      </FormField>

      {state && !state.ok ? (
        <p className="text-destructive text-sm sm:col-span-2" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending || vehicles.length === 0}>
          {pending ? "Enregistrement…" : "Enregistrer l’entretien"}
        </Button>
      </div>
    </form>
  );
}
