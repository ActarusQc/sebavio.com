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
import { TripDetailPanels } from "@/features/trips/components";
import { getTripById } from "@/features/trips/services";
import { isAppError } from "@/lib/errors";

type PageProps = { params: Promise<{ id: string }> };

export default async function TripDetailPage({ params }: PageProps) {
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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title={trip.title}
        description="Fiche voyage et étapes."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" render={<Link href="/dashboard/trips" />}>
              Liste
            </Button>
            {trip.status !== "completed" && trip.status !== "cancelled" ? (
              <Button
                render={<Link href={`/dashboard/trips/${trip.id}/edit`} />}
              >
                Modifier
              </Button>
            ) : null}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Détails</CardTitle>
          <CardDescription>
            {trip.stopCount} étape{trip.stopCount > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TripDetailPanels trip={trip} />
        </CardContent>
      </Card>
    </div>
  );
}
