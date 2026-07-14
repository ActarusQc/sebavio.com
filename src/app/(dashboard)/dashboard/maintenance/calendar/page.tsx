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
import { ScheduleList } from "@/features/maintenance/components";
import { listUserSchedules } from "@/features/maintenance/services";

export default async function MaintenanceCalendarPage() {
  const user = await requireActiveUser();
  const schedules = await listUserSchedules(user.id);
  const active = schedules.filter((s) => s.status !== "completed");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div>
        <Link
          href="/dashboard/maintenance"
          className="text-muted-foreground mb-3 inline-block text-sm hover:underline"
        >
          ← Entretien
        </Link>
        <PageHeader
          title="Calendrier des échéances"
          description="Échéances par date et/ou kilométrage."
          actions={
            <Button render={<Link href="/dashboard/maintenance/new" />}>
              Ajouter
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planifiées</CardTitle>
          <CardDescription>
            Statuts upcoming / overdue recalculés côté serveur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleList
            items={active}
            empty="Aucune échéance. Liez un véhicule à un modèle catalogue et lancez un recalcul."
          />
        </CardContent>
      </Card>
    </div>
  );
}
