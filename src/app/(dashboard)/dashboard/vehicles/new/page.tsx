import Link from "next/link";
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
import {
  listManufacturers,
  listModels,
} from "@/features/vehicle-catalog/services";
import { MAX_PAGE_SIZE } from "@/features/vehicle-catalog/constants";

export default async function NewVehiclePage() {
  await requireActiveUser();

  const [manufacturers, models] = await Promise.all([
    listManufacturers({ pageSize: String(MAX_PAGE_SIZE), active: "true" }),
    listModels({ pageSize: String(MAX_PAGE_SIZE) }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Ajouter un véhicule"
        description="Choisissez un modèle du catalogue ou saisissez les informations manuellement."
        actions={
          <Button
            variant="outline"
            render={<Link href="/dashboard/vehicles" />}
          >
            Retour
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>
            Le kilométrage est obligatoire à la création.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm
            manufacturers={manufacturers.items}
            models={models.items}
          />
        </CardContent>
      </Card>
    </div>
  );
}
