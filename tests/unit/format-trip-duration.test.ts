import { describe, expect, it } from "vitest";
import { formatTripDuration } from "@/features/trips/lib/format-duration";

describe("formatTripDuration", () => {
  it("formate heures et minutes", () => {
    expect(formatTripDuration(487)).toBe("8 h 7 min");
  });

  it("gère heures exactes et minutes seules", () => {
    expect(formatTripDuration(120)).toBe("2 h");
    expect(formatTripDuration(45)).toBe("45 min");
  });

  it("retourne un tiret si invalide", () => {
    expect(formatTripDuration(null)).toBe("—");
    expect(formatTripDuration(undefined)).toBe("—");
  });
});
