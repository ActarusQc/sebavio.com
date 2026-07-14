"use client";

import { useActionState } from "react";
import {
  updatePreferencesAction,
  type UsersActionResult,
} from "@/features/users/actions";
import type { UserPreferencesDto } from "@/features/users/types";
import { FormField } from "@/components/common";
import { Button } from "@/components/ui";

const initial: UsersActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type PreferencesFormProps = {
  preferences: UserPreferencesDto;
};

export function PreferencesForm({ preferences }: PreferencesFormProps) {
  const [state, formAction, pending] = useActionState(
    updatePreferencesAction,
    initial,
  );

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField htmlFor="distanceUnit" label="Distance" required>
          <select
            id="distanceUnit"
            name="distanceUnit"
            required
            defaultValue={preferences.distanceUnit}
            className={selectClassName}
          >
            <option value="km">Kilomètres</option>
            <option value="miles">Miles</option>
          </select>
        </FormField>
        <FormField htmlFor="temperatureUnit" label="Température" required>
          <select
            id="temperatureUnit"
            name="temperatureUnit"
            required
            defaultValue={preferences.temperatureUnit}
            className={selectClassName}
          >
            <option value="C">Celsius (°C)</option>
            <option value="F">Fahrenheit (°F)</option>
          </select>
        </FormField>
        <FormField htmlFor="fuelUnit" label="Carburant" required>
          <select
            id="fuelUnit"
            name="fuelUnit"
            required
            defaultValue={preferences.fuelUnit}
            className={selectClassName}
          >
            <option value="L/100">L/100 km</option>
            <option value="MPG">MPG</option>
          </select>
        </FormField>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="notificationsEnabled"
          defaultChecked={preferences.notificationsEnabled}
          className="border-input size-4 rounded border"
        />
        Notifications globales
      </label>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="aiProactive"
          defaultChecked={preferences.aiProactive}
          className="border-input size-4 rounded border"
        />
        Suggestions IA proactives
      </label>
      {state && !state.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      ) : null}
      {state?.ok ? (
        <p
          className="text-sm text-emerald-700 dark:text-emerald-400"
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : "Enregistrer les préférences"}
      </Button>
    </form>
  );
}
