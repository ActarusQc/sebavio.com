/**
 * @vitest-environment node
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  clearReverseGeocodeMemoryCache,
  reverseGeocodeRoutePoint,
} from "@/features/fuel/services/reverse-geocode-route-point";

describe("reverseGeocodeRoutePoint", () => {
  beforeEach(() => {
    clearReverseGeocodeMemoryCache();
  });

  it("succès : extrait locality", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "OK",
        results: [
          {
            formatted_address: "Lévis, QC, Canada",
            address_components: [
              { long_name: "Lévis", short_name: "Lévis", types: ["locality"] },
              {
                long_name: "Québec",
                short_name: "QC",
                types: ["administrative_area_level_1"],
              },
            ],
          },
        ],
      }),
    } as Response);

    // Coords uniques pour éviter un hit Redis d'un run précédent
    const latitude = 46.8 + Math.random() * 0.01;
    const longitude = -71.2 + Math.random() * 0.01;

    const result = await reverseGeocodeRoutePoint({
      latitude,
      longitude,
      apiKey: "test-key",
      provider: {
        name: "test",
        isAvailable: () => ({ available: true }),
        geocode: async () => ({ lat: 0, lng: 0, formattedAddress: "" }),
        directions: async () => ({
          distanceKm: 0,
          durationMin: 0,
          polyline: "",
          provider: "google",
          legCount: 1,
          legs: [
            {
              distanceKm: 0,
              durationMin: 0,
              start: { lat: 0, lng: 0 },
              end: { lat: 0, lng: 0 },
            },
          ],
          finalDestination: { lat: 0, lng: 0 },
        }),
      },
    });

    expect(result.locality).toBe("Lévis");
    expect(fetchMock).toHaveBeenCalled();
    fetchMock.mockRestore();
  });

  it("indisponible : retourne null sans throw", async () => {
    const result = await reverseGeocodeRoutePoint({
      latitude: 47.1,
      longitude: -70.9,
      apiKey: "",
      provider: {
        name: "null",
        isAvailable: () => ({ available: false, reason: "missing_key" }),
        geocode: async () => {
          throw new Error("no");
        },
        directions: async () => {
          throw new Error("no");
        },
      },
    });
    expect(result.locality).toBeNull();
  });
});
