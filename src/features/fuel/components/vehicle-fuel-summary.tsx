"use client";

import type { FuelStatsDto } from "@/features/fuel/types";
import { Button } from "@/components/ui";
import Link from "next/link";

type Props = {
  vehicleId: string;
  stats: FuelStatsDto | null;
};

export function VehicleFuelStatsSummary({ vehicleId, stats }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">Carburant</h3>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/dashboard/vehicles/${vehicleId}/fuel`} />}
        >
          Gérer les pleins
        </Button>
      </div>
      {stats ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Conso réelle</dt>
            <dd>
              {stats.realAvgConsumption
                ? `${stats.realAvgConsumption} L/100 km`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Pleins enregistrés</dt>
            <dd>{stats.totalFillCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Prix moyen / L</dt>
            <dd>
              {stats.avgPricePerLiter ? `${stats.avgPricePerLiter} CAD` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Total dépensé</dt>
            <dd>{stats.totalSpent} CAD</dd>
          </div>
        </dl>
      ) : (
        <p className="text-muted-foreground text-sm">
          Aucune statistique — ajoutez des pleins.
        </p>
      )}
    </section>
  );
}
