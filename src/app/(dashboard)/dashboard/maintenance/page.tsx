import Link from "next/link";
import { requireActiveUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  HistoryList,
  MaintenanceStatsCards,
  OdometerStaleBanner,
  ScheduleList,
} from "@/features/maintenance/components";
import {
  getMaintenanceDashboard,
  listHistory,
} from "@/features/maintenance/services";

export default async function MaintenanceDashboardPage() {
  const user = await requireActiveUser();
  const [dashboard, history] = await Promise.all([
    getMaintenanceDashboard(user.id),
    listHistory(user.id, { page: "1", pageSize: "5" }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeader
        title="Entretien"
        description="Échéances, historique et coûts — calculés côté serveur."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button render={<Link href="/dashboard/maintenance/new" />}>
              Ajouter
            </Button>
            <Button
              variant="outline"
              render={<Link href="/dashboard/maintenance/calendar" />}
            >
              Calendrier
            </Button>
            <Button
              variant="outline"
              render={<Link href="/dashboard/maintenance/history" />}
            >
              Historique
            </Button>
          </div>
        }
      />

      <OdometerStaleBanner hints={dashboard.odometerHints} />

      <MaintenanceStatsCards stats={dashboard.stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>En retard</CardTitle>
            <CardDescription>
              Priorité aux échéances dépassées (date ou kilométrage).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleList
              items={dashboard.overdue}
              empty="Aucune échéance en retard."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>À venir</CardTitle>
            <CardDescription>
              Prochaines interventions planifiées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleList
              items={dashboard.upcoming}
              empty="Aucune échéance à venir. Recalculez depuis un véhicule lié au catalogue."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Derniers entretiens</CardTitle>
          <CardDescription>Historique récent.</CardDescription>
        </CardHeader>
        <CardContent>
          <HistoryList items={history.items} />
        </CardContent>
      </Card>
    </div>
  );
}
