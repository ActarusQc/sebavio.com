import { WEATHER_FORECAST_HORIZON_DAYS } from "@/lib/constants";
import { getOwnedTripOrThrow } from "@/features/trips/services";
import {
  clusterWeatherLocations,
  computeTripTiming,
  getWeatherService,
  loadWeatherConfig,
  resolveCacheProximity,
  resolveDisplayWindow,
  shouldCallProvider,
  weatherActivityClassifier,
} from "@/services/weather";
import type { WeatherAlert, WeatherForecast } from "@/services/weather/types";
import {
  isWithinHorizon,
  resolveDestinationArrivalForecastDate,
  resolveStopForecastDate,
} from "@/features/weather/lib/dates";
import type {
  StopWeatherDto,
  TripWeatherDto,
  TripWeatherLocation,
  TripWeatherResponse,
  WeatherCurrentApiDto,
  WeatherForecastApiDto,
} from "@/features/weather/types";

export {
  resolveDestinationArrivalForecastDate,
  resolveStopForecastDate,
} from "@/features/weather/lib/dates";

const TOO_EARLY_MESSAGE =
  "Les prévisions détaillées ne sont pas encore disponibles.";
const UNAVAILABLE_APPROACH_MESSAGE =
  "Les prévisions météo seront disponibles à l'approche de votre voyage.";

function dedupeAlerts(alerts: WeatherAlert[]): WeatherAlert[] {
  const seen = new Set<string>();
  const result: WeatherAlert[] = [];
  for (const alert of alerts) {
    const key = `${alert.title}|${alert.senderName}|${alert.startAt}|${alert.endAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(alert);
  }
  return result;
}

function shortSummary(
  forecast: WeatherForecast,
  date: string | null,
): string | null {
  if (date) {
    const day = forecast.daily.find((d) => d.date === date);
    if (day) {
      return `${day.summary} — ${Math.round(day.tempMinC)}° / ${Math.round(day.tempMaxC)}°C`;
    }
  }
  if (forecast.current) {
    return `${forecast.current.condition.description} — ${Math.round(forecast.current.temperatureC)}°C`;
  }
  const first = forecast.daily[0];
  return first
    ? `${first.summary} — ${Math.round(first.tempMinC)}° / ${Math.round(first.tempMaxC)}°C`
    : null;
}

type Candidate = {
  id: string;
  name: string;
  type: TripWeatherLocation["type"];
  latitude: number;
  longitude: number;
  date: string | null;
};

/**
 * Prévisions météo du voyage — soft-fail, jamais bloquant pour la fiche.
 * Coordonnées issues du voyage autorisé ; optionnellement position live
 * (voyage in_progress) sans modifier l'origine persistée.
 */
export async function getTripWeather(
  userId: string,
  tripId: string,
  options?: {
    liveLatitude?: number | null;
    liveLongitude?: number | null;
  },
): Promise<TripWeatherDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  const config = loadWeatherConfig();
  const weather = getWeatherService();
  const availability = weather.availability();
  const generatedAt = new Date().toISOString();

  const timing = computeTripTiming({
    departureDate: trip.departureDate,
    tripStatus: trip.status,
  });
  const displayWindow = resolveDisplayWindow(timing);
  const proximity = resolveCacheProximity(timing);

  const emptyResponse = (
    status: TripWeatherResponse["status"],
    message: string | null,
    locations: TripWeatherLocation[] = [],
  ): TripWeatherDto => ({
    tripId: trip.id,
    providerAvailable: availability.available,
    horizonDays: WEATHER_FORECAST_HORIZON_DAYS,
    stops: [],
    response: {
      status,
      generatedAt,
      message,
      displayWindow,
      locations,
    },
  });

  if (!config.enabled) {
    return emptyResponse("disabled", "La météo est désactivée.");
  }

  if (displayWindow === "none") {
    return emptyResponse("too_early", UNAVAILABLE_APPROACH_MESSAGE);
  }

  if (displayWindow === "too_early_detail") {
    return emptyResponse("too_early", TOO_EARLY_MESSAGE);
  }

  const candidates: Candidate[] = [];
  const stops = [...trip.stops].sort((a, b) => a.sequence - b.sequence);

  const liveLat = options?.liveLatitude;
  const liveLng = options?.liveLongitude;
  if (
    trip.status === "in_progress" &&
    liveLat != null &&
    liveLng != null &&
    Number.isFinite(liveLat) &&
    Number.isFinite(liveLng) &&
    liveLat >= -90 &&
    liveLat <= 90 &&
    liveLng >= -180 &&
    liveLng <= 180
  ) {
    candidates.push({
      id: `live:${trip.id}`,
      name: "Ma position",
      type: "live",
      latitude: liveLat,
      longitude: liveLng,
      date: new Date().toISOString().slice(0, 10),
    });
  }

  if (trip.destinationLatitude != null && trip.destinationLongitude != null) {
    const destinationStop =
      stops.find((s) => s.stopType === "destination") ?? null;
    const arrivalAnchor = resolveDestinationArrivalForecastDate({
      departureDate: trip.departureDate,
      destinationStopArrivalTime: destinationStop?.arrivalTime ?? null,
    });

    candidates.push({
      id: `destination:${trip.id}`,
      name: trip.destination,
      type: "destination",
      latitude: Number(trip.destinationLatitude.toString()),
      longitude: Number(trip.destinationLongitude.toString()),
      date: arrivalAnchor,
    });
  }

  for (const stop of stops) {
    if (stop.latitude == null || stop.longitude == null) continue;
    const forecastDate = resolveStopForecastDate({
      arrivalTime: stop.arrivalTime,
      departureDate: trip.departureDate,
      sequence: stop.sequence,
    });
    candidates.push({
      id: `stop:${stop.id}`,
      name: stop.name,
      type: "stop",
      latitude: Number(stop.latitude.toString()),
      longitude: Number(stop.longitude.toString()),
      date: forecastDate,
    });
  }

  // Départ : toujours inclus quand des coordonnées existent (bandeau dual départ/arrivée).
  if (trip.originLatitude != null && trip.originLongitude != null) {
    candidates.unshift({
      id: `origin:${trip.id}`,
      name: trip.origin,
      type: "origin",
      latitude: Number(trip.originLatitude.toString()),
      longitude: Number(trip.originLongitude.toString()),
      date:
        trip.status === "in_progress"
          ? new Date().toISOString().slice(0, 10)
          : trip.departureDate.toISOString().slice(0, 10),
    });
  }

  if (candidates.length === 0) {
    return emptyResponse(
      "no_coordinates",
      "Aucune coordonnée disponible pour afficher la météo.",
    );
  }

  if (!shouldCallProvider(displayWindow)) {
    return emptyResponse("too_early", UNAVAILABLE_APPROACH_MESSAGE);
  }

  const parts = {
    current: displayWindow === "live",
    hourly: displayWindow === "hourly" || displayWindow === "live",
    daily: true,
    alerts: displayWindow === "live" || displayWindow === "hourly",
  };

  const clusters = clusterWeatherLocations(
    candidates.map((c) => ({
      id: c.id,
      latitude: c.latitude,
      longitude: c.longitude,
      date: c.date,
    })),
    config.clusterRadiusKm,
  );

  const forecastByCluster = new Map<
    string,
    {
      forecast: WeatherForecast;
      fromCache: boolean;
      stale: boolean;
      nextRefreshAt?: string;
      status: "ok" | "quota" | "error";
    }
  >();

  let quotaHit = false;
  let anyError = false;

  for (const cluster of clusters) {
    const result = await weather.tryGetForecast(
      userId,
      {
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        parts,
      },
      { proximity, windowKey: displayWindow },
    );

    if (!result) {
      anyError = true;
      forecastByCluster.set(cluster.key, {
        forecast: {
          provider: "null",
          latitude: cluster.latitude,
          longitude: cluster.longitude,
          timezone: "UTC",
          timezoneOffsetSeconds: 0,
          fetchedAt: generatedAt,
          hourly: [],
          daily: [],
          alerts: [],
        },
        fromCache: false,
        stale: false,
        status: "error",
      });
      continue;
    }

    if (result.stale) {
      // Peut être un repli après quota.
      quotaHit = quotaHit || true;
    }

    forecastByCluster.set(cluster.key, {
      ...result,
      status: "ok",
    });
  }

  const locations: TripWeatherLocation[] = [];
  const legacyStops: StopWeatherDto[] = [];

  for (const candidate of candidates) {
    const cluster = clusters.find((c) => c.memberIds.includes(candidate.id));
    const packed = cluster ? forecastByCluster.get(cluster.key) : undefined;

    const hasUsableForecast =
      packed &&
      packed.status === "ok" &&
      (packed.forecast.daily.length > 0 ||
        Boolean(packed.forecast.current) ||
        packed.forecast.hourly.length > 0);

    if (!hasUsableForecast || !packed) {
      locations.push({
        id: candidate.id,
        name: candidate.name,
        type: candidate.type,
        date: candidate.date,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        current: null,
        daily: [],
        hourly: [],
        alerts: [],
        activity: null,
        updatedAt: null,
        fromCache: false,
        stale: false,
        summary: null,
      });
      if (candidate.type === "stop") {
        legacyStops.push({
          stopId: candidate.id.replace(/^stop:/, ""),
          stopName: candidate.name,
          sequence:
            stops.find((s) => `stop:${s.id}` === candidate.id)?.sequence ?? 0,
          forecastDate: candidate.date,
          status: "unavailable",
          message: "Météo temporairement indisponible",
          forecast: null,
        });
      }
      continue;
    }

    const { forecast, fromCache, stale } = packed;
    const day = candidate.date
      ? forecast.daily.find((d) => d.date === candidate.date)
      : forecast.daily[0];

    // Priorité aux données réelles : si le jour demandé n'existe pas, ne pas inventer.
    const daily =
      day != null
        ? [day, ...forecast.daily.filter((d) => d.date !== day.date)].slice(
            0,
            8,
          )
        : forecast.daily.slice(0, 8);

    const relevantDay = day ?? forecast.daily[0] ?? null;
    const activity = relevantDay
      ? weatherActivityClassifier.classify({
          current: forecast.current,
          daily: relevantDay,
          hourly: forecast.hourly,
        })
      : null;

    const hourly = parts.hourly
      ? forecast.hourly
          .filter((h) => {
            if (!candidate.date) return true;
            return h.forecastAt.startsWith(candidate.date);
          })
          .slice(0, 24)
      : [];

    locations.push({
      id: candidate.id,
      name: candidate.name,
      type: candidate.type,
      date: candidate.date,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      current: parts.current ? (forecast.current ?? null) : null,
      daily,
      hourly,
      alerts: dedupeAlerts(forecast.alerts),
      activity,
      updatedAt: forecast.fetchedAt,
      fromCache,
      stale,
      summary: shortSummary(forecast, candidate.date),
    });

    if (candidate.type === "stop") {
      const stopId = candidate.id.replace(/^stop:/, "");
      if (
        !candidate.date ||
        !isWithinHorizon(candidate.date, WEATHER_FORECAST_HORIZON_DAYS)
      ) {
        legacyStops.push({
          stopId,
          stopName: candidate.name,
          sequence: stops.find((s) => s.id === stopId)?.sequence ?? 0,
          forecastDate: candidate.date,
          status: "out_of_range",
          message: "Prévisions disponibles à l'approche",
          forecast: null,
        });
      } else if (!day) {
        legacyStops.push({
          stopId,
          stopName: candidate.name,
          sequence: stops.find((s) => s.id === stopId)?.sequence ?? 0,
          forecastDate: candidate.date,
          status: "out_of_range",
          message: "Prévisions disponibles à l'approche",
          forecast: null,
        });
      } else {
        legacyStops.push({
          stopId,
          stopName: candidate.name,
          sequence: stops.find((s) => s.id === stopId)?.sequence ?? 0,
          forecastDate: candidate.date,
          status: "ok",
          message: null,
          forecast: {
            date: day.date,
            weatherCode: day.weatherCode,
            summary: day.summary,
            tempMinC: day.tempMinC,
            tempMaxC: day.tempMaxC,
            precipitationMm: day.precipitationMm,
          },
        });
      }
    }
  }

  // Dédupliquer alertes globales proches
  const allAlerts = dedupeAlerts(locations.flatMap((l) => l.alerts));
  for (const loc of locations) {
    loc.alerts = allAlerts.filter((a) =>
      loc.alerts.some((la) => la.id === a.id),
    );
  }

  let status: TripWeatherResponse["status"] = "available";
  let message: string | null = null;

  if (!availability.available) {
    status =
      availability.reason === "disabled"
        ? "disabled"
        : "temporarily_unavailable";
    message =
      status === "disabled"
        ? "La météo est désactivée."
        : "Fournisseur météo temporairement indisponible.";
  } else if (locations.every((l) => l.daily.length === 0 && !l.current)) {
    if (quotaHit) {
      status = "provider_limit_reached";
      message =
        "Limite quotidienne d'appels météo atteinte. Réessayez plus tard.";
    } else if (anyError) {
      status = "temporarily_unavailable";
      message = "Fournisseur météo temporairement indisponible.";
    } else {
      status = "too_early";
      message = UNAVAILABLE_APPROACH_MESSAGE;
    }
  } else if (
    locations.some((l) => l.stale) &&
    locations.every((l) => l.fromCache)
  ) {
    message = "Données météo en cache (mise à jour différée).";
  }

  const nextRefreshAt = [...forecastByCluster.values()].find(
    (v) => v.nextRefreshAt,
  )?.nextRefreshAt;

  return {
    tripId: trip.id,
    providerAvailable: availability.available,
    horizonDays: WEATHER_FORECAST_HORIZON_DAYS,
    stops: legacyStops,
    response: {
      status,
      generatedAt,
      nextRefreshAt,
      message,
      displayWindow,
      locations,
    },
  };
}

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

export async function getTripWeatherResponse(
  userId: string,
  tripId: string,
  options?: {
    liveLatitude?: number | null;
    liveLongitude?: number | null;
  },
): Promise<TripWeatherResponse> {
  const dto = await getTripWeather(userId, tripId, options);
  return (
    dto.response ?? {
      status: "temporarily_unavailable",
      generatedAt: new Date().toISOString(),
      message: "Météo temporairement indisponible",
      displayWindow: "none",
      locations: [],
    }
  );
}

export async function getForecastForLocation(
  userId: string,
  lat: number,
  lng: number,
): Promise<WeatherForecastApiDto> {
  const weather = getWeatherService();
  const result = await weather.tryGetForecast(userId, {
    latitude: lat,
    longitude: lng,
    parts: { current: false, hourly: false, daily: true, alerts: false },
  });
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
    provider: result.forecast.provider,
    horizonDays: WEATHER_FORECAST_HORIZON_DAYS,
    location: { lat, lng },
    daily: result.forecast.daily.map((day) => ({
      date: day.date,
      weatherCode: day.weatherCode,
      summary: day.summary,
      tempMinC: day.tempMinC,
      tempMaxC: day.tempMaxC,
      precipitationMm: day.precipitationMm,
    })),
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
    location: { lat, lng },
    current: {
      observedAt: result.current.observedAt,
      weatherCode: result.current.weatherCode,
      summary: result.current.summary,
      temperatureC: result.current.temperatureC,
      feelsLikeC: result.current.feelsLikeC,
    },
    message: null,
  };
}
