"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  getEffectiveCoordinates,
  type CoordinateSource,
} from "@/features/trips/lib/geolocation";
import type { GeoPosition } from "@/hooks/use-geolocation";
import type { TripLocationDto } from "@/features/trips/services/trip-locations";

export type TripLiveLocationValue = {
  latitude: number | null;
  longitude: number | null;
  source: CoordinateSource;
  accuracyM: number | null;
  /** Position utilisable pour météo / POI / stations (pas l'origine persistée). */
  isLiveUseful: boolean;
};

const TripLiveLocationContext = createContext<TripLiveLocationValue>({
  latitude: null,
  longitude: null,
  source: "none",
  accuracyM: null,
  isLiveUseful: false,
});

export function TripLiveLocationProvider({
  livePosition,
  latestServer,
  tripOrigin,
  children,
}: {
  livePosition?: GeoPosition | null;
  latestServer?: TripLocationDto | null;
  tripOrigin?: { latitude: number; longitude: number } | null;
  children: ReactNode;
}) {
  const value = useMemo(() => {
    const effective = getEffectiveCoordinates({
      livePosition: livePosition
        ? {
            latitude: livePosition.latitude,
            longitude: livePosition.longitude,
            accuracyM: livePosition.accuracyM,
            recordedAtMs: livePosition.recordedAtMs,
          }
        : null,
      latestServerPosition: latestServer
        ? {
            latitude: latestServer.latitude,
            longitude: latestServer.longitude,
            accuracyM: latestServer.accuracyM,
            recordedAtMs: new Date(latestServer.recordedAt).getTime(),
          }
        : null,
      tripOrigin: tripOrigin ?? null,
    });
    return {
      latitude: effective.latitude,
      longitude: effective.longitude,
      source: effective.source,
      accuracyM: effective.accuracyM,
      isLiveUseful:
        effective.source === "live" || effective.source === "server",
    };
  }, [livePosition, latestServer, tripOrigin]);

  return (
    <TripLiveLocationContext.Provider value={value}>
      {children}
    </TripLiveLocationContext.Provider>
  );
}

export function useTripLiveLocation(): TripLiveLocationValue {
  return useContext(TripLiveLocationContext);
}
