/**
 * @vitest-environment node
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  clearPlacesGasMemoryCache,
  extractGasBrand,
  findBestGasStationNearPoint,
  searchNearbyGasStations,
} from "@/services/maps/places-gas-stations";

describe("places-gas-stations", () => {
  beforeEach(() => {
    clearPlacesGasMemoryCache();
  });

  it("extrait la marque depuis le nom", () => {
    expect(extractGasBrand("Petro-Canada Saint-Apollinaire")).toBe(
      "Petro-Canada",
    );
    expect(extractGasBrand("Ultramar - Lévis")).toBe("Ultramar");
    expect(extractGasBrand("Station indépendante")).toBeNull();
  });

  it("searchNearbyGasStations parse la réponse Places API (New)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        places: [
          {
            id: "places/ChIJabc",
            displayName: { text: "Petro-Canada" },
            formattedAddress: "121 Rue Principale, Saint-Apollinaire, QC",
            googleMapsUri: "https://maps.google.com/?cid=1",
            location: { latitude: 46.61, longitude: -71.52 },
            addressComponents: [
              {
                longText: "Saint-Apollinaire",
                types: ["locality"],
              },
            ],
            fuelOptions: { fuelPrices: [] },
          },
        ],
      }),
    } as Response);

    const lat = 46.6 + Math.random() * 0.01;
    const lng = -71.5 + Math.random() * 0.01;
    const stations = await searchNearbyGasStations({
      latitude: lat,
      longitude: lng,
      apiKey: "test-key",
      radiusMeters: 5000,
    });

    expect(stations).toHaveLength(1);
    expect(stations[0]!.name).toBe("Petro-Canada");
    expect(stations[0]!.brand).toBe("Petro-Canada");
    expect(stations[0]!.city).toBe("Saint-Apollinaire");
    expect(stations[0]!.placeId).toBe("ChIJabc");
    expect(fetchMock).toHaveBeenCalled();
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(String(fetchMock.mock.calls[0]![0])).toContain(
      "places.googleapis.com/v1/places:searchNearby",
    );
    expect(init.method).toBe("POST");
    fetchMock.mockRestore();
  });

  it("findBestGasStationNearPoint exclut les placeIds déjà utilisés", async () => {
    const searchFn = vi.fn(async () => [
      {
        placeId: "used",
        name: "A",
        brand: null,
        address: null,
        city: "X",
        latitude: 46.6,
        longitude: -71.5,
        googleMapsUrl: "https://maps.google.com",
        pricePerLiter: null,
        priceUpdatedAt: null,
        distanceFromSearchKm: 1,
      },
      {
        placeId: "free",
        name: "B",
        brand: null,
        address: null,
        city: "Y",
        latitude: 46.61,
        longitude: -71.51,
        googleMapsUrl: "https://maps.google.com",
        pricePerLiter: null,
        priceUpdatedAt: null,
        distanceFromSearchKm: 2,
      },
    ]);

    const best = await findBestGasStationNearPoint({
      latitude: 46.6,
      longitude: -71.5,
      excludePlaceIds: new Set(["used"]),
      searchFn,
    });
    expect(best?.placeId).toBe("free");
  });

  it("sans clé API : liste vide", async () => {
    const stations = await searchNearbyGasStations({
      latitude: 46.6,
      longitude: -71.5,
      apiKey: "",
    });
    expect(stations).toEqual([]);
  });
});
