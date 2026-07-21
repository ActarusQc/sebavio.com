import { beforeEach, describe, expect, it, vi } from "vitest";
import { WeatherError } from "@/services/weather/errors";
import { forecastCacheKey, roundCoord } from "@/services/weather/cache";
import {
  createWeatherService,
  setWeatherProviderForTests,
  metersPerSecondToKmh,
  popToPercent,
  resolveDisplayWindow,
  computeTripTiming,
  clusterWeatherLocations,
  WeatherActivityClassifier,
  mapOneCall3ToForecast,
  OpenMeteoProvider,
  clearCoalesceForTests,
  resetWeatherMetricsForTests,
} from "@/services/weather";
import { wmoWeatherSummary } from "@/services/weather/wmo";
import { resolveStopForecastDate } from "@/features/weather/lib/dates";
import {
  formatDateTimeInTimezone,
  unixToDateOnlyInTimezone,
} from "@/services/weather/format";
import { cacheTtlSeconds } from "@/services/weather/window";
import { OpenWeatherProvider } from "@/services/weather/openweather/provider";
import type {
  WeatherForecast,
  WeatherProvider,
} from "@/services/weather/types";

const redisStore = new Map<string, string>();

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    status: "ready",
    connect: async () => undefined,
    get: async (key: string) => redisStore.get(key) ?? null,
    set: async (key: string, value: string) => {
      redisStore.set(key, value);
      return "OK";
    },
    incr: async (key: string) => {
      const next = Number(redisStore.get(key) ?? "0") + 1;
      redisStore.set(key, String(next));
      return next;
    },
    expire: async () => 1,
  }),
}));

function sampleForecast(overrides?: Partial<WeatherForecast>): WeatherForecast {
  return {
    provider: "openweather",
    latitude: 46.81,
    longitude: -71.21,
    timezone: "America/Toronto",
    timezoneOffsetSeconds: -14400,
    fetchedAt: "2026-07-14T12:00:00.000Z",
    current: {
      observedAt: "2026-07-14T12:00:00.000Z",
      temperatureC: 20,
      feelsLikeC: 19,
      humidity: 50,
      pressureHpa: 1012,
      windSpeedKmh: 18,
      windDirectionDeg: 180,
      windGustKmh: null,
      visibilityM: 10000,
      cloudCoverPct: 10,
      uvIndex: 5,
      rainMm: null,
      snowMm: null,
      sunriseAt: null,
      sunsetAt: null,
      condition: {
        code: 800,
        main: "Clear",
        description: "Ciel dégagé",
        iconId: "01d",
      },
    },
    hourly: [],
    daily: [
      {
        date: "2026-07-14",
        forecastAt: "2026-07-14T16:00:00.000Z",
        tempMinC: 12,
        tempMaxC: 24,
        tempDayC: 22,
        feelsLikeDayC: 21,
        precipitationProbability: 10,
        rainMm: 0,
        snowMm: null,
        humidity: 50,
        pressureHpa: 1012,
        windSpeedKmh: 15,
        windDirectionDeg: 180,
        windGustKmh: null,
        cloudCoverPct: 10,
        uvIndex: 5,
        sunriseAt: null,
        sunsetAt: null,
        condition: {
          code: 800,
          main: "Clear",
          description: "Ciel dégagé",
          iconId: "01d",
        },
        weatherCode: 800,
        summary: "Ciel dégagé",
        precipitationMm: 0,
      },
    ],
    alerts: [],
    ...overrides,
  };
}

function mockProvider(overrides?: Partial<WeatherProvider>): WeatherProvider {
  return {
    name: "openweather",
    horizonDays: 16,
    isAvailable: () => ({ available: true }),
    getForecast: async () => sampleForecast(),
    ...overrides,
  };
}

describe("units / format", () => {
  it("convertit m/s en km/h", () => {
    expect(metersPerSecondToKmh(10)).toBe(36);
    expect(metersPerSecondToKmh(1)).toBe(3.6);
  });

  it("convertit pop en pourcentage", () => {
    expect(popToPercent(0.42)).toBe(42);
    expect(popToPercent(null)).toBeNull();
  });

  it("formate une date dans le fuseau destination", () => {
    const date = unixToDateOnlyInTimezone(1_721_000_000, "America/Toronto");
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const formatted = formatDateTimeInTimezone(
      "2026-07-14T18:00:00.000Z",
      "America/Toronto",
    );
    expect(formatted.length).toBeGreaterThan(5);
  });
});

describe("fenêtre d'affichage", () => {
  it("aucun appel au-delà de 16 jours", () => {
    expect(
      resolveDisplayWindow({
        daysUntilDeparture: 20,
        hoursUntilDeparture: 20 * 24,
        tripStatus: "planned",
      }),
    ).toBe("none");
  });

  it("too_early_detail entre 9 et 16 jours", () => {
    expect(
      resolveDisplayWindow({
        daysUntilDeparture: 12,
        hoursUntilDeparture: 12 * 24,
        tripStatus: "planned",
      }),
    ).toBe("too_early_detail");
  });

  it("daily à 8 jours ou moins", () => {
    expect(
      resolveDisplayWindow({
        daysUntilDeparture: 5,
        hoursUntilDeparture: 5 * 24,
        tripStatus: "planned",
      }),
    ).toBe("daily");
  });

  it("hourly sous 48 h", () => {
    expect(
      resolveDisplayWindow({
        daysUntilDeparture: 1,
        hoursUntilDeparture: 36,
        tripStatus: "planned",
      }),
    ).toBe("hourly");
  });

  it("live si voyage en cours", () => {
    expect(
      resolveDisplayWindow({
        daysUntilDeparture: 0,
        hoursUntilDeparture: -5,
        tripStatus: "in_progress",
      }),
    ).toBe("live");
  });

  it("TTL cache selon proximité", () => {
    expect(cacheTtlSeconds("far")).toBe(6 * 3600);
    expect(cacheTtlSeconds("mid")).toBe(3 * 3600);
    expect(cacheTtlSeconds("near")).toBe(3600);
    expect(cacheTtlSeconds("live")).toBe(1800);
  });
});

describe("cluster géographique", () => {
  it("regroupe deux points proches", () => {
    const clusters = clusterWeatherLocations(
      [
        {
          id: "a",
          latitude: 46.81,
          longitude: -71.21,
          date: "2026-07-20",
        },
        {
          id: "b",
          latitude: 46.82,
          longitude: -71.2,
          date: "2026-07-20",
        },
      ],
      20,
    );
    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.memberIds).toEqual(["a", "b"]);
  });

  it("sépare les points éloignés", () => {
    const clusters = clusterWeatherLocations(
      [
        {
          id: "a",
          latitude: 46.81,
          longitude: -71.21,
          date: "2026-07-20",
        },
        {
          id: "b",
          latitude: 48.5,
          longitude: -68.5,
          date: "2026-07-22",
        },
      ],
      20,
    );
    expect(clusters).toHaveLength(2);
  });
});

describe("WeatherActivityClassifier", () => {
  const classifier = new WeatherActivityClassifier();

  it("détecte orage → indoor", () => {
    const result = classifier.classify({
      daily: {
        ...sampleForecast().daily[0]!,
        condition: {
          code: 211,
          main: "Thunderstorm",
          description: "Orage",
          iconId: "11d",
        },
        weatherCode: 211,
        summary: "Orage",
      },
    });
    expect(result.conditions).toContain("storm");
    expect(result.indoorPreferred).toBe(true);
    expect(result.reasons[0]?.code).toBe("storm");
  });

  it("détecte beau temps", () => {
    const result = classifier.classify({
      daily: sampleForecast().daily[0]!,
    });
    expect(result.conditions).toContain("excellent_outdoor");
    expect(result.outdoorSuitable).toBe(true);
  });
});

describe("mapping OpenWeather One Call 4 daily sans weather", () => {
  it("infère une condition quand weather est null", async () => {
    const { mapTimelineRecordToDaily } =
      await import("@/services/weather/openweather/mapper");
    const mapped = mapTimelineRecordToDaily(
      {
        dt: 1_784_332_800,
        temp: { day: 16.4, min: 14.1, max: 17.2 },
        weather: null,
        rain: 14.69,
        clouds: 100,
        wind_speed: 3.2,
        humidity: 80,
      },
      "America/Toronto",
    );
    expect(mapped).not.toBeNull();
    expect(mapped?.tempMinC).toBe(14.1);
    expect(mapped?.tempMaxC).toBe(17.2);
    expect(mapped?.condition.code).toBe(502);
    expect(mapped?.summary.length).toBeGreaterThan(0);
  });
});

describe("mapping OpenWeather One Call 3", () => {
  it("mappe une réponse valide", () => {
    const mapped = mapOneCall3ToForecast({
      lat: 46.81,
      lon: -71.21,
      timezone: "America/Toronto",
      timezone_offset: -14400,
      current: {
        dt: 1_721_000_000,
        temp: 20,
        feels_like: 19,
        humidity: 40,
        weather: [
          { id: 800, main: "Clear", description: "ciel dégagé", icon: "01d" },
        ],
        wind_speed: 5,
      },
      daily: [
        {
          dt: 1_721_000_000,
          temp: { min: 10, max: 22, day: 20 },
          weather: [
            { id: 800, main: "Clear", description: "ciel dégagé", icon: "01d" },
          ],
          pop: 0.2,
          wind_speed: 4,
        },
      ],
      hourly: [
        {
          dt: 1_721_000_000,
          temp: 18,
          feels_like: 17,
          weather: [
            { id: 800, main: "Clear", description: "ciel dégagé", icon: "01d" },
          ],
          pop: 0.1,
          wind_speed: 3,
        },
      ],
      alerts: [
        {
          sender_name: "ECCC",
          event: "Alerte orages",
          start: 1_721_000_000,
          end: 1_721_100_000,
          description:
            "Orages violents attendus cet après-midi dans la région.",
          tags: ["Thunderstorm"],
        },
      ],
    });

    expect(mapped.provider).toBe("openweather");
    expect(mapped.daily[0]?.tempMaxC).toBe(22);
    expect(mapped.hourly[0]?.windSpeedKmh).toBe(10.8);
    expect(mapped.current?.windSpeedKmh).toBe(18);
    expect(mapped.alerts[0]?.level).toBeTruthy();
    expect(mapped.daily[0]?.precipitationProbability).toBe(20);
  });
});

describe("wmoWeatherSummary", () => {
  it("mappe les codes courants", () => {
    expect(wmoWeatherSummary(0)).toBe("Ciel dégagé");
    expect(wmoWeatherSummary(61)).toBe("Pluie");
  });
});

describe("roundCoord / cache key", () => {
  it("arrondit et mutualise la clé", () => {
    expect(roundCoord(46.81321)).toBe(46.81);
    expect(forecastCacheKey("openweather", { lat: 46.813, lng: -71.208 })).toBe(
      forecastCacheKey("openweather", { lat: 46.81, lng: -71.21 }),
    );
  });
});

describe("resolveStopForecastDate", () => {
  it("utilise arrivalTime si présent", () => {
    expect(
      resolveStopForecastDate({
        arrivalTime: new Date("2026-08-01T15:00:00.000Z"),
        departureDate: new Date("2026-07-20T00:00:00.000Z"),
        sequence: 3,
      }),
    ).toBe("2026-08-01");
  });
});

describe("computeTripTiming", () => {
  it("calcule les heures jusqu'au départ", () => {
    const now = new Date("2026-07-14T12:00:00.000Z");
    const timing = computeTripTiming({
      departureDate: new Date("2026-07-16T12:00:00.000Z"),
      tripStatus: "planned",
      now,
    });
    expect(timing.hoursUntilDeparture).toBe(48);
  });
});

describe("weather service (mocked provider)", () => {
  beforeEach(() => {
    redisStore.clear();
    setWeatherProviderForTests(null);
    clearCoalesceForTests();
    resetWeatherMetricsForTests();
  });

  it("sert la prévision depuis le cache sans rappeler le provider", async () => {
    const getForecast = vi.fn(async () => sampleForecast());
    const service = createWeatherService(mockProvider({ getForecast }));

    const first = await service.getForecast("user-1", {
      latitude: 46.81,
      longitude: -71.21,
    });
    const second = await service.getForecast("user-1", {
      latitude: 46.81,
      longitude: -71.21,
    });

    expect(first.forecast.daily).toHaveLength(1);
    expect(second.fromCache).toBe(true);
    expect(getForecast).toHaveBeenCalledTimes(1);
  });

  it("déduplique les appels simultanés identiques", async () => {
    let resolveForecast!: (v: WeatherForecast) => void;
    const pending = new Promise<WeatherForecast>((resolve) => {
      resolveForecast = resolve;
    });
    const getForecast = vi.fn(() => pending);
    const service = createWeatherService(mockProvider({ getForecast }));

    const p1 = service.getForecast("user-1", {
      latitude: 46.81,
      longitude: -71.21,
    });
    const p2 = service.getForecast("user-1", {
      latitude: 46.81,
      longitude: -71.21,
    });
    resolveForecast(sampleForecast());
    const [a, b] = await Promise.all([p1, p2]);
    expect(getForecast).toHaveBeenCalledTimes(1);
    expect(a.forecast.daily[0]?.date).toBe(b.forecast.daily[0]?.date);
  });

  it("tryGetForecast renvoie null si le fournisseur est down", async () => {
    const service = createWeatherService(
      mockProvider({
        isAvailable: () => ({ available: false, reason: "disabled" }),
        getForecast: async () => {
          throw new WeatherError(
            "disabled",
            "Données météo indisponibles",
            503,
          );
        },
      }),
    );

    const result = await service.tryGetForecast("user-1", {
      latitude: 46.81,
      longitude: -71.21,
    });
    expect(result).toBeNull();
  });

  it("rejette une position invalide", async () => {
    const service = createWeatherService(mockProvider());
    await expect(
      service.getForecast("user-1", { latitude: 999, longitude: 0 }),
    ).rejects.toMatchObject({ code: "EXT_002" });
  });

  it("fallback cache périmé si erreur temporaire", async () => {
    const getForecast = vi
      .fn()
      .mockResolvedValueOnce(sampleForecast())
      .mockRejectedValueOnce(
        new WeatherError("temporary", "down", 503, { retryable: true }),
      );

    const service = createWeatherService(mockProvider({ getForecast }));
    await service.getForecast("user-1", {
      latitude: 46.81,
      longitude: -71.21,
    });

    // Expire le cache frais en le supprimant, garde :stale
    for (const key of [...redisStore.keys()]) {
      if (!key.endsWith(":stale")) redisStore.delete(key);
    }

    const again = await service.getForecast("user-1", {
      latitude: 46.81,
      longitude: -71.21,
    });
    expect(again.stale).toBe(true);
    expect(again.fromCache).toBe(true);
  });

  it("refuse au-delà de la limite quotidienne puis sert le cache", async () => {
    process.env.WEATHER_MAX_DAILY_CALLS = "1";
    const getForecast = vi.fn(async () => sampleForecast());
    const service = createWeatherService(mockProvider({ getForecast }));

    await service.getForecast("user-1", {
      latitude: 46.81,
      longitude: -71.21,
    });

    // Force miss cache frais
    for (const key of [...redisStore.keys()]) {
      if (key.includes("weather:v2") && !key.endsWith(":stale")) {
        redisStore.delete(key);
      }
    }

    // Compteur déjà à 1 ; prochain incr → 2 > 1
    redisStore.set(
      `weather:daily_calls:${new Date().toISOString().slice(0, 10)}`,
      "1",
    );

    const again = await service.getForecast(
      "user-1",
      { latitude: 46.81, longitude: -71.21 },
      { allowStaleOnQuota: true },
    );
    expect(again.fromCache).toBe(true);
    delete process.env.WEATHER_MAX_DAILY_CALLS;
  });
});

describe("OpenMeteoProvider (fetch mocké)", () => {
  it("parse une réponse daily", async () => {
    const fetchImpl: typeof fetch = async () =>
      Response.json({
        daily: {
          time: ["2026-07-14"],
          weather_code: [3],
          temperature_2m_max: [22.5],
          temperature_2m_min: [11.2],
          precipitation_sum: [1.5],
        },
      });

    const provider = new OpenMeteoProvider({ fetchImpl });
    const result = await provider.getForecast({
      latitude: 46.8,
      longitude: -71.2,
    });
    expect(result.provider).toBe("open-meteo");
    expect(result.daily[0]?.summary).toBe("Couvert");
  });
});

describe("OpenWeatherProvider erreurs", () => {
  it("ne retry pas sur 401", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      return new Response("{}", { status: 401 });
    };
    const provider = new OpenWeatherProvider({
      config: {
        enabled: true,
        provider: "openweather",
        maxDailyCalls: 900,
        openWeatherApiKey: "test-key",
        openWeatherBaseUrl: "https://api.openweathermap.org",
        openWeatherOneCallVersion: "3",
        openMeteoApiKey: "",
        clusterRadiusKm: 20,
        timeoutMs: 5000,
        maxRetries: 2,
        horizonDays: 16,
      },
      fetchImpl,
    });

    await expect(
      provider.getForecast({ latitude: 46.8, longitude: -71.2 }),
    ).rejects.toMatchObject({ kind: "unauthorized" });
    expect(calls).toBe(1);
  });

  it("retry limité sur 500", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      return new Response("{}", { status: 500 });
    };
    const provider = new OpenWeatherProvider({
      config: {
        enabled: true,
        provider: "openweather",
        maxDailyCalls: 900,
        openWeatherApiKey: "test-key",
        openWeatherBaseUrl: "https://api.openweathermap.org",
        openWeatherOneCallVersion: "3",
        openMeteoApiKey: "",
        clusterRadiusKm: 20,
        timeoutMs: 5000,
        maxRetries: 2,
        horizonDays: 16,
      },
      fetchImpl,
    });

    await expect(
      provider.getForecast({ latitude: 46.8, longitude: -71.2 }),
    ).rejects.toMatchObject({ kind: "temporary" });
    expect(calls).toBe(3);
  });

  it("parse One Call 3 valide", async () => {
    const fetchImpl: typeof fetch = async () =>
      Response.json({
        lat: 46.8,
        lon: -71.2,
        timezone: "America/Toronto",
        timezone_offset: -14400,
        daily: [
          {
            dt: 1_721_000_000,
            temp: { min: 10, max: 20 },
            weather: [
              {
                id: 800,
                main: "Clear",
                description: "ciel dégagé",
                icon: "01d",
              },
            ],
          },
        ],
      });

    const provider = new OpenWeatherProvider({
      config: {
        enabled: true,
        provider: "openweather",
        maxDailyCalls: 900,
        openWeatherApiKey: "test-key",
        openWeatherBaseUrl: "https://api.openweathermap.org",
        openWeatherOneCallVersion: "3",
        openMeteoApiKey: "",
        clusterRadiusKm: 20,
        timeoutMs: 5000,
        maxRetries: 0,
        horizonDays: 16,
      },
      fetchImpl,
    });

    const result = await provider.getForecast({
      latitude: 46.8,
      longitude: -71.2,
    });
    expect(result.daily).toHaveLength(1);
  });
});
