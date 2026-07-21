import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  History,
  Plus,
  Wrench,
} from "lucide-react";
import { requireActiveUser } from "@/features/auth";
import { AppPageHero, EmptyState } from "@/components/common";
import {
  Button,
  Card,
  CardContent,
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
import { BRAND_ASSETS } from "@/features/marketing";

export default async function MaintenanceDashboardPage() {
  const user = await requireActiveUser();
  const [dashboard, history] = await Promise.all([
    getMaintenanceDashboard(user.id),
    listHistory(user.id, { page: "1", pageSize: "5" }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <AppPageHero
        variant="maintenance"
        title="Entretien"
        description="Suivez les échéances, les coûts et l’état de votre véhicule avant chaque départ."
        breadcrumb={
          <span className="inline-flex items-center gap-2">
            <Image
              src={BRAND_ASSETS.icons.entretien.teal}
              alt=""
              width={16}
              height={16}
              className="opacity-80"
            />
            Espace client · Entretien
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              render={<Link href="/dashboard/maintenance/new" />}
            >
              <Plus data-icon="inline-start" />
              Ajouter un entretien
            </Button>
            <Button
              variant="outline"
              render={<Link href="/dashboard/maintenance/calendar" />}
            >
              <CalendarClock data-icon="inline-start" />
              Calendrier
            </Button>
            <Button
              variant="outline"
              render={<Link href="/dashboard/maintenance/history" />}
            >
              <History data-icon="inline-start" />
              Historique
            </Button>
          </div>
        }
      />

      <OdometerStaleBanner hints={dashboard.odometerHints} />

      <MaintenanceStatsCards stats={dashboard.stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card/90 dark:bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle
                className="text-sebavio-coral size-4"
                aria-hidden
              />
              En retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.overdue.length === 0 ? (
              <EmptyState
                className="border-0 bg-transparent py-8 shadow-none"
                title="Rien en retard"
                description="Votre véhicule est à jour — parfait pour prendre la route."
                icon={<Wrench />}
              />
            ) : (
              <ScheduleList items={dashboard.overdue} empty="" />
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/90 dark:bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock
                className="text-sebavio-slate size-4"
                aria-hidden
              />
              À venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.upcoming.length === 0 ? (
              <EmptyState
                className="border-0 bg-transparent py-8 shadow-none"
                title="Aucune échéance planifiée"
                description="Recalculez depuis un véhicule lié au catalogue, ou ajoutez un entretien."
                icon={
                  <Image
                    src={BRAND_ASSETS.icons.entretien.teal}
                    alt=""
                    width={28}
                    height={28}
                  />
                }
                action={
                  <Button
                    size="sm"
                    render={<Link href="/dashboard/maintenance/new" />}
                  >
                    Enregistrer un entretien
                  </Button>
                }
              />
            ) : (
              <ScheduleList items={dashboard.upcoming} empty="" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/90 dark:bg-card/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="text-sebavio-sage size-4" aria-hidden />
            Derniers entretiens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HistoryList items={history.items} />
        </CardContent>
      </Card>
    </div>
  );
}
