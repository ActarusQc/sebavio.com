import { describe, expect, it } from "vitest";
import {
  resolveWeatherIconKind,
  weatherKindFromWmo,
} from "@/features/weather/components/weather-condition-icon";

describe("resolveWeatherIconKind", () => {
  it("mappe les codes OpenWeather jour/nuit", () => {
    expect(resolveWeatherIconKind("01d")).toBe("clear-day");
    expect(resolveWeatherIconKind("01n")).toBe("clear-night");
    expect(resolveWeatherIconKind("02d")).toBe("partly-cloudy-day");
    expect(resolveWeatherIconKind("02n")).toBe("partly-cloudy-night");
    expect(resolveWeatherIconKind("10d")).toBe("rain");
    expect(resolveWeatherIconKind("11n")).toBe("thunder");
    expect(resolveWeatherIconKind("13d")).toBe("snow");
    expect(resolveWeatherIconKind("50d")).toBe("fog");
  });

  it("mappe les codes WMO (Open-Meteo)", () => {
    expect(resolveWeatherIconKind("0")).toBe("clear-day");
    expect(resolveWeatherIconKind("2")).toBe("partly-cloudy-day");
    expect(resolveWeatherIconKind("3")).toBe("overcast");
    expect(resolveWeatherIconKind("61")).toBe("rain");
    expect(resolveWeatherIconKind("80")).toBe("showers");
    expect(resolveWeatherIconKind("95")).toBe("thunder");
    expect(weatherKindFromWmo(45)).toBe("fog");
  });

  it("utilise condition.code en secours", () => {
    expect(resolveWeatherIconKind(undefined, 3)).toBe("overcast");
    expect(resolveWeatherIconKind("", 71)).toBe("snow");
  });

  it("ne confond pas les codes OWM avec des nombres", () => {
    expect(resolveWeatherIconKind("01d")).toBe("clear-day");
    expect(resolveWeatherIconKind("02n")).toBe("partly-cloudy-night");
  });

  it("preferDay force soleil plutôt que lune", () => {
    expect(resolveWeatherIconKind("01n", null, { preferDay: true })).toBe(
      "clear-day",
    );
    expect(resolveWeatherIconKind("02n", null, { preferDay: true })).toBe(
      "partly-cloudy-day",
    );
  });
});
