"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";

type StatusPayload = {
  totalVehicles: number;
  yearsCovered: number[];
  yearMin: number | null;
  yearMax: number | null;
  lastSync: {
    id: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    durationMs: number | null;
    recordsRead: number;
    recordsCreated: number;
    recordsUpdated: number;
    recordsUnchanged: number;
    recordsRejected: number;
    errorMessage: string | null;
    sourceDataset: string | null;
    metadata: unknown;
  } | null;
};

export function AdminCatalogPanel() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/admin/vehicle-catalog/status", {
      credentials: "same-origin",
    });
    if (!res.ok) {
      setError("Impossible de charger le statut");
      return;
    }
    const json = (await res.json()) as { data: StatusPayload };
    setError(null);
    setData(json.data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function syncNow(force: boolean) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/vehicle-catalog/sync", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const json = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!res.ok) {
        setError(json?.message ?? "Synchronisation échouée");
        return;
      }
      await load();
    } finally {
      setPending(false);
    }
  }

  const last = data?.lastSync;

  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Véhicules catalogue" value={data?.totalVehicles ?? "—"} />
        <Stat
          label="Années couvertes"
          value={
            data?.yearMin != null && data.yearMax != null
              ? `${data.yearMin} – ${data.yearMax}`
              : "—"
          }
        />
        <Stat label="Dernier statut" value={last?.status ?? "—"} />
        <Stat
          label="Durée"
          value={
            last?.durationMs != null
              ? `${Math.round(last.durationMs / 1000)} s`
              : "—"
          }
        />
      </div>

      {last ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Dernière sync</dt>
            <dd>{new Date(last.startedAt).toLocaleString("fr-CA")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Jeu de données</dt>
            <dd>{last.sourceDataset ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              Lues / créées / maj / inchangées / rejetées
            </dt>
            <dd>
              {last.recordsRead} / {last.recordsCreated} / {last.recordsUpdated}{" "}
              / {last.recordsUnchanged} / {last.recordsRejected}
            </dd>
          </div>
          {last.errorMessage ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Dernière erreur</dt>
              <dd className="text-destructive">{last.errorMessage}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="text-muted-foreground text-sm">
          Aucune synchronisation enregistrée.
        </p>
      )}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={() => syncNow(false)}>
          {pending ? "Synchronisation…" : "Synchroniser maintenant"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => syncNow(true)}
        >
          Forcer la réimportation
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        Source : Ressources naturelles Canada — Cotes de consommation de
        carburant (gouvernement ouvert). Ce catalogue ne couvre pas tous les
        véhicules immatriculés au Québec.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-lg font-medium">{value}</p>
    </div>
  );
}
