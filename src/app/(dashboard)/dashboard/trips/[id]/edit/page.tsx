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
import { TripForm } from "@/features/trips/components";
import { getTripById } from "@/features/trips/services";
import { listVehicles } from "@/features/vehicles/services";
import { MAX_PAGE_SIZE } from "@/features/vehicles/constants";
import { isAppError } from "@/lib/errors";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditTripPage({ params }: PageProps) {
  const user = await requireActiveUser();
  const { id } = await params;

  let trip;
  try {
    trip = await getTripById(user.id, id);
  } catch (error) {
    if (isAppError(error) && error.code === "TRIP_001") {
      notFound();
    }
    throw error;
  }

  if (trip.status === "completed" || trip.status === "cancelled") {
    notFound();
  }

  const vehicles = await listVehicles(user.id, {
    pageSize: String(MAX_PAGE_SIZE),
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Modifier le voyage"
        description={trip.title}
        actions={
          <Button
            variant="outline"
            render={<Link href={`/dashboard/trips/${trip.id}`} />}
          >
            Retour
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>Le véhicule doit vous appartenir.</CardDescription>
        </CardHeader>
        <CardContent>
          <TripForm
            trip={trip}
            vehicles={vehicles.items.map((v) => ({
              id: v.id,
              displayName: v.displayName,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
