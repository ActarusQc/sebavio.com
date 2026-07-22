import Link from "next/link";
import { CloudOff, MapPin } from "lucide-react";
import { WeatherConditionIcon } from "@/features/weather/components/weather-condition-icon";
import type { DashboardWeather } from "@/features/dashboard/types";
import { DashboardCard } from "./dashboard-card";

type WeatherWidgetProps = {
  weather: DashboardWeather | null;
};

function formatDayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("fr-CA", { weekday: "short" }).format(d);
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  if (weather == null) {
    return (
      <DashboardCard title="Météo à 5 jours">
        <div className="text-client-text-muted flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center text-sm">
          <MapPin className="text-client-teal size-8 opacity-70" aria-hidden />
          <p>
            Ajoutez une adresse de domicile ou une destination de voyage pour
            afficher la météo.
          </p>
        </div>
      </DashboardCard>
    );
  }

  if (!weather.available) {
    return (
      <DashboardCard title="Météo à 5 jours">
        <div className="text-client-text-muted flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center text-sm">
          <CloudOff
            className="text-client-teal size-8 opacity-70"
            aria-hidden
          />
          <p>
            {weather.message ??
              "Les prévisions ne sont pas disponibles pour le moment."}
          </p>
          {weather.locationLabel ? (
            <p className="text-client-text-muted/80 text-xs">
              {weather.locationLabel}
            </p>
          ) : null}
        </div>
      </DashboardCard>
    );
  }

  const footer =
    weather.tripIdForLink != null ? (
      <Link
        href={`/dashboard/trips/${weather.tripIdForLink}`}
        className="text-client-petrol hover:text-client-night text-sm font-medium transition-colors"
      >
        Voir la météo complète →
      </Link>
    ) : undefined;

  return (
    <DashboardCard title="Météo à 5 jours" footer={footer}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-client-text-muted flex items-center gap-1.5 text-xs">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{weather.locationLabel}</span>
            </p>
            {weather.current ? (
              <>
                <p className="font-heading text-client-night text-3xl font-bold tabular-nums">
                  {Math.round(weather.current.tempC)}°C
                </p>
                <p className="text-client-text text-sm capitalize">
                  {weather.current.summary}
                </p>
                <p className="text-client-text-muted text-xs">
                  Ressenti {Math.round(weather.current.feelsLikeC)}°C
                </p>
              </>
            ) : (
              <p className="text-client-text-muted text-sm">
                Conditions actuelles indisponibles
              </p>
            )}
          </div>
          {weather.current ? (
            <WeatherConditionIcon
              code={weather.current.weatherCode}
              description={weather.current.summary}
              preferDay
              size={56}
            />
          ) : null}
        </div>

        {weather.daily.length > 0 ? (
          <ul className="grid grid-cols-5 gap-1.5">
            {weather.daily.map((day) => (
              <li
                key={day.date}
                className="bg-client-pale/80 flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center"
              >
                <span className="text-client-text-muted text-[0.65rem] font-medium uppercase">
                  {formatDayLabel(day.date)}
                </span>
                <WeatherConditionIcon
                  code={day.weatherCode}
                  description={day.summary}
                  preferDay
                  size={28}
                />
                <span className="text-client-text text-[0.65rem] tabular-nums">
                  {Math.round(day.tempMaxC)}°
                  <span className="text-client-text-muted">
                    {" "}
                    / {Math.round(day.tempMinC)}°
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </DashboardCard>
  );
}
