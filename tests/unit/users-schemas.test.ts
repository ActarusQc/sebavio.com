import { describe, expect, it } from "vitest";
import {
  updateProfileSchema,
  updatePreferencesSchema,
} from "@/features/users/schemas";
import { currencyForCountry } from "@/features/users/services/defaults";

describe("currencyForCountry", () => {
  it("mappe CA → CAD et US → USD", () => {
    expect(currencyForCountry("CA")).toBe("CAD");
    expect(currencyForCountry("us")).toBe("USD");
  });

  it("retombe sur CAD pour un pays inconnu", () => {
    expect(currencyForCountry("ZZ")).toBe("CAD");
  });
});

describe("updateProfileSchema", () => {
  it("accepte un patch partiel", () => {
    const result = updateProfileSchema.safeParse({
      firstName: "Daniel",
      lastName: "Grosleau",
      language: "fr",
      country: "CA",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("CAD");
      expect(result.data.firstName).toBe("Daniel");
    }
  });

  it("refuse un code pays invalide", () => {
    expect(updateProfileSchema.safeParse({ country: "Canada" }).success).toBe(
      false,
    );
  });

  it("refuse un objet vide", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
  });

  it("normalise travelStyle vide en null", () => {
    const result = updateProfileSchema.safeParse({ travelStyle: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.travelStyle).toBeNull();
    }
  });
});

describe("updatePreferencesSchema", () => {
  it("accepte des préférences valides", () => {
    const result = updatePreferencesSchema.safeParse({
      distanceUnit: "km",
      temperatureUnit: "C",
      fuelUnit: "L/100",
      notificationsEnabled: true,
      aiProactive: false,
      costcoMember: false,
    });
    expect(result.success).toBe(true);
  });

  it("refuse une unité de distance invalide", () => {
    expect(
      updatePreferencesSchema.safeParse({
        distanceUnit: "yards",
        temperatureUnit: "C",
        fuelUnit: "L/100",
        notificationsEnabled: true,
        aiProactive: false,
        costcoMember: true,
      }).success,
    ).toBe(false);
  });
});
