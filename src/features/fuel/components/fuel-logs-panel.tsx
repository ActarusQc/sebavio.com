"use client";

import { useActionState } from "react";
import {
  createFuelLogAction,
  deleteFuelLogAction,
  type FuelActionResult,
} from "@/features/fuel/actions";
import type { FuelLogDto, FuelStatsDto } from "@/features/fuel/types";
import { FormField } from "@/components/common";
import { Badge, Button, Input } from "@/components/ui";

const initial: FuelActionResult | undefined = undefined;

type Props = {
  vehicleId: string;
  currentOdometer: number;
  logs: FuelLogDto[];
  stats: FuelStatsDto;
};

export function FuelLogsPanel({
  vehicleId,
  currentOdometer,
  logs,
  stats,
}: Props) {
  const [createState, createAction, createPending] = useActionState(
    createFuelLogAction,
    initial,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteFuelLogAction,
    initial,
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      <section className="space-y-3">
        <h3 className="font-medium">Statistiques de consommation</h3>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Conso réelle</dt>
            <dd>
              {stats.realAvgConsumption
                ? `${stats.realAvgConsumption} L/100 km`
                : "— (moins de 2 pleins complets)"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Pleins / complets</dt>
            <dd>
              {stats.totalFillCount} / {stats.fullFillCount}
            </dd>
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
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Nouveau plein</h3>
        <p className="text-muted-foreground text-sm">
          Saisissez deux valeurs parmi litres, prix/L et total — la troisième
          est calculée. Si les trois sont fournies, l&apos;écart doit rester ≤
          2&nbsp;%.
        </p>
        <form action={createAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <FormField htmlFor="fuel-date" label="Date" required>
            <Input
              id="fuel-date"
              name="filledAt"
              type="date"
              defaultValue={today}
              required
            />
          </FormField>
          <FormField htmlFor="fuel-odo" label="Odomètre (km)" required>
            <Input
              id="fuel-odo"
              name="odometerKm"
              type="number"
              min={currentOdometer}
              step={1}
              required
              defaultValue={currentOdometer}
            />
          </FormField>
          <FormField htmlFor="fuel-liters" label="Litres">
            <Input
              id="fuel-liters"
              name="liters"
              type="number"
              min={0.001}
              step="0.001"
            />
          </FormField>
          <FormField htmlFor="fuel-price" label="Prix / L (CAD)">
            <Input
              id="fuel-price"
              name="pricePerLiter"
              type="number"
              min={0.001}
              step="0.001"
            />
          </FormField>
          <FormField htmlFor="fuel-total" label="Total payé (CAD)">
            <Input
              id="fuel-total"
              name="totalCost"
              type="number"
              min={0.01}
              step="0.01"
            />
          </FormField>
          <FormField htmlFor="fuel-full" label="Type de plein">
            <select
              id="fuel-full"
              name="isFull"
              defaultValue="true"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3"
            >
              <option value="true">Plein complet</option>
              <option value="false">Plein partiel</option>
            </select>
          </FormField>
          <FormField htmlFor="fuel-station" label="Station">
            <Input id="fuel-station" name="stationName" maxLength={200} />
          </FormField>
          <FormField htmlFor="fuel-notes" label="Notes">
            <Input id="fuel-notes" name="notes" maxLength={500} />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={createPending}>
              Enregistrer le plein
            </Button>
          </div>
        </form>
        {createState?.ok === false ? (
          <p className="text-destructive text-sm">{createState.message}</p>
        ) : null}
        {createState?.ok ? (
          <p className="text-sm text-emerald-700">{createState.message}</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Historique ({logs.length})</h3>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun plein.</p>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-start justify-between gap-3 border-b pb-3 text-sm"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{log.filledAt}</span>
                    <Badge variant={log.isFull ? "secondary" : "outline"}>
                      {log.isFull ? "Complet" : "Partiel"}
                    </Badge>
                  </div>
                  <p>
                    {log.odometerKm.toLocaleString("fr-CA")} km · {log.liters} L
                    · {log.pricePerLiter} $/L · {log.totalCost} CAD
                  </p>
                  {log.stationName ? (
                    <p className="text-muted-foreground">{log.stationName}</p>
                  ) : null}
                </div>
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={log.id} />
                  <input type="hidden" name="vehicleId" value={vehicleId} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    disabled={deletePending}
                  >
                    Supprimer
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {deleteState?.ok === false ? (
          <p className="text-destructive text-sm">{deleteState.message}</p>
        ) : null}
      </section>
    </div>
  );
}
