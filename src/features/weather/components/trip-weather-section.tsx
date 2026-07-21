"use client";

import { useEffect, useId, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  CloudOff,
  CloudSun,
  Droplets,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  TripWeatherLocation,
  TripWeatherResponse,
} from "@/features/weather/types";

type Props = {
  tripId: string;
  liveLatitude?: number | null;
  liveLongitude?: number | null;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; data: TripWeatherResponse }
  | { kind: "error"; message: string };

function iconUrl(iconId: string): string {
  return `https://openweathermap.org/img/wn/${iconId}@2x.png`;
}

function formatWind(kmh: number | null | undefined): string | null {
  if (kmh == null) return null;
  return `${Math.round(kmh)} km/h`;
}

function alertLevelLabel(level: string): string {
  if (level === "important") return "Important";
  if (level === "vigilance") return "Vigilance";
  return "Information";
}

function LocationCard({
  location,
  showHourly,
}: {
  location: TripWeatherLocation;
  showHourly: boolean;
}) {
  const [openHourly, setOpenHourly] = useState(false);
  const panelId = useId();
  const day = location.daily[0];
  const iconId = day?.condition.iconId ?? location.current?.condition.iconId;

  return (
    <article
      className="trip-card flex min-w-0 flex-col gap-3 p-4"
      data-testid="trip-weather-location"
    >
      <header className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sebavio-navy text-sm font-semibold break-words">
            {location.name}
          </p>
          {location.date ? (
            <p className="text-muted-foreground text-xs">{location.date}</p>
          ) : null}
        </div>
        {iconId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl(iconId)}
            alt={day?.condition.description ?? "Icône météo"}
            width={56}
            height={56}
            className="size-14 shrink-0"
          />
        ) : (
          <CloudSun className="text-sebavio-teal size-8 shrink-0" aria-hidden />
        )}
      </header>

      {day ? (
        <div className="space-y-1">
          <p className="text-sebavio-navy text-base font-semibold">
            {day.condition.description}
          </p>
          <p className="text-sebavio-navy text-lg font-bold">
            {Math.round(day.tempMinC)}° / {Math.round(day.tempMaxC)}°C
          </p>
          {day.feelsLikeDayC != null ? (
            <p className="text-muted-foreground text-sm">
              Ressenti {Math.round(day.feelsLikeDayC)}°C
            </p>
          ) : null}
          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {day.precipitationProbability != null ? (
              <span className="inline-flex items-center gap-1">
                <Droplets className="size-3.5" aria-hidden />
                <span>Pluie {day.precipitationProbability} %</span>
              </span>
            ) : null}
            {formatWind(day.windSpeedKmh) ? (
              <span className="inline-flex items-center gap-1">
                <Wind className="size-3.5" aria-hidden />
                <span>Vent {formatWind(day.windSpeedKmh)}</span>
              </span>
            ) : null}
          </div>
          {location.summary ? (
            <p className="text-muted-foreground text-sm">{location.summary}</p>
          ) : null}
        </div>
      ) : location.current ? (
        <div className="space-y-1">
          <p className="text-sebavio-navy text-base font-semibold">
            {location.current.condition.description}
          </p>
          <p className="text-sebavio-navy text-lg font-bold">
            {Math.round(location.current.temperatureC)}°C
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              ressenti {Math.round(location.current.feelsLikeC)}°C
            </span>
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Prévisions non disponibles pour ce lieu.
        </p>
      )}

      {location.alerts.length > 0 ? (
        <ul className="space-y-2" aria-label="Alertes météo">
          {location.alerts.map((alert) => (
            <li
              key={alert.id}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                alert.level === "important"
                  ? "border-red-300 bg-red-50 text-red-900"
                  : alert.level === "vigilance"
                    ? "border-amber-300 bg-amber-50 text-amber-950"
                    : "border-sky-200 bg-sky-50 text-sky-950",
              )}
            >
              <p className="flex items-start gap-2 font-semibold">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {alert.title}{" "}
                  <span className="font-normal">
                    ({alertLevelLabel(alert.level)})
                  </span>
                </span>
              </p>
              <p className="mt-1 text-xs opacity-90">
                {alert.senderName} —{" "}
                {new Date(alert.startAt).toLocaleString("fr-CA")} →{" "}
                {new Date(alert.endAt).toLocaleString("fr-CA")}
              </p>
              <p className="mt-1">{alert.summary}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {showHourly && location.hourly.length > 0 ? (
        <div>
          <button
            type="button"
            className="focus-visible:ring-sebavio-teal flex min-h-11 w-full items-center justify-between gap-2 rounded-md text-left text-sm font-medium outline-none focus-visible:ring-2"
            aria-expanded={openHourly}
            aria-controls={panelId}
            onClick={() => setOpenHourly((v) => !v)}
          >
            Prévisions horaires
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                openHourly && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {openHourly ? (
            <ul
              id={panelId}
              className="mt-2 flex gap-2 overflow-x-auto pb-1"
              role="list"
            >
              {location.hourly.map((h) => (
                <li
                  key={h.forecastAt}
                  className="bg-sebavio-teal-soft/40 flex w-20 shrink-0 flex-col items-center rounded-lg px-2 py-2 text-center text-xs"
                >
                  <span className="text-muted-foreground">
                    {new Date(h.forecastAt).toLocaleTimeString("fr-CA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={iconUrl(h.condition.iconId)}
                    alt={h.condition.description}
                    width={36}
                    height={36}
                  />
                  <span className="font-semibold">
                    {Math.round(h.temperatureC)}°
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <footer className="text-muted-foreground flex flex-wrap gap-2 text-xs">
        {location.updatedAt ? (
          <span>
            Mise à jour {new Date(location.updatedAt).toLocaleString("fr-CA")}
          </span>
        ) : null}
        {location.fromCache ? (
          <span>{location.stale ? "Cache (données anciennes)" : "Cache"}</span>
        ) : null}
      </footer>
    </article>
  );
}

function Skeleton() {
  return (
    <div
      className="space-y-3"
      aria-busy="true"
      aria-live="polite"
      data-testid="trip-weather-loading"
    >
      <div className="bg-muted h-5 w-40 animate-pulse rounded" />
      <div className="bg-muted h-28 animate-pulse rounded-xl" />
      <div className="bg-muted h-28 animate-pulse rounded-xl" />
    </div>
  );
}

export function TripWeatherSection({
  tripId,
  liveLatitude = null,
  liveLongitude = null,
}: Props) {
  return (
    <TripWeatherSectionInner
      key={`${tripId}:${liveLatitude ?? ""}:${liveLongitude ?? ""}`}
      tripId={tripId}
      liveLatitude={liveLatitude}
      liveLongitude={liveLongitude}
    />
  );
}

function TripWeatherSectionInner({
  tripId,
  liveLatitude,
  liveLongitude,
}: Props) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const params = new URLSearchParams();
        if (
          liveLatitude != null &&
          liveLongitude != null &&
          Number.isFinite(liveLatitude) &&
          Number.isFinite(liveLongitude)
        ) {
          params.set("liveLat", String(liveLatitude));
          params.set("liveLng", String(liveLongitude));
        }
        const qs = params.toString();
        const res = await fetch(
          `/api/v1/trips/${tripId}/weather${qs ? `?${qs}` : ""}`,
          { credentials: "same-origin" },
        );
        if (!res.ok) {
          throw new Error("Erreur de chargement météo");
        }
        const json = (await res.json()) as {
          success?: boolean;
          data?: { weather?: TripWeatherResponse };
        };
        const weather = json.data?.weather;
        if (!weather) {
          throw new Error("Réponse météo invalide");
        }
        if (!cancelled) {
          setState({ kind: "ready", data: weather });
        }
      } catch {
        if (!cancelled) {
          setState({
            kind: "error",
            message: "Impossible de charger la météo pour le moment.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tripId, liveLatitude, liveLongitude]);

  return (
    <details
      id="trip-weather-section"
      className="trip-card group open:pb-4"
      data-testid="trip-weather-section"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 marker:content-none sm:p-5 [&::-webkit-details-marker]:hidden">
        <span
          className="bg-sebavio-teal-soft text-sebavio-teal flex size-9 items-center justify-center rounded-full"
          aria-hidden
        >
          <CloudSun className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id="trip-weather-heading"
            className="text-sebavio-navy text-base font-semibold"
          >
            Détails météo
          </h2>
          <p className="text-muted-foreground text-xs">
            Prévisions complètes par étape
          </p>
        </div>
        <ChevronDown
          className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="space-y-4 px-4 pb-1 sm:px-5">
        {state.kind === "loading" ? <Skeleton /> : null}

        {state.kind === "error" ? (
          <p
            className="text-muted-foreground flex items-start gap-2 text-sm"
            role="alert"
          >
            <CloudOff className="size-4 shrink-0" aria-hidden />
            {state.message}
          </p>
        ) : null}

        {state.kind === "ready" ? <WeatherBody data={state.data} /> : null}
      </div>
    </details>
  );
}

function WeatherBody({ data }: { data: TripWeatherResponse }) {
  if (data.status === "disabled") {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        {data.message ?? "La météo est désactivée."}
      </p>
    );
  }

  if (data.status === "no_coordinates") {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        {data.message ?? "Aucune coordonnée disponible pour afficher la météo."}
      </p>
    );
  }

  if (data.status === "too_early") {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        {data.message ??
          "Les prévisions météo seront disponibles à l'approche de votre voyage."}
      </p>
    );
  }

  if (data.status === "provider_limit_reached") {
    return (
      <div className="space-y-3" role="status">
        <p className="text-muted-foreground text-sm">
          {data.message ??
            "Limite quotidienne d'appels météo atteinte. Réessayez plus tard."}
        </p>
        {data.locations.some((l) => l.daily.length > 0) ? (
          <LocationsList data={data} />
        ) : null}
      </div>
    );
  }

  if (data.status === "temporarily_unavailable") {
    return (
      <div className="space-y-3" role="status">
        <p className="text-muted-foreground flex items-start gap-2 text-sm">
          <CloudOff className="size-4 shrink-0" aria-hidden />
          {data.message ?? "Fournisseur météo temporairement indisponible."}
        </p>
        {data.locations.some((l) => l.stale && l.daily.length > 0) ? (
          <LocationsList data={data} />
        ) : null}
      </div>
    );
  }

  if (data.locations.length === 0) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Les prévisions météo seront disponibles à l&apos;approche de votre
        voyage.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.message ? (
        <p className="text-muted-foreground text-sm" role="status">
          {data.message}
        </p>
      ) : null}
      <LocationsList data={data} />
    </div>
  );
}

function LocationsList({ data }: { data: TripWeatherResponse }) {
  const showHourly =
    data.displayWindow === "hourly" || data.displayWindow === "live";

  return (
    <div
      className="flex flex-col gap-3 md:grid md:grid-cols-2"
      data-testid="trip-weather-locations"
    >
      {data.locations.map((location) => (
        <LocationCard
          key={location.id}
          location={location}
          showHourly={showHourly}
        />
      ))}
    </div>
  );
}

/** Ancien panneau — conserve l'export pour compat. */
export { TripWeatherPanel } from "./trip-weather-panel";
