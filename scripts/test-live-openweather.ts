/**
 * Smoke test manuel OpenWeather — consomme de vrais appels API.
 * Usage : npm run test:live:openweather
 */
import "dotenv/config";
import { OpenWeatherProvider } from "../src/services/weather/openweather/provider";
import { loadWeatherConfig } from "../src/services/weather/config";

async function main() {
  const config = loadWeatherConfig();
  if (!config.openWeatherApiKey) {
    console.error(
      "OPENWEATHER_API_KEY manquante — configurez .env puis relancez.",
    );
    process.exit(1);
  }

  const provider = new OpenWeatherProvider({ config });
  console.info("Provider available:", provider.isAvailable());
  console.info("One Call version:", config.openWeatherOneCallVersion);

  const forecast = await provider.getForecast({
    latitude: 46.8139,
    longitude: -71.208,
    parts: { current: true, hourly: true, daily: true, alerts: true },
  });

  console.info(
    JSON.stringify(
      {
        provider: forecast.provider,
        timezone: forecast.timezone,
        dailyCount: forecast.daily.length,
        hourlyCount: forecast.hourly.length,
        hasCurrent: Boolean(forecast.current),
        alerts: forecast.alerts.length,
        firstDay: forecast.daily[0]
          ? {
              date: forecast.daily[0].date,
              summary: forecast.daily[0].summary,
              min: forecast.daily[0].tempMinC,
              max: forecast.daily[0].tempMaxC,
            }
          : null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    "Smoke OpenWeather échoué:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
