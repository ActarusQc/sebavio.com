import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { normalizeAddress } from "@/services/maps/normalize";
import { computeWaypointsHash, geocodeCacheKey } from "@/services/maps/cache";
import { createMapsService, setMapsProviderForTests } from "@/services/maps";
import type {
  DirectionsResult,
  GeocodeResult,
  MapsProvider,
} from "@/services/maps/types";
import { decodeGooglePolyline } from "@/features/maps/lib/polyline";

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

function mockProvider(overrides?: Partial<MapsProvider>): MapsProvider {
  return {
    name: "mock",
    isAvailable: () => ({ available: true }),
    geocode: async (address: string): Promise<GeocodeResult> => ({
      lat: 46.8,
      lng: -71.2,
      formattedAddress: address,
    }),
    directions: async (): Promise<DirectionsResult> => ({
      distanceKm: 100,
      durationMin: 90,
      polyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
      provider: "google",
      legCount: 1,
      legs: [
        {
          distanceKm: 100,
          durationMin: 90,
          start: { lat: 46.8, lng: -71.3 },
          end: { lat: 46.9, lng: -71.1 },
        },
      ],
      finalDestination: { lat: 46.9, lng: -71.1 },
    }),
    ...overrides,
  };
}

describe("normalizeAddress", () => {
  it("normalise trim, casse et espaces sans toucher aux accents", () => {
    expect(normalizeAddress("  123 Rue Principale  ")).toBe(
      "123 rue principale",
    );
    expect(normalizeAddress("123 rue principale")).toBe("123 rue principale");
    expect(normalizeAddress("Café  Été")).toBe("café été");
  });
});

describe("geocode cache key", () => {
  it("produit le même hash pour des adresses équivalentes", () => {
    expect(geocodeCacheKey("123 Rue Principale")).toBe(
      geocodeCacheKey("123 rue principale  "),
    );
    const expected = createHash("sha256")
      .update("123 rue principale", "utf8")
      .digest("hex");
    expect(geocodeCacheKey("123 Rue Principale")).toBe(
      `maps:geocode:${expected}`,
    );
  });
});

describe("computeWaypointsHash / stale", () => {
  it("change lorsque l'ordre des étapes change", () => {
    const base = {
      origin: "Montréal",
      destination: "Québec",
      stops: [
        {
          sequence: 1,
          address: "Trois-Rivières",
          latitude: "46.3",
          longitude: "-72.5",
        },
        {
          sequence: 2,
          address: "Portneuf",
          latitude: "46.7",
          longitude: "-71.9",
        },
      ],
    };
    const reordered = {
      ...base,
      stops: [
        { ...base.stops[1], sequence: 1 },
        { ...base.stops[0], sequence: 2 },
      ],
    };
    expect(computeWaypointsHash(base)).not.toBe(
      computeWaypointsHash(reordered),
    );
  });
});

describe("maps service (mocked provider)", () => {
  beforeEach(() => {
    redisStore.clear();
    setMapsProviderForTests(null);
  });

  it("sert le géocodage depuis le cache sans rappeler le provider", async () => {
    const geocode = vi.fn(async (address: string): Promise<GeocodeResult> => ({
      lat: 1,
      lng: 2,
      formattedAddress: address,
    }));
    setMapsProviderForTests(mockProvider({ geocode }));
    const service = createMapsService();

    const first = await service.geocode("user-1", "123 Rue Principale");
    const second = await service.geocode("user-1", "123 rue principale  ");

    expect(first).toEqual(second);
    expect(geocode).toHaveBeenCalledTimes(1);
  });

  it("refuse en mode dégradé si provider indisponible et cache vide", async () => {
    setMapsProviderForTests(
      mockProvider({
        isAvailable: () => ({ available: false, reason: "missing_key" }),
      }),
    );
    const service = createMapsService();

    await expect(service.geocode("user-1", "Somewhere")).rejects.toMatchObject({
      code: "EXT_001",
    } satisfies Partial<AppError>);
  });

  it("calcule un itinéraire via le provider mocké", async () => {
    const directions = vi.fn(async (): Promise<DirectionsResult> => ({
      distanceKm: 42,
      durationMin: 55,
      polyline: "abc",
      provider: "google",
      legCount: 2,
      legs: [
        {
          distanceKm: 20,
          durationMin: 25,
          start: { lat: 45, lng: -73 },
          end: { lat: 45.5, lng: -72 },
        },
        {
          distanceKm: 22,
          durationMin: 30,
          start: { lat: 45.5, lng: -72 },
          end: { lat: 46, lng: -71 },
        },
      ],
      finalDestination: { lat: 46, lng: -71 },
    }));
    setMapsProviderForTests(mockProvider({ directions }));
    const service = createMapsService();

    const result = await service.directions(
      "user-1",
      { lat: 45, lng: -73 },
      { lat: 46, lng: -71 },
      [{ lat: 45.5, lng: -72 }],
    );

    expect(result.distanceKm).toBe(42);
    expect(directions).toHaveBeenCalledTimes(1);

    const cached = await service.directions(
      "user-1",
      { lat: 45, lng: -73 },
      { lat: 46, lng: -71 },
      [{ lat: 45.5, lng: -72 }],
    );
    expect(cached.distanceKm).toBe(42);
    expect(directions).toHaveBeenCalledTimes(1);
  });
});

describe("decodeGooglePolyline", () => {
  it("décode une polyline connue", () => {
    const points = decodeGooglePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(points.length).toBeGreaterThan(1);
    expect(points[0].lat).toBeCloseTo(38.5, 1);
    expect(points[0].lng).toBeCloseTo(-120.2, 1);
  });
});
