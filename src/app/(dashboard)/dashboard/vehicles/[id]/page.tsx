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
import { VehicleDetailPanels } from "@/features/vehicles/components";
import { getVehicleById } from "@/features/vehicles/services";
import { isAppError } from "@/lib/errors";
import { getVehicleFuelStats } from "@/features/fuel/services";
import { VehicleFuelStatsSummary } from "@/features/fuel/components";

type PageProps = { params: Promise<{ id: string }> };

export default async function VehicleDetailPage({ params }: PageProps) {
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

  const fuelStats = await getVehicleFuelStats(user.id, id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title={vehicle.displayName}
        description="Fiche véhicule, photos et documents (URL)."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={<Link href="/dashboard/vehicles" />}
            >
              Liste
            </Button>
            <Button
              variant="outline"
              render={<Link href={`/dashboard/vehicles/${vehicle.id}/fuel`} />}
            >
              Carburant
            </Button>
            <Button
              render={<Link href={`/dashboard/vehicles/${vehicle.id}/edit`} />}
            >
              Modifier
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Détails</CardTitle>
          <CardDescription>
            {vehicle.stats.photoCount} photo
            {vehicle.stats.photoCount > 1 ? "s" : ""} ·{" "}
            {vehicle.stats.documentCount} document
            {vehicle.stats.documentCount > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <VehicleDetailPanels vehicle={vehicle} />
          <VehicleFuelStatsSummary vehicleId={vehicle.id} stats={fuelStats} />
        </CardContent>
      </Card>
    </div>
  );
}
