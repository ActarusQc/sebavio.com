import type { TripWeatherDto } from "@/features/weather/types";

type Props = {
  weather: TripWeatherDto | null;
};

function formatTemps(min: number, max: number): string {
  return `${Math.round(min)}° / ${Math.round(max)}°C`;
}

export function TripWeatherPanel({ weather }: Props) {
  if (!weather) {
    return (
      <section className="space-y-2">
        <h3 className="font-medium">Météo</h3>
        <p className="text-muted-foreground text-sm">
          Météo temporairement indisponible.
        </p>
      </section>
    );
  }

  if (weather.stops.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="font-medium">Météo</h3>
        <p className="text-muted-foreground text-sm">
          Ajoutez des étapes géocodées pour voir les prévisions.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="font-medium">Météo aux étapes</h3>
      <p className="text-muted-foreground text-sm">
        Prévisions à la date d&apos;arrivée prévue (horizon{" "}
        {weather.horizonDays} jours).
      </p>
      <ul className="divide-border divide-y rounded-lg border">
        {weather.stops.map((stop) => (
          <li
            key={stop.stopId}
            className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">
                {stop.sequence}. {stop.stopName}
              </p>
              {stop.forecastDate ? (
                <p className="text-muted-foreground text-sm">
                  {stop.forecastDate}
                </p>
              ) : null}
            </div>
            <div className="text-sm sm:text-right">
              {stop.status === "ok" && stop.forecast ? (
                <>
                  <p className="font-medium">{stop.forecast.summary}</p>
                  <p className="text-muted-foreground">
                    {formatTemps(
                      stop.forecast.tempMinC,
                      stop.forecast.tempMaxC,
                    )}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  {stop.message ?? "Indisponible"}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
