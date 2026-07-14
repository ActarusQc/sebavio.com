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
import { VehicleForm } from "@/features/vehicles/components";
import { getVehicleById } from "@/features/vehicles/services";
import {
  listManufacturers,
  listModels,
} from "@/features/vehicle-catalog/services";
import { MAX_PAGE_SIZE } from "@/features/vehicle-catalog/constants";
import { isAppError } from "@/lib/errors";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditVehiclePage({ params }: PageProps) {
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

  const [manufacturers, models] = await Promise.all([
    listManufacturers({ pageSize: String(MAX_PAGE_SIZE), active: "true" }),
    listModels({ pageSize: String(MAX_PAGE_SIZE) }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Modifier le véhicule"
        description={vehicle.displayName}
        actions={
          <Button
            variant="outline"
            render={<Link href={`/dashboard/vehicles/${vehicle.id}`} />}
          >
            Retour à la fiche
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>
            Vous pouvez lier un véhicule manuel à un modèle du catalogue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm
            manufacturers={manufacturers.items}
            models={models.items}
            vehicle={vehicle}
          />
        </CardContent>
      </Card>
    </div>
  );
}
