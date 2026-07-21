/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TripWeatherSection } from "@/features/weather/components/trip-weather-section";
import type { TripWeatherResponse } from "@/features/weather/types";

function mockResponse(data: TripWeatherResponse) {
  return {
    ok: true,
    json: async () => ({ success: true, data: { weather: data } }),
  } as Response;
}

const baseLocation = {
  id: "destination:1",
  name: "Québec",
  type: "destination" as const,
  date: "2026-07-20",
  latitude: 46.81,
  longitude: -71.21,
  current: null,
  daily: [
    {
      date: "2026-07-20",
      forecastAt: "2026-07-20T16:00:00.000Z",
      tempMinC: 12,
      tempMaxC: 24,
      tempDayC: 22,
      feelsLikeDayC: 21,
      precipitationProbability: 20,
      rainMm: 0,
      snowMm: null,
      humidity: 50,
      pressureHpa: 1012,
      windSpeedKmh: 18,
      windDirectionDeg: 180,
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
    },
  ],
  hourly: [
    {
      forecastAt: "2026-07-20T14:00:00.000Z",
      temperatureC: 20,
      feelsLikeC: 19,
      precipitationProbability: 10,
      rainMm: null,
      snowMm: null,
      humidity: 50,
      pressureHpa: 1012,
      windSpeedKmh: 12,
      windDirectionDeg: 180,
      windGustKmh: null,
      visibilityM: 10000,
      cloudCoverPct: 10,
      uvIndex: 3,
      condition: {
        code: 800,
        main: "Clear",
        description: "Ciel dégagé",
        iconId: "01d",
      },
    },
  ],
  alerts: [] as TripWeatherResponse["locations"][0]["alerts"],
  activity: null,
  updatedAt: "2026-07-17T12:00:00.000Z",
  fromCache: false,
  stale: false,
  summary: "Ciel dégagé — 12° / 24°C",
};

describe("TripWeatherSection", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("affiche le skeleton pendant le chargement", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => undefined) as never);
    render(<TripWeatherSection tripId="trip-1" />);
    expect(screen.getByTestId("trip-weather-loading")).toBeInTheDocument();
  });

  it("affiche too early", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        status: "too_early",
        generatedAt: new Date().toISOString(),
        message:
          "Les prévisions météo seront disponibles à l'approche de votre voyage.",
        displayWindow: "none",
        locations: [],
      }),
    );
    render(<TripWeatherSection tripId="trip-1" />);
    await waitFor(() => {
      expect(screen.getByText(/approche de votre voyage/i)).toBeInTheDocument();
    });
  });

  it("affiche les prévisions disponibles (desktop/mobile)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        status: "available",
        generatedAt: new Date().toISOString(),
        message: null,
        displayWindow: "daily",
        locations: [baseLocation],
      }),
    );
    const { container } = render(<TripWeatherSection tripId="trip-1" />);
    await waitFor(() => {
      expect(screen.getByText("Québec")).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Ciel dégagé/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("trip-weather-locations").className).toMatch(
      /flex-col/,
    );
    expect(
      container.querySelector("[data-testid='trip-weather-section']"),
    ).toBeTruthy();
  });

  it("affiche les alertes", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        status: "available",
        generatedAt: new Date().toISOString(),
        message: null,
        displayWindow: "live",
        locations: [
          {
            ...baseLocation,
            alerts: [
              {
                id: "a1",
                title: "Alerte orages",
                senderName: "ECCC",
                startAt: "2026-07-20T12:00:00.000Z",
                endAt: "2026-07-20T20:00:00.000Z",
                description: "Orages violents",
                summary: "Orages violents",
                tags: ["Thunderstorm"],
                level: "vigilance",
              },
            ],
          },
        ],
      }),
    );
    render(<TripWeatherSection tripId="trip-1" />);
    await waitFor(() => {
      expect(screen.getByText(/Alerte orages/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Vigilance/i)).toBeInTheDocument();
  });

  it("indique les données cache périmées", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        status: "available",
        generatedAt: new Date().toISOString(),
        message: "Données météo en cache (mise à jour différée).",
        displayWindow: "daily",
        locations: [{ ...baseLocation, fromCache: true, stale: true }],
      }),
    );
    render(<TripWeatherSection tripId="trip-1" />);
    await waitFor(() => {
      expect(screen.getByText(/données anciennes/i)).toBeInTheDocument();
    });
  });

  it("affiche fournisseur indisponible", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        status: "temporarily_unavailable",
        generatedAt: new Date().toISOString(),
        message: "Fournisseur météo temporairement indisponible.",
        displayWindow: "daily",
        locations: [],
      }),
    );
    render(<TripWeatherSection tripId="trip-1" />);
    await waitFor(() => {
      expect(
        screen.getByText(/temporairement indisponible/i),
      ).toBeInTheDocument();
    });
  });
});
