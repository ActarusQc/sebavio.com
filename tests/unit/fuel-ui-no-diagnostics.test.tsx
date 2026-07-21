/** @vitest-environment jsdom */
/**
 * L'UI carburant ne doit pas exposer les diagnostics internes.
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FuelStopsList } from "@/features/fuel/components/fuel-stops-list";
import { FuelRefuelPlanSection } from "@/features/fuel/components/fuel-refuel-plan";
import type { FuelFillStopDto, FuelRefuelPlanDto } from "@/features/fuel/types";

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
      placeId: null,
      googleMapsUrl: null,
      distanceFromRouteKm: "1.2",
    },
    isEstimatedLocation: false,
    fuelType: "regular",
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

describe("UI carburant sans diagnostics", () => {
  it("FuelStopsList n'affiche pas le jargon technique", () => {
    const { container } = render(
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
      />,
    );
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/Identifiant de prix partagé/i);
    expect(text).not.toMatch(/Couverture corridor/i);
    expect(text).not.toMatch(/stations détectées/i);
    expect(text).not.toMatch(/estimations régionales/i);
    expect(text).not.toMatch(/\bcandidates\b/i);
    expect(text).not.toMatch(/station_exact/i);
    expect(text).not.toMatch(/regional_estimate/i);
    expect(text).not.toMatch(/price identity/i);
    expect(text).not.toMatch(/Identifiant de prix/i);
    expect(screen.queryByTestId("fuel-stops-diag")).toBeNull();
    // Lieu fonctionnel toujours visible
    expect(screen.getAllByText(/Petro-Canada/).length).toBeGreaterThan(0);
    expect(screen.getByText(/123, route 132/)).toBeTruthy();
  });

  it("FuelRefuelPlanSection n'affiche pas la couverture corridor", () => {
    const plan: FuelRefuelPlanDto = {
      initialFuelL: "50.0",
      remainingFuelL: "12.0",
      remainingFuelPercent: "24.0",
      litersPurchased: "40.0",
      averagePricePerLiter: "1.700",
      suggestedStopCount: 1,
      naiveCostAtDeparturePrice: "80.00",
      estimatedSavingsVsNaive: "5.00",
      selectedStrategyId: "naive",
      selectedStrategyLabel: "Standard",
      noAdvantageousOptimization: false,
      strategyComparison: [],
      priceConfidence: "medium",
      priceSourceSummary: "test",
      pricePeriodSummary: null,
      reserveLiters: "7.5",
      reservePercent: "15.0",
      searchThresholdPercent: "25",
      feasible: true,
      failureReasonLabel: null,
      stops: [],
      coverage: {
        samplePoints: 21,
        nearbyCalls: 32,
        rawStationHits: 135,
        uniqueStations: 126,
        stationsInCorridor: 126,
        withExactPrice: 15,
        withCityPrice: 0,
        withRegionalPrice: 111,
        withoutPrice: 0,
        rejectedTooFar: 0,
        candidates: 126,
        analyzedByOptimizer: 126,
        retainedStops: 2,
        regions: ["Québec"],
        distinctPriceValues: 33,
        distinctPriceIdentities: 33,
      },
    };
    const { container } = render(
      <FuelRefuelPlanSection plan={plan} hideStops />,
    );
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/Couverture corridor/i);
    expect(text).not.toMatch(/stations détectées/i);
    expect(text).not.toMatch(/candidates/i);
    expect(text).not.toMatch(/identifiants de prix/i);
  });
});
