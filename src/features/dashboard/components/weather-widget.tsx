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
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center text-[0.9375rem] text-white/60">
          <MapPin className="size-9 text-[#c4b5fd] opacity-80" aria-hidden />
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
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center text-[0.9375rem] text-white/60">
          <CloudOff className="size-9 text-[#c4b5fd] opacity-80" aria-hidden />
          <p>
            {weather.message ??
              "Les prévisions ne sont pas disponibles pour le moment."}
          </p>
          {weather.locationLabel ? (
            <p className="text-sm text-white/45">{weather.locationLabel}</p>
          ) : null}
        </div>
      </DashboardCard>
    );
  }

  const footer =
    weather.tripIdForLink != null ? (
      <Link
        href={`/dashboard/trips/${weather.tripIdForLink}`}
        className="text-[0.9375rem] font-semibold text-[#93c5fd] transition-colors hover:text-white"
      >
        Voir la météo complète →
      </Link>
    ) : undefined;

  return (
    <DashboardCard
      title="Météo à 5 jours"
      footer={footer}
      className="bg-[linear-gradient(160deg,rgba(12,30,56,0.95),rgba(26,45,80,0.9))]"
    >
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="flex items-center gap-1.5 text-sm text-white/55">
              <MapPin className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{weather.locationLabel}</span>
            </p>
            {weather.current ? (
              <>
                <p className="font-heading text-4xl font-bold tracking-tight text-white tabular-nums">
                  {Math.round(weather.current.tempC)}°C
                </p>
                <p className="text-[0.9375rem] text-white/85 capitalize">
                  {weather.current.summary}
                </p>
                <p className="text-sm text-white/50">
                  Ressenti {Math.round(weather.current.feelsLikeC)}°C
                </p>
              </>
            ) : (
              <p className="text-[0.9375rem] text-white/55">
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
                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-1 py-2.5 text-center"
              >
                <span className="text-[0.7rem] font-semibold text-white/50 uppercase">
                  {formatDayLabel(day.date)}
                </span>
                <WeatherConditionIcon
                  code={day.weatherCode}
                  description={day.summary}
                  preferDay
                  size={32}
                />
                <span className="text-xs font-medium text-white tabular-nums">
                  {Math.round(day.tempMaxC)}°
                  <span className="text-white/45">
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
