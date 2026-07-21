import { describe, expect, it } from "vitest";
import { buildFuelMapMarkers } from "@/features/fuel/lib/build-fuel-map-markers";
import type { FuelFillStopDto } from "@/features/fuel/types";

function stop(
  partial: Partial<FuelFillStopDto> & Pick<FuelFillStopDto, "id" | "sequence">,
): FuelFillStopDto {
  return {
    leg: "outbound",
    kind: "en_route",
    order: partial.sequence,
    distanceFromStartKm: "280.00",
    distanceRemainingKm: "45.00",
    positionLabel: "Station",
    regionLabel: "Québec",
    station: {
      name: "Ultramar",
      address: "10, rue Principale",
      city: "Lévis",
      latitude: "46.800000",
      longitude: "-71.200000",
      brand: "Ultramar",
      placeId: "p1",
      googleMapsUrl: "https://maps.google.com/?q=46.8,-71.2",
      distanceFromRouteKm: "0.5",
    },
    isEstimatedLocation: false,
    fuelType: "regular",
    pricePerLiter: "1.940",
    priceSource: "station_exact",
    priceGranularity: "station",
    pricePeriod: null,
    priceIsEstimate: false,
    litersAdded: "72.00",
    tankLitersBefore: "10.00",
    tankLitersAfter: "82.00",
    tankPercentBefore: "12.0",
    tankPercentAfter: "100.0",
    cost: "139.68",
    rangeAfterKm: "900.0",
    reasonLabel: "Ravitaillement requis",
    detourKm: "1.0",
    ...partial,
  };
}

describe("buildFuelMapMarkers", () => {
  it("crée un marqueur numéroté quand les coordonnées existent", () => {
    const markers = buildFuelMapMarkers([stop({ id: "a1", sequence: 1 })]);
    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({
      id: "fuel:a1",
      kind: "fuel_outbound",
      sequence: 1,
      lat: 46.8,
      lng: -71.2,
      title: "Ultramar",
    });
    expect(markers[0].info?.address).toBe("10, rue Principale");
    expect(markers[0].info?.pricePerLiter).toBe("1.940");
    expect(markers[0].info?.litersAdded).toBe("72.00");
    expect(markers[0].info?.cost).toBe("139.68");
  });

  it("différencie aller et retour", () => {
    const markers = buildFuelMapMarkers(
      [stop({ id: "o1", sequence: 1 })],
      [stop({ id: "r1", sequence: 1, leg: "return" })],
    );
    expect(markers).toHaveLength(2);
    expect(markers[0].kind).toBe("fuel_outbound");
    expect(markers[1].kind).toBe("fuel_return");
  });

  it("n'ajoute aucun marqueur sans coordonnées", () => {
    const markers = buildFuelMapMarkers([
      stop({
        id: "x1",
        sequence: 1,
        station: {
          name: "Sans coords",
          address: "1 rue",
          city: "Québec",
          latitude: null,
          longitude: null,
          brand: null,
          placeId: null,
          googleMapsUrl: null,
          distanceFromRouteKm: null,
        },
      }),
    ]);
    expect(markers).toHaveLength(0);
  });

  it("emplacement estimé : titre compréhensible", () => {
    const markers = buildFuelMapMarkers([
      stop({
        id: "e1",
        sequence: 2,
        isEstimatedLocation: true,
        priceIsEstimate: true,
        station: {
          name: null,
          address: null,
          city: "Saint-Apollinaire",
          latitude: "46.6",
          longitude: "-71.5",
          brand: null,
          placeId: null,
          googleMapsUrl: null,
          distanceFromRouteKm: null,
        },
      }),
    ]);
    expect(markers).toHaveLength(1);
    expect(markers[0].title).toMatch(
      /Arrêt recommandé près de Saint-Apollinaire/,
    );
    expect(markers[0].info?.isEstimatedLocation).toBe(true);
    expect(markers[0].sequence).toBe(2);
  });
});
