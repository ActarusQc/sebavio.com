import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trip: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/features/weather", () => ({
  getTripWeather: vi.fn(async () => {
    throw new Error("weather_unavailable");
  }),
}));

import { prisma } from "@/lib/prisma";
import { buildTripAssistantContext } from "@/features/ai/services/context-builder";

describe("buildTripAssistantContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("construit un DTO minimal et arrondit les coordonnées", async () => {
    vi.mocked(prisma.trip.findFirst).mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000001",
      title: "Québec",
      status: "planned",
      origin: "Montréal",
      destination: "Québec",
      departureDate: new Date("2026-08-01T12:00:00.000Z"),
      returnDate: null,
      originCity: "Montréal",
      destinationCity: "Québec",
      route: {
        distanceKm: 250,
        estimatedDurationMin: 180,
        returnDistanceKm: null,
        returnEstimatedDurationMin: null,
        estimatedFuelCost: 45.5,
        isStale: false,
        fuelEstimateStale: false,
      },
      stops: [
        {
          id: "00000000-0000-4000-8000-000000000010",
          name: "Pause",
          stopType: "rest",
          direction: "outbound",
          sequence: 1,
          durationMinutes: 15,
          arrivalTime: null,
          departureTime: null,
          address: null,
          latitude: 45.5012345,
          longitude: -73.5678901,
        },
      ],
      tripActivities: [],
      travelerProfile: null,
      vehicle: {
        nickname: "Van",
        manualYear: null,
        manualManufacturerName: null,
        manualModelName: null,
        customFuelType: null,
        fuelType: "regular",
        manufacturerFuelType: null,
        customConsumptionL100: 10.5,
        realAvgConsumption: null,
        tankCapacityOverride: 70,
      },
    } as never);

    const ctx = await buildTripAssistantContext({
      userId: "00000000-0000-4000-8000-000000000099",
      tripId: "00000000-0000-4000-8000-000000000001",
      requestType: "analyze",
    });

    expect(ctx.trip.title).toBe("Québec");
    expect(ctx.stops[0]?.latApprox).toBe(45.501);
    expect(ctx.stops[0]?.lngApprox).toBe(-73.568);
    expect(ctx.liveLocation?.included).toBe(false);
    expect(ctx.vehicle?.customConsumptionL100).toBe(10.5);
    expect(ctx.weather?.available).toBe(false);
  });

  it("n’inclut la position live que si voyage actif", async () => {
    vi.mocked(prisma.trip.findFirst).mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000001",
      title: "Trip",
      status: "planned",
      origin: "A",
      destination: "B",
      departureDate: new Date(),
      returnDate: null,
      originCity: null,
      destinationCity: null,
      route: null,
      stops: [],
      tripActivities: [],
      travelerProfile: null,
      vehicle: {
        nickname: null,
        manualYear: 2020,
        manualManufacturerName: "Ford",
        manualModelName: "Transit",
        customFuelType: null,
        fuelType: null,
        manufacturerFuelType: null,
        customConsumptionL100: null,
        realAvgConsumption: null,
        tankCapacityOverride: null,
      },
    } as never);

    const ctx = await buildTripAssistantContext({
      userId: "u",
      tripId: "t",
      requestType: "chat",
      includeLiveLocation: true,
      liveLatitude: 45.5,
      liveLongitude: -73.5,
    });

    expect(ctx.liveLocation?.included).toBe(false);
  });
});
