"use client";

import { useActionState, useCallback, useState, type ReactNode } from "react";
import {
  addStopAction,
  cancelTripAction,
  completeTripAction,
  deleteStopAction,
  optimizeTripAction,
  reorderStopsAction,
  startTripAction,
  updateStopAction,
  type TripsActionResult,
} from "@/features/trips/actions";
import type { TripDetailDto } from "@/features/trips/types";
import {
  TripFuelEstimateProvider,
  TripFuelSettingsCard,
} from "@/features/fuel/components/trip-fuel-estimate";
import type {
  ActivityMapMarker,
  FuelMapMarker,
} from "@/features/maps/components/trip-map";
import { TripActivitiesSection } from "@/features/trips/activities/components/trip-activities-section";
import type { TripActivityDto } from "@/features/trips/activities/activity-types";
import { TripHero } from "@/features/trips/components/detail/trip-hero";
import { TripQuickSummary } from "@/features/trips/components/detail/trip-quick-summary";
import { TripOverviewCard } from "@/features/trips/components/detail/trip-overview-card";
import { TripMapCard } from "@/features/trips/components/detail/trip-map-card";
import { TripStopsOverview } from "@/features/trips/components/detail/trip-stops-overview";
import { TripFutureModules } from "@/features/trips/components/detail/trip-future-modules";
import { TripItinerarySection } from "@/features/trips/components/detail/trip-itinerary-section";
import { TripConfirmDialog } from "@/features/trips/components/detail/trip-confirm-dialog";
import { TripGeolocationPanel } from "@/features/trips/components/detail/trip-geolocation-panel";
import {
  TripLiveLocationProvider,
  useTripLiveLocation,
} from "@/features/trips/components/detail/trip-live-location-context";
import { useTripLocationTracking } from "@/features/trips/hooks/use-trip-location-tracking";
import {
  TripWeatherCompact,
  TripWeatherSection,
} from "@/features/weather/components";
import { countRouteStopsByKind } from "@/features/trips/lib/stop-counts";
import { TripAssistantPanel } from "@/features/ai/components/trip-assistant-panel";

const initial: TripsActionResult | undefined = undefined;

type TripDetailPanelsProps = {
  trip: TripDetailDto;
};

export function TripDetailPanels({ trip }: TripDetailPanelsProps) {
  const tracking = useTripLocationTracking({
    tripId: trip.id,
    tripStatus: trip.status,
  });
  const [centerOnUserToken, setCenterOnUserToken] = useState(0);

  const tripOrigin =
    trip.originLatitude != null && trip.originLongitude != null
      ? {
          latitude: Number(trip.originLatitude),
          longitude: Number(trip.originLongitude),
        }
      : null;

  const userLocation = tracking.displayPosition
    ? {
        lat: tracking.displayPosition.latitude,
        lng: tracking.displayPosition.longitude,
        accuracyM: tracking.displayPosition.accuracyM,
        heading: tracking.displayPosition.heading,
      }
    : null;

  return (
    <TripLiveLocationProvider
      livePosition={tracking.displayPosition}
      latestServer={tracking.latestServer}
      tripOrigin={tripOrigin}
    >
      <TripDetailPanelsInner
        trip={trip}
        userLocation={userLocation}
        centerOnUserToken={centerOnUserToken}
        geoPanel={
          <TripGeolocationPanel
            uiState={tracking.uiState}
            messageFr={
              tracking.error?.messageFr ?? tracking.flushError?.messageFr
            }
            canCenter={Boolean(userLocation)}
            onActivate={tracking.activate}
            onPause={tracking.pauseTracking}
            onResume={tracking.resumeTracking}
            onRetry={() => {
              void tracking.refreshPermission().then((perm) => {
                if (perm === "granted" || perm === "prompt") {
                  tracking.activate();
                }
              });
            }}
            onCenter={() => setCenterOnUserToken((n) => n + 1)}
          />
        }
      />
    </TripLiveLocationProvider>
  );
}

function TripDetailPanelsInner({
  trip,
  userLocation,
  centerOnUserToken,
  geoPanel,
}: {
  trip: TripDetailDto;
  userLocation: {
    lat: number;
    lng: number;
    accuracyM?: number | null;
    heading?: number | null;
  } | null;
  centerOnUserToken: number;
  geoPanel: ReactNode;
}) {
  const live = useTripLiveLocation();
  const readonly = trip.status === "completed" || trip.status === "cancelled";
  const [fuelMarkers, setFuelMarkers] = useState<FuelMapMarker[]>([]);
  const [activityMarkers, setActivityMarkers] = useState<ActivityMapMarker[]>(
    [],
  );
  const [focusFuelMarkerId, setFocusFuelMarkerId] = useState<string | null>(
    null,
  );
  const [confirm, setConfirm] = useState<"complete" | "cancel" | null>(null);
  const [mapEditMode, setMapEditMode] = useState(false);

  const onFuelMarkersChange = useCallback((markers: FuelMapMarker[]) => {
    setFuelMarkers(markers);
  }, []);
  const onFocusFuelStop = useCallback(
    (focus: { id: string; latitude: number; longitude: number } | null) => {
      setFocusFuelMarkerId(focus?.id ?? null);
    },
    [],
  );
  const onActivitiesChange = useCallback((items: TripActivityDto[]) => {
    setActivityMarkers(
      items
        .filter(
          (a) =>
            a.status === "saved" ||
            a.status === "added_to_trip" ||
            a.status === "completed",
        )
        .map((a) => ({
          id: `activity:${a.id}`,
          kind:
            a.status === "added_to_trip" || a.status === "completed"
              ? ("activity_added" as const)
              : ("activity_saved" as const),
          title: a.name,
          lat: a.latitude,
          lng: a.longitude,
          info: {
            name: a.name,
            city: a.city,
            category: a.primaryType?.replaceAll("_", " ") ?? null,
            rating: a.rating,
            detourMinutes: a.detourDurationMinutes,
            googleMapsUrl: a.googleMapsUrl,
          },
        })),
    );
  }, []);

  const [startState, startAction, startPending] = useActionState(
    startTripAction,
    initial,
  );
  const [completeState, completeAction, completePending] = useActionState(
    completeTripAction,
    initial,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelTripAction,
    initial,
  );
  const [addState, addAction, addPending] = useActionState(
    addStopAction,
    initial,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateStopAction,
    initial,
  );
  const [delState, delAction, delPending] = useActionState(
    deleteStopAction,
    initial,
  );
  const [reorderState, reorderAction, reorderPending] = useActionState(
    reorderStopsAction,
    initial,
  );
  const [optimizeState, optimizeAction, optimizePending] = useActionState(
    optimizeTripAction,
    initial,
  );

  const recalculating =
    optimizePending ||
    addPending ||
    updatePending ||
    delPending ||
    reorderPending;

  const feedback =
    (startState?.ok === false && startState.message) ||
    (completeState?.ok === false && completeState.message) ||
    (cancelState?.ok === false && cancelState.message) ||
    (addState?.ok === false && addState.message) ||
    (updateState?.ok === false && updateState.message) ||
    (delState?.ok === false && delState.message) ||
    (reorderState?.ok === false && reorderState.message) ||
    (optimizeState?.ok === false && optimizeState.message) ||
    null;

  const success =
    (startState?.ok && startState.message) ||
    (completeState?.ok && completeState.message) ||
    (cancelState?.ok && cancelState.message) ||
    (addState?.ok && addState.message) ||
    (updateState?.ok && updateState.message) ||
    (delState?.ok && delState.message) ||
    (reorderState?.ok && reorderState.message) ||
    (optimizeState?.ok && optimizeState.message) ||
    null;

  const routeFresh = trip.route && !trip.route.isStale;
  const routeStale = Boolean(trip.route?.isStale);
  const stopCounts = countRouteStopsByKind(trip.stops);

  function submitHidden(
    action: (payload: FormData) => void,
    fields: Record<string, string>,
  ) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    action(fd);
  }

  function handleAdd(data: {
    name: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    placeId?: string | null;
    stopType: string;
    direction: "outbound" | "return";
    durationMinutes: number;
    notes?: string | null;
    alsoAddToReturn?: boolean;
    sequence?: number;
  }) {
    const fd = new FormData();
    fd.set("tripId", trip.id);
    fd.set("name", data.name);
    if (data.address) fd.set("address", data.address);
    if (data.latitude != null) fd.set("latitude", String(data.latitude));
    if (data.longitude != null) fd.set("longitude", String(data.longitude));
    if (data.placeId) fd.set("placeId", data.placeId);
    fd.set("stopType", data.stopType);
    fd.set("direction", data.direction);
    fd.set("durationMinutes", String(data.durationMinutes));
    if (data.notes) fd.set("notes", data.notes);
    if (data.alsoAddToReturn) fd.set("alsoAddToReturn", "true");
    if (data.sequence != null) fd.set("sequence", String(data.sequence));
    addAction(fd);
  }

  function handleUpdate(stopId: string, data: Record<string, unknown>) {
    const fd = new FormData();
    fd.set("tripId", trip.id);
    fd.set("stopId", stopId);
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      fd.set(k, v == null ? "" : String(v));
    }
    updateAction(fd);
  }

  function handleDelete(stopId: string) {
    submitHidden(delAction, { tripId: trip.id, stopId });
  }

  function handleReorder(
    direction: "outbound" | "return",
    orderedIds: string[],
  ) {
    const fd = new FormData();
    fd.set("tripId", trip.id);
    fd.set("direction", direction);
    fd.set("orderedIds", JSON.stringify(orderedIds));
    reorderAction(fd);
  }

  function handleMapClickAdd(lat: number, lng: number) {
    handleAdd({
      name: `Point ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      latitude: lat,
      longitude: lng,
      stopType: "detour",
      direction: "outbound",
      durationMinutes: 0,
    });
  }

  function handleWaypointDrag(stopId: string, lat: number, lng: number) {
    handleUpdate(stopId, { latitude: lat, longitude: lng });
  }

  const liveLat =
    live.isLiveUseful && trip.status === "in_progress" ? live.latitude : null;
  const liveLng =
    live.isLiveUseful && trip.status === "in_progress" ? live.longitude : null;

  return (
    <div className="flex flex-col gap-5 sm:gap-6" data-trip-detail>
      <TripHero
        tripId={trip.id}
        title={trip.title}
        status={trip.status}
        canEdit={!readonly}
      />

      <div className="flex flex-wrap items-center gap-2">
        <TripAssistantPanel
          tripId={trip.id}
          tripActive={trip.status === "in_progress"}
          liveLatitude={userLocation?.lat ?? liveLat}
          liveLongitude={userLocation?.lng ?? liveLng}
        />
      </div>
      {(feedback || success) && (
        <p
          className={
            feedback
              ? "text-destructive rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm"
              : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          }
          role={feedback ? "alert" : "status"}
        >
          {feedback ?? success}
        </p>
      )}

      <TripFuelEstimateProvider
        tripId={trip.id}
        vehicleId={trip.vehicleId}
        vehicleLabel={trip.vehicle?.displayName ?? null}
        distanceKm={routeFresh ? (trip.route?.distanceKm ?? null) : null}
        estimatedFuelCost={
          routeFresh ? (trip.route?.estimatedFuelCost ?? null) : null
        }
        routeFresh={Boolean(routeFresh)}
        routeVersion={
          routeFresh
            ? (trip.route?.waypointsHash ?? trip.route?.updatedAt ?? null)
            : null
        }
        fuelEstimateStale={Boolean(trip.route?.fuelEstimateStale)}
        vehicleSpecsVersion={
          trip.route?.fuelEstimateStale
            ? `stale:${trip.route.updatedAt}`
            : (trip.route?.updatedAt ?? null)
        }
        defaultFuelType={
          trip.vehicle?.preferredFuelType ?? trip.vehicle?.fuelType ?? null
        }
        onFuelMarkersChange={onFuelMarkersChange}
        onFocusFuelStop={onFocusFuelStop}
      >
        {/* 1. Météo compacte */}
        <TripWeatherCompact
          tripId={trip.id}
          liveLatitude={liveLat}
          liveLongitude={liveLng}
        />

        {/* 2. KPIs */}
        <TripQuickSummary
          routeFresh={Boolean(routeFresh)}
          distanceKm={routeFresh ? (trip.route?.distanceKm ?? null) : null}
          durationMin={
            routeFresh
              ? (trip.totalDurationMin ??
                trip.route?.estimatedDurationMin ??
                null)
              : null
          }
          estimatedFuelCost={
            routeFresh ? (trip.route?.estimatedFuelCost ?? null) : null
          }
          routeStopCount={stopCounts.routeStopCount}
          activityStopCount={stopCounts.activityStopCount}
          detourStopCount={stopCounts.detourStopCount}
        />

        {/* Géoloc discrète */}
        {geoPanel}

        {live.isLiveUseful && trip.status === "in_progress" ? (
          <p
            className="text-muted-foreground px-1 text-xs"
            role="status"
            data-testid="trip-geo-remaining-hint"
          >
            Position actuelle utilisée pour la météo locale, les activités à
            proximité et les estimations de trajet restant.
          </p>
        ) : null}

        {/* 3. Carburant + Carte */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-start lg:gap-6">
          <TripFuelSettingsCard />
          <TripMapCard
            trip={trip}
            readonly={readonly}
            routeStale={routeStale}
            optimizePending={recalculating}
            fuelMarkers={fuelMarkers}
            activityMarkers={activityMarkers}
            focusFuelMarkerId={focusFuelMarkerId}
            userLocation={userLocation}
            centerOnUserToken={centerOnUserToken}
            onOptimize={() => submitHidden(optimizeAction, { id: trip.id })}
            mapEditMode={mapEditMode && !readonly}
            onToggleMapEdit={() => setMapEditMode((v) => !v)}
            onMapClickAddWaypoint={handleMapClickAdd}
            onWaypointDragEnd={handleWaypointDrag}
          />
        </div>

        {/* 4. Itinéraire détaillé */}
        <TripItinerarySection
          trip={trip}
          readonly={readonly}
          recalculating={recalculating}
          mapEditMode={mapEditMode}
          onToggleMapEdit={() => setMapEditMode((v) => !v)}
          onRecalculate={() => submitHidden(optimizeAction, { id: trip.id })}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReorder={handleReorder}
        />

        {/* 5. Activités + Détails */}
        <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch lg:gap-6">
          <TripActivitiesSection
            tripId={trip.id}
            readonly={readonly}
            variant="selected"
            onActivitiesChange={onActivitiesChange}
            tripOrigin={
              live.isLiveUseful &&
              live.latitude != null &&
              live.longitude != null
                ? {
                    address: "Ma position actuelle",
                    lat: live.latitude,
                    lng: live.longitude,
                  }
                : trip.originLatitude != null && trip.originLongitude != null
                  ? {
                      address: trip.origin,
                      lat: Number(trip.originLatitude),
                      lng: Number(trip.originLongitude),
                    }
                  : { address: trip.origin, lat: NaN, lng: NaN }
            }
            tripDestination={
              trip.destinationLatitude != null &&
              trip.destinationLongitude != null
                ? {
                    address: trip.destination,
                    lat: Number(trip.destinationLatitude),
                    lng: Number(trip.destinationLongitude),
                  }
                : { address: trip.destination, lat: NaN, lng: NaN }
            }
          />
          <TripOverviewCard
            trip={trip}
            readonly={readonly}
            startPending={startPending}
            completePending={completePending}
            cancelPending={cancelPending}
            onStart={() => submitHidden(startAction, { id: trip.id })}
            onComplete={() => setConfirm("complete")}
            onCancel={() => setConfirm("cancel")}
          />
        </div>

        {/* Secondaires */}
        <TripWeatherSection
          tripId={trip.id}
          liveLatitude={liveLat}
          liveLongitude={liveLng}
        />

        <TripStopsOverview />
        <TripFutureModules />
      </TripFuelEstimateProvider>

      <TripConfirmDialog
        open={confirm === "complete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Clôturer le voyage ?"
        description="Cette action marque le voyage comme terminé. Vous pourrez toujours consulter la fiche, mais plus la modifier."
        confirmLabel="Clôturer"
        pending={completePending}
        onConfirm={() => {
          submitHidden(completeAction, { id: trip.id });
          setConfirm(null);
        }}
      />

      <TripConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Annuler le voyage ?"
        description="L'annulation est irréversible. Le voyage passera au statut Annulé."
        confirmLabel="Annuler le voyage"
        pending={cancelPending}
        destructive
        onConfirm={() => {
          submitHidden(cancelAction, { id: trip.id });
          setConfirm(null);
        }}
      />
    </div>
  );
}
