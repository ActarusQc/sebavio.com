"use client";

import { useActionState } from "react";
import {
  deleteExpenseAction,
  type FinanceActionResult,
} from "@/features/finance/actions";
import { EXPENSE_CATEGORY_LABELS } from "@/features/finance/constants";
import type { ExpenseDto } from "@/features/finance/types";
import { Button } from "@/components/ui";

const initial: FinanceActionResult | undefined = undefined;

type Props = {
  expenses: ExpenseDto[];
  tripId: string;
};

function DeleteButton({
  expenseId,
  tripId,
}: {
  expenseId: string;
  tripId: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteExpenseAction,
    initial,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={expenseId} />
      <input type="hidden" name="tripId" value={tripId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "…" : "Supprimer"}
      </Button>
      {state?.ok === false ? (
        <span className="text-destructive ml-2 text-xs">{state.message}</span>
      ) : null}
    </form>
  );
}

export function ExpensesList({ expenses, tripId }: Props) {
  if (expenses.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune dépense pour ce voyage.
      </p>
    );
  }

  return (
    <ul className="divide-border divide-y">
      {expenses.map((e) => (
        <li
          key={e.id}
          className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
        >
          <div>
            <p className="font-medium">
              {EXPENSE_CATEGORY_LABELS[e.category]} · {e.amount} {e.currency}
            </p>
            <p className="text-muted-foreground">
              {e.expenseDate}
              {e.merchant ? ` · ${e.merchant}` : ""}
              {e.sourceFuelLogId ? " · import plein" : ""}
            </p>
            {e.notes ? (
              <p className="text-muted-foreground mt-0.5 text-xs">{e.notes}</p>
            ) : null}
          </div>
          <DeleteButton expenseId={e.id} tripId={tripId} />
        </li>
      ))}
    </ul>
  );
}
