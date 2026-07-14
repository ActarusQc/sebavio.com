"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { decodeGooglePolyline } from "@/features/maps/lib/polyline";
import type { TripRouteDto, TripStopDto } from "@/features/trips/types";

type TripMapProps = {
  stops: TripStopDto[];
  route: TripRouteDto | null;
  className?: string;
};

type GoogleMapsNs = {
  maps: {
    Map: new (
      el: HTMLElement,
      opts: {
        center: { lat: number; lng: number };
        zoom: number;
        mapId?: string;
        disableDefaultUI?: boolean;
      },
    ) => {
      fitBounds: (b: unknown) => void;
    };
    Marker: new (opts: {
      map: unknown;
      position: { lat: number; lng: number };
      title?: string;
    }) => unknown;
    Polyline: new (opts: {
      map: unknown;
      path: Array<{ lat: number; lng: number }>;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }) => unknown;
    LatLngBounds: new () => {
      extend: (p: { lat: number; lng: number }) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsNs;
  }
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("client only"));
  }
  if (window.google?.maps) {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(
    "script[data-sebavio-google-maps]",
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Google Maps script error")),
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.sebavioGoogleMaps = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps script error"));
    document.head.appendChild(script);
  });
}

function clientApiKey(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || null;
}

/**
 * Carte voyage — lazy, mode dégradé si clé client absente ou script KO.
 * La clé NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ne doit autoriser que Maps JavaScript API.
 */
export function TripMap({ stops, route, className }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiKey = clientApiKey();

  const markers = useMemo(
    () =>
      stops
        .filter((s) => s.latitude != null && s.longitude != null)
        .map((s) => ({
          id: s.id,
          title: s.name,
          lat: Number(s.latitude),
          lng: Number(s.longitude),
        })),
    [stops],
  );

  const markersKey = markers.map((m) => `${m.id}:${m.lat},${m.lng}`).join("|");
  const polyline = route?.isStale ? null : (route?.polyline ?? null);
  const canRender =
    Boolean(apiKey) && (markers.length > 0 || Boolean(polyline));

  const [loadError, setLoadError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canRender || !apiKey) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await loadGoogleMapsScript(apiKey);
        if (cancelled || !containerRef.current || !window.google?.maps) {
          return;
        }

        const center = markers[0] ?? { lat: 46.8, lng: -71.2 };
        const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID?.trim();
        const map = new window.google.maps.Map(containerRef.current, {
          center,
          zoom: 7,
          ...(mapId ? { mapId } : {}),
          disableDefaultUI: false,
        });

        const bounds = new window.google.maps.LatLngBounds();

        for (const m of markers) {
          new window.google.maps.Marker({
            map,
            position: { lat: m.lat, lng: m.lng },
            title: m.title,
          });
          bounds.extend({ lat: m.lat, lng: m.lng });
        }

        if (polyline) {
          const path = decodeGooglePolyline(polyline);
          new window.google.maps.Polyline({
            map,
            path,
            strokeColor: "#0f766e",
            strokeOpacity: 0.85,
            strokeWeight: 4,
          });
          for (const p of path) {
            bounds.extend(p);
          }
        }

        map.fitBounds(bounds);
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- markersKey / polyline / canRender
  }, [markersKey, polyline, canRender, apiKey]);

  if (!canRender) {
    return (
      <p className="text-muted-foreground text-sm">
        Carte indisponible — les adresses restent consultables en texte.
      </p>
    );
  }

  return (
    <div className={className}>
      {loadError ? (
        <p className="text-muted-foreground mb-2 text-sm">
          Affichage carte indisponible (script Google injoignable).
        </p>
      ) : null}
      {!ready && !loadError ? (
        <p className="text-muted-foreground mb-2 text-sm">
          Chargement de la carte…
        </p>
      ) : null}
      <div
        ref={containerRef}
        className="bg-muted h-64 w-full overflow-hidden rounded-lg border sm:h-80"
        aria-label="Carte du voyage"
      />
    </div>
  );
}
