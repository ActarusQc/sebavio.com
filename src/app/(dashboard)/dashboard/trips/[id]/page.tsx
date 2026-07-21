import { notFound } from "next/navigation";
import { requireActiveUser } from "@/features/auth";
import { UnlockTripPanel } from "@/features/subscriptions/components";
import {
  buildLimitedTripPreview,
  resolveUserAccess,
} from "@/features/subscriptions/services/access-resolve";
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

  const access = await resolveUserAccess(user.id);
  const showUnlock = access.level === "decouverte";
  const preview = showUnlock
    ? buildLimitedTripPreview({
        approximateDistanceKm: trip.route?.distanceKm
          ? Number(trip.route.distanceKm)
          : null,
        approximateDurationMinutes:
          trip.totalDurationMin ?? trip.route?.estimatedDurationMin ?? null,
        stopCount: trip.stopCount,
        fuelLitersEstimate: null,
      })
    : null;

  return (
    <div
      className="mx-auto flex w-full max-w-[1320px] flex-col gap-5 sm:gap-6 lg:gap-[22px]"
      data-trip-detail
    >
      {showUnlock && preview ? (
        <UnlockTripPanel tripId={trip.id} preview={preview} />
      ) : null}
      <TripDetailPanels trip={trip} />
    </div>
  );
}
