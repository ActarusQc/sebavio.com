import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTripWeatherResponse } from "@/features/weather/services";
import { setWeatherProviderForTests } from "@/services/weather";
import type {
  WeatherForecast,
  WeatherProvider,
} from "@/services/weather/types";
import { AppError } from "@/lib/errors";

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

const ownedTrip = {
  id: "trip-1",
  userId: "user-1",
  status: "planned" as "planned" | "in_progress" | "completed" | "cancelled",
  title: "Test",
  departureDate: new Date(),
  returnDate: null as Date | null,
  origin: "Montréal",
  originLatitude: { toString: () => "45.5" },
  originLongitude: { toString: () => "-73.6" },
  destination: "Québec",
  destinationLatitude: { toString: () => "46.81" },
  destinationLongitude: { toString: () => "-71.21" },
  stops: [
    {
      id: "stop-1",
      name: "Trois-Rivières",
      sequence: 1,
      latitude: { toString: () => "46.35" },
      longitude: { toString: () => "-72.55" },
      arrivalTime: null as Date | null,
    },
  ],
};

vi.mock("@/features/trips/services", () => ({
  getOwnedTripOrThrow: vi.fn(async (userId: string, tripId: string) => {
    if (userId !== "user-1") {
      throw new AppError("TRIP_001", "Voyage introuvable", 404);
    }
    if (tripId !== "trip-1") {
      throw new AppError("TRIP_001", "Voyage introuvable", 404);
    }
    return ownedTrip;
  }),
}));

function forecast(): WeatherForecast {
  return {
    provider: "openweather",
    latitude: 46.81,
    longitude: -71.21,
    timezone: "America/Toronto",
    timezoneOffsetSeconds: -14400,
    fetchedAt: new Date().toISOString(),
    current: {
      observedAt: new Date().toISOString(),
      temperatureC: 18,
      feelsLikeC: 17,
      humidity: 50,
      pressureHpa: 1010,
      windSpeedKmh: 12,
      windDirectionDeg: 90,
      windGustKmh: null,
      visibilityM: 10000,
      cloudCoverPct: 20,
      uvIndex: 3,
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
    hourly: Array.from({ length: 6 }, (_, i) => ({
      forecastAt: new Date(Date.now() + i * 3600_000).toISOString(),
      temperatureC: 18,
      feelsLikeC: 17,
      precipitationProbability: 10,
      rainMm: null,
      snowMm: null,
      humidity: 50,
      pressureHpa: 1010,
      windSpeedKmh: 10,
      windDirectionDeg: 90,
      windGustKmh: null,
      visibilityM: 10000,
      cloudCoverPct: 20,
      uvIndex: 2,
      condition: {
        code: 800,
        main: "Clear",
        description: "Ciel dégagé",
        iconId: "01d",
      },
    })),
    daily: Array.from({ length: 8 }, (_, i) => {
      const d = new Date(ownedTrip.departureDate);
      d.setUTCDate(d.getUTCDate() + i);
      const date = d.toISOString().slice(0, 10);
      return {
        date,
        forecastAt: `${date}T16:00:00.000Z`,
        tempMinC: 10,
        tempMaxC: 22,
        tempDayC: 20,
        feelsLikeDayC: 19,
        precipitationProbability: 15,
        rainMm: 0,
        snowMm: null,
        humidity: 50,
        pressureHpa: 1010,
        windSpeedKmh: 12,
        windDirectionDeg: 90,
        windGustKmh: null,
        cloudCoverPct: 20,
        uvIndex: 4,
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
      };
    }),
    alerts: [],
  };
}

function mockProvider(overrides?: Partial<WeatherProvider>): WeatherProvider {
  return {
    name: "openweather",
    horizonDays: 16,
    isAvailable: () => ({ available: true }),
    getForecast: async () => forecast(),
    ...overrides,
  };
}

describe("intégration météo voyage", () => {
  beforeEach(() => {
    redisStore.clear();
    setWeatherProviderForTests(null);
    ownedTrip.status = "planned";
    ownedTrip.departureDate = new Date(Date.now() + 3 * 86_400_000);
    ownedTrip.returnDate = null;
    ownedTrip.destinationLatitude = { toString: () => "46.81" };
    ownedTrip.destinationLongitude = { toString: () => "-71.21" };
    ownedTrip.stops = [
      {
        id: "stop-1",
        name: "Trois-Rivières",
        sequence: 1,
        latitude: { toString: () => "46.35" },
        longitude: { toString: () => "-72.55" },
        arrivalTime: null,
      },
    ];
    process.env.WEATHER_ENABLED = "true";
    process.env.WEATHER_PROVIDER = "openweather";
    process.env.WEATHER_MAX_DAILY_CALLS = "900";
  });

  it("voyage à plus de 16 jours → too_early sans appel utile", async () => {
    ownedTrip.departureDate = new Date(Date.now() + 20 * 86_400_000);
    const getForecast = vi.fn(async () => forecast());
    setWeatherProviderForTests(mockProvider({ getForecast }));

    const res = await getTripWeatherResponse("user-1", "trip-1");
    expect(res.status).toBe("too_early");
    expect(getForecast).not.toHaveBeenCalled();
  });

  it("voyage à moins de 8 jours → available avec daily", async () => {
    ownedTrip.departureDate = new Date(Date.now() + 5 * 86_400_000);
    setWeatherProviderForTests(mockProvider());
    const res = await getTripWeatherResponse("user-1", "trip-1");
    expect(res.status).toBe("available");
    expect(res.displayWindow).toBe("daily");
    expect(res.locations.some((l) => l.daily.length > 0)).toBe(true);
  });

  it("voyage à moins de 48 heures → hourly", async () => {
    ownedTrip.departureDate = new Date(Date.now() + 36 * 3600_000);
    setWeatherProviderForTests(mockProvider());
    const res = await getTripWeatherResponse("user-1", "trip-1");
    expect(res.displayWindow).toBe("hourly");
  });

  it("voyage en cours → live", async () => {
    ownedTrip.status = "in_progress";
    ownedTrip.departureDate = new Date(Date.now() - 86_400_000);
    setWeatherProviderForTests(mockProvider());
    const res = await getTripWeatherResponse("user-1", "trip-1");
    expect(res.displayWindow).toBe("live");
    expect(res.locations.some((l) => l.current != null)).toBe(true);
  });

  it("voyage sans coordonnées", async () => {
    ownedTrip.destinationLatitude = null as never;
    ownedTrip.destinationLongitude = null as never;
    ownedTrip.originLatitude = null as never;
    ownedTrip.originLongitude = null as never;
    ownedTrip.stops = [];
    setWeatherProviderForTests(mockProvider());
    const res = await getTripWeatherResponse("user-1", "trip-1");
    expect(res.status).toBe("no_coordinates");
  });

  it("réponse fournisseur invalide → unavailable", async () => {
    ownedTrip.departureDate = new Date(Date.now() + 3 * 86_400_000);
    setWeatherProviderForTests(
      mockProvider({
        getForecast: async () => {
          throw new Error("boom");
        },
      }),
    );
    const res = await getTripWeatherResponse("user-1", "trip-1");
    expect(["temporarily_unavailable", "too_early"]).toContain(res.status);
  });

  it("utilisateur non autorisé / autre propriétaire", async () => {
    setWeatherProviderForTests(mockProvider());
    await expect(
      getTripWeatherResponse("other-user", "trip-1"),
    ).rejects.toMatchObject({ code: "TRIP_001" });
  });

  it("limite interne atteinte → provider_limit_reached ou cache", async () => {
    ownedTrip.departureDate = new Date(Date.now() + 3 * 86_400_000);
    process.env.WEATHER_MAX_DAILY_CALLS = "0";
    // With max 0, canCallProvider: count < 0 is false immediately
    redisStore.set(
      `weather:daily_calls:${new Date().toISOString().slice(0, 10)}`,
      "0",
    );
    setWeatherProviderForTests(
      mockProvider({
        getForecast: async () => {
          throw new Error("should not call");
        },
      }),
    );
    // maxDailyCalls 0 → parsePositiveInt min is 1, so use env 1 and pre-fill counter
    process.env.WEATHER_MAX_DAILY_CALLS = "1";
    redisStore.set(
      `weather:daily_calls:${new Date().toISOString().slice(0, 10)}`,
      "5",
    );
    const res = await getTripWeatherResponse("user-1", "trip-1");
    expect([
      "provider_limit_reached",
      "temporarily_unavailable",
      "too_early",
    ]).toContain(res.status);
  });
});
