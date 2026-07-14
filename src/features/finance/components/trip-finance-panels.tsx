"use client";

import { useActionState } from "react";
import {
  importFuelExpenseAction,
  type FinanceActionResult,
} from "@/features/finance/actions";
import type { TripFinanceSummaryDto } from "@/features/finance/types";
import { Button } from "@/components/ui";

const initial: FinanceActionResult | undefined = undefined;

type Props = {
  summary: TripFinanceSummaryDto;
};

function ImportFuelButton({
  tripId,
  fuelLogId,
  disabled,
}: {
  tripId: string;
  fuelLogId: string;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    importFuelExpenseAction,
    initial,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="fuelLogId" value={fuelLogId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={disabled || pending}
      >
        {disabled ? "Déjà ajouté" : pending ? "…" : "Ajouter aux dépenses"}
      </Button>
      {state?.ok === false ? (
        <span className="text-destructive ml-2 text-xs">{state.message}</span>
      ) : null}
      {state?.ok && state.warnings && state.warnings.length > 0 ? (
        <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">
          {state.warnings[0]}
        </span>
      ) : null}
    </form>
  );
}

export function TripFinancePanels({ summary }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-xs uppercase">Prévu</p>
          <p className="text-lg font-medium">
            {summary.plannedAmount
              ? `${summary.plannedAmount} ${summary.currency}`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Réel</p>
          <p className="text-lg font-medium">
            {summary.actualTotal} {summary.currency}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Écart</p>
          <p className="text-lg font-medium">
            {summary.variance != null
              ? `${summary.variance} ${summary.currency}`
              : "—"}
          </p>
        </div>
      </section>

      {summary.byCategory.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-medium">Par catégorie</h3>
          <ul className="space-y-1 text-sm">
            {summary.byCategory.map((c) => (
              <li key={c.category} className="flex justify-between gap-4">
                <span>
                  {c.category} ({c.count})
                </span>
                <span>
                  {c.total} {summary.currency}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="border-border border-t pt-6">
        <h3 className="mb-1 text-sm font-medium">Référence (hors totaux)</h3>
        <p className="text-muted-foreground mb-4 text-xs">
          Pleins, entretiens et prix indicatifs sur la période du voyage — non
          inclus dans le budget tant qu&apos;ils ne sont pas ajoutés en
          dépenses.
        </p>

        {summary.estimatedFuelCost ? (
          <p className="mb-3 text-sm">
            Estimation carburant itinéraire : {summary.estimatedFuelCost}{" "}
            {summary.currency}
          </p>
        ) : null}

        <h4 className="mb-2 text-xs font-medium tracking-wide uppercase">
          Pleins du véhicule
        </h4>
        {summary.referenceFuelLogs.length === 0 ? (
          <p className="text-muted-foreground mb-4 text-sm">
            Aucun plein sur la période.
          </p>
        ) : (
          <ul className="divide-border mb-4 divide-y">
            {summary.referenceFuelLogs.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span>
                  {log.filledAt} · {log.totalCost} CAD · {log.liters} L
                  {log.stationName ? ` · ${log.stationName}` : ""}
                </span>
                <ImportFuelButton
                  tripId={summary.tripId}
                  fuelLogId={log.id}
                  disabled={log.alreadyImported}
                />
              </li>
            ))}
          </ul>
        )}

        <h4 className="mb-2 text-xs font-medium tracking-wide uppercase">
          Entretiens (période)
        </h4>
        {summary.referenceMaintenance.length === 0 ? (
          <p className="text-muted-foreground mb-4 text-sm">Aucun entretien.</p>
        ) : (
          <ul className="mb-4 space-y-1 text-sm">
            {summary.referenceMaintenance.map((h) => (
              <li key={h.id}>
                {h.performedDate}
                {h.cost
                  ? ` · ${h.cost} ${h.currency ?? "CAD"}`
                  : " · coût non renseigné"}
                {h.provider ? ` · ${h.provider}` : ""}
              </li>
            ))}
          </ul>
        )}

        {(summary.campingPriceHints.length > 0 ||
          summary.activityPriceHints.length > 0) && (
          <>
            <h4 className="mb-2 text-xs font-medium tracking-wide uppercase">
              Prix indicatifs
            </h4>
            <ul className="space-y-1 text-sm">
              {summary.campingPriceHints.map((c, i) => (
                <li key={`camp-${i}`}>
                  Camping {c.campgroundName} ({c.stopName})
                  {c.priceMin || c.priceMax
                    ? ` · ${c.priceMin ?? "?"}–${c.priceMax ?? "?"} CAD`
                    : ""}
                </li>
              ))}
              {summary.activityPriceHints.map((a, i) => (
                <li key={`act-${i}`}>
                  {a.activityName} ({a.stopName})
                  {a.priceIndicative ? ` · ~${a.priceIndicative} CAD` : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
