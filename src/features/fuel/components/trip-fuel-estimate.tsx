"use client";

import { useActionState } from "react";
import {
  estimateTripFuelAction,
  type FuelActionResult,
} from "@/features/fuel/actions";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: FuelActionResult | undefined = undefined;

type Props = {
  tripId: string;
  distanceKm: string | null;
  estimatedFuelCost: string | null;
  routeFresh: boolean;
};

export function TripFuelEstimatePanel({
  tripId,
  distanceKm,
  estimatedFuelCost,
  routeFresh,
}: Props) {
  const [state, action, pending] = useActionState(
    estimateTripFuelAction,
    initial,
  );

  return (
    <section className="space-y-3">
      <h3 className="font-medium">Estimation carburant</h3>
      <p className="text-muted-foreground text-sm">
        Estimation indicative : distance × consommation × prix (Régie QC si
        disponible, sinon moyenne de vos pleins, sinon prix par défaut).
      </p>

      {routeFresh && distanceKm ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Distance</dt>
            <dd>{distanceKm} km</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Coût estimé</dt>
            <dd>
              {estimatedFuelCost
                ? `${estimatedFuelCost} CAD`
                : "Pas encore calculé"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-muted-foreground text-sm">
          Calculez d&apos;abord l&apos;itinéraire pour estimer le carburant.
        </p>
      )}

      {routeFresh && distanceKm ? (
        <form action={action} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="tripId" value={tripId} />
          <FormField
            htmlFor="est-price"
            label="Prix / L par défaut (si aucun plein / hors QC)"
          >
            <Input
              id="est-price"
              name="defaultPricePerLiter"
              type="number"
              min={0.001}
              step="0.001"
              placeholder="ex. 1.650"
            />
          </FormField>
          <FormField htmlFor="est-conso" label="Conso L/100 (optionnel)">
            <Input
              id="est-conso"
              name="consumptionL100"
              type="number"
              min={0.1}
              step="0.1"
              placeholder="sinon conso réelle / catalogue"
            />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" variant="outline" disabled={pending}>
              Estimer le coût carburant
            </Button>
          </div>
        </form>
      ) : null}

      {state?.ok === false ? (
        <p className="text-destructive text-sm">{state.message}</p>
      ) : null}
      {state?.ok ? (
        <div className="space-y-1 text-sm text-emerald-700" role="status">
          <p>{state.message}</p>
          {state.priceLabel ? (
            <p className="text-muted-foreground">{state.priceLabel}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
