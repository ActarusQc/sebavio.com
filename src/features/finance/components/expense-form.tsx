"use client";

import { useActionState } from "react";
import {
  createExpenseAction,
  type FinanceActionResult,
} from "@/features/finance/actions";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from "@/features/finance/constants";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: FinanceActionResult | undefined = undefined;

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3";

type Props = {
  tripId: string;
  defaultCurrency?: string;
};

export function ExpenseForm({ tripId, defaultCurrency = "CAD" }: Props) {
  const [state, formAction, pending] = useActionState(
    createExpenseAction,
    initial,
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="currency" value={defaultCurrency} />

      <FormField htmlFor="exp-category" label="Catégorie" required>
        <select
          id="exp-category"
          name="category"
          required
          className={selectClassName}
          defaultValue="other"
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EXPENSE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField htmlFor="exp-amount" label="Montant" required>
        <Input
          id="exp-amount"
          name="amount"
          type="number"
          min={0}
          step="0.01"
          required
        />
      </FormField>

      <FormField htmlFor="exp-date" label="Date" required>
        <Input
          id="exp-date"
          name="expenseDate"
          type="date"
          required
          defaultValue={today}
        />
      </FormField>

      <FormField htmlFor="exp-merchant" label="Marchand">
        <Input id="exp-merchant" name="merchant" maxLength={200} />
      </FormField>

      <FormField htmlFor="exp-notes" label="Notes" className="sm:col-span-2">
        <Input id="exp-notes" name="notes" maxLength={2000} />
      </FormField>

      {state?.ok === false ? (
        <p className="text-destructive text-sm sm:col-span-2">
          {state.message}
        </p>
      ) : null}
      {state?.ok && state.warnings && state.warnings.length > 0 ? (
        <p className="text-sm text-amber-700 sm:col-span-2 dark:text-amber-400">
          {state.warnings.join(" ")}
        </p>
      ) : null}
      {state?.ok && state.message ? (
        <p className="text-muted-foreground text-sm sm:col-span-2">
          {state.message}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Ajouter la dépense"}
        </Button>
      </div>
    </form>
  );
}
