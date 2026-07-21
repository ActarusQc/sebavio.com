import { describe, expect, it } from "vitest";
import { homeAddressSchema } from "@/features/users/schemas/home-address";
import { DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS } from "@/features/ai-trip-planner/constants";

describe("homeAddressSchema", () => {
  const valid = {
    homeAddressLabel: "123 rue Exemple, Bromont, QC J2L 1A1",
    homeAddressPlaceId: "ChIJabcdef",
    homeAddressLatitude: 45.318,
    homeAddressLongitude: -72.648,
    homeAddressCity: "Bromont",
    homeAddressProvince: "Québec",
    homeAddressPostalCode: "J2L 1A1",
    homeAddressCountry: "CA",
  };

  it("accepte une adresse complète validée", () => {
    const parsed = homeAddressSchema.parse(valid);
    expect(parsed.homeAddressCity).toBe("Bromont");
    expect(parsed.homeAddressCountry).toBe("CA");
  });

  it("accepte un compte sans champs optionnels (ville absente)", () => {
    const parsed = homeAddressSchema.parse({
      homeAddressLabel: valid.homeAddressLabel,
      homeAddressPlaceId: valid.homeAddressPlaceId,
      homeAddressLatitude: valid.homeAddressLatitude,
      homeAddressLongitude: valid.homeAddressLongitude,
    });
    expect(parsed.homeAddressCity).toBeUndefined();
  });

  it("refuse des données géographiques incomplètes", () => {
    expect(() =>
      homeAddressSchema.parse({
        homeAddressLabel: "Bromont",
        homeAddressPlaceId: "",
        homeAddressLatitude: 45,
        homeAddressLongitude: -72,
      }),
    ).toThrow();
  });

  it("refuse des coordonnées hors bornes", () => {
    expect(() =>
      homeAddressSchema.parse({
        ...valid,
        homeAddressLatitude: 120,
      }),
    ).toThrow();
  });

  it("accepte une adresse hors Québec (France / États-Unis)", () => {
    const fr = homeAddressSchema.parse({
      ...valid,
      homeAddressLabel: "10 rue de Rivoli, Paris",
      homeAddressCity: "Paris",
      homeAddressProvince: null,
      homeAddressCountry: "FR",
      homeAddressLatitude: 48.8566,
      homeAddressLongitude: 2.3522,
    });
    expect(fr.homeAddressCountry).toBe("FR");

    const us = homeAddressSchema.parse({
      ...valid,
      homeAddressLabel: "1 Main St, Burlington, VT",
      homeAddressCity: "Burlington",
      homeAddressProvince: "Vermont",
      homeAddressCountry: "US",
      homeAddressLatitude: 44.4759,
      homeAddressLongitude: -73.2121,
    });
    expect(us.homeAddressCountry).toBe("US");
  });
});

describe("DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS", () => {
  it("ne contient aucune ville française", () => {
    const frenchCities = ["Paris", "Lyon", "Marseille", "Bordeaux", "Toulouse"];
    for (const city of frenchCities) {
      expect(DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS).not.toContain(city);
    }
    expect(DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS).toContain("Montréal");
    expect(DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS).toContain("Québec");
  });
});
