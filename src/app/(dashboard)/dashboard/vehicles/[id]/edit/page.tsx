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
            Les consommations officielles du catalogue ne sont pas écrasées par
            une moyenne réelle des pleins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm vehicle={vehicle} />
        </CardContent>
      </Card>
    </div>
  );
}
