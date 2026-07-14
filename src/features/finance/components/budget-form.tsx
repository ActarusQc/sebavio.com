"use client";

import { useActionState } from "react";
import {
  upsertBudgetAction,
  type FinanceActionResult,
} from "@/features/finance/actions";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: FinanceActionResult | undefined = undefined;

type Props = {
  tripId: string;
  plannedAmount: string | null;
  currency?: string;
};

export function BudgetForm({ tripId, plannedAmount, currency = "CAD" }: Props) {
  const [state, formAction, pending] = useActionState(
    upsertBudgetAction,
    initial,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="currency" value={currency} />
      <FormField htmlFor="budget-amount" label="Budget prévu" required>
        <Input
          id="budget-amount"
          name="plannedAmount"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={plannedAmount ?? ""}
          className="w-40"
        />
      </FormField>
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "Enregistrer"}
      </Button>
      {state?.ok === false ? (
        <p className="text-destructive w-full text-sm">{state.message}</p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="text-muted-foreground w-full text-sm">{state.message}</p>
      ) : null}
    </form>
  );
}
