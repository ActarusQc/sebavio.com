import { Briefcase, Car, Fuel, Star } from "lucide-react";
import type { DashboardStats } from "@/features/dashboard/types";
import { DashboardCard } from "./dashboard-card";

type QuickStatsWidgetProps = {
  stats: DashboardStats;
};

const ITEMS: {
  key: keyof DashboardStats;
  title: string;
  icon: typeof Briefcase;
  format: (stats: DashboardStats) => string;
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
      <ul className="grid grid-cols-2 gap-3">
        {ITEMS.map(({ key, title, icon: Icon, format }) => (
          <li
            key={key}
            className="bg-client-pale/70 flex flex-col gap-2 rounded-xl p-3 transition-shadow duration-200 hover:shadow-[var(--client-shadow)]"
          >
            <Icon className="text-client-teal size-4" aria-hidden />
            <p className="font-heading text-client-night text-lg font-semibold tabular-nums">
              {format(stats)}
            </p>
            <p className="text-client-text-muted text-[0.7rem] leading-tight">
              {title}
            </p>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
