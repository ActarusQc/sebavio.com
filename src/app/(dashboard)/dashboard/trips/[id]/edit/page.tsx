import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/features/auth";
import { AppPageHero } from "@/components/common";
import { Button } from "@/components/ui";
import { getTravelerProfile } from "@/features/trips/activities/trip-activity-service";
import { TripForm } from "@/features/trips/components";
import { getTripById } from "@/features/trips/services";
import { listVehicles } from "@/features/vehicles/services";
import { listTravelGroups } from "@/features/travel-groups/services";
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

  const [vehicles, groups, travelerProfile] = await Promise.all([
    listVehicles(user.id, { pageSize: String(MAX_PAGE_SIZE) }),
    listTravelGroups(user.id, { pageSize: String(MAX_PAGE_SIZE) }),
    getTravelerProfile(user.id, id),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <AppPageHero
        variant="trips"
        title="Modifier le voyage"
        description={trip.title}
        breadcrumb={<span>Espace client · Voyages · Modification</span>}
        actions={
          <Button
            variant="outline"
            render={<Link href={`/dashboard/trips/${trip.id}`} />}
          >
            Retour
          </Button>
        }
      />

      <TripForm
        trip={trip}
        travelerProfile={travelerProfile}
        vehicles={vehicles.items.map((v) => ({
          id: v.id,
          displayName: v.displayName,
        }))}
        groups={groups.items.map((g) => ({
          id: g.id,
          name: g.name,
        }))}
      />
    </div>
  );
}
