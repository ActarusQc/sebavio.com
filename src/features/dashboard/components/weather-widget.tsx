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
      <DashboardCard
        title="Météo à 5 jours"
        className="from-client-surface to-sebavio-blue-100/40 bg-gradient-to-br"
      >
        <div className="text-client-text-muted flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center text-[0.9375rem]">
          <MapPin
            className="text-sebavio-slate size-9 opacity-70"
            aria-hidden
          />
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
        <div className="text-client-text-muted flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center text-[0.9375rem]">
          <CloudOff
            className="text-sebavio-slate size-9 opacity-70"
            aria-hidden
          />
          <p>
            {weather.message ??
              "Les prévisions ne sont pas disponibles pour le moment."}
          </p>
          {weather.locationLabel ? (
            <p className="text-sm opacity-80">{weather.locationLabel}</p>
          ) : null}
        </div>
      </DashboardCard>
    );
  }

  const footer =
    weather.tripIdForLink != null ? (
      <Link
        href={`/dashboard/trips/${weather.tripIdForLink}`}
        className="text-sebavio-navy hover:text-sebavio-slate text-[0.9375rem] font-semibold transition-colors"
      >
        Voir la météo complète →
      </Link>
    ) : undefined;

  return (
    <DashboardCard
      title="Météo à 5 jours"
      footer={footer}
      className="from-client-surface to-sebavio-blue-100/50 bg-gradient-to-br"
    >
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="text-client-text-muted flex items-center gap-1.5 text-sm">
              <MapPin className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{weather.locationLabel}</span>
            </p>
            {weather.current ? (
              <>
                <p className="font-heading text-client-text text-4xl font-bold tracking-tight tabular-nums">
                  {Math.round(weather.current.tempC)}°C
                </p>
                <p className="text-client-text text-[0.9375rem] capitalize">
                  {weather.current.summary}
                </p>
                <p className="text-client-text-muted text-sm">
                  Ressenti {Math.round(weather.current.feelsLikeC)}°C
                </p>
              </>
            ) : (
              <p className="text-client-text-muted text-[0.9375rem]">
                Conditions actuelles indisponibles
              </p>
            )}
          </div>
          {weather.current ? (
            <WeatherConditionIcon
              code={weather.current.weatherCode}
              description={weather.current.summary}
              preferDay
              size={64}
            />
          ) : null}
        </div>

        {weather.daily.length > 0 ? (
          <ul className="grid grid-cols-5 gap-2">
            {weather.daily.map((day) => (
              <li
                key={day.date}
                className="bg-client-surface-strong/80 border-client-border flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-center"
              >
                <span className="text-client-text-muted text-[0.7rem] font-semibold uppercase">
                  {formatDayLabel(day.date)}
                </span>
                <WeatherConditionIcon
                  code={day.weatherCode}
                  description={day.summary}
                  preferDay
                  size={32}
                />
                <span className="text-client-text text-xs font-medium tabular-nums">
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
