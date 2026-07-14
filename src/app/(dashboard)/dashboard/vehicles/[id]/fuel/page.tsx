import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import { FuelLogsPanel } from "@/features/fuel/components";
import {
  getVehicleFuelStats,
  listVehicleFuelLogs,
} from "@/features/fuel/services";
import { getVehicleById } from "@/features/vehicles/services";
import { isAppError } from "@/lib/errors";

type PageProps = { params: Promise<{ id: string }> };

export default async function VehicleFuelPage({ params }: PageProps) {
  const user = await requireActiveUser();
  const { id } = await params;

  let vehicle;
  try {
    vehicle = await getVehicleById(user.id, id);
  } catch (error) {
    if (isAppError(error) && error.code === "VEH_001") {
      notFound();
    }
    throw error;
  }

  const [logsPage, stats] = await Promise.all([
    listVehicleFuelLogs(user.id, id, { pageSize: "50" }),
    getVehicleFuelStats(user.id, id),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title={`Carburant — ${vehicle.displayName}`}
        description="Suivi des pleins et consommation réelle."
        actions={
          <Button
            variant="outline"
            render={<Link href={`/dashboard/vehicles/${vehicle.id}`} />}
          >
            Fiche véhicule
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Pleins</CardTitle>
          <CardDescription>
            Odomètre courant : {vehicle.currentOdometer.toLocaleString("fr-CA")}{" "}
            km
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FuelLogsPanel
            vehicleId={vehicle.id}
            currentOdometer={vehicle.currentOdometer}
            logs={logsPage.items}
            stats={stats}
          />
        </CardContent>
      </Card>
    </div>
  );
}
