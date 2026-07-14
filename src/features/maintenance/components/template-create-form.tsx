"use client";

import { useActionState } from "react";
import {
  createTemplateAction,
  type MaintenanceActionResult,
} from "@/features/maintenance/actions";
import { MAINTENANCE_PRIORITIES } from "@/features/maintenance/constants";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

export function TemplateCreateForm({ modelId }: { modelId: string }) {
  const [state, formAction, pending] = useActionState(
    createTemplateAction,
    undefined as MaintenanceActionResult | undefined,
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="modelId" value={modelId} />
      <FormField htmlFor="tpl-title" label="Titre" required>
        <Input id="tpl-title" name="title" required maxLength={150} />
      </FormField>
      <FormField htmlFor="tpl-cat" label="Catégorie" required>
        <Input
          id="tpl-cat"
          name="category"
          required
          maxLength={50}
          placeholder="Moteur, pneus…"
        />
      </FormField>
      <FormField htmlFor="tpl-km" label="Intervalle km">
        <Input id="tpl-km" name="intervalKm" type="number" min={1} />
      </FormField>
      <FormField htmlFor="tpl-months" label="Intervalle mois">
        <Input id="tpl-months" name="intervalMonths" type="number" min={1} />
      </FormField>
      <FormField htmlFor="tpl-prio" label="Priorité">
        <select
          id="tpl-prio"
          name="priority"
          className={selectClassName}
          defaultValue="normal"
        >
          {MAINTENANCE_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </FormField>
      {state && !state.ok ? (
        <p className="text-destructive text-sm sm:col-span-2" role="alert">
          {state.message}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-muted-foreground text-sm sm:col-span-2">
          {state.message}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          Ajouter un gabarit
        </Button>
      </div>
    </form>
  );
}
