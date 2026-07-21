import { describe, expect, it } from "vitest";
import {
  buildDualWeatherBlocks,
  formatWeatherDayHeading,
  selectThreeDays,
  shortWeatherPlaceLabel,
} from "@/features/weather/lib/dual-blocks";
import type {
  TripWeatherLocation,
  TripWeatherResponse,
} from "@/features/weather/types";
import type { WeatherDailyForecast } from "@/services/weather/types";

function day(date: string, max = 20, min = 10): WeatherDailyForecast {
  return {
    date,
    forecastAt: `${date}T12:00:00.000Z`,
    tempMinC: min,
    tempMaxC: max,
    tempDayC: max,
    feelsLikeDayC: max,
    precipitationProbability: 10,
    rainMm: 0,
    snowMm: null,
    humidity: 50,
    pressureHpa: 1012,
    windSpeedKmh: 10,
    windDirectionDeg: 180,
    windGustKmh: null,
    cloudCoverPct: 20,
    uvIndex: 3,
    sunriseAt: null,
    sunsetAt: null,
    condition: {
      code: 0,
      main: "Clear",
      description: "Ciel dégagé",
      iconId: "01d",
    },
    weatherCode: 0,
    summary: "Ciel dégagé",
    precipitationMm: 0,
  };
}

function loc(
  partial: Partial<TripWeatherLocation> &
    Pick<TripWeatherLocation, "id" | "type" | "name">,
): TripWeatherLocation {
  return {
    date: null,
    latitude: 45,
    longitude: -73,
    current: null,
    daily: [],
    hourly: [],
    alerts: [],
    activity: null,
    updatedAt: null,
    fromCache: false,
    stale: false,
    summary: null,
    ...partial,
  };
}

function response(
  locations: TripWeatherLocation[],
  status: TripWeatherResponse["status"] = "available",
): TripWeatherResponse {
  return {
    status,
    generatedAt: new Date().toISOString(),
    message: null,
    displayWindow: "daily",
    locations,
  };
}

describe("shortWeatherPlaceLabel", () => {
  it("préfère le libellé court et tronque les adresses longues", () => {
    expect(shortWeatherPlaceLabel("New Richmond, QC", "fallback")).toBe(
      "New Richmond, QC",
    );
    expect(
      shortWeatherPlaceLabel(
        null,
        "68 Rue Soupras, Saint-Mathias-sur-Richelieu, QC",
      ),
    ).toBe("68 Rue Soupras");
  });
});

describe("formatWeatherDayHeading", () => {
  it("affiche Aujourd’hui seulement pour la date du jour", () => {
    expect(formatWeatherDayHeading("2026-07-21", "2026-07-21")).toBe(
      "Aujourd’hui",
    );
    expect(formatWeatherDayHeading("2026-07-22", "2026-07-21")).not.toBe(
      "Aujourd’hui",
    );
  });
});

describe("selectThreeDays", () => {
  it("limite à 3 jours chronologiques à partir de l’ancre", () => {
    const location = loc({
      id: "d",
      type: "destination",
      name: "Percé",
      date: "2026-07-22",
      daily: [
        day("2026-07-22"),
        day("2026-07-20"),
        day("2026-07-23"),
        day("2026-07-24"),
        day("2026-07-25"),
      ],
    });
    const days = selectThreeDays(location, { todayIso: "2026-07-21" });
    expect(days.map((d) => d.date)).toEqual([
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
    ]);
  });

  it("ignore les jours passés mélangés après l’ancre serveur", () => {
    const location = loc({
      id: "o",
      type: "origin",
      name: "Montréal",
      date: "2026-07-21",
      daily: [
        day("2026-07-21"),
        day("2026-07-20"),
        day("2026-07-22"),
        day("2026-07-23"),
      ],
    });
    expect(
      selectThreeDays(location, { todayIso: "2026-07-21" }).map((d) => d.date),
    ).toEqual(["2026-07-21", "2026-07-22", "2026-07-23"]);
  });
});

describe("buildDualWeatherBlocks", () => {
  it("utilise live plutôt que origin pour le bloc gauche", () => {
    const blocks = buildDualWeatherBlocks({
      response: response([
        loc({
          id: "o",
          type: "origin",
          name: "Montréal",
          daily: [day("2026-07-18"), day("2026-07-19"), day("2026-07-20")],
        }),
        loc({
          id: "l",
          type: "live",
          name: "Ma position",
          daily: [day("2026-07-21"), day("2026-07-22"), day("2026-07-23")],
        }),
        loc({
          id: "d",
          type: "destination",
          name: "New Richmond",
          daily: [day("2026-07-22"), day("2026-07-23"), day("2026-07-24")],
        }),
      ]),
      originLabel: "Montréal, QC",
      destinationLabel: "New Richmond, QC",
      todayIso: "2026-07-21",
    });

    expect(blocks.departure.kind).toBe("live");
    expect(blocks.departure.title).toBe("Position actuelle");
    expect(blocks.departure.days.map((d) => d.date)[0]).toBe("2026-07-21");
    expect(blocks.arrival.title).toBe("Arrivée");
    expect(blocks.arrival.placeLabel).toContain("New Richmond");
    expect(blocks.arrival.days.map((d) => d.date)).toEqual([
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
    ]);
  });

  it("retombe sur le départ sans géoloc et message vide si arrivée absente", () => {
    const blocks = buildDualWeatherBlocks({
      response: response([
        loc({
          id: "o",
          type: "origin",
          name: "Montréal",
          daily: [day("2026-07-18"), day("2026-07-19"), day("2026-07-20")],
        }),
      ]),
      originLabel: "Montréal",
      todayIso: "2026-07-10",
    });

    expect(blocks.departure.kind).toBe("departure");
    expect(blocks.departure.title).toBe("Départ");
    expect(blocks.departure.days).toHaveLength(3);
    expect(blocks.arrival.days).toHaveLength(0);
    expect(blocks.arrival.emptyMessage).toMatch(/arrivée/i);
  });

  it("expose un message d’approche pour voyage futur (too_early)", () => {
    const blocks = buildDualWeatherBlocks({
      response: response([], "too_early"),
      todayIso: "2026-07-01",
    });
    expect(blocks.departure.emptyMessage).toMatch(/approche/i);
    expect(blocks.arrival.emptyMessage).toMatch(/approche/i);
  });
});
