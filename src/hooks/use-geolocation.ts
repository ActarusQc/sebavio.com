"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  mapGeolocationError,
  type GeoUiErrorCode,
} from "@/features/trips/lib/geolocation";

export type GeolocationPermissionState =
  "unsupported" | "prompt" | "granted" | "denied" | "unavailable";

export type GeolocationTrackingState =
  | "idle"
  | "requesting"
  | "tracking"
  | "paused"
  | "temporarily_unavailable"
  | "error";

export type GeoPosition = {
  latitude: number;
  longitude: number;
  accuracyM: number | null;
  heading: number | null;
  speedMps: number | null;
  recordedAtMs: number;
};

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 10_000,
  timeout: 20_000,
};

function readPermissionFromGeolocationError(
  error: GeolocationPositionError,
): GeolocationPermissionState | null {
  if (error.code === error.PERMISSION_DENIED) return "denied";
  return null;
}

export function useGeolocation() {
  const [permissionState, setPermissionState] =
    useState<GeolocationPermissionState>("unavailable");
  const [trackingState, setTrackingState] =
    useState<GeolocationTrackingState>("idle");
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [lastKnownPosition, setLastKnownPosition] =
    useState<GeoPosition | null>(null);
  const [error, setError] = useState<{
    code: GeoUiErrorCode;
    messageFr: string;
  } | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const mountedRef = useRef(true);
  const wasTrackingBeforeHideRef = useRef(false);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current != null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const refreshPermission = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermissionState("unsupported");
      return "unsupported" as const;
    }
    try {
      if (navigator.permissions?.query) {
        const status = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });
        const mapped =
          status.state === "granted"
            ? "granted"
            : status.state === "denied"
              ? "denied"
              : "prompt";
        if (mountedRef.current) setPermissionState(mapped);
        status.onchange = () => {
          const next =
            status.state === "granted"
              ? "granted"
              : status.state === "denied"
                ? "denied"
                : "prompt";
          if (mountedRef.current) setPermissionState(next);
        };
        return mapped;
      }
    } catch {
      // Permissions API indisponible pour geolocation (Safari, etc.)
    }
    if (mountedRef.current) setPermissionState("prompt");
    return "prompt" as const;
  }, []);

  const applyPosition = useCallback((geo: GeolocationPosition) => {
    const next: GeoPosition = {
      latitude: geo.coords.latitude,
      longitude: geo.coords.longitude,
      accuracyM:
        geo.coords.accuracy != null && Number.isFinite(geo.coords.accuracy)
          ? geo.coords.accuracy
          : null,
      heading:
        geo.coords.heading != null && Number.isFinite(geo.coords.heading)
          ? geo.coords.heading
          : null,
      speedMps:
        geo.coords.speed != null && Number.isFinite(geo.coords.speed)
          ? geo.coords.speed
          : null,
      recordedAtMs: geo.timestamp,
    };
    if (!mountedRef.current) return;
    setPosition(next);
    setLastKnownPosition(next);
    setError(null);
    setTrackingState(pausedRef.current ? "paused" : "tracking");
    setPermissionState("granted");
  }, []);

  const applyError = useCallback((err: GeolocationPositionError) => {
    const mapped = mapGeolocationError(err.code);
    const perm = readPermissionFromGeolocationError(err);
    if (!mountedRef.current) return;
    setError(mapped);
    if (perm) setPermissionState(perm);
    if (err.code === err.POSITION_UNAVAILABLE || err.code === err.TIMEOUT) {
      setTrackingState("temporarily_unavailable");
    } else {
      setTrackingState("error");
    }
  }, []);

  const startWatch = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermissionState("unsupported");
      setTrackingState("error");
      setError(mapGeolocationError("unsupported"));
      return;
    }
    if (watchIdRef.current != null) return;
    pausedRef.current = false;
    setTrackingState("requesting");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => applyPosition(pos),
      (err) => applyError(err),
      WATCH_OPTIONS,
    );
  }, [applyError, applyPosition]);

  const start = useCallback(() => {
    startWatch();
  }, [startWatch]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    clearWatch();
    setTrackingState("paused");
  }, [clearWatch]);

  const resume = useCallback(() => {
    pausedRef.current = false;
    clearWatch();
    startWatch();
  }, [clearWatch, startWatch]);

  const stop = useCallback(() => {
    pausedRef.current = false;
    wasTrackingBeforeHideRef.current = false;
    clearWatch();
    setTrackingState("idle");
    setPosition(null);
  }, [clearWatch]);

  useEffect(() => {
    mountedRef.current = true;
    queueMicrotask(() => {
      void refreshPermission();
    });
    return () => {
      mountedRef.current = false;
      clearWatch();
    };
  }, [clearWatch, refreshPermission]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        wasTrackingBeforeHideRef.current =
          trackingState === "tracking" || trackingState === "requesting";
        // Ne pas promettre de suivi en arrière-plan ; clearWatch pour éviter
        // les callbacks fantômes, on relancera au retour.
        if (wasTrackingBeforeHideRef.current && !pausedRef.current) {
          clearWatch();
          setTrackingState("temporarily_unavailable");
        }
        return;
      }
      void (async () => {
        await refreshPermission();
        if (wasTrackingBeforeHideRef.current && !pausedRef.current) {
          setTrackingState("requesting");
          startWatch();
        }
      })();
    };

    const onPageHide = () => {
      wasTrackingBeforeHideRef.current =
        !pausedRef.current && watchIdRef.current != null;
      clearWatch();
    };

    const onPageShow = () => {
      if (wasTrackingBeforeHideRef.current && !pausedRef.current) {
        startWatch();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [clearWatch, refreshPermission, startWatch, trackingState]);

  return {
    permissionState,
    trackingState,
    position,
    lastKnownPosition,
    error,
    start,
    pause,
    resume,
    stop,
    refreshPermission,
  };
}
