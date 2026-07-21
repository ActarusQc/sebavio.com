/** @vitest-environment jsdom */
/**
 * Rendu liste arrêts carburant (états + séparation aller/retour).
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FuelStopsList } from "@/features/fuel/components/fuel-stops-list";
import type { FuelFillStopDto } from "@/features/fuel/types";

function stop(
  partial: Partial<FuelFillStopDto> & Pick<FuelFillStopDto, "id" | "sequence">,
): FuelFillStopDto {
  return {
    leg: "outbound",
    kind: "en_route",
    order: partial.sequence,
    distanceFromStartKm: "486.20",
    distanceRemainingKm: "307.65",
    positionLabel: "Petro-Canada",
    regionLabel: "Bas-Saint-Laurent",
    station: {
      name: "Petro-Canada",
      address: "123, route 132",
      city: "Rimouski",
      latitude: "48.400000",
      longitude: "-68.500000",
      brand: "Petro-Canada",
      placeId: "place-1",
      googleMapsUrl:
        "https://www.google.com/maps/search/?api=1&query=48.4,-68.5",
      distanceFromRouteKm: "1.8",
    },
    isEstimatedLocation: false,
    fuelType: "premium",
    pricePerLiter: "1.789",
    priceSource: "station_exact",
    priceGranularity: "station",
    pricePeriod: null,
    priceIsEstimate: false,
    litersAdded: "42.60",
    tankLitersBefore: "8.40",
    tankLitersAfter: "51.00",
    tankPercentBefore: "16.8",
    tankPercentAfter: "100.0",
    cost: "76.20",
    rangeAfterKm: "621.9",
    reasonLabel: "Ravitaillement requis",
    detourKm: "1.8",
    ...partial,
  };
}

describe("FuelStopsList", () => {
  it("affiche aucun plein en route si liste vide", () => {
    render(
      <FuelStopsList
        outboundRefuelStops={[]}
        returnRefuelStops={[]}
        departureStops={[]}
        destinationStops={[]}
        finalStops={[]}
        includeReturnTrip={false}
        feasible
        failureMessage={null}
        fuelType="regular"
      />,
    );
    expect(
      screen.getByText(/Aucun plein en route requis pour l'aller/i),
    ).toBeTruthy();
  });

  it("affiche nom, adresse, ville, distance, prix, quantité, coût", () => {
    render(
      <FuelStopsList
        outboundRefuelStops={[stop({ id: "s1", sequence: 1 })]}
        returnRefuelStops={[]}
        departureStops={[]}
        destinationStops={[]}
        finalStops={[]}
        includeReturnTrip={false}
        feasible
        failureMessage={null}
        fuelType="premium"
      />,
    );
    expect(screen.getByText(/Arrêt carburant 1/i)).toBeTruthy();
    expect(screen.getAllByText(/Petro-Canada/).length).toBeGreaterThan(0);
    expect(screen.getByText(/123, route 132/)).toBeTruthy();
    expect(screen.getAllByText(/Rimouski/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/486/).length).toBeGreaterThan(0);
    expect(screen.getByText(/1,789/)).toBeTruthy();
    expect(screen.getByText(/42,6/)).toBeTruthy();
    expect(screen.getByText(/76,20/)).toBeTruthy();
    expect(screen.getByText(/Plan de ravitaillement/i)).toBeTruthy();
    expect(screen.getByText(/^Aller$/i)).toBeTruthy();
    expect(screen.getByText(/Arrêts de carburant/i)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Voir sur la carte/i }),
    ).toBeTruthy();
  });

  it("prix régional avec station confirmée : affiche toujours le lieu", () => {
    render(
      <FuelStopsList
        outboundRefuelStops={[
          stop({
            id: "s1",
            sequence: 1,
            priceSource: "regional_estimate",
            priceGranularity: "regional",
            priceIsEstimate: true,
            isEstimatedLocation: false,
          }),
        ]}
        returnRefuelStops={[]}
        departureStops={[]}
        destinationStops={[]}
        finalStops={[]}
        includeReturnTrip={false}
        feasible
        failureMessage={null}
        fuelType="regular"
      />,
    );
    expect(screen.getAllByText(/Petro-Canada/).length).toBeGreaterThan(0);
    expect(screen.getByText(/123, route 132/)).toBeTruthy();
    expect(screen.getByText(/Ouvrir dans Google Maps/i)).toBeTruthy();
    expect(screen.queryByText(/Arrêt recommandé près de/i)).toBeNull();
    expect(screen.queryByText(/Emplacement approximatif/i)).toBeNull();
    expect(screen.queryByText(/regional_estimate/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Voir plus$/i }));
    expect(screen.getByText(/Station située à/i)).toBeTruthy();
    expect(screen.getByText(/Estimation régionale/i)).toBeTruthy();
  });

  it("localisation estimée avec nom de station : conserve le nom et badge", () => {
    render(
      <FuelStopsList
        outboundRefuelStops={[
          stop({
            id: "s1",
            sequence: 1,
            isEstimatedLocation: true,
            station: {
              name: "Couche-Tard inc.",
              address: "100 route 132",
              city: "New Richmond",
              latitude: "48.1",
              longitude: "-65.8",
              brand: "Couche-Tard",
              placeId: "p1",
              googleMapsUrl: "https://maps.google.com/?q=48.1,-65.8",
              distanceFromRouteKm: "0.3",
            },
          }),
        ]}
        returnRefuelStops={[]}
        departureStops={[]}
        destinationStops={[]}
        finalStops={[]}
        includeReturnTrip={false}
        feasible
        failureMessage={null}
        fuelType="regular"
      />,
    );
    expect(screen.getAllByText(/Couche-Tard inc\./i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Localisation estimée/i)).toBeTruthy();
    expect(screen.queryByText(/Arrêt recommandé près de/i)).toBeNull();
  });

  it("station estimée : formulation compréhensible sans inventer de nom", () => {
    render(
      <FuelStopsList
        outboundRefuelStops={[
          stop({
            id: "s1",
            sequence: 1,
            isEstimatedLocation: true,
            station: {
              name: null,
              address: null,
              city: "Saint-Apollinaire",
              latitude: "48.4",
              longitude: "-68.5",
              brand: null,
              placeId: null,
              googleMapsUrl: null,
              distanceFromRouteKm: null,
            },
            priceSource: "regional_estimate",
            priceIsEstimate: true,
          }),
        ]}
        returnRefuelStops={[]}
        departureStops={[]}
        destinationStops={[]}
        finalStops={[]}
        includeReturnTrip={false}
        feasible
        failureMessage={null}
        fuelType="regular"
      />,
    );
    expect(
      screen.getByText(/Arrêt recommandé près de Saint-Apollinaire/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/Emplacement approximatif le long de l'itinéraire/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/La station exacte sera à confirmer avant le départ/i),
    ).toBeTruthy();
    expect(screen.queryByText(/Montréal/i)).toBeNull();
  });

  it("emplacement sans ville : formulation générique", () => {
    render(
      <FuelStopsList
        outboundRefuelStops={[
          stop({
            id: "s1",
            sequence: 1,
            isEstimatedLocation: true,
            station: {
              name: null,
              address: null,
              city: null,
              latitude: "46.6",
              longitude: "-71.5",
              brand: null,
              placeId: null,
              googleMapsUrl: null,
              distanceFromRouteKm: null,
            },
            priceIsEstimate: true,
          }),
        ]}
        returnRefuelStops={[]}
        departureStops={[]}
        destinationStops={[]}
        finalStops={[]}
        includeReturnTrip={false}
        feasible
        failureMessage={null}
        fuelType="regular"
      />,
    );
    expect(
      screen.getByText(/Arrêt recommandé le long de l'itinéraire/i),
    ).toBeTruthy();
  });

  it("sépare ALLER et RETOUR", () => {
    render(
      <FuelStopsList
        outboundRefuelStops={[stop({ id: "o1", sequence: 1 })]}
        returnRefuelStops={[stop({ id: "r1", sequence: 1, leg: "return" })]}
        departureStops={[]}
        destinationStops={[]}
        finalStops={[]}
        includeReturnTrip
        feasible
        failureMessage={null}
        fuelType="regular"
      />,
    );
    expect(screen.getByText(/^Aller$/i)).toBeTruthy();
    expect(screen.getByText(/^Retour$/i)).toBeTruthy();
    expect(
      screen.getAllByText(/Arrêt carburant/i).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("clic Voir sur la carte → focus", () => {
    const onFocus = vi.fn();
    render(
      <FuelStopsList
        outboundRefuelStops={[stop({ id: "s1", sequence: 1 })]}
        returnRefuelStops={[]}
        departureStops={[]}
        destinationStops={[]}
        finalStops={[]}
        includeReturnTrip={false}
        feasible
        failureMessage={null}
        fuelType="regular"
        onFocusStop={onFocus}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Voir sur la carte/i }));
    expect(onFocus).toHaveBeenCalledWith({
      id: "s1",
      latitude: 48.4,
      longitude: -68.5,
    });
  });

  it("aucune station accessible", () => {
    render(
      <FuelStopsList
        outboundRefuelStops={[]}
        returnRefuelStops={[]}
        departureStops={[]}
        destinationStops={[]}
        finalStops={[]}
        includeReturnTrip={false}
        feasible={false}
        failureMessage="Aucun arrêt carburant accessible n’a été trouvé avant la limite d’autonomie du véhicule."
        fuelType="regular"
      />,
    );
    expect(screen.getByText(/Aucun arrêt carburant accessible/i)).toBeTruthy();
  });

  it("mobile : cartes verticales (pas de tableau)", () => {
    const { container } = render(
      <FuelStopsList
        outboundRefuelStops={[
          stop({ id: "s1", sequence: 1 }),
          stop({ id: "s2", sequence: 2, distanceFromStartKm: "700.00" }),
        ]}
        returnRefuelStops={[]}
        departureStops={[]}
        destinationStops={[]}
        finalStops={[]}
        includeReturnTrip={false}
        feasible
        failureMessage={null}
        fuelType="regular"
      />,
    );
    expect(container.querySelector("table")).toBeNull();
    expect(container.querySelectorAll("article").length).toBe(2);
  });
});
