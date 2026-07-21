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

export default async function NewVehiclePage() {
  await requireActiveUser();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Ajouter un véhicule"
        description="Sélectionnez votre véhicule dans le catalogue officiel canadien (cotes NRCan), ou saisissez-le manuellement s’il n’y figure pas."
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
            Année → marque → modèle → configuration. La consommation officielle
            est remplie automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm />
        </CardContent>
      </Card>
    </div>
  );
}
