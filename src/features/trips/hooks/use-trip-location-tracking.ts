"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGeolocation, type GeoPosition } from "@/hooks/use-geolocation";
import {
  clearTripLocationBuffer,
  enqueueLocationPoint,
  listBufferedPoints,
  removeBufferedPoints,
  type BufferedLocationPoint,
} from "@/features/trips/lib/geo-location-buffer";
import {
  mapGeolocationError,
  pauseStorageKey,
  shouldKeepSample,
  type GeoUiErrorCode,
} from "@/features/trips/lib/geolocation";
import type { TripLocationDto } from "@/features/trips/services/trip-locations";

function newClientPointId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function toBufferPoint(
  tripId: string,
  pos: GeoPosition,
  clientPointId: string,
): BufferedLocationPoint {
  return {
    clientPointId,
    tripId,
    latitude: pos.latitude,
    longitude: pos.longitude,
    accuracyM: pos.accuracyM,
    heading: pos.heading,
    speedMps: pos.speedMps,
    recordedAt: new Date(pos.recordedAtMs).toISOString(),
  };
}

type PostResult = {
  accepted: number;
  skipped: number;
  duplicates: number;
  latest: TripLocationDto | null;
};

async function postLocations(
  tripId: string,
  points: BufferedLocationPoint[],
): Promise<{ ok: true; data: PostResult } | { ok: false; status: number }> {
  const res = await fetch(`/api/v1/trips/${tripId}/locations`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      points: points.map((p) => ({
        clientPointId: p.clientPointId,
        latitude: p.latitude,
        longitude: p.longitude,
        accuracyM: p.accuracyM,
        heading: p.heading,
        speedMps: p.speedMps,
        recordedAt: p.recordedAt,
      })),
    }),
  });
  if (!res.ok) {
    return { ok: false, status: res.status };
  }
  const json = (await res.json()) as { success: boolean; data: PostResult };
  return { ok: true, data: json.data };
}

export type TripLocationUiState =
  | "disabled"
  | "permission_required"
  | "active"
  | "approximate"
  | "reconnecting"
  | "paused"
  | "unavailable"
  | "denied"
  | "unsupported";

export function useTripLocationTracking(input: {
  tripId: string;
  tripStatus: string;
  enabled?: boolean;
}) {
  const { tripId, tripStatus, enabled = true } = input;
  const geo = useGeolocation();
  const [paused, setPaused] = useState(() => {
    if (typeof sessionStorage === "undefined") return false;
    try {
      return sessionStorage.getItem(pauseStorageKey(tripId)) === "1";
    } catch {
      return false;
    }
  });
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  const [latestServer, setLatestServer] = useState<TripLocationDto | null>(
    null,
  );
  const [flushError, setFlushError] = useState<{
    code: GeoUiErrorCode;
    messageFr: string;
  } | null>(null);
  const lastKeptRef = useRef<{
    latitude: number;
    longitude: number;
    recordedAtMs: number;
    accuracyM?: number | null;
  } | null>(null);
  const flushingRef = useRef(false);
  const activeTripRef = useRef(tripId);

  const isActiveTrip =
    enabled && tripStatus === "in_progress" && Boolean(tripId);

  const writePaused = useCallback(
    (value: boolean) => {
      try {
        const key = pauseStorageKey(tripId);
        if (value) sessionStorage.setItem(key, "1");
        else sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
      setPaused(value);
    },
    [tripId],
  );

  const flushBuffer = useCallback(async () => {
    if (flushingRef.current || !isActiveTrip) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    flushingRef.current = true;
    try {
      const points = await listBufferedPoints(tripId);
      if (points.length === 0) return;
      const result = await postLocations(tripId, points);
      if (!result.ok) {
        if ([401, 403, 409, 422].includes(result.status)) {
          await clearTripLocationBuffer(tripId);
          setFlushError(mapGeolocationError("server_error"));
          if (result.status === 401 || result.status === 403) {
            geo.stop();
          }
        } else if (!navigator.onLine) {
          setFlushError(mapGeolocationError("offline"));
        } else {
          setFlushError(mapGeolocationError("server_error"));
        }
        return;
      }
      setFlushError(null);
      if (result.data.latest) setLatestServer(result.data.latest);
      // Retirer les points envoyés (acceptés, skipped ou duplicates).
      await removeBufferedPoints(points.map((p) => p.clientPointId));
    } catch {
      setFlushError(
        mapGeolocationError(
          typeof navigator !== "undefined" && !navigator.onLine
            ? "offline"
            : "server_error",
        ),
      );
    } finally {
      flushingRef.current = false;
    }
  }, [geo, isActiveTrip, tripId]);

  const enqueueAndFlush = useCallback(
    async (pos: GeoPosition) => {
      if (!isActiveTrip || paused) return;
      const sample = {
        latitude: pos.latitude,
        longitude: pos.longitude,
        recordedAtMs: pos.recordedAtMs,
        accuracyM: pos.accuracyM,
      };
      if (!shouldKeepSample(sample, lastKeptRef.current)) return;
      lastKeptRef.current = sample;
      const clientPointId = newClientPointId();
      const buffered = toBufferPoint(tripId, pos, clientPointId);
      try {
        await enqueueLocationPoint(buffered);
      } catch {
        // IndexedDB indisponible : tentative d'envoi immédiat.
      }
      await flushBuffer();
    },
    [flushBuffer, isActiveTrip, paused, tripId],
  );

  // Changement de voyage / statut terminal → stop + clear buffer local.
  useEffect(() => {
    if (activeTripRef.current !== tripId) {
      void clearTripLocationBuffer(activeTripRef.current);
      geo.stop();
      activeTripRef.current = tripId;
      lastKeptRef.current = null;
      queueMicrotask(() => {
        try {
          setPaused(sessionStorage.getItem(pauseStorageKey(tripId)) === "1");
        } catch {
          setPaused(false);
        }
      });
    }
    if (!isActiveTrip) {
      geo.stop();
      void clearTripLocationBuffer(tripId);
      try {
        sessionStorage.removeItem(pauseStorageKey(tripId));
      } catch {
        // ignore
      }
      queueMicrotask(() => setPaused(false));
    }
  }, [geo, isActiveTrip, tripId]);

  // Auto-start si permission granted (sans redemander si prompt).
  useEffect(() => {
    if (!isActiveTrip) return;
    const isPaused = pausedRef.current;
    void (async () => {
      const perm = await geo.refreshPermission();
      if (isPaused) {
        geo.pause();
        return;
      }
      if (perm === "granted") {
        geo.start();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- démarrage une fois par voyage actif
  }, [isActiveTrip, tripId]);

  // Échantillonnage à chaque nouvelle position.
  useEffect(() => {
    if (!geo.position || !isActiveTrip || paused) return;
    void enqueueAndFlush(geo.position);
  }, [enqueueAndFlush, geo.position, isActiveTrip, paused]);

  // Online → flush.
  useEffect(() => {
    const onOnline = () => {
      void flushBuffer();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushBuffer]);

  const activate = useCallback(() => {
    writePaused(false);
    geo.start();
  }, [geo, writePaused]);

  const pauseTracking = useCallback(() => {
    writePaused(true);
    geo.pause();
  }, [geo, writePaused]);

  const resumeTracking = useCallback(() => {
    writePaused(false);
    geo.resume();
  }, [geo, writePaused]);

  const displayPosition = geo.position ?? geo.lastKnownPosition;
  const approximate =
    displayPosition?.accuracyM != null && displayPosition.accuracyM >= 500;

  let uiState: TripLocationUiState = "disabled";
  if (!isActiveTrip) {
    uiState = "disabled";
  } else if (geo.permissionState === "unsupported") {
    uiState = "unsupported";
  } else if (geo.permissionState === "denied") {
    uiState = "denied";
  } else if (paused || geo.trackingState === "paused") {
    uiState = "paused";
  } else if (geo.trackingState === "temporarily_unavailable") {
    uiState = "reconnecting";
  } else if (geo.trackingState === "tracking" || geo.position) {
    uiState = approximate ? "approximate" : "active";
  } else if (geo.permissionState === "prompt") {
    uiState = "permission_required";
  } else if (geo.trackingState === "error") {
    uiState = "unavailable";
  } else if (geo.permissionState === "granted") {
    uiState = geo.trackingState === "requesting" ? "reconnecting" : "active";
  }

  return {
    ...geo,
    paused,
    uiState,
    displayPosition,
    latestServer,
    flushError,
    activate,
    pauseTracking,
    resumeTracking,
    clearLocalState: async () => {
      await clearTripLocationBuffer(tripId);
      try {
        sessionStorage.removeItem(pauseStorageKey(tripId));
      } catch {
        // ignore
      }
    },
  };
}
