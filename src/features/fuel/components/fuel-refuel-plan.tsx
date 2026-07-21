"use client";

import type { FuelRefuelPlanDto } from "@/features/fuel/types";

type Props = {
  plan: FuelRefuelPlanDto;
  /** Masquer la liste d'arrêts (affichée ailleurs via FuelStopsList). */
  hideStops?: boolean;
};

/**
 * Résumé d'optimisation pour l'utilisateur (sans statistiques internes).
 */
export function FuelRefuelPlanSection({ plan, hideStops = false }: Props) {
  const savings = plan.estimatedSavingsVsNaive;
  const savingsNum = savings != null ? Number(savings) : null;

  return (
    <section className="space-y-3 border-t pt-3">
      <h4 className="font-medium">Optimisation du ravitaillement</h4>

      {!plan.feasible ? (
        <p className="text-destructive text-sm">
          {plan.failureReasonLabel ??
            "Impossible de calculer un plan sûr pour ce trajet."}
        </p>
      ) : null}

      {plan.noAdvantageousOptimization && plan.feasible ? (
        <p className="text-sm">
          Aucune stratégie moins coûteuse que le ravitaillement standard n’a été
          trouvée pour cet itinéraire.
        </p>
      ) : null}

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Coût estimé des arrêts</dt>
          <dd>
            {plan.stops
              .reduce((s, st) => s + Number(st.estimatedCost), 0)
              .toFixed(2)}{" "}
            CAD
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Économies prévues</dt>
          <dd>
            {savingsNum == null
              ? "—"
              : savingsNum > 0
                ? `${savingsNum.toFixed(2)} CAD`
                : "Aucune économie supplémentaire"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Arrêts suggérés</dt>
          <dd>{plan.suggestedStopCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Restant à destination</dt>
          <dd>{plan.remainingFuelL} L</dd>
        </div>
      </dl>

      {!hideStops && plan.stops.length === 0 && plan.feasible ? (
        <p className="text-sm">
          Aucun arrêt requis avant la destination — le plein initial suffit en
          respectant la réserve.
        </p>
      ) : null}

      {!hideStops && plan.stops.length > 0 ? (
        <ol className="border-border relative space-y-4 border-l-2 pl-4">
          {plan.stops.map((stop) => (
            <li key={stop.order} className="relative text-sm">
              <span
                className="bg-foreground absolute top-1 -left-[1.35rem] size-2.5 rounded-full"
                aria-hidden
              />
              <p className="font-medium">
                Arrêt {stop.order} — vers {stop.distanceFromStartKm} km
              </p>
              <p className="text-muted-foreground">
                {stop.regionLabel ?? stop.positionLabel}
              </p>
              <ul className="mt-1 space-y-0.5">
                <li>
                  {stop.litersToBuy} L à {stop.pricePerLiter} $/L →{" "}
                  {stop.estimatedCost} CAD
                </li>
              </ul>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
