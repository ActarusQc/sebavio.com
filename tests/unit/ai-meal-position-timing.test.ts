import { describe, expect, it } from "vitest";
import {
  combineTripDateAndClock,
  resolveDepartureTiming,
  resolveMealTiming,
} from "@/features/ai/lib/meal-timing";

describe("progression temporelle 6 h → midi", () => {
  it("calcule 6 heures de fenêtre", () => {
    const msg = "Je compte partir à 6 h. Je voudrais dîner à midi. Restaurant?";
    const dep = resolveDepartureTiming(msg)!;
    const meal = resolveMealTiming(msg)!;
    expect(dep.hour).toBe(6);
    expect(meal.targetHour).toBe(12);
    const departure = combineTripDateAndClock("2026-07-23T12:00:00.000Z", {
      hour: dep.hour,
      minute: dep.minute,
    });
    const target = combineTripDateAndClock("2026-07-23T12:00:00.000Z", {
      hour: meal.targetHour,
      minute: meal.targetMinute,
    });
    const elapsedMin = (target.getTime() - departure.getTime()) / 60_000;
    expect(elapsedMin).toBe(360);
  });

  it("7 h → midi = 5 h", () => {
    const departure = combineTripDateAndClock("2026-07-23T12:00:00.000Z", {
      hour: 7,
      minute: 0,
    });
    const target = combineTripDateAndClock("2026-07-23T12:00:00.000Z", {
      hour: 12,
      minute: 0,
    });
    expect((target.getTime() - departure.getTime()) / 60_000).toBe(300);
  });
});
