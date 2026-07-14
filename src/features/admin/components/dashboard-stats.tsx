import Link from "next/link";
import type { AdminDashboardStats } from "@/features/admin/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

const STATS: {
  key: keyof Omit<AdminDashboardStats, "cachedAt">;
  label: string;
}[] = [
  { key: "usersActive", label: "Utilisateurs actifs" },
  { key: "usersSuspended", label: "Suspendus" },
  { key: "usersTotal", label: "Utilisateurs (total)" },
  { key: "registrationsLast7Days", label: "Inscriptions 7 j" },
  { key: "registrationsLast30Days", label: "Inscriptions 30 j" },
  { key: "vehiclesTotal", label: "Véhicules" },
  { key: "tripsTotal", label: "Voyages" },
  { key: "campgroundsTotal", label: "Campings" },
  { key: "activitiesTotal", label: "Activités" },
  { key: "auditLogsLast24h", label: "Audit (24 h)" },
];

type Props = {
  stats: AdminDashboardStats;
};

export function DashboardStats({ stats }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STATS.map(({ key, label }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-semibold tabular-nums">
                {stats[key]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        Cache Redis ≤ 90 s — calculé à{" "}
        {new Date(stats.cachedAt).toLocaleString("fr-CA")}
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          className="underline underline-offset-2"
          href="/admin/utilisateurs"
        >
          Gérer les utilisateurs
        </Link>
        <Link className="underline underline-offset-2" href="/admin/audit">
          Journal d&apos;audit
        </Link>
        <Link className="underline underline-offset-2" href="/admin/campings">
          Campings
        </Link>
        <Link className="underline underline-offset-2" href="/admin/activites">
          Activités
        </Link>
      </div>
    </div>
  );
}
