import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { forecastCacheKey, roundCoord } from "@/services/weather/cache";
import {
  createWeatherService,
  setWeatherProviderForTests,
} from "@/services/weather";
import { OpenMeteoProvider } from "@/services/weather/open-meteo-provider";
import { wmoWeatherSummary } from "@/services/weather/wmo";
import { resolveStopForecastDate } from "@/features/weather/lib/dates";
import type {
  WeatherCurrentResult,
  WeatherForecastResult,
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

function mockForecast(
  overrides?: Partial<WeatherForecastResult>,
): WeatherForecastResult {
  return {
    location: { lat: 46.81, lng: -71.21 },
    provider: "mock",
    horizonDays: 16,
    daily: [
      {
        date: "2026-07-14",
        weatherCode: 0,
        summary: "Ciel dégagé",
        tempMinC: 12,
        tempMaxC: 24,
        precipitationMm: 0,
      },
      {
        date: "2026-07-15",
        weatherCode: 61,
        summary: "Pluie",
        tempMinC: 10,
        tempMaxC: 18,
        precipitationMm: 5,
      },
    ],
    ...overrides,
  };
}

function mockProvider(overrides?: Partial<WeatherProvider>): WeatherProvider {
  return {
    name: "mock",
    horizonDays: 16,
    isAvailable: () => ({ available: true }),
    getForecast: async (): Promise<WeatherForecastResult> => mockForecast(),
    getCurrent: async (): Promise<WeatherCurrentResult> => ({
      location: { lat: 46.81, lng: -71.21 },
      provider: "mock",
      current: {
        observedAt: "2026-07-14T12:00:00.000Z",
        weatherCode: 0,
        summary: "Ciel dégagé",
        temperatureC: 20,
      },
    }),
    ...overrides,
  };
}

describe("wmoWeatherSummary", () => {
  it("mappe les codes courants", () => {
    expect(wmoWeatherSummary(0)).toBe("Ciel dégagé");
    expect(wmoWeatherSummary(61)).toBe("Pluie");
    expect(wmoWeatherSummary(95)).toBe("Orage");
  });
});

describe("roundCoord / cache key", () => {
  it("arrondit à 2 décimales pour mutualiser le cache", () => {
    expect(roundCoord(46.81321)).toBe(46.81);
    expect(forecastCacheKey({ lat: 46.813, lng: -71.208 })).toBe(
      forecastCacheKey({ lat: 46.81, lng: -71.21 }),
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

  it("sinon departureDate + (sequence - 1)", () => {
    expect(
      resolveStopForecastDate({
        arrivalTime: null,
        departureDate: new Date("2026-07-20T12:00:00.000Z"),
        sequence: 3,
      }),
    ).toBe("2026-07-22");
  });
});

describe("weather service (mocked provider)", () => {
  beforeEach(() => {
    redisStore.clear();
    setWeatherProviderForTests(null);
  });

  it("sert la prévision depuis le cache sans rappeler le provider", async () => {
    const getForecast = vi.fn(async () => mockForecast());
    const service = createWeatherService(mockProvider({ getForecast }));

    const first = await service.getForecast("user-1", {
      lat: 46.81,
      lng: -71.21,
    });
    const second = await service.getForecast("user-1", {
      lat: 46.81,
      lng: -71.21,
    });

    expect(first.daily).toHaveLength(2);
    expect(second.daily).toHaveLength(2);
    expect(getForecast).toHaveBeenCalledTimes(1);
  });

  it("tryGetForecast renvoie null si le fournisseur est down", async () => {
    const service = createWeatherService(
      mockProvider({
        isAvailable: () => ({ available: false, reason: "disabled" }),
        getForecast: async () => {
          throw new AppError("EXT_003", "Données météo indisponibles", 503);
        },
      }),
    );

    const result = await service.tryGetForecast("user-1", {
      lat: 46.81,
      lng: -71.21,
    });
    expect(result).toBeNull();
  });

  it("rejette une position invalide", async () => {
    const service = createWeatherService(mockProvider());
    await expect(
      service.getForecast("user-1", { lat: 999, lng: 0 }),
    ).rejects.toMatchObject({ code: "EXT_002" });
  });
});

describe("OpenMeteoProvider (fetch mocké)", () => {
  it("parse une réponse daily sans appeler le réseau réel", async () => {
    let calledUrl = "";
    const fetchImpl: typeof fetch = async (input) => {
      calledUrl = String(input);
      return Response.json({
        daily: {
          time: ["2026-07-14"],
          weather_code: [3],
          temperature_2m_max: [22.5],
          temperature_2m_min: [11.2],
          precipitation_sum: [1.5],
        },
      });
    };

    const provider = new OpenMeteoProvider({ fetchImpl });
    const result = await provider.getForecast({ lat: 46.8, lng: -71.2 });

    expect(result.provider).toBe("open-meteo");
    expect(result.daily[0]?.summary).toBe("Couvert");
    expect(result.daily[0]?.tempMaxC).toBe(22.5);
    expect(calledUrl).toContain("api.open-meteo.com");
    expect(calledUrl).not.toContain("apikey=");
  });

  it("utilise customer-api et apikey si clé fournie", async () => {
    let calledUrl = "";
    const fetchImpl: typeof fetch = async (input) => {
      calledUrl = String(input);
      return Response.json({
        daily: {
          time: ["2026-07-14"],
          weather_code: [0],
          temperature_2m_max: [20],
          temperature_2m_min: [10],
          precipitation_sum: [0],
        },
      });
    };

    const provider = new OpenMeteoProvider({
      apiKey: "test-key",
      fetchImpl,
    });
    await provider.getForecast({ lat: 46.8, lng: -71.2 });

    expect(calledUrl).toContain("customer-api.open-meteo.com");
    expect(calledUrl).toContain("apikey=test-key");
  });
});
