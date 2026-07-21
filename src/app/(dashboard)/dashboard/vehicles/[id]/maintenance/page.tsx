import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui";
import { getVehicleById } from "@/features/vehicles/services";
import { getProviderMaintenanceDashboard } from "@/features/vehicle-maintenance";
import { VehicleMaintenanceDashboard } from "@/features/vehicle-maintenance/components/vehicle-maintenance-dashboard";
import { isAppError } from "@/lib/errors";

type PageProps = { params: Promise<{ id: string }> };

export default async function VehicleMaintenancePage({ params }: PageProps) {
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

  const dashboard = await getProviderMaintenanceDashboard(user.id, id);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <PageHeader
        title={`Entretien — ${vehicle.displayName}`}
        description="Calendrier, rappels et historique d’entretien du véhicule."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={<Link href={`/dashboard/vehicles/${vehicle.id}`} />}
            >
              Fiche véhicule
            </Button>
            <Button
              variant="outline"
              render={<Link href="/dashboard/maintenance" />}
            >
              Entretiens globaux
            </Button>
          </div>
        }
      />

      <VehicleMaintenanceDashboard vehicleId={id} initial={dashboard} />
    </div>
  );
}
