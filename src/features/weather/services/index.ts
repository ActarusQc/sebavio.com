import { WEATHER_FORECAST_HORIZON_DAYS } from "@/lib/constants";
import { getOwnedTripOrThrow } from "@/features/trips/services";
import { getWeatherService } from "@/services/weather";
import type { WeatherDailyForecast } from "@/services/weather/types";
import {
  isWithinHorizon,
  resolveStopForecastDate,
} from "@/features/weather/lib/dates";
import type {
  StopWeatherDto,
  StopWeatherForecastDto,
  TripWeatherDto,
  WeatherCurrentApiDto,
  WeatherForecastApiDto,
} from "@/features/weather/types";

export { resolveStopForecastDate } from "@/features/weather/lib/dates";

function toForecastDto(day: WeatherDailyForecast): StopWeatherForecastDto {
  return {
    date: day.date,
    weatherCode: day.weatherCode,
    summary: day.summary,
    tempMinC: day.tempMinC,
    tempMaxC: day.tempMaxC,
    precipitationMm: day.precipitationMm,
  };
}

/**
 * Prévisions météo par étape — soft-fail, jamais bloquant.
 * Isolation propriétaire via getOwnedTripOrThrow.
 */
export async function getTripWeather(
  userId: string,
  tripId: string,
): Promise<TripWeatherDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  const weather = getWeatherService();
  const availability = weather.availability();
  const horizonDays = WEATHER_FORECAST_HORIZON_DAYS;

  const stops = [...trip.stops].sort((a, b) => a.sequence - b.sequence);
  const resultStops: StopWeatherDto[] = [];

  const forecastByPoint = new Map<
    string,
    Awaited<ReturnType<typeof weather.tryGetForecast>>
  >();

  for (const stop of stops) {
    const forecastDate = resolveStopForecastDate({
      arrivalTime: stop.arrivalTime,
      departureDate: trip.departureDate,
      sequence: stop.sequence,
    });

    if (stop.latitude == null || stop.longitude == null) {
      resultStops.push({
        stopId: stop.id,
        stopName: stop.name,
        sequence: stop.sequence,
        forecastDate,
        status: "no_coordinates",
        message: "Étape non géocodée — météo indisponible",
        forecast: null,
      });
      continue;
    }

    if (!isWithinHorizon(forecastDate, horizonDays)) {
      resultStops.push({
        stopId: stop.id,
        stopName: stop.name,
        sequence: stop.sequence,
        forecastDate,
        status: "out_of_range",
        message: "Prévisions disponibles à l'approche",
        forecast: null,
      });
      continue;
    }

    if (!availability.available) {
      resultStops.push({
        stopId: stop.id,
        stopName: stop.name,
        sequence: stop.sequence,
        forecastDate,
        status: "unavailable",
        message: "Météo temporairement indisponible",
        forecast: null,
      });
      continue;
    }

    const lat = Number(stop.latitude.toString());
    const lng = Number(stop.longitude.toString());
    const pointKey = `${lat.toFixed(2)}:${lng.toFixed(2)}`;

    let series = forecastByPoint.get(pointKey);
    if (series === undefined) {
      series = await weather.tryGetForecast(userId, { lat, lng });
      forecastByPoint.set(pointKey, series);
    }

    if (!series) {
      resultStops.push({
        stopId: stop.id,
        stopName: stop.name,
        sequence: stop.sequence,
        forecastDate,
        status: "unavailable",
        message: "Météo temporairement indisponible",
        forecast: null,
      });
      continue;
    }

    const day = series.daily.find((d) => d.date === forecastDate);
    if (!day) {
      resultStops.push({
        stopId: stop.id,
        stopName: stop.name,
        sequence: stop.sequence,
        forecastDate,
        status: "out_of_range",
        message: "Prévisions disponibles à l'approche",
        forecast: null,
      });
      continue;
    }

    resultStops.push({
      stopId: stop.id,
      stopName: stop.name,
      sequence: stop.sequence,
      forecastDate,
      status: "ok",
      message: null,
      forecast: toForecastDto(day),
    });
  }

  return {
    tripId: trip.id,
    providerAvailable: availability.available,
    horizonDays,
    stops: resultStops,
  };
}

/** Soft : jamais d'erreur bloquante pour la fiche voyage. */
export async function getTripWeatherSafe(
  userId: string,
  tripId: string,
): Promise<TripWeatherDto | null> {
  try {
    return await getTripWeather(userId, tripId);
  } catch {
    return null;
  }
}

export async function getForecastForLocation(
  userId: string,
  lat: number,
  lng: number,
): Promise<WeatherForecastApiDto> {
  const weather = getWeatherService();
  const result = await weather.tryGetForecast(userId, { lat, lng });
  if (!result) {
    return {
      available: false,
      provider: null,
      horizonDays: WEATHER_FORECAST_HORIZON_DAYS,
      location: { lat, lng },
      daily: [],
      message: "Données météo indisponibles",
    };
  }
  return {
    available: true,
    provider: result.provider,
    horizonDays: result.horizonDays,
    location: result.location,
    daily: result.daily.map(toForecastDto),
    message: null,
  };
}

export async function getCurrentForLocation(
  userId: string,
  lat: number,
  lng: number,
): Promise<WeatherCurrentApiDto> {
  const weather = getWeatherService();
  const result = await weather.tryGetCurrent(userId, { lat, lng });
  if (!result) {
    return {
      available: false,
      provider: null,
      location: { lat, lng },
      current: null,
      message: "Données météo indisponibles",
    };
  }
  return {
    available: true,
    provider: result.provider,
    location: result.location,
    current: result.current,
    message: null,
  };
}
