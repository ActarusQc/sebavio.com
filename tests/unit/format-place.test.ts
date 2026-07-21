import { describe, expect, it } from "vitest";
import {
  formatClockTime,
  formatPlaceLabel,
  formatRelativeFr,
  formatTripDateRange,
} from "@/features/trips/lib/format-place";

describe("format-place", () => {
  it("compose ville + province", () => {
    expect(formatPlaceLabel("Québec", "QC", "fallback")).toBe("Québec, QC");
  });

  it("utilise le fallback si pas de ville", () => {
    expect(formatPlaceLabel(null, null, "Adresse longue")).toBe(
      "Adresse longue",
    );
  });

  it("formate une plage de dates", () => {
    const label = formatTripDateRange("2025-06-08", "2025-06-12");
    expect(label).toMatch(/8/);
    expect(label).toMatch(/12/);
    expect(label).toMatch(/2025/);
  });

  it("formate une heure ISO", () => {
    expect(formatClockTime("19:20")).toMatch(/19/);
  });

  it("formate un relatif récent", () => {
    const iso = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeFr(iso)).toMatch(/heure/);
  });
});
