"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { decodeGooglePolyline } from "@/features/maps/lib/polyline";
import { hasGoogleMapsApiKey, loadGoogleMaps } from "@/lib/google-maps-loader";
import type { TripRouteDto, TripStopDto } from "@/features/trips/types";
import { cn } from "@/lib/utils";

export type FuelMapMarker = {
  id: string;
  kind: "fuel_outbound" | "fuel_return";
  /** Numéro d'arrêt sur la jambe (aller ou retour). */
  sequence?: number;
  title: string;
  lat: number;
  lng: number;
  info?: {
    name?: string | null;
    address?: string | null;
    city?: string | null;
    pricePerLiter?: string | null;
    litersAdded?: string | null;
    cost?: string | null;
    distanceFromStartKm?: string | null;
    isEstimatedLocation?: boolean;
  };
};

export type ActivityMapMarker = {
  id: string;
  kind: "activity_suggested" | "activity_saved" | "activity_added";
  title: string;
  lat: number;
  lng: number;
  info?: {
    name?: string | null;
    city?: string | null;
    category?: string | null;
    rating?: number | null;
    detourMinutes?: number | null;
    googleMapsUrl?: string | null;
  };
};

export type TripEndpointMarker = {
  title: string;
  lat: number;
  lng: number;
};

export type UserLocationMarker = {
  lat: number;
  lng: number;
  accuracyM?: number | null;
  heading?: number | null;
};

type TripMapProps = {
  stops: TripStopDto[];
  route: TripRouteDto | null;
  className?: string;
  /** Départ canonique du Trip — jamais déduit des TripStop. */
  originEndpoint?: TripEndpointMarker | null;
  /** Destination canonique du Trip — jamais le dernier arrêt. */
  destinationEndpoint?: TripEndpointMarker | null;
  fuelMarkers?: FuelMapMarker[];
  activityMarkers?: ActivityMapMarker[];
  focusFuelMarkerId?: string | null;
  /** Position GPS live (distincte des stops / fuel / activités). */
  userLocation?: UserLocationMarker | null;
  /** Incrémenter pour recentrer une fois sur userLocation. */
  centerOnUserToken?: number;
  /** Mode édition itinéraire : clic carte + marqueurs intermédiaires déplaçables. */
  mapEditMode?: boolean;
  /** Ajout d'un détour/étape par clic sur la carte (mode édition uniquement). */
  onMapClickAddWaypoint?: (lat: number, lng: number) => void;
  /** Déplacement d'un arrêt intermédiaire existant (mode édition uniquement). */
  onWaypointDragEnd?: (stopId: string, lat: number, lng: number) => void;
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
        gestureHandling?: string;
      },
    ) => {
      fitBounds: (b: unknown) => void;
      panTo: (p: { lat: number; lng: number }) => void;
      setZoom: (z: number) => void;
      setOptions: (opts: { gestureHandling?: string }) => void;
      addListener: (
        event: string,
        handler: (e: {
          latLng?: { lat: () => number; lng: () => number } | null;
        }) => void,
      ) => { remove: () => void };
    };
    Marker: new (opts: {
      map: unknown;
      position: { lat: number; lng: number };
      title?: string;
      label?: string | { text: string; color?: string };
      icon?: unknown;
      draggable?: boolean;
    }) => {
      setMap: (m: unknown) => void;
      setAnimation: (a: unknown) => void;
      setDraggable: (draggable: boolean) => void;
      setPosition: (p: { lat: number; lng: number }) => void;
      setIcon: (icon: unknown) => void;
      setTitle: (title: string) => void;
      addListener: (event: string, handler: () => void) => void;
      getPosition: () => { lat: () => number; lng: () => number } | null;
    };
    InfoWindow: new (opts?: { content?: string }) => {
      setContent: (c: string) => void;
      open: (opts: { map: unknown; anchor: unknown }) => void;
      close: () => void;
    };
    Polyline: new (opts: {
      map: unknown;
      path: Array<{ lat: number; lng: number }>;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }) => { setMap: (m: unknown) => void };
    LatLngBounds: new () => {
      extend: (p: { lat: number; lng: number }) => void;
      isEmpty?: () => boolean;
    };
    Circle: new (opts: {
      map: unknown;
      center: { lat: number; lng: number };
      radius: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }) => {
      setMap: (m: unknown) => void;
      setCenter: (p: { lat: number; lng: number }) => void;
      setRadius: (r: number) => void;
    };
    SymbolPath?: { CIRCLE: unknown; FORWARD_CLOSED_ARROW?: unknown };
    Animation?: { BOUNCE: unknown };
  };
};

function activityInfoHtml(m: ActivityMapMarker): string {
  const i = m.info;
  const statusLabel =
    m.kind === "activity_added"
      ? "Ajoutée au voyage"
      : m.kind === "activity_saved"
        ? "Enregistrée"
        : "Suggestion";
  const lines: string[] = [
    `<span style="font-size:11px;opacity:.8">${escapeHtml(statusLabel)}</span>`,
    `<strong>${escapeHtml(i?.name ?? m.title)}</strong>`,
  ];
  if (i?.category) lines.push(escapeHtml(i.category));
  if (i?.city) lines.push(escapeHtml(i.city));
  if (i?.rating != null) lines.push(`Note : ${i.rating.toFixed(1)}`);
  if (i?.detourMinutes != null) {
    lines.push(`Détour estimé : ${i.detourMinutes} min`);
  }
  return `<div style="max-width:240px;font-size:13px;line-height:1.35">${lines.join("<br/>")}</div>`;
}

function fuelInfoHtml(m: FuelMapMarker): string {
  const i = m.info;
  const leg = m.kind === "fuel_return" ? "Retour" : "Aller";
  const seq =
    m.sequence != null ? `Arrêt ${m.sequence} — ${leg}` : `Carburant — ${leg}`;
  const lines: string[] = [
    `<span style="font-size:11px;opacity:.8">${escapeHtml(seq)}</span>`,
    `<strong>${escapeHtml(i?.name ?? m.title)}</strong>`,
  ];
  if (i?.isEstimatedLocation) {
    lines.push(`<em>La station exacte sera à confirmer avant le départ.</em>`);
  }
  if (i?.address) lines.push(escapeHtml(i.address));
  if (i?.city && !i?.isEstimatedLocation) lines.push(escapeHtml(i.city));
  if (i?.pricePerLiter) {
    lines.push(`Prix estimé : ${escapeHtml(i.pricePerLiter)} $/L`);
  }
  if (i?.litersAdded) {
    lines.push(`Quantité à ajouter : ${escapeHtml(i.litersAdded)} L`);
  }
  if (i?.cost) lines.push(`Coût estimé : ${escapeHtml(i.cost)} $`);
  return `<div style="max-width:240px;font-size:13px;line-height:1.35">${lines.join("<br/>")}</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Carte voyage — lazy, mode dégradé si clé client absente ou script KO.
 * Marqueurs distincts : étapes, arrêts carburant aller / retour.
 */
export function TripMap({
  stops,
  route,
  className,
  originEndpoint = null,
  destinationEndpoint = null,
  fuelMarkers = [],
  activityMarkers = [],
  focusFuelMarkerId = null,
  userLocation = null,
  centerOnUserToken = 0,
  mapEditMode = false,
  onMapClickAddWaypoint,
  onWaypointDragEnd,
}: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<InstanceType<GoogleMapsNs["maps"]["Map"]> | null>(null);
  const mapsNsRef = useRef<GoogleMapsNs["maps"] | null>(null);
  const infoRef = useRef<InstanceType<
    GoogleMapsNs["maps"]["InfoWindow"]
  > | null>(null);
  const fuelMarkerObjsRef = useRef<
    Map<string, InstanceType<GoogleMapsNs["maps"]["Marker"]>>
  >(new Map());
  const activityMarkerObjsRef = useRef<
    Map<string, InstanceType<GoogleMapsNs["maps"]["Marker"]>>
  >(new Map());
  const tripMarkersRef = useRef<InstanceType<GoogleMapsNs["maps"]["Marker"]>[]>(
    [],
  );
  const stopMarkerObjsRef = useRef<
    Map<string, InstanceType<GoogleMapsNs["maps"]["Marker"]>>
  >(new Map());
  const userMarkerRef = useRef<InstanceType<
    GoogleMapsNs["maps"]["Marker"]
  > | null>(null);
  const userAccuracyRef = useRef<InstanceType<
    GoogleMapsNs["maps"]["Circle"]
  > | null>(null);
  const polylineRef = useRef<InstanceType<
    GoogleMapsNs["maps"]["Polyline"]
  > | null>(null);
  const returnPolylineRef = useRef<InstanceType<
    GoogleMapsNs["maps"]["Polyline"]
  > | null>(null);
  const clickListenerRef = useRef<{ remove: () => void } | null>(null);
  const lastCenterTokenRef = useRef(0);

  // Refs pour toujours appeler la dernière version des callbacks sans
  // recréer la carte (évite un remount coûteux à chaque re-render parent).
  const onMapClickAddWaypointRef = useRef(onMapClickAddWaypoint);
  const onWaypointDragEndRef = useRef(onWaypointDragEnd);
  useEffect(() => {
    onMapClickAddWaypointRef.current = onMapClickAddWaypoint;
    onWaypointDragEndRef.current = onWaypointDragEnd;
  }, [onMapClickAddWaypoint, onWaypointDragEnd]);

  const apiKey = hasGoogleMapsApiKey();

  const tripMarkers = useMemo(() => {
    const markers: Array<{
      id: string;
      title: string;
      kind: "origin" | "destination" | "stop";
      lat: number;
      lng: number;
      stopId?: string;
      stopType?: string;
    }> = [];

    if (originEndpoint) {
      markers.push({
        id: `origin:${originEndpoint.title}`,
        title: `Départ — ${originEndpoint.title}`,
        kind: "origin",
        lat: originEndpoint.lat,
        lng: originEndpoint.lng,
      });
    }

    for (const s of stops) {
      if (s.latitude == null || s.longitude == null) continue;
      // Les TripStop sont toujours des étapes intermédiaires — jamais la destination.
      markers.push({
        id: `route-stop:${s.id}`,
        title: s.name,
        kind: "stop",
        lat: Number(s.latitude),
        lng: Number(s.longitude),
        stopId: s.id,
        stopType: s.stopType,
      });
    }

    if (destinationEndpoint) {
      markers.push({
        id: `destination:${destinationEndpoint.title}`,
        title: `Destination — ${destinationEndpoint.title}`,
        kind: "destination",
        lat: destinationEndpoint.lat,
        lng: destinationEndpoint.lng,
      });
    }

    return markers;
  }, [stops, originEndpoint, destinationEndpoint]);

  const markersKey = [
    tripMarkers
      .map((m) => `${m.id}:${m.lat},${m.lng}:${m.stopType ?? ""}`)
      .join("|"),
    fuelMarkers.map((m) => `${m.id}:${m.kind}:${m.lat},${m.lng}`).join("|"),
    activityMarkers.map((m) => `${m.id}:${m.kind}:${m.lat},${m.lng}`).join("|"),
  ].join("||");

  const polyline = route?.isStale ? null : (route?.polyline ?? null);
  const returnPolyline = route?.isStale
    ? null
    : (route?.returnPolyline ?? null);
  const canRender =
    Boolean(apiKey) &&
    (tripMarkers.length > 0 ||
      fuelMarkers.length > 0 ||
      activityMarkers.length > 0 ||
      Boolean(polyline) ||
      Boolean(returnPolyline));

  const [loadError, setLoadError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canRender || !apiKey) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await loadGoogleMaps({ libraries: ["maps"] });
        const googleMaps = window.google?.maps as
          GoogleMapsNs["maps"] | undefined;
        if (cancelled || !containerRef.current || !googleMaps) {
          return;
        }

        mapsNsRef.current = googleMaps;
        const center = tripMarkers[0] ??
          fuelMarkers[0] ?? { lat: 46.8, lng: -71.2 };
        const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID?.trim();
        const map = new googleMaps.Map(containerRef.current, {
          center,
          zoom: 7,
          ...(mapId ? { mapId } : {}),
          disableDefaultUI: false,
          // "cooperative" par défaut : ne capture jamais le scroll de la page.
          // "greedy" en mode édition, pour une interaction précise au doigt/clic.
          gestureHandling: mapEditMode ? "greedy" : "cooperative",
        });
        mapRef.current = map;
        infoRef.current = new googleMaps.InfoWindow();

        const bounds = new googleMaps.LatLngBounds();

        for (const m of tripMarkersRef.current) m.setMap(null);
        tripMarkersRef.current = [];
        stopMarkerObjsRef.current.clear();
        for (const m of tripMarkers) {
          const isDetour = m.kind === "stop" && m.stopType === "detour";
          const marker = new googleMaps.Marker({
            map,
            position: { lat: m.lat, lng: m.lng },
            title: m.title,
            draggable: m.kind === "stop" && mapEditMode,
            label:
              m.kind === "origin"
                ? "D"
                : m.kind === "destination"
                  ? "A"
                  : isDetour
                    ? { text: "D", color: "#ffffff" }
                    : undefined,
            icon:
              m.kind === "stop"
                ? {
                    path: googleMaps.SymbolPath?.CIRCLE ?? 0,
                    scale: isDetour ? 10 : 8,
                    fillColor: isDetour ? "#c2410c" : "#0f766e",
                    fillOpacity: 0.95,
                    strokeColor: isDetour ? "#7c2d12" : "#0f766e",
                    strokeWeight: 2,
                  }
                : undefined,
          });
          if (m.kind === "stop" && m.stopId) {
            const stopId = m.stopId;
            marker.addListener("dragend", () => {
              const pos = marker.getPosition();
              if (pos) {
                onWaypointDragEndRef.current?.(stopId, pos.lat(), pos.lng());
              }
            });
            stopMarkerObjsRef.current.set(stopId, marker);
          }
          tripMarkersRef.current.push(marker);
          bounds.extend({ lat: m.lat, lng: m.lng });
        }

        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }
        if (polyline) {
          const path = decodeGooglePolyline(polyline);
          polylineRef.current = new googleMaps.Polyline({
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

        if (returnPolylineRef.current) {
          returnPolylineRef.current.setMap(null);
          returnPolylineRef.current = null;
        }
        if (returnPolyline) {
          const returnPath = decodeGooglePolyline(returnPolyline);
          returnPolylineRef.current = new googleMaps.Polyline({
            map,
            path: returnPath,
            strokeColor: "#0f766e",
            strokeOpacity: 0.4,
            strokeWeight: 3,
          });
          for (const p of returnPath) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- markersKey / polyline / canRender / mapEditMode (état initial uniquement)
  }, [markersKey.split("||")[0], polyline, returnPolyline, canRender, apiKey]);

  // Bascule glisser-déposer des arrêts intermédiaires sans recréer la carte.
  useEffect(() => {
    if (!ready) return;
    for (const [, marker] of stopMarkerObjsRef.current) {
      marker.setDraggable(mapEditMode);
    }
  }, [mapEditMode, ready, markersKey]);

  // Interaction carte : ajustement du geste + clic pour ajouter un détour.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setOptions({ gestureHandling: mapEditMode ? "greedy" : "cooperative" });

    clickListenerRef.current?.remove();
    clickListenerRef.current = null;
    if (mapEditMode) {
      clickListenerRef.current = map.addListener("click", (event) => {
        const latLng = event.latLng;
        if (!latLng) return;
        onMapClickAddWaypointRef.current?.(latLng.lat(), latLng.lng());
      });
    }

    return () => {
      clickListenerRef.current?.remove();
      clickListenerRef.current = null;
    };
  }, [mapEditMode, ready]);

  // Mise à jour des marqueurs carburant sans recréer la carte
  useEffect(() => {
    const map = mapRef.current;
    const googleMaps = mapsNsRef.current;
    if (!map || !googleMaps || !ready) return;

    for (const [, marker] of fuelMarkerObjsRef.current) {
      marker.setMap(null);
    }
    fuelMarkerObjsRef.current.clear();

    for (const m of fuelMarkers) {
      const fill = m.kind === "fuel_return" ? "#b45309" : "#0f766e";
      const seqLabel =
        m.sequence != null && m.sequence > 0
          ? String(m.sequence)
          : m.kind === "fuel_return"
            ? "R"
            : "C";
      const marker = new googleMaps.Marker({
        map,
        position: { lat: m.lat, lng: m.lng },
        title: m.title,
        label: {
          text: seqLabel,
          color: "#ffffff",
        },
        icon: {
          path: googleMaps.SymbolPath?.CIRCLE ?? 0,
          scale: m.info?.isEstimatedLocation ? 11 : 12,
          fillColor: fill,
          fillOpacity: m.info?.isEstimatedLocation ? 0.45 : 0.95,
          strokeColor: fill,
          strokeWeight: 2,
          strokeOpacity: 1,
        },
      });
      marker.addListener("click", () => {
        const info = infoRef.current;
        if (!info) return;
        info.setContent(fuelInfoHtml(m));
        info.open({ map, anchor: marker });
      });
      fuelMarkerObjsRef.current.set(m.id, marker);
    }
  }, [fuelMarkers, ready, markersKey]);

  // Marqueurs activités (violet Sebavio, distincts carburant / étapes)
  useEffect(() => {
    const map = mapRef.current;
    const googleMaps = mapsNsRef.current;
    if (!map || !googleMaps || !ready) return;

    for (const [, marker] of activityMarkerObjsRef.current) {
      marker.setMap(null);
    }
    activityMarkerObjsRef.current.clear();

    for (const m of activityMarkers) {
      const fill =
        m.kind === "activity_added"
          ? "#7c3aed"
          : m.kind === "activity_saved"
            ? "#a78bfa"
            : "#c4b5fd";
      const marker = new googleMaps.Marker({
        map,
        position: { lat: m.lat, lng: m.lng },
        title: m.title,
        label: {
          text: "A",
          color: "#1e1b4b",
        },
        icon: {
          path: googleMaps.SymbolPath?.CIRCLE ?? 0,
          scale: m.kind === "activity_added" ? 11 : 9,
          fillColor: fill,
          fillOpacity: 0.95,
          strokeColor: "#4c1d95",
          strokeWeight: 2,
          strokeOpacity: 1,
        },
      });
      marker.addListener("click", () => {
        const info = infoRef.current;
        if (!info) return;
        info.setContent(activityInfoHtml(m));
        info.open({ map, anchor: marker });
      });
      activityMarkerObjsRef.current.set(m.id, marker);
    }
  }, [activityMarkers, ready, markersKey]);

  useEffect(() => {
    if (!focusFuelMarkerId || !ready) return;
    const map = mapRef.current;
    const marker = fuelMarkerObjsRef.current.get(focusFuelMarkerId);
    const fuel = fuelMarkers.find((m) => m.id === focusFuelMarkerId);
    if (!map || !marker || !fuel) return;

    map.panTo({ lat: fuel.lat, lng: fuel.lng });
    map.setZoom(12);
    if (mapsNsRef.current?.Animation?.BOUNCE) {
      marker.setAnimation(mapsNsRef.current.Animation.BOUNCE);
      window.setTimeout(() => marker.setAnimation(null), 1400);
    }
    const info = infoRef.current;
    if (info) {
      info.setContent(fuelInfoHtml(fuel));
      info.open({ map, anchor: marker });
    }
  }, [focusFuelMarkerId, fuelMarkers, ready]);

  // Marqueur « Ma position » + cercle de précision (sans recentrage auto).
  useEffect(() => {
    const map = mapRef.current;
    const googleMaps = mapsNsRef.current;
    if (!map || !googleMaps || !ready) return;

    if (!userLocation) {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      userAccuracyRef.current?.setMap(null);
      userAccuracyRef.current = null;
      return;
    }

    const pos = { lat: userLocation.lat, lng: userLocation.lng };
    const heading =
      userLocation.heading != null &&
      Number.isFinite(userLocation.heading) &&
      (userLocation.accuracyM == null || userLocation.accuracyM < 100)
        ? userLocation.heading
        : null;

    const icon =
      heading != null && googleMaps.SymbolPath?.FORWARD_CLOSED_ARROW != null
        ? {
            path: googleMaps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: "#0d9488",
            fillOpacity: 1,
            strokeColor: "#134e4a",
            strokeWeight: 2,
            rotation: heading,
          }
        : {
            path: googleMaps.SymbolPath?.CIRCLE ?? 0,
            scale: 10,
            fillColor: "#0d9488",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          };

    if (!userMarkerRef.current) {
      userMarkerRef.current = new googleMaps.Marker({
        map,
        position: pos,
        title: "Ma position",
        icon,
      });
      userMarkerRef.current.addListener("click", () => {
        const info = infoRef.current;
        if (!info || !userMarkerRef.current) return;
        info.setContent(
          `<div style="font-size:13px"><strong>Ma position</strong></div>`,
        );
        info.open({ map, anchor: userMarkerRef.current });
      });
    } else {
      userMarkerRef.current.setPosition(pos);
      userMarkerRef.current.setIcon(icon);
      userMarkerRef.current.setTitle("Ma position");
    }

    const accuracy =
      userLocation.accuracyM != null &&
      Number.isFinite(userLocation.accuracyM) &&
      userLocation.accuracyM > 0
        ? userLocation.accuracyM
        : null;

    if (accuracy != null) {
      if (!userAccuracyRef.current) {
        userAccuracyRef.current = new googleMaps.Circle({
          map,
          center: pos,
          radius: accuracy,
          fillColor: "#0d9488",
          fillOpacity: 0.12,
          strokeColor: "#0d9488",
          strokeOpacity: 0.35,
          strokeWeight: 1,
        });
      } else {
        userAccuracyRef.current.setCenter(pos);
        userAccuracyRef.current.setRadius(accuracy);
      }
    } else if (userAccuracyRef.current) {
      userAccuracyRef.current.setMap(null);
      userAccuracyRef.current = null;
    }
  }, [userLocation, ready]);

  // Recentrage ponctuel (bouton « Me centrer »).
  useEffect(() => {
    if (!ready || !userLocation || !centerOnUserToken) return;
    if (centerOnUserToken === lastCenterTokenRef.current) return;
    lastCenterTokenRef.current = centerOnUserToken;
    const map = mapRef.current;
    if (!map) return;
    map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
    map.setZoom(14);
  }, [centerOnUserToken, userLocation, ready]);

  if (!canRender) {
    return (
      <p className="text-muted-foreground text-sm">
        Carte indisponible — les adresses restent consultables en texte.
      </p>
    );
  }

  return (
    <div>
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
        className={cn(
          "bg-muted h-[240px] w-full overflow-hidden rounded-xl border sm:h-[320px] lg:h-[380px]",
          className,
        )}
        aria-label="Carte du voyage"
        data-testid="trip-map"
      />
    </div>
  );
}
