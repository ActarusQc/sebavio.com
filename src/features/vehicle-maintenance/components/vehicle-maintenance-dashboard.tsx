"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { EmptyState } from "@/components/common";

type ReminderCard = {
  id: string;
  taskDefinitionId: string;
  title: string;
  category: string;
  actionType: string;
  dueDate: string | null;
  dueOdometerKm: number | null;
  status: string;
  priority: string;
  conditionType: string;
  inspectionOnly: boolean;
  officialManufacturerRecommendation: boolean;
  sourceLabel: string;
  sourceKind: string;
  remainingKm: number | null;
};

type Dashboard = {
  summary: {
    currentOdometerKm: number;
    nextMaintenance: ReminderCard | null;
    overdueCount: number;
    upcomingCount: number;
    openRecallsCount: number;
    lastSyncedAt: string | null;
    isStale: boolean;
    provider: string | null;
    warning: string | null;
  };
  sections: {
    dueNow: ReminderCard[];
    dueSoon: ReminderCard[];
    upcoming: ReminderCard[];
    history: Array<{
      id: string;
      title: string;
      serviceDate: string;
      odometerKm: number;
      providerName: string | null;
      cost: string | null;
      currency: string | null;
    }>;
    recalls: Array<{
      id: string;
      title: string;
      summary: string | null;
      officialUrl: string | null;
      status: string;
      vinMatchUncertain: boolean;
      warning: string | null;
    }>;
    fullCalendar: ReminderCard[];
  };
  emptySchedule: boolean;
  emptyMessage: string | null;
};

function statusLabel(status: string): string {
  switch (status) {
    case "overdue":
      return "En retard";
    case "due_now":
      return "À faire maintenant";
    case "due_soon":
      return "Bientôt";
    case "upcoming":
      return "À venir";
    case "completed":
      return "Effectué";
    default:
      return status;
  }
}

function ReminderRow({
  item,
  vehicleId,
  onChanged,
}: {
  item: ReminderCard;
  vehicleId: string;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function markDone() {
    startTransition(async () => {
      const odo = prompt("Kilométrage au moment de l’entretien ?", "");
      if (!odo) return;
      const date = prompt(
        "Date (AAAA-MM-JJ) ?",
        new Date().toISOString().slice(0, 10),
      );
      if (!date) return;
      await fetch(`/api/v1/vehicles/${vehicleId}/maintenance/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskDefinitionId: item.taskDefinitionId,
          serviceDate: date,
          odometerKm: Number(odo),
          status: "completed",
        }),
      });
      onChanged();
    });
  }

  function dismiss() {
    startTransition(async () => {
      await fetch(
        `/api/v1/vehicles/${vehicleId}/maintenance/reminders/${item.id}/dismiss`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days: 7 }),
        },
      );
      onChanged();
    });
  }

  const remainingText =
    item.remainingKm != null
      ? item.remainingKm <= 0
        ? "Échéance dépassée"
        : `Recommandée dans environ ${item.remainingKm.toLocaleString("fr-CA")} km`
      : null;

  return (
    <article className="rounded-lg border p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{item.title}</h3>
          <p className="text-muted-foreground mt-1">
            {item.category.replaceAll("_", " ")} · {item.actionType} ·{" "}
            {statusLabel(item.status)}
          </p>
          {remainingText ? <p className="mt-1">{remainingText}</p> : null}
          {item.dueDate ? (
            <p className="text-muted-foreground">
              Échéance estimée : {item.dueDate}
            </p>
          ) : null}
          {item.dueOdometerKm != null ? (
            <p className="text-muted-foreground">
              Échéance : {item.dueOdometerKm.toLocaleString("fr-CA")} km
            </p>
          ) : null}
          <p className="mt-2 text-xs">{item.sourceLabel}</p>
          <p className="text-muted-foreground text-xs">
            Conditions : {item.conditionType} · Priorité : {item.priority}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={pending} onClick={markDone}>
            Marquer comme effectué
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={dismiss}
          >
            Reporter
          </Button>
        </div>
      </div>
    </article>
  );
}

export function VehicleMaintenanceDashboard({
  vehicleId,
  initial,
}: {
  vehicleId: string;
  initial: Dashboard;
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    startTransition(async () => {
      const res = await fetch(
        `/api/v1/vehicles/${vehicleId}/maintenance/provider`,
      );
      const json = (await res.json()) as {
        success?: boolean;
        data?: { maintenance: Dashboard };
      };
      if (json.success && json.data?.maintenance) {
        setData(json.data.maintenance);
      }
      router.refresh();
    });
  }

  function syncMaintenance() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/v1/vehicles/${vehicleId}/maintenance/sync`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forceRefresh: true }),
        },
      );
      const json = (await res.json()) as {
        success?: boolean;
        error?: { message?: string };
      };
      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "Synchronisation impossible");
      }
      refresh();
    });
  }

  function syncRecalls() {
    startTransition(async () => {
      await fetch(`/api/v1/vehicles/${vehicleId}/recalls/sync`, {
        method: "POST",
      });
      refresh();
    });
  }

  const s = data.summary;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4 text-sm">
          <p className="text-muted-foreground">Kilométrage actuel</p>
          <p className="text-2xl font-semibold">
            {s.currentOdometerKm.toLocaleString("fr-CA")} km
          </p>
        </div>
        <div className="rounded-lg border p-4 text-sm">
          <p className="text-muted-foreground">Prochain entretien</p>
          <p className="font-medium">{s.nextMaintenance?.title ?? "—"}</p>
        </div>
        <div className="rounded-lg border p-4 text-sm">
          <p className="text-muted-foreground">En retard</p>
          <p className="text-2xl font-semibold">{s.overdueCount}</p>
        </div>
        <div className="rounded-lg border p-4 text-sm">
          <p className="text-muted-foreground">À venir</p>
          <p className="text-2xl font-semibold">{s.upcomingCount}</p>
        </div>
        <div className="rounded-lg border p-4 text-sm">
          <p className="text-muted-foreground">Rappels de sécurité</p>
          <p className="text-2xl font-semibold">{s.openRecallsCount}</p>
        </div>
        <div className="rounded-lg border p-4 text-sm">
          <p className="text-muted-foreground">Dernière synchronisation</p>
          <p className="font-medium">
            {s.lastSyncedAt
              ? new Date(s.lastSyncedAt).toLocaleString("fr-CA")
              : "Jamais"}
          </p>
          {s.warning ? (
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
              {s.warning}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={syncMaintenance}>
          Synchroniser le calendrier
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={syncRecalls}
        >
          Synchroniser les rappels TC
        </Button>
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {data.emptySchedule ? (
        <EmptyState
          title="Calendrier indisponible"
          description={
            data.emptyMessage ??
            "Nous n’avons pas encore trouvé le calendrier officiel de ce véhicule. Vous pouvez ajouter vos entretiens manuellement ou réessayer la synchronisation."
          }
        />
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">À faire maintenant</h2>
        {data.sections.dueNow.length === 0 ? (
          <p className="text-muted-foreground text-sm">Rien pour l’instant.</p>
        ) : (
          data.sections.dueNow.map((item) => (
            <ReminderRow
              key={item.id}
              item={item}
              vehicleId={vehicleId}
              onChanged={refresh}
            />
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Bientôt</h2>
        {data.sections.dueSoon.map((item) => (
          <ReminderRow
            key={item.id}
            item={item}
            vehicleId={vehicleId}
            onChanged={refresh}
          />
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">À venir</h2>
        {data.sections.upcoming.map((item) => (
          <ReminderRow
            key={item.id}
            item={item}
            vehicleId={vehicleId}
            onChanged={refresh}
          />
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Historique</h2>
        {data.sections.history.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun travail enregistré.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {data.sections.history.map((h) => (
              <li key={h.id} className="px-4 py-3 text-sm">
                <p className="font-medium">{h.title}</p>
                <p className="text-muted-foreground">
                  {h.serviceDate} · {h.odometerKm.toLocaleString("fr-CA")} km
                  {h.cost ? ` · ${h.cost} ${h.currency ?? "CAD"}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Rappels de sécurité</h2>
        {data.sections.recalls.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun rappel ouvert.</p>
        ) : (
          data.sections.recalls.map((r) => (
            <article key={r.id} className="rounded-lg border p-4 text-sm">
              <h3 className="font-medium">{r.title}</h3>
              {r.summary ? <p className="mt-1">{r.summary}</p> : null}
              {r.warning ? (
                <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
                  {r.warning}
                </p>
              ) : null}
              {r.officialUrl ? (
                <a
                  href={r.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sebavio-slate mt-2 inline-block underline"
                >
                  Fiche officielle
                </a>
              ) : null}
            </article>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Calendrier complet</h2>
        {data.sections.fullCalendar.map((item) => (
          <ReminderRow
            key={`full-${item.id}`}
            item={item}
            vehicleId={vehicleId}
            onChanged={refresh}
          />
        ))}
      </section>
    </div>
  );
}
