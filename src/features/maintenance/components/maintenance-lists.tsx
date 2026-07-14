import type {
  MaintenanceHistoryDto,
  MaintenanceScheduleDto,
  MaintenanceStatsDto,
  OdometerFreshnessDto,
} from "@/features/maintenance/types";
import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import Link from "next/link";

export function OdometerStaleBanner({
  hints,
}: {
  hints: OdometerFreshnessDto[];
}) {
  if (hints.length === 0) return null;
  return (
    <div
      className="border-border bg-muted/40 text-muted-foreground rounded-lg border px-4 py-3 text-sm"
      role="status"
    >
      <p className="text-foreground font-medium">Odomètre à actualiser</p>
      <ul className="mt-1 list-inside list-disc">
        {hints.map((h) => (
          <li key={h.vehicleId}>
            {h.vehicleLabel} — dernière mise à jour il y a {h.daysSinceUpdate}{" "}
            jours.{" "}
            <Link
              href={`/dashboard/vehicles/${h.vehicleId}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              Mettre à jour
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MaintenanceStatsCards({
  stats,
}: {
  stats: MaintenanceStatsDto;
}) {
  const items = [
    { label: "Interventions", value: String(stats.interventionCount) },
    { label: "Coût total", value: `${stats.totalCost} $` },
    { label: "Coût année", value: `${stats.yearCost} $` },
    { label: "À venir", value: String(stats.upcomingCount) },
    { label: "En retard", value: String(stats.overdueCount) },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-2xl">{item.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function ScheduleList({
  items,
  empty,
}: {
  items: MaintenanceScheduleDto[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{empty}</p>;
  }
  return (
    <ul className="divide-border divide-y">
      {items.map((s) => (
        <li
          key={s.id}
          className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
        >
          <div>
            <p className="font-medium">
              {s.templateTitle ?? "Entretien"}{" "}
              {s.templateCategory ? (
                <span className="text-muted-foreground font-normal">
                  · {s.templateCategory}
                </span>
              ) : null}
            </p>
            <p className="text-muted-foreground">
              {s.nextDueDate ? `Date : ${s.nextDueDate}` : "Date : —"}
              {" · "}
              {s.nextDueOdometer != null
                ? `Km : ${s.nextDueOdometer}`
                : "Km : —"}
            </p>
          </div>
          <Badge variant={s.status === "overdue" ? "destructive" : "secondary"}>
            {s.status}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function HistoryList({ items }: { items: MaintenanceHistoryDto[] }) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun entretien enregistré.
      </p>
    );
  }
  return (
    <ul className="divide-border divide-y">
      {items.map((h) => (
        <li key={h.id} className="py-3 text-sm">
          <Link
            href={`/dashboard/maintenance/${h.id}`}
            className="font-medium hover:underline"
          >
            {h.templateTitle ?? "Entretien manuel"} — {h.performedDate}
          </Link>
          <p className="text-muted-foreground">
            {h.performedOdometer} km
            {h.cost ? ` · ${h.cost} ${h.currency ?? ""}` : ""}
            {h.provider ? ` · ${h.provider}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

export { TemplateCreateForm } from "./template-create-form";
