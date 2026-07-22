import { Briefcase, Car, Fuel, Star } from "lucide-react";
import type { DashboardStats } from "@/features/dashboard/types";
import { DashboardCard } from "./dashboard-card";
import { cn } from "@/lib/utils";

type QuickStatsWidgetProps = {
  stats: DashboardStats;
};

const ITEMS: {
  key: keyof DashboardStats;
  title: string;
  icon: typeof Briefcase;
  format: (stats: DashboardStats) => string;
  accent?: boolean;
}[] = [
  {
    key: "upcomingTrips",
    title: "Voyages à venir",
    icon: Briefcase,
    format: (s) => String(s.upcomingTrips),
  },
  {
    key: "savedActivities",
    title: "Activités sauvegardées",
    icon: Star,
    format: (s) => String(s.savedActivities),
    accent: true,
  },
  {
    key: "activeVehicles",
    title: "Véhicules actifs",
    icon: Car,
    format: (s) => String(s.activeVehicles),
  },
  {
    key: "nextTripDistanceKm",
    title: "Prochain trajet estimé",
    icon: Fuel,
    format: (s) =>
      s.nextTripDistanceKm != null
        ? `${Math.round(s.nextTripDistanceKm)} km`
        : "Non disponible",
  },
];

export function QuickStatsWidget({ stats }: QuickStatsWidgetProps) {
  return (
    <DashboardCard title="Aperçu rapide">
      <ul className="grid grid-cols-2 gap-3 sm:gap-3.5">
        {ITEMS.map(({ key, title, icon: Icon, format, accent }) => (
          <li
            key={key}
            className={cn(
              "flex flex-col gap-2.5 rounded-xl border p-3.5 transition-shadow duration-200 hover:shadow-[var(--client-shadow)]",
              accent
                ? "border-sebavio-gold/35 bg-sebavio-orange-100/70"
                : "border-client-border bg-client-pale/80",
            )}
          >
            <Icon
              className={cn(
                "size-5",
                accent ? "text-sebavio-gold" : "text-sebavio-slate",
              )}
              aria-hidden
            />
            <p className="font-heading text-client-text text-2xl font-bold tracking-tight tabular-nums">
              {format(stats)}
            </p>
            <p className="text-client-text-muted text-sm leading-snug">
              {title}
            </p>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
