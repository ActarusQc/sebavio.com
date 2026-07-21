import type {
  MaintenanceHistoryDto,
  MaintenanceScheduleDto,
  MaintenanceStatsDto,
  OdometerFreshnessDto,
} from "@/features/maintenance/types";
import { EmptyState, MetricCard } from "@/components/common";
import { Badge } from "@/components/ui";
import {
  AlertCircle,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui";
import { BRAND_ASSETS } from "@/features/marketing";

export function OdometerStaleBanner({
  hints,
}: {
  hints: OdometerFreshnessDto[];
}) {
  if (hints.length === 0) return null;
  return (
    <div
      className="border-sebavio-gold/40 bg-sebavio-gold/10 text-sebavio-navy dark:border-sebavio-gold/30 dark:bg-sebavio-gold/10 dark:text-foreground rounded-[var(--radius-card)] border px-4 py-3 text-sm"
      role="status"
    >
      <p className="font-medium">Odomètre à actualiser</p>
      <ul className="text-muted-foreground mt-1 list-inside list-disc dark:text-[#c5d0d0]">
        {hints.map((h) => (
          <li key={h.vehicleId}>
            {h.vehicleLabel} — dernière mise à jour il y a {h.daysSinceUpdate}{" "}
            jours.{" "}
            <Link
              href={`/dashboard/vehicles/${h.vehicleId}`}
              className="text-sebavio-slate dark:text-sebavio-gold underline-offset-2 hover:underline"
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
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <MetricCard
        title="Interventions"
        value={String(stats.interventionCount)}
        description="Historique enregistré"
        icon={<ClipboardList />}
        variant="neutral"
      />
      <MetricCard
        title="Coût total"
        value={`${stats.totalCost} $`}
        description="Toutes périodes"
        icon={<CircleDollarSign />}
        variant="info"
      />
      <MetricCard
        title="Coût de l’année"
        value={`${stats.yearCost} $`}
        description="Année civile en cours"
        icon={<CircleDollarSign />}
        variant="success"
      />
      <MetricCard
        title="À venir"
        value={String(stats.upcomingCount)}
        description="Prochaines échéances"
        icon={<CalendarDays />}
        variant="warning"
      />
      <MetricCard
        title="En retard"
        value={String(stats.overdueCount)}
        description="À traiter en priorité"
        icon={<AlertCircle />}
        variant={stats.overdueCount > 0 ? "danger" : "neutral"}
      />
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
    return empty ? (
      <p className="text-muted-foreground text-sm">{empty}</p>
    ) : null;
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
      <EmptyState
        className="border-0 bg-transparent py-8 shadow-none"
        title="Aucun entretien enregistré"
        description="Notez les interventions pour préparer sereinement vos prochains voyages."
        icon={
          <Image
            src={BRAND_ASSETS.icons.entretien.teal}
            alt=""
            width={28}
            height={28}
          />
        }
        action={
          <Button size="sm" render={<Link href="/dashboard/maintenance/new" />}>
            <Wrench data-icon="inline-start" />
            Ajouter un entretien
          </Button>
        }
      />
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
