"use client";

import Link from "next/link";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/features/finance/constants";
import type { FinanceDashboardDto } from "@/features/finance/types";
import { Button } from "@/components/ui";

type Props = {
  dashboard: FinanceDashboardDto;
};

export function FinanceDashboard({ dashboard }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-xs uppercase">
            Budget prévu (voyages)
          </p>
          <p className="text-lg font-medium">
            {dashboard.totalPlanned} {dashboard.currency}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">
            Dépenses réelles
          </p>
          <p className="text-lg font-medium">
            {dashboard.totalActual} {dashboard.currency}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Écart</p>
          <p className="text-lg font-medium">
            {dashboard.variance} {dashboard.currency}
          </p>
        </div>
      </section>

      {dashboard.byCategory.some((c) => c.count > 0) ? (
        <section>
          <h2 className="mb-2 text-sm font-medium">Répartition</h2>
          <ul className="space-y-1 text-sm">
            {dashboard.byCategory
              .filter((c) => c.count > 0)
              .map((c) => (
                <li key={c.category} className="flex justify-between gap-4">
                  <span>
                    {EXPENSE_CATEGORY_LABELS[c.category as ExpenseCategory]} (
                    {c.count})
                  </span>
                  <span>
                    {c.total} {dashboard.currency}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-medium">Voyages</h2>
        {dashboard.trips.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun voyage — créez-en un pour suivre un budget.
          </p>
        ) : (
          <ul className="space-y-3">
            {dashboard.trips.map((t) => (
              <li
                key={t.tripId}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-muted-foreground">
                    Prévu {t.plannedAmount ?? "—"} · Réel {t.actualTotal}
                    {t.variance != null ? ` · Écart ${t.variance}` : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link href={`/dashboard/finance/trips/${t.tripId}`} />
                  }
                >
                  Détail
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dashboard.recentExpenses.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-medium">Dépenses récentes</h2>
          <ul className="space-y-2 text-sm">
            {dashboard.recentExpenses.map((e) => (
              <li key={e.id} className="flex justify-between gap-4">
                <span>
                  {EXPENSE_CATEGORY_LABELS[e.category]} · {e.expenseDate}
                </span>
                <span>
                  {e.amount} {e.currency}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
