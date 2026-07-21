"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { Maximize2 } from "lucide-react";
import { Skeleton } from "@/components/ui";
import type {
  ActivityMapMarker,
  FuelMapMarker,
  UserLocationMarker,
} from "@/features/maps/components/trip-map";
import { formatKm } from "@/features/fuel/components/trip-fuel-form-shared";
import { formatTripDuration } from "@/features/trips/lib/format-duration";
import type { TripDetailDto } from "@/features/trips/types";

const TripMap = dynamic(
  () => import("@/features/maps").then((m) => m.TripMap),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[320px] w-full rounded-xl sm:h-[350px] lg:h-[400px]" />
    ),
  },
);

type TripMapCardProps = {
  trip: TripDetailDto;
  readonly: boolean;
  routeStale: boolean;
  optimizePending: boolean;
  fuelMarkers: FuelMapMarker[];
  activityMarkers?: ActivityMapMarker[];
  focusFuelMarkerId: string | null;
  userLocation?: UserLocationMarker | null;
  centerOnUserToken?: number;
  onOptimize: () => void;
  mapEditMode?: boolean;
  onToggleMapEdit?: () => void;
  onMapClickAddWaypoint?: (lat: number, lng: number) => void;
  onWaypointDragEnd?: (stopId: string, lat: number, lng: number) => void;
  /** Masque les boutons Modifier/Recalculer (actions sur la section Itinéraire). */
  compactActions?: boolean;
};

export function TripMapCard({
  trip,
  routeStale,
  fuelMarkers,
  activityMarkers = [],
  focusFuelMarkerId,
  userLocation = null,
  centerOnUserToken = 0,
  mapEditMode = false,
  onMapClickAddWaypoint,
  onWaypointDragEnd,
  compactActions = true,
}: TripMapCardProps) {
  const mapShellRef = useRef<HTMLDivElement>(null);

  const distanceKm = trip.route?.distanceKm ?? null;
  const durationMin =
    trip.totalDurationMin ?? trip.route?.estimatedDurationMin ?? null;
  const overlayLabel =
    trip.route && !trip.route.isStale && distanceKm
      ? `${formatKm(distanceKm)} km — ${formatTripDuration(durationMin)}`
      : null;

  function requestFullscreen() {
    const el = mapShellRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void el.requestFullscreen?.();
  }

  return (
    <section
      className="trip-card flex h-full flex-col overflow-hidden p-0"
      data-testid="trip-map-card"
      aria-labelledby="trip-map-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 pb-1.5 sm:px-5">
        <h2
          id="trip-map-title"
          className="font-heading text-sebavio-navy text-[16px] font-bold sm:text-[17px]"
        >
          Carte
        </h2>
        {compactActions ? (
          <button
            type="button"
            onClick={requestFullscreen}
            className="text-sebavio-navy inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[rgb(14_45_70/0.12)] bg-white px-3 text-[13px] font-semibold hover:bg-slate-50"
          >
            Plein écran
            <Maximize2 className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      {routeStale ? (
        <p
          className="mx-4 mb-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-950 sm:mx-5"
          role="status"
        >
          Itinéraire à recalculer — les étapes ont changé depuis le dernier
          calcul.
        </p>
      ) : null}

      <div
        id="trip-map-section"
        className="relative min-h-[320px] flex-1 px-1.5 pb-1.5 sm:min-h-[350px] sm:px-2 sm:pb-2 lg:min-h-[400px]"
      >
        <div
          ref={mapShellRef}
          className="relative h-full min-h-[inherit] w-full overflow-hidden rounded-xl bg-white [&_.gm-style]:rounded-xl"
        >
          <TripMap
            stops={trip.stops}
            route={trip.route}
            originEndpoint={
              trip.originLatitude != null && trip.originLongitude != null
                ? {
                    title: trip.origin,
                    lat: Number(trip.originLatitude),
                    lng: Number(trip.originLongitude),
                  }
                : null
            }
            destinationEndpoint={
              trip.destinationLatitude != null &&
              trip.destinationLongitude != null
                ? {
                    title: trip.destination,
                    lat: Number(trip.destinationLatitude),
                    lng: Number(trip.destinationLongitude),
                  }
                : null
            }
            fuelMarkers={fuelMarkers}
            activityMarkers={activityMarkers}
            focusFuelMarkerId={focusFuelMarkerId}
            userLocation={userLocation}
            centerOnUserToken={centerOnUserToken}
            mapEditMode={mapEditMode}
            onMapClickAddWaypoint={onMapClickAddWaypoint}
            onWaypointDragEnd={onWaypointDragEnd}
            className="h-full min-h-[320px] w-full sm:min-h-[350px] lg:min-h-[400px]"
          />
          {overlayLabel ? (
            <p
              className="text-sebavio-navy absolute bottom-3 left-3 z-[1] rounded-lg border border-[rgb(14_45_70/0.12)] bg-white/95 px-3 py-1.5 text-[13px] font-semibold tabular-nums shadow-sm"
              data-testid="trip-map-route-overlay"
            >
              {overlayLabel}
            </p>
          ) : null}
          {!compactActions ? (
            <button
              type="button"
              onClick={requestFullscreen}
              className="text-sebavio-navy absolute right-3 bottom-3 z-[1] inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[rgb(14_45_70/0.12)] bg-white/95 px-3 text-[13px] font-semibold shadow-sm hover:bg-white"
            >
              Voir en plein écran
              <Maximize2 className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
