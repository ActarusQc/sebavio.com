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
              "flex flex-col gap-2.5 rounded-xl border p-3.5 transition-shadow duration-200",
              accent
                ? "border-[#f0b64d]/30 bg-[rgba(240,182,77,0.1)]"
                : "border-white/10 bg-white/5",
            )}
          >
            <Icon
              className={cn(
                "size-5",
                accent ? "text-[#f0b64d]" : "text-[#c4b5fd]",
              )}
              aria-hidden
            />
            <p className="font-heading text-2xl font-bold tracking-tight text-white tabular-nums">
              {format(stats)}
            </p>
            <p className="text-sm leading-snug text-white/55">{title}</p>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
