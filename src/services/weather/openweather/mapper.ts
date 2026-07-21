import {
  truncateAlertDescription,
  unixToDateOnlyInTimezone,
  unixToIso,
} from "../format";
import { metersPerSecondToKmh, popToPercent } from "../units";
import type {
  WeatherAlert,
  WeatherCondition,
  WeatherCurrent,
  WeatherDailyForecast,
  WeatherForecast,
  WeatherHourlyForecast,
} from "../types";
import { classifyAlertLevel, frenchWeatherDescription } from "./conditions-fr";
import type { OpenWeatherOneCall3 } from "./schema";

function mapCondition(
  weather: { id: number; main: string; description: string; icon: string }[],
): WeatherCondition {
  const w = weather[0]!;
  return {
    code: w.id,
    main: w.main,
    description: frenchWeatherDescription(w.id, w.description),
    iconId: w.icon,
  };
}

function precipMm(
  rain?: { "1h"?: number; "3h"?: number } | number | null,
): number | null {
  if (rain == null) return null;
  if (typeof rain === "number") return rain;
  const v = rain["1h"] ?? rain["3h"];
  return v == null ? null : Number(v);
}

/**
 * One Call 4.0 timeline/1day renvoie souvent `weather: null`.
 * On infère une condition exploitable à partir de pluie / neige / nuages.
 */
export function inferConditionFromMetrics(input: {
  rainMm?: number | null;
  snowMm?: number | null;
  cloudCoverPct?: number | null;
}): WeatherCondition {
  const rain = input.rainMm ?? 0;
  const snow = input.snowMm ?? 0;
  const clouds = input.cloudCoverPct ?? 0;

  if (snow > 0) {
    const code = snow >= 5 ? 602 : 601;
    return {
      code,
      main: "Snow",
      description: frenchWeatherDescription(code),
      iconId: "13d",
    };
  }
  if (rain >= 10) {
    return {
      code: 502,
      main: "Rain",
      description: frenchWeatherDescription(502),
      iconId: "10d",
    };
  }
  if (rain > 0) {
    const code = rain >= 3 ? 501 : 500;
    return {
      code,
      main: "Rain",
      description: frenchWeatherDescription(code),
      iconId: "10d",
    };
  }
  if (clouds >= 85) {
    return {
      code: 804,
      main: "Clouds",
      description: frenchWeatherDescription(804),
      iconId: "04d",
    };
  }
  if (clouds >= 50) {
    return {
      code: 803,
      main: "Clouds",
      description: frenchWeatherDescription(803),
      iconId: "04d",
    };
  }
  if (clouds >= 20) {
    return {
      code: 801,
      main: "Clouds",
      description: frenchWeatherDescription(801),
      iconId: "02d",
    };
  }
  return {
    code: 800,
    main: "Clear",
    description: frenchWeatherDescription(800),
    iconId: "01d",
  };
}

function normalizeWeatherArray(
  weather: unknown,
): { id: number; main: string; description: string; icon: string }[] | null {
  if (!Array.isArray(weather) || weather.length === 0) return null;
  const first = weather[0] as Record<string, unknown>;
  if (
    typeof first?.id !== "number" ||
    typeof first.main !== "string" ||
    typeof first.icon !== "string"
  ) {
    return null;
  }
  return [
    {
      id: first.id,
      main: first.main,
      description:
        typeof first.description === "string" ? first.description : first.main,
      icon: first.icon,
    },
  ];
}

export function mapOneCall3ToForecast(
  data: OpenWeatherOneCall3,
): WeatherForecast {
  const tz = data.timezone;
  const conditionCurrent = data.current
    ? mapCondition(data.current.weather)
    : null;

  const current: WeatherCurrent | undefined = data.current
    ? {
        observedAt: unixToIso(data.current.dt),
        temperatureC: data.current.temp,
        feelsLikeC: data.current.feels_like,
        humidity: data.current.humidity ?? null,
        pressureHpa: data.current.pressure ?? null,
        windSpeedKmh:
          data.current.wind_speed == null
            ? null
            : metersPerSecondToKmh(data.current.wind_speed),
        windDirectionDeg: data.current.wind_deg ?? null,
        windGustKmh:
          data.current.wind_gust == null
            ? null
            : metersPerSecondToKmh(data.current.wind_gust),
        visibilityM: data.current.visibility ?? null,
        cloudCoverPct: data.current.clouds ?? null,
        uvIndex: data.current.uvi ?? null,
        rainMm: precipMm(data.current.rain),
        snowMm: precipMm(data.current.snow),
        sunriseAt: data.current.sunrise
          ? unixToIso(data.current.sunrise)
          : null,
        sunsetAt: data.current.sunset ? unixToIso(data.current.sunset) : null,
        condition: conditionCurrent!,
      }
    : undefined;

  const hourly: WeatherHourlyForecast[] = (data.hourly ?? []).map((h) => {
    const condition = mapCondition(h.weather);
    return {
      forecastAt: unixToIso(h.dt),
      temperatureC: h.temp,
      feelsLikeC: h.feels_like,
      precipitationProbability: popToPercent(h.pop),
      rainMm: precipMm(h.rain),
      snowMm: precipMm(h.snow),
      humidity: h.humidity ?? null,
      pressureHpa: h.pressure ?? null,
      windSpeedKmh:
        h.wind_speed == null ? null : metersPerSecondToKmh(h.wind_speed),
      windDirectionDeg: h.wind_deg ?? null,
      windGustKmh:
        h.wind_gust == null ? null : metersPerSecondToKmh(h.wind_gust),
      visibilityM: h.visibility ?? null,
      cloudCoverPct: h.clouds ?? null,
      uvIndex: h.uvi ?? null,
      condition,
    };
  });

  const daily: WeatherDailyForecast[] = (data.daily ?? []).map((d) => {
    const condition = mapCondition(d.weather);
    const rainMm = d.rain ?? null;
    const snowMm = d.snow ?? null;
    return {
      date: unixToDateOnlyInTimezone(d.dt, tz),
      forecastAt: unixToIso(d.dt),
      tempMinC: d.temp.min,
      tempMaxC: d.temp.max,
      tempDayC: d.temp.day ?? null,
      feelsLikeDayC: d.feels_like?.day ?? null,
      precipitationProbability: popToPercent(d.pop),
      rainMm,
      snowMm,
      humidity: d.humidity ?? null,
      pressureHpa: d.pressure ?? null,
      windSpeedKmh:
        d.wind_speed == null ? null : metersPerSecondToKmh(d.wind_speed),
      windDirectionDeg: d.wind_deg ?? null,
      windGustKmh:
        d.wind_gust == null ? null : metersPerSecondToKmh(d.wind_gust),
      cloudCoverPct: d.clouds ?? null,
      uvIndex: d.uvi ?? null,
      sunriseAt: d.sunrise ? unixToIso(d.sunrise) : null,
      sunsetAt: d.sunset ? unixToIso(d.sunset) : null,
      condition,
      weatherCode: condition.code,
      summary: condition.description,
      precipitationMm: rainMm ?? snowMm,
    };
  });

  const alerts: WeatherAlert[] = (data.alerts ?? []).map((a, index) => {
    const tags = a.tags ?? [];
    const level = classifyAlertLevel(a.event, a.description, tags);
    return {
      id: `${a.sender_name}:${a.event}:${a.start}:${index}`,
      title: a.event,
      senderName: a.sender_name,
      startAt: unixToIso(a.start),
      endAt: unixToIso(a.end),
      description: a.description,
      summary: truncateAlertDescription(a.description),
      tags,
      level,
    };
  });

  return {
    provider: "openweather",
    latitude: data.lat,
    longitude: data.lon,
    timezone: tz,
    timezoneOffsetSeconds: data.timezone_offset,
    fetchedAt: new Date().toISOString(),
    current,
    hourly,
    daily,
    alerts,
  };
}

/** Mappe un enregistrement timeline 4.0 (forme proche de 3.0). */
export function mapTimelineRecordToHourly(
  record: Record<string, unknown>,
): WeatherHourlyForecast | null {
  const dt = Number(record.dt);
  const temp = Number(record.temp);
  const feels = Number(record.feels_like ?? temp);
  const weather = record.weather as
    | { id: number; main: string; description: string; icon: string }[]
    | undefined;
  if (!Number.isFinite(dt) || !Number.isFinite(temp) || !weather?.[0]) {
    return null;
  }
  const condition = mapCondition(weather);
  return {
    forecastAt: unixToIso(dt),
    temperatureC: temp,
    feelsLikeC: feels,
    precipitationProbability: popToPercent(
      typeof record.pop === "number" ? record.pop : null,
    ),
    rainMm: precipMm(record.rain as { "1h"?: number } | undefined),
    snowMm: precipMm(record.snow as { "1h"?: number } | undefined),
    humidity: typeof record.humidity === "number" ? record.humidity : null,
    pressureHpa: typeof record.pressure === "number" ? record.pressure : null,
    windSpeedKmh:
      typeof record.wind_speed === "number"
        ? metersPerSecondToKmh(record.wind_speed)
        : null,
    windDirectionDeg:
      typeof record.wind_deg === "number" ? record.wind_deg : null,
    windGustKmh:
      typeof record.wind_gust === "number"
        ? metersPerSecondToKmh(record.wind_gust)
        : null,
    visibilityM:
      typeof record.visibility === "number" ? record.visibility : null,
    cloudCoverPct: typeof record.clouds === "number" ? record.clouds : null,
    uvIndex: typeof record.uvi === "number" ? record.uvi : null,
    condition,
  };
}

export function mapTimelineRecordToDaily(
  record: Record<string, unknown>,
  timeZone: string,
): WeatherDailyForecast | null {
  const dt = Number(record.dt);
  const temp = record.temp as
    { min?: number; max?: number; day?: number } | number | undefined;
  if (!Number.isFinite(dt) || temp == null) return null;

  let tempMinC: number;
  let tempMaxC: number;
  let tempDayC: number | null = null;
  if (typeof temp === "number") {
    tempMinC = temp;
    tempMaxC = temp;
    tempDayC = temp;
  } else {
    if (temp.min == null || temp.max == null) return null;
    tempMinC = temp.min;
    tempMaxC = temp.max;
    tempDayC = temp.day ?? null;
  }

  const feels = record.feels_like as { day?: number } | undefined;
  const rainMm =
    typeof record.rain === "number"
      ? record.rain
      : precipMm(record.rain as { "1h"?: number } | undefined);
  const snowMm =
    typeof record.snow === "number"
      ? record.snow
      : precipMm(record.snow as { "1h"?: number } | undefined);
  const cloudCoverPct =
    typeof record.clouds === "number" ? record.clouds : null;

  const weatherArr = normalizeWeatherArray(record.weather);
  const condition = weatherArr
    ? mapCondition(weatherArr)
    : inferConditionFromMetrics({ rainMm, snowMm, cloudCoverPct });

  return {
    date: unixToDateOnlyInTimezone(dt, timeZone),
    forecastAt: unixToIso(dt),
    tempMinC,
    tempMaxC,
    tempDayC,
    feelsLikeDayC: feels?.day ?? null,
    precipitationProbability: popToPercent(
      typeof record.pop === "number" ? record.pop : null,
    ),
    rainMm,
    snowMm,
    humidity: typeof record.humidity === "number" ? record.humidity : null,
    pressureHpa: typeof record.pressure === "number" ? record.pressure : null,
    windSpeedKmh:
      typeof record.wind_speed === "number"
        ? metersPerSecondToKmh(record.wind_speed)
        : null,
    windDirectionDeg:
      typeof record.wind_deg === "number" ? record.wind_deg : null,
    windGustKmh:
      typeof record.wind_gust === "number"
        ? metersPerSecondToKmh(record.wind_gust)
        : null,
    cloudCoverPct: typeof record.clouds === "number" ? record.clouds : null,
    uvIndex: typeof record.uvi === "number" ? record.uvi : null,
    sunriseAt:
      typeof record.sunrise === "number" ? unixToIso(record.sunrise) : null,
    sunsetAt:
      typeof record.sunset === "number" ? unixToIso(record.sunset) : null,
    condition,
    weatherCode: condition.code,
    summary: condition.description,
    precipitationMm: rainMm ?? snowMm,
  };
}

export function mapTimelineRecordToCurrent(
  record: Record<string, unknown>,
): WeatherCurrent | null {
  const hourly = mapTimelineRecordToHourly(record);
  if (!hourly) return null;
  return {
    observedAt: hourly.forecastAt,
    temperatureC: hourly.temperatureC,
    feelsLikeC: hourly.feelsLikeC,
    humidity: hourly.humidity,
    pressureHpa: hourly.pressureHpa,
    windSpeedKmh: hourly.windSpeedKmh,
    windDirectionDeg: hourly.windDirectionDeg,
    windGustKmh: hourly.windGustKmh,
    visibilityM: hourly.visibilityM,
    cloudCoverPct: hourly.cloudCoverPct,
    uvIndex: hourly.uvIndex,
    rainMm: hourly.rainMm,
    snowMm: hourly.snowMm,
    sunriseAt:
      typeof record.sunrise === "number" ? unixToIso(record.sunrise) : null,
    sunsetAt:
      typeof record.sunset === "number" ? unixToIso(record.sunset) : null,
    condition: hourly.condition,
  };
}

export function mapAlertDetail(
  id: string,
  payload: {
    sender_name?: string;
    event?: string;
    start?: number;
    end?: number;
    description?: string;
    tags?: string[];
  },
): WeatherAlert | null {
  if (!payload.event || payload.start == null || payload.end == null) {
    return null;
  }
  const description = payload.description ?? "";
  const tags = payload.tags ?? [];
  return {
    id,
    title: payload.event,
    senderName: payload.sender_name ?? "OpenWeather",
    startAt: unixToIso(payload.start),
    endAt: unixToIso(payload.end),
    description,
    summary: truncateAlertDescription(description),
    tags,
    level: classifyAlertLevel(payload.event, description, tags),
  };
}
