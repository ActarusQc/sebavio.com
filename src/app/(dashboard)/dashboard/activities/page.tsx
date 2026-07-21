import { Suspense } from "react";
import { requireActiveUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import { listTrips } from "@/features/trips";
import { ActivitiesPageClient } from "@/features/trips/activities/components/activities-page-client";

type PageProps = {
  searchParams: Promise<{ tripId?: string }>;
};

export default async function ActivitiesPage({ searchParams }: PageProps) {
  const user = await requireActiveUser();
  const params = await searchParams;

  const [planned, inProgress] = await Promise.all([
    listTrips(user.id, { status: "planned", pageSize: "50" }),
    listTrips(user.id, { status: "in_progress", pageSize: "50" }),
  ]);

  const trips = [...inProgress.items, ...planned.items].map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    origin: t.origin,
    destination: t.destination,
    departureDate: t.departureDate,
  }));

  const initialTripId =
    params.tripId && trips.some((t) => t.id === params.tripId)
      ? params.tripId
      : (trips[0]?.id ?? null);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Activités"
        description="Explorez les suggestions pour vos voyages planifiés, puis choisissez-les avec l'étoile pour les retrouver sur la fiche voyage."
      />

      <Suspense
        fallback={
          <div className="bg-muted h-40 animate-pulse rounded-xl" aria-busy />
        }
      >
        <ActivitiesPageClient trips={trips} initialTripId={initialTripId} />
      </Suspense>
    </div>
  );
}
